#!/usr/bin/env node
/**
 * 4-Layer Validation Pipeline for BrainSpark Questions
 * Validates: Schema, Content, Pedagogy, Presentation
 */

const fs = require('fs');
const path = require('path');

const QUESTIONS_FILE = process.argv[2] || 'questions/states-of-matter-year8-complete.json';

// Validation results
const results = {
  summary: {
    totalQuestions: 0,
    passed: 0,
    warnings: 0,
    errors: 0,
    status: 'UNKNOWN'
  },
  layers: {
    schema: { passed: 0, failed: 0, issues: [] },
    content: { passed: 0, failed: 0, issues: [] },
    pedagogy: { passed: 0, warnings: 0, issues: [] },
    presentation: { passed: 0, failed: 0, issues: [] }
  },
  distributions: {
    questionTypes: {},
    pedagogy: {},
    difficulty: {},
    phases: {}
  },
  humanReviewFlags: []
};

// ============================================
// LAYER 1: SCHEMA VALIDATION
// ============================================
function validateSchema(question, index) {
  const issues = [];
  const qid = question.questionId || `Q${index + 1}`;

  // Required fields
  const requiredFields = ['questionId', 'questionType', 'stem', 'solution', 'hints', 'difficulty', 'curriculum', 'status'];
  for (const field of requiredFields) {
    if (!question[field]) {
      issues.push({ severity: 'error', message: `Missing required field '${field}'`, field });
    }
  }

  // questionType enum
  const validTypes = ['MCQ', 'SHORT_ANSWER', 'EXTENDED_RESPONSE', 'short-answer', 'explanation'];
  if (question.questionType && !validTypes.includes(question.questionType)) {
    issues.push({ severity: 'error', message: `Invalid questionType '${question.questionType}'`, field: 'questionType' });
  }

  // MCQ validation
  if (question.questionType === 'MCQ') {
    if (!question.mcqOptions) {
      issues.push({ severity: 'error', message: 'MCQ missing mcqOptions', field: 'mcqOptions' });
    } else {
      if (question.mcqOptions.length !== 4) {
        issues.push({ severity: 'error', message: `mcqOptions has ${question.mcqOptions.length} items, expected 4`, field: 'mcqOptions' });
      }

      const correctCount = question.mcqOptions.filter(o => o.isCorrect).length;
      if (correctCount !== 1) {
        issues.push({ severity: 'error', message: `MCQ has ${correctCount} correct answers, expected exactly 1`, field: 'mcqOptions' });
      }

      // Check option structure
      question.mcqOptions.forEach((opt, i) => {
        if (!opt.id || !opt.text) {
          issues.push({ severity: 'error', message: `Option ${i + 1} missing id or text`, field: 'mcqOptions' });
        }
        if (opt.isCorrect === undefined) {
          issues.push({ severity: 'warning', message: `Option ${opt.id} missing isCorrect field`, field: 'mcqOptions' });
        }
      });
    }
  }

  // Hints validation
  if (question.hints) {
    if (question.hints.length < 2) {
      issues.push({ severity: 'warning', message: `Only ${question.hints.length} hints, recommend 2-3`, field: 'hints' });
    }
    question.hints.forEach((hint, i) => {
      if (!hint.content && !hint.level) {
        issues.push({ severity: 'error', message: `Hint ${i + 1} missing content or level`, field: 'hints' });
      }
    });
  }

  // Difficulty range
  if (question.difficulty && (question.difficulty < 1 || question.difficulty > 5)) {
    issues.push({ severity: 'error', message: `Difficulty ${question.difficulty} outside range 1-5`, field: 'difficulty' });
  }

  // Curriculum validation
  if (question.curriculum) {
    if (!question.curriculum.codes || question.curriculum.codes.length === 0) {
      issues.push({ severity: 'warning', message: 'No curriculum codes specified', field: 'curriculum' });
    }
    if (!question.curriculum.year) {
      issues.push({ severity: 'warning', message: 'No year level specified', field: 'curriculum' });
    }
  }

  // LearningArc validation
  if (question.learningArc) {
    if (!question.learningArc.phase) {
      issues.push({ severity: 'warning', message: 'No learning arc phase specified', field: 'learningArc' });
    }
    if (!question.learningArc.conceptsUsed || question.learningArc.conceptsUsed.length === 0) {
      issues.push({ severity: 'warning', message: 'No concepts specified in learning arc', field: 'learningArc' });
    }
  }

  return issues;
}

