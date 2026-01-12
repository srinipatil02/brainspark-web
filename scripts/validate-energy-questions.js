#!/usr/bin/env node

/**
 * Validates Energy Forms and Transformations question set
 * 4-Layer Validation Pipeline
 */

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || 'questions/energy-forms-transformations-year8-complete.json';
const filePath = path.join(__dirname, inputFile);

console.log('======================================================');
console.log(' QUESTION SET VALIDATION PIPELINE');
console.log('======================================================\n');
console.log(`File: ${inputFile}\n`);

// Load questions
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const questions = data.questions || [];
const metadata = data.metadata || {};

console.log(`Total questions: ${questions.length}`);
console.log(`Topic: ${metadata.topic}`);
console.log(`Outcome Code: ${metadata.outcomeCode}\n`);

const issues = [];
let schemaErrors = 0;
let contentErrors = 0;
let pedagogyWarnings = 0;
let passed = 0;

// ========================================
// LAYER 1: SCHEMA VALIDATION
// ========================================
console.log('─'.repeat(50));
console.log('LAYER 1: SCHEMA VALIDATION');
console.log('─'.repeat(50));

const requiredFields = [
  'questionId', 'questionType', 'stem', 'solution', 'hints',
  'difficulty', 'curriculum', 'learningArc', 'paperMetadata', 'status'
];

const validQuestionTypes = ['MCQ', 'SHORT_ANSWER', 'EXTENDED_RESPONSE'];

questions.forEach((q, idx) => {
  // Check required fields
  requiredFields.forEach(field => {
    if (!q[field]) {
      issues.push({
        questionId: q.questionId || `Q${idx + 1}`,
        layer: 'schema',
        severity: 'error',
        message: `Missing required field: ${field}`
      });
      schemaErrors++;
    }
  });

  // Check questionType
  if (q.questionType && !validQuestionTypes.includes(q.questionType)) {
    issues.push({
      questionId: q.questionId,
      layer: 'schema',
      severity: 'error',
      message: `Invalid questionType: ${q.questionType}`
    });
    schemaErrors++;
  }

  // Check difficulty range
  if (q.difficulty && (q.difficulty < 1 || q.difficulty > 5)) {
    issues.push({
      questionId: q.questionId,
      layer: 'schema',
      severity: 'error',
      message: `Difficulty ${q.difficulty} out of range (1-5)`
    });
    schemaErrors++;
  }

  // MCQ-specific validation
  if (q.questionType === 'MCQ') {
    if (!q.mcqOptions || !Array.isArray(q.mcqOptions)) {
      issues.push({
        questionId: q.questionId,
        layer: 'schema',
        severity: 'error',
        message: 'MCQ missing mcqOptions array'
      });
      schemaErrors++;
    } else if (q.mcqOptions.length !== 4) {
      issues.push({
        questionId: q.questionId,
        layer: 'schema',
        severity: 'error',
        message: `MCQ has ${q.mcqOptions.length} options, expected 4`
      });
      schemaErrors++;
    }
  }

  // Check hints array
  if (q.hints && q.hints.length < 2) {
    issues.push({
      questionId: q.questionId,
      layer: 'schema',
      severity: 'warning',
      message: `Only ${q.hints.length} hint(s), expected 2-3`
    });
  }

  // Check paperMetadata
  if (q.paperMetadata) {
    if (!q.paperMetadata.setId) {
      issues.push({
        questionId: q.questionId,
        layer: 'schema',
        severity: 'error',
        message: 'Missing paperMetadata.setId'
      });
      schemaErrors++;
    }
    if (!q.paperMetadata.sequenceInPaper) {
      issues.push({
        questionId: q.questionId,
        layer: 'schema',
        severity: 'warning',
        message: 'Missing paperMetadata.sequenceInPaper'
      });
    }
  }
});

const schemaIssues = issues.filter(i => i.layer === 'schema');
console.log(`Schema errors: ${schemaErrors}`);
console.log(`Schema passed: ${schemaErrors === 0 ? '✅ PASS' : '❌ FAIL'}\n`);

// ========================================
// LAYER 2: CONTENT VALIDATION
// ========================================
console.log('─'.repeat(50));
console.log('LAYER 2: CONTENT VALIDATION');
console.log('─'.repeat(50));

// LaTeX pattern for basic validation
const latexInlinePattern = /\$[^$]+\$/g;
const latexBlockPattern = /\$\$[^$]+\$\$/g;
const unclosedBracePattern = /\{[^}]*$/;

