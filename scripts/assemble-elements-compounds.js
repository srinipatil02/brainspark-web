const fs = require('fs');
const path = require('path');

// Configuration
const TOPIC = 'Elements, Compounds and Mixtures';
const TOPIC_SLUG = 'elements-compounds-mixtures';
const OUTCOME_CODE = 'ACSSU152';
const YEAR = 8;

// Phase files
const phaseFiles = [
  'questions/elements-compounds-mixtures-phase1-q1-q20.json',
  'questions/elements-compounds-mixtures-phase2-q21-q40.json',
  'questions/elements-compounds-mixtures-phase3-q41-q60.json',
  'questions/elements-compounds-mixtures-phase4-q61-q80.json'
];

// Output file
const outputFile = `questions/${TOPIC_SLUG}-year${YEAR}-complete.json`;

function assignSetId(questionIndex) {
  const setNumber = Math.floor(questionIndex / 10) + 1;
  return `year${YEAR}-${TOPIC_SLUG}-set${setNumber}`;
}

function assignSequenceInPaper(questionIndex) {
  return (questionIndex % 10) + 1;
}

function normalizeQuestionId(question, index) {
  // Create consistent ID format
  const paddedIndex = String(index + 1).padStart(3, '0');
  return `ecm-y${YEAR}-${paddedIndex}`;
}

function normalizeQuestion(question, index) {
  const setId = assignSetId(index);
  const sequenceInPaper = assignSequenceInPaper(index);
  const questionId = normalizeQuestionId(question, index);

  // Normalize questionType to uppercase format
  let questionType = question.questionType;
  if (questionType === 'short-answer' || questionType === 'short_answer') {
    questionType = 'SHORT_ANSWER';
  } else if (questionType === 'explanation') {
    questionType = 'SHORT_ANSWER';
  } else if (questionType === 'mcq' || questionType === 'MCQ') {
    questionType = 'MCQ';
  }

  return {
    questionId,
    questionType,
    stem: question.stem,
    ...(question.mcqOptions && { mcqOptions: question.mcqOptions }),
    solution: question.solution,
    hints: question.hints || [
      { level: 1, content: 'Think about what you learned in earlier questions.', revealsCriticalInfo: false },
      { level: 2, content: 'Review the key concepts for this topic.', revealsCriticalInfo: true }
    ],
    difficulty: question.difficulty || 2,
    estimatedTime: question.estimatedTime || 120,
    curriculum: {
      system: 'NSW Science K-10 Syllabus',
      codes: [OUTCOME_CODE],
      year: YEAR,
      subject: 'science',
      strand: 'Chemical Sciences'
    },
    learningArc: {
      phase: Math.floor(index / 20) + 1,
      phasePosition: index + 1,
      conceptsUsed: question.learningArc?.conceptsUsed || [],
      buildsOn: question.learningArc?.buildsOn || [],
      preparesFor: question.learningArc?.preparesFor || []
    },
    pedagogy: question.pedagogy || {
      type: 'scaffolded',
      targetFeeling: getPhaseFeeling(Math.floor(index / 20) + 1)
    },
    richContent: question.richContent || {
      hasEquations: false,
      hasTables: false,
      hasGraphs: false,
      hasDiagrams: false,
      hasCode: false
    },
    paperMetadata: {
      section: `year${YEAR}-science`,
      setId,
      sequenceInPaper
    },
    status: 'published'
  };
}

function getPhaseFeeling(phase) {
  const feelings = {
    1: 'I can do this!',
    2: 'This is how it works in real life!',
    3: 'Aha! Now I really understand!',
    4: 'I can figure out new problems!'
  };
  return feelings[phase] || 'I can do this!';
}

function main() {
  console.log('Assembling Elements, Compounds and Mixtures questions...\n');

  let allQuestions = [];

  // Load each phase file
  for (const phaseFile of phaseFiles) {
    const filePath = path.join(__dirname, phaseFile);

    if (!fs.existsSync(filePath)) {
      console.error(`Missing file: ${phaseFile}`);
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const questions = data.questions || data;

    console.log(`Loaded ${questions.length} questions from ${phaseFile}`);
    allQuestions = allQuestions.concat(questions);
  }

  console.log(`\nTotal questions loaded: ${allQuestions.length}`);

  // Normalize all questions
  const normalizedQuestions = allQuestions.map((q, i) => normalizeQuestion(q, i));

  // Create output structure
  const output = {
    metadata: {
      topic: TOPIC,
      topicSlug: TOPIC_SLUG,
      outcomeCode: OUTCOME_CODE,
      year: YEAR,
      questionCount: normalizedQuestions.length,
      generatedAt: new Date().toISOString().split('T')[0],
      version: '1.0',
      phases: {
        foundation: { questions: '1-20', sets: ['set1', 'set2'] },
        application: { questions: '21-40', sets: ['set3', 'set4'] },
        connection: { questions: '41-60', sets: ['set5', 'set6'] },
        mastery: { questions: '61-80', sets: ['set7', 'set8'] }
      }
    },
    questions: normalizedQuestions
  };

  // Validate setId distribution
  const setIds = {};
  for (const q of normalizedQuestions) {
    const setId = q.paperMetadata.setId;
    setIds[setId] = (setIds[setId] || 0) + 1;
  }

  console.log('\nSet distribution:');
  Object.entries(setIds).sort().forEach(([setId, count]) => {
    console.log(`  ${setId}: ${count} questions`);
  });

  // Validate question types
  const types = { MCQ: 0, SHORT_ANSWER: 0 };
  for (const q of normalizedQuestions) {
    types[q.questionType] = (types[q.questionType] || 0) + 1;
  }

  console.log('\nQuestion type distribution:');
  Object.entries(types).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} questions`);
  });

  // Write output
  const outputPath = path.join(__dirname, outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Complete question set written to: ${outputFile}`);
  console.log(`   Total: ${normalizedQuestions.length} questions across 8 sets`);
}

main();
