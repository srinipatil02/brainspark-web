const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'qa21-complete.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let fixedCount = 0;

data.questions = data.questions.map((q, index) => {
  const qNum = parseInt(q.questionId.split('-').pop());

  // Only fix Q101-Q150
  if (qNum < 101) return q;

  fixedCount++;

  // Add missing top-level fields
  if (!q.estimatedTime) q.estimatedTime = 90;
  if (!q.status) q.status = 'published';

  // Add curriculum
  if (!q.curriculum) {
    q.curriculum = {
      system: 'nsw-selective',
      codes: ['mathematics'],
      year: 6,
      subject: 'Mathematics',
      strand: 'Multi-Concept Integration'
    };
  }

  // Add paperMetadata
  if (!q.paperMetadata) {
    const setNum = Math.ceil(qNum / 10);
    q.paperMetadata = {
      section: 'nsw-selective-mathematics',
      setId: 'nsw-sel-qa21-set' + setNum,
      sequenceInPaper: qNum
    };
  }

  // Convert methodologySteps to solutionApproach (join with →)
  if (q.nswSelective && q.nswSelective.methodologySteps && !q.nswSelective.solutionApproach) {
    q.nswSelective.solutionApproach = q.nswSelective.methodologySteps.join(' → ');
    delete q.nswSelective.methodologySteps;
  }

  return q;
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log('✅ Fixed ' + fixedCount + ' questions (Q101-Q150)');
console.log('\n📋 Fields added:');
console.log('   - estimatedTime: 90');
console.log('   - status: published');
console.log('   - curriculum (nsw-selective)');
console.log('   - paperMetadata (section, setId, sequenceInPaper)');
console.log('   - Converted methodologySteps → solutionApproach');