// ============================================
// LAYER 2: CONTENT VALIDATION
// ============================================
function validateContent(question) {
  const issues = [];
  const qid = question.questionId;

  // Check stem length
  if (question.stem) {
    if (question.stem.length < 20) {
      issues.push({ severity: 'warning', message: `Stem too short (${question.stem.length} chars)`, field: 'stem' });
    }
    if (question.stem.length > 2000) {
      issues.push({ severity: 'warning', message: `Stem very long (${question.stem.length} chars)`, field: 'stem' });
    }
  }

  // Check solution length
  if (question.solution) {
    if (question.solution.length < 50) {
      issues.push({ severity: 'warning', message: `Solution too brief (${question.solution.length} chars)`, field: 'solution' });
    }
  }

  // Check for LaTeX syntax (basic validation)
  const latexPatterns = [/\$[^$]+\$/g, /\$\$[^$]+\$\$/g];
  const content = [question.stem, question.solution].filter(Boolean).join(' ');

  // Check for unmatched $ signs
  const dollarCount = (content.match(/\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    issues.push({ severity: 'error', message: 'Unmatched $ in LaTeX equation', field: 'content' });
  }

  // Check for unclosed braces in potential equations
  const braceOpen = (content.match(/\{/g) || []).length;
  const braceClose = (content.match(/\}/g) || []).length;
  if (braceOpen !== braceClose) {
    issues.push({ severity: 'warning', message: 'Possible unclosed braces in content', field: 'content' });
  }

  // Check markdown tables
  if (content.includes('|')) {
    const lines = content.split('\n');
    let inTable = false;
    lines.forEach((line, i) => {
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (!inTable && i > 0 && !lines[i-1].includes('|')) {
          // Table start
        }
        inTable = true;
        const pipes = (line.match(/\|/g) || []).length;
        if (pipes < 2) {
          issues.push({ severity: 'warning', message: `Table row may be malformed at line ${i}`, field: 'content' });
        }
      } else {
        inTable = false;
      }
    });
  }

  // Check MCQ option feedback
  if (question.mcqOptions) {
    question.mcqOptions.forEach(opt => {
      if (!opt.feedback || opt.feedback.length < 10) {
        issues.push({ severity: 'warning', message: `Option ${opt.id} feedback too brief`, field: 'mcqOptions' });
      }
    });
  }

  return issues;
}