questions.forEach(q => {
  // Check for basic LaTeX issues
  const allText = [q.stem, q.solution, ...(q.hints || []).map(h => h.content)].join(' ');

  // Find LaTeX expressions
  const inlineMatches = allText.match(latexInlinePattern) || [];
  const blockMatches = allText.match(latexBlockPattern) || [];

  [...inlineMatches, ...blockMatches].forEach(latex => {
    // Check for unclosed braces
    const openBraces = (latex.match(/\{/g) || []).length;
    const closeBraces = (latex.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push({
        questionId: q.questionId,
        layer: 'content',
        severity: 'error',
        message: `LaTeX brace mismatch in: ${latex.substring(0, 50)}...`
      });
      contentErrors++;
    }
  });

  // MCQ: Check exactly one correct answer
  if (q.questionType === 'MCQ' && q.mcqOptions) {
    const correctCount = q.mcqOptions.filter(opt => opt.isCorrect === true).length;
    if (correctCount !== 1) {
      issues.push({
        questionId: q.questionId,
        layer: 'content',
        severity: 'error',
        message: `MCQ has ${correctCount} correct answers, expected exactly 1`
      });
      contentErrors++;
    }

    // Check all options have feedback
    q.mcqOptions.forEach((opt, i) => {
      if (!opt.feedback || opt.feedback.length < 10) {
        issues.push({
          questionId: q.questionId,
          layer: 'content',
          severity: 'warning',
          message: `Option ${opt.id} missing or short feedback`
        });
      }
    });
  }

  // Check solution length
  if (q.solution && q.solution.length < 50) {
    issues.push({
      questionId: q.questionId,
      layer: 'content',
      severity: 'warning',
      message: `Solution too brief (${q.solution.length} chars, min 50)`
    });
  }

  // Check stem length
  if (q.stem && q.stem.length < 20) {
    issues.push({
      questionId: q.questionId,
      layer: 'content',
      severity: 'warning',
      message: `Stem too brief (${q.stem.length} chars, min 20)`
    });
  }
});

const contentIssues = issues.filter(i => i.layer === 'content');
console.log(`Content errors: ${contentErrors}`);
console.log(`Content warnings: ${contentIssues.filter(i => i.severity === 'warning').length}`);
console.log(`Content passed: ${contentErrors === 0 ? '✅ PASS' : '❌ FAIL'}\n`);

// ========================================
// LAYER 3: PEDAGOGICAL VALIDATION
// ========================================
console.log('─'.repeat(50));
console.log('LAYER 3: PEDAGOGICAL VALIDATION');
console.log('─'.repeat(50));

// Check learning arc structure
const phases = { 1: [], 2: [], 3: [], 4: [] };
questions.forEach(q => {
  if (q.learningArc && q.learningArc.phase) {
    phases[q.learningArc.phase] = phases[q.learningArc.phase] || [];
    phases[q.learningArc.phase].push(q);
  }
});

console.log('Phase distribution:');
Object.entries(phases).forEach(([phase, qs]) => {
  const expected = 20;
  const actual = qs.length;
  const status = actual === expected ? '✅' : '⚠️';
  console.log(`  Phase ${phase}: ${actual}/${expected} questions ${status}`);

  if (actual !== expected) {
    issues.push({
      questionId: 'DISTRIBUTION',
      layer: 'pedagogy',
      severity: 'warning',
      message: `Phase ${phase} has ${actual} questions, expected ${expected}`
    });
    pedagogyWarnings++;
  }
});

// Check difficulty by phase
console.log('\nDifficulty by phase:');
Object.entries(phases).forEach(([phase, qs]) => {
  if (qs.length === 0) return;
  const avgDifficulty = qs.reduce((sum, q) => sum + (q.difficulty || 0), 0) / qs.length;
  const expectedMin = phase <= 2 ? 2 : 3;
  const expectedMax = phase <= 2 ? 3 : 4;
  const status = avgDifficulty >= expectedMin && avgDifficulty <= expectedMax ? '✅' : '⚠️';
  console.log(`  Phase ${phase}: avg ${avgDifficulty.toFixed(1)} (expected ${expectedMin}-${expectedMax}) ${status}`);
});

// Check curriculum alignment
console.log('\nCurriculum alignment:');
const curriculumCodes = new Set();
questions.forEach(q => {
  if (q.curriculum && q.curriculum.codes) {
    q.curriculum.codes.forEach(code => curriculumCodes.add(code));
  }
});
console.log(`  Codes used: ${[...curriculumCodes].join(', ')}`);
console.log(`  Expected: ACSSU155`);
console.log(`  Status: ${curriculumCodes.has('ACSSU155') ? '✅ PASS' : '⚠️ WARNING'}`);

// Check pedagogy distribution
console.log('\nPedagogy distribution:');
const pedagogyTypes = {};
questions.forEach(q => {
  if (q.pedagogy && q.pedagogy.type) {
    pedagogyTypes[q.pedagogy.type] = (pedagogyTypes[q.pedagogy.type] || 0) + 1;
  }
});

const expectedPedagogy = { scaffolded: 26, phenomenon: 20, misconception: 17, socratic: 17 };
Object.entries(pedagogyTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  const expected = expectedPedagogy[type] || '?';
  const tolerance = 5;
  const inRange = Math.abs(count - expected) <= tolerance;
  console.log(`  ${type}: ${count} (target: ${expected}) ${inRange ? '✅' : '⚠️'}`);
});

console.log(`\nPedagogy passed: ${pedagogyWarnings === 0 ? '✅ PASS' : '⚠️ WARNINGS'}\n`);

// ========================================
// LAYER 4: DISTRIBUTION VALIDATION
// ========================================
console.log('─'.repeat(50));
console.log('LAYER 4: DISTRIBUTION VALIDATION');
console.log('─'.repeat(50));

// Question type distribution
const questionTypes = {};
questions.forEach(q => {
  questionTypes[q.questionType] = (questionTypes[q.questionType] || 0) + 1;
});

console.log('Question type distribution:');
Object.entries(questionTypes).forEach(([type, count]) => {
  console.log(`  ${type}: ${count} (${(count/questions.length*100).toFixed(0)}%)`);
});

// Set distribution
const setIds = {};
questions.forEach(q => {
  if (q.paperMetadata && q.paperMetadata.setId) {
    setIds[q.paperMetadata.setId] = (setIds[q.paperMetadata.setId] || 0) + 1;
  }
});

console.log('\nSet distribution:');
let setDistributionValid = true;
Object.entries(setIds).sort().forEach(([setId, count]) => {
  const status = count === 10 ? '✅' : '❌';
  if (count !== 10) setDistributionValid = false;
  console.log(`  ${setId}: ${count} ${status}`);
});

console.log(`\nDistribution passed: ${setDistributionValid ? '✅ PASS' : '❌ FAIL'}\n`);

// ========================================
// VALIDATION SUMMARY
// ========================================
console.log('═'.repeat(50));
console.log('VALIDATION SUMMARY');
console.log('═'.repeat(50));

const totalErrors = schemaErrors + contentErrors;
const totalWarnings = issues.filter(i => i.severity === 'warning').length;

console.log(`\nTotal questions: ${questions.length}`);
console.log(`Errors: ${totalErrors}`);
console.log(`Warnings: ${totalWarnings}`);

let status;
if (totalErrors === 0 && totalWarnings === 0) {
  status = 'PASSED';
  console.log(`\n✅ STATUS: PASSED - Ready for upload!`);
} else if (totalErrors === 0) {
  status = 'WARNINGS_ONLY';
  console.log(`\n⚠️ STATUS: WARNINGS_ONLY - Can proceed with upload`);
} else {
  status = 'FAILED';
  console.log(`\n❌ STATUS: FAILED - Must fix errors before upload`);
}

// Show issues
if (issues.length > 0) {
  console.log('\n─'.repeat(50));
  console.log('ISSUES FOUND:');
  console.log('─'.repeat(50));

  // Group by severity
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  if (errors.length > 0) {
    console.log('\nERRORS:');
    errors.slice(0, 10).forEach(i => {
      console.log(`  ❌ [${i.questionId}] ${i.message}`);
    });
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }

  if (warnings.length > 0) {
    console.log('\nWARNINGS:');
    warnings.slice(0, 10).forEach(i => {
      console.log(`  ⚠️ [${i.questionId}] ${i.message}`);
    });
    if (warnings.length > 10) {
      console.log(`  ... and ${warnings.length - 10} more warnings`);
    }
  }
}

console.log('\n' + '═'.repeat(50));

// Write validation report
const report = {
  validationReport: {
    file: inputFile,
    timestamp: new Date().toISOString(),
    summary: {
      totalQuestions: questions.length,
      passed: questions.length - totalErrors,
      warnings: totalWarnings,
      errors: totalErrors,
      status: status
    },
    layers: {
      schema: { passed: questions.length - schemaErrors, failed: schemaErrors },
      content: { passed: questions.length - contentErrors, failed: contentErrors },
      pedagogy: { passed: questions.length - pedagogyWarnings, warnings: pedagogyWarnings },
      distribution: { passed: setDistributionValid ? 8 : 0, failed: setDistributionValid ? 0 : 8 }
    },
    distributions: {
      questionTypes,
      pedagogyTypes,
      setIds,
      phases: Object.fromEntries(Object.entries(phases).map(([k, v]) => [k, v.length]))
    },
    issues: issues
  }
};

const reportPath = path.join(__dirname, 'questions/validation-report-energy.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\nValidation report saved to: ${reportPath}`);

process.exit(totalErrors > 0 ? 2 : (totalWarnings > 0 ? 1 : 0));