// ============================================
// LAYER 3: PEDAGOGICAL VALIDATION
// ============================================
function validatePedagogy(question, allQuestions) {
  const issues = [];
  const qid = question.questionId;

  // Age-appropriate vocabulary check for Year 8
  const advancedVocab = ['entropy', 'enthalpy', 'intermolecular', 'thermodynamic', 'exothermic', 'endothermic'];
  const content = [question.stem, question.solution].filter(Boolean).join(' ').toLowerCase();

  advancedVocab.forEach(word => {
    if (content.includes(word)) {
      issues.push({
        severity: 'warning',
        message: `Vocabulary '${word}' may be advanced for Year 8`,
        field: 'vocabulary',
        autoFixable: false
      });
    }
  });

  // Hint progression
  if (question.hints && question.hints.length >= 2) {
    const hint1 = question.hints[0]?.content || '';
    const solution = question.solution || '';

    // Check if first hint reveals answer
    if (question.questionType === 'MCQ' && question.mcqOptions) {
      const correctOption = question.mcqOptions.find(o => o.isCorrect);
      if (correctOption && hint1.toLowerCase().includes(correctOption.text.toLowerCase().substring(0, 20))) {
        issues.push({ severity: 'warning', message: 'Hint 1 may reveal the correct answer', field: 'hints' });
      }
    }
  }

  // Solution explains reasoning
  if (question.solution) {
    const hasExplanation = question.solution.includes('because') ||
                          question.solution.includes('This is') ||
                          question.solution.includes('explains') ||
                          question.solution.includes('**') ||
                          question.solution.length > 200;
    if (!hasExplanation) {
      issues.push({ severity: 'warning', message: 'Solution may not explain reasoning fully', field: 'solution' });
    }
  }

  // Learning arc coherence
  if (question.learningArc) {
    const phase = question.learningArc.phase;
    const difficulty = question.difficulty;

    // Phase 1 should have lower difficulty
    if (phase === 1 && difficulty > 3) {
      issues.push({ severity: 'warning', message: `Phase 1 question has high difficulty (${difficulty})`, field: 'learningArc' });
    }
    // Phase 4 should have higher difficulty
    if (phase === 4 && difficulty < 3) {
      issues.push({ severity: 'warning', message: `Phase 4 question has low difficulty (${difficulty})`, field: 'learningArc' });
    }

    // Check buildsOn references exist
    if (question.learningArc.buildsOn) {
      question.learningArc.buildsOn.forEach(ref => {
        const exists = allQuestions.some(q => q.questionId === ref);
        if (!exists && ref !== '') {
          issues.push({ severity: 'warning', message: `buildsOn reference '${ref}' not found`, field: 'learningArc' });
        }
      });
    }
  }

  return issues;
}

// ============================================
// LAYER 4: PRESENTATION VALIDATION
// ============================================
function validatePresentation(question) {
  const issues = [];

  // Check for very long unbroken text (might overflow)
  const content = question.stem || '';
  const words = content.split(' ');
  const longWords = words.filter(w => w.length > 30);
  if (longWords.length > 0) {
    issues.push({ severity: 'warning', message: 'Contains very long words that may overflow on mobile', field: 'presentation' });
  }

  // Check table column count (mobile-friendly is 4 or less)
  if (content.includes('|')) {
    const tableLines = content.split('\n').filter(l => l.includes('|') && l.trim().startsWith('|'));
    if (tableLines.length > 0) {
      const columns = (tableLines[0].match(/\|/g) || []).length - 1;
      if (columns > 5) {
        issues.push({ severity: 'warning', message: `Table has ${columns} columns, may not fit mobile screens`, field: 'presentation' });
      }
    }
  }

  // Check equation complexity (very rough heuristic)
  const equations = content.match(/\$[^$]+\$/g) || [];
  equations.forEach(eq => {
    if (eq.length > 100) {
      issues.push({ severity: 'warning', message: 'Long equation may need wrapping for mobile', field: 'presentation' });
    }
  });

  return issues;
}

// ============================================
// MAIN VALIDATION
// ============================================
function runValidation() {
  console.log('\n' + '═'.repeat(60));
  console.log('  📋 BRAINSPARK QUESTION VALIDATION PIPELINE');
  console.log('═'.repeat(60) + '\n');

  // Load questions
  const filepath = path.join(__dirname, QUESTIONS_FILE);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    console.error(`❌ Failed to load questions file: ${e.message}`);
    process.exit(2);
  }

  const questions = data.questions || [];
  results.summary.totalQuestions = questions.length;

  console.log(`📄 File: ${QUESTIONS_FILE}`);
  console.log(`📊 Questions: ${questions.length}\n`);

  // Collect distributions
  questions.forEach(q => {
    // Question types
    const type = q.questionType || 'unknown';
    results.distributions.questionTypes[type] = (results.distributions.questionTypes[type] || 0) + 1;

    // Pedagogy types
    const pedType = q.pedagogy?.type || 'unknown';
    results.distributions.pedagogy[pedType] = (results.distributions.pedagogy[pedType] || 0) + 1;

    // Difficulty
    const diff = q.difficulty || 0;
    results.distributions.difficulty[diff] = (results.distributions.difficulty[diff] || 0) + 1;

    // Phases
    const phase = q.learningArc?.phase || 0;
    results.distributions.phases[phase] = (results.distributions.phases[phase] || 0) + 1;
  });

  // Run all validations
  console.log('━'.repeat(60));
  console.log('  LAYER 1: SCHEMA VALIDATION');
  console.log('━'.repeat(60));

  questions.forEach((q, i) => {
    const issues = validateSchema(q, i);
    if (issues.length === 0) {
      results.layers.schema.passed++;
    } else {
      const hasError = issues.some(iss => iss.severity === 'error');
      if (hasError) results.layers.schema.failed++;
      else results.layers.schema.passed++;

      issues.forEach(iss => {
        results.layers.schema.issues.push({ questionId: q.questionId, ...iss });
        if (iss.severity === 'error') results.summary.errors++;
        else results.summary.warnings++;
      });
    }
  });

  const schemaErrors = results.layers.schema.issues.filter(i => i.severity === 'error').length;
  const schemaWarnings = results.layers.schema.issues.filter(i => i.severity === 'warning').length;
  console.log(`  ✅ Passed: ${results.layers.schema.passed}`);
  console.log(`  ❌ Errors: ${schemaErrors}`);
  console.log(`  ⚠️  Warnings: ${schemaWarnings}\n`);

  console.log('━'.repeat(60));
  console.log('  LAYER 2: CONTENT VALIDATION');
  console.log('━'.repeat(60));

  questions.forEach((q) => {
    const issues = validateContent(q);
    if (issues.length === 0) {
      results.layers.content.passed++;
    } else {
      const hasError = issues.some(iss => iss.severity === 'error');
      if (hasError) results.layers.content.failed++;
      else results.layers.content.passed++;

      issues.forEach(iss => {
        results.layers.content.issues.push({ questionId: q.questionId, ...iss });
        if (iss.severity === 'error') results.summary.errors++;
        else results.summary.warnings++;
      });
    }
  });

  const contentErrors = results.layers.content.issues.filter(i => i.severity === 'error').length;
  const contentWarnings = results.layers.content.issues.filter(i => i.severity === 'warning').length;
  console.log(`  ✅ Passed: ${results.layers.content.passed}`);
  console.log(`  ❌ Errors: ${contentErrors}`);
  console.log(`  ⚠️  Warnings: ${contentWarnings}\n`);

  console.log('━'.repeat(60));
  console.log('  LAYER 3: PEDAGOGICAL VALIDATION');
  console.log('━'.repeat(60));

  questions.forEach((q) => {
    const issues = validatePedagogy(q, questions);
    if (issues.length === 0) {
      results.layers.pedagogy.passed++;
    } else {
      results.layers.pedagogy.warnings += issues.length;
      issues.forEach(iss => {
        results.layers.pedagogy.issues.push({ questionId: q.questionId, ...iss });
        results.summary.warnings++;
      });
    }
  });

  console.log(`  ✅ Passed: ${results.layers.pedagogy.passed}`);
  console.log(`  ⚠️  Warnings: ${results.layers.pedagogy.warnings}\n`);

  console.log('━'.repeat(60));
  console.log('  LAYER 4: PRESENTATION VALIDATION');
  console.log('━'.repeat(60));

  questions.forEach((q) => {
    const issues = validatePresentation(q);
    if (issues.length === 0) {
      results.layers.presentation.passed++;
    } else {
      results.layers.presentation.failed += issues.filter(i => i.severity === 'error').length;
      issues.forEach(iss => {
        results.layers.presentation.issues.push({ questionId: q.questionId, ...iss });
        if (iss.severity === 'error') results.summary.errors++;
        else results.summary.warnings++;
      });
    }
  });

  const presentationErrors = results.layers.presentation.issues.filter(i => i.severity === 'error').length;
  const presentationWarnings = results.layers.presentation.issues.filter(i => i.severity === 'warning').length;
  console.log(`  ✅ Passed: ${results.layers.presentation.passed}`);
  console.log(`  ❌ Errors: ${presentationErrors}`);
  console.log(`  ⚠️  Warnings: ${presentationWarnings}\n`);

  // Summary
  results.summary.passed = questions.length - results.summary.errors;
  if (results.summary.errors > 0) {
    results.summary.status = 'FAILED';
  } else if (results.summary.warnings > 5) {
    results.summary.status = 'NEEDS_REVIEW';
  } else {
    results.summary.status = 'PASSED';
  }

  console.log('═'.repeat(60));
  console.log('  📊 VALIDATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Total Questions: ${results.summary.totalQuestions}`);
  console.log(`  Passed:          ${results.summary.passed}`);
  console.log(`  Errors:          ${results.summary.errors}`);
  console.log(`  Warnings:        ${results.summary.warnings}`);
  console.log(`  Status:          ${results.summary.status === 'PASSED' ? '✅' : results.summary.status === 'NEEDS_REVIEW' ? '⚠️' : '❌'} ${results.summary.status}`);

  console.log('\n━'.repeat(60));
  console.log('  📈 DISTRIBUTIONS');
  console.log('━'.repeat(60));

  console.log('\n  Question Types:');
  Object.entries(results.distributions.questionTypes).forEach(([type, count]) => {
    console.log(`    ${type}: ${count}`);
  });

  console.log('\n  Pedagogy Types:');
  Object.entries(results.distributions.pedagogy).forEach(([type, count]) => {
    console.log(`    ${type}: ${count}`);
  });

  console.log('\n  Difficulty Levels:');
  Object.entries(results.distributions.difficulty).sort((a, b) => a[0] - b[0]).forEach(([level, count]) => {
    console.log(`    Level ${level}: ${count}`);
  });

  console.log('\n  Phases:');
  Object.entries(results.distributions.phases).sort((a, b) => a[0] - b[0]).forEach(([phase, count]) => {
    console.log(`    Phase ${phase}: ${count}`);
  });

  // Show issues
  const allIssues = [
    ...results.layers.schema.issues,
    ...results.layers.content.issues,
    ...results.layers.pedagogy.issues,
    ...results.layers.presentation.issues
  ].filter(i => i.severity === 'error');

  if (allIssues.length > 0) {
    console.log('\n━'.repeat(60));
    console.log('  ❌ ERRORS TO FIX');
    console.log('━'.repeat(60));
    allIssues.forEach(iss => {
      console.log(`  [${iss.questionId}] ${iss.message}`);
    });
  }

  // Sample warnings
  const warnings = [
    ...results.layers.schema.issues,
    ...results.layers.content.issues,
    ...results.layers.pedagogy.issues,
    ...results.layers.presentation.issues
  ].filter(i => i.severity === 'warning');

  if (warnings.length > 0) {
    console.log('\n━'.repeat(60));
    console.log(`  ⚠️  SAMPLE WARNINGS (showing ${Math.min(10, warnings.length)} of ${warnings.length})`);
    console.log('━'.repeat(60));
    warnings.slice(0, 10).forEach(iss => {
      console.log(`  [${iss.questionId}] ${iss.message}`);
    });
  }

  console.log('\n' + '═'.repeat(60) + '\n');

  // Write validation report
  const reportPath = path.join(__dirname, 'questions', 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Full report saved to: ${reportPath}\n`);

  // Exit code
  process.exit(results.summary.errors > 0 ? 2 : results.summary.warnings > 5 ? 1 : 0);
}

runValidation();
