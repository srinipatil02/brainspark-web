---
name: edu-upload
description: Upload validated question sets to Firebase Firestore. Handles batch uploads, generates document IDs, and provides rollback instructions. Use after /edu:validate confirms question set is ready.
allowed-tools: Read, Write, Bash, Glob
---

# Firestore Uploader

Uploads validated question sets to Firebase Firestore with proper batching, per-set architecture, migration support, and app integration.

## Quick Start

```
/edu:upload questions_file=scripts/questions/states-of-matter-year8-complete.json
```

## Input Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| questions_file | Yes | Path to validated questions JSON |
| include_classic | No | Also upload migrated classic questions (default: true) |
| dry_run | No | Preview without uploading (default: false) |
| batch_size | No | Documents per batch (default: 400, max: 500) |

## Prerequisites

### Validation Required
Questions must pass `/edu:validate` before upload:
```
/edu:validate questions_file=scripts/questions/states-of-matter-year8-complete.json
# Must show: status: "PASSED" or "WARNINGS_ONLY"
```

### Environment Setup
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

Default path (if not set):
```
/Users/srini/code/REFERENCE-flutter-app/thebrainspark-project-firebase-adminsdk-fbsvc-2d1f468a9e.json
```

---

## CRITICAL: Per-Set SetId Architecture

### Old Approach (DO NOT USE)
```
setId: "year8-science-states-of-matter-medium"  // Shared across all sets
Query: Get all 50 questions, then slice by index
```
**Problem**: Not scalable, adding more questions breaks existing sets.

### New Approach (REQUIRED)
```
setId: "year8-states-of-matter-set1"   // Unique per set
setId: "year8-states-of-matter-set2"   // Unique per set
...
Query: Get exactly the questions for that set
```
**Benefit**: Dynamic, scalable, can add unlimited sets.

### SetId Naming Convention
```
{year}-{topic-slug}-set{number}

Examples:
- year8-states-of-matter-set1   (Learning Arc Set 1)
- year8-states-of-matter-set9   (Classic Set 9)
- year8-cells-set1
- year7-fractions-set1
```

---

## Complete Upload Workflow

### Step 1: Ensure Questions Have Per-Set SetIds

Each question in the JSON must have:
```json
{
  "questionId": "states-matter-y8-001",
  "paperMetadata": {
    "section": "year8-science",
    "setId": "year8-states-of-matter-set1",  // UNIQUE per set
    "sequenceInPaper": 1
  }
}
```

Questions are assigned to sets based on their `paperMetadata.setId` field.

### Step 2: Run Migration (If Classic Questions Exist)

If there are existing questions with old shared setId format:

```bash
node scripts/migrate-old-questions.js
```

This creates `scripts/questions/{topic}-year{year}-classic.json` with:
- Questions reassigned to sets 9-13 (or appropriate numbers)
- SetIds updated to per-set format
- Question types normalized (short-answer → SHORT_ANSWER)

### Step 3: Upload All Questions

```bash
cd scripts
export GOOGLE_APPLICATION_CREDENTIALS="..."
node upload-all-states-of-matter.js
```

---

## File Structure

### Questions Directory
```
scripts/questions/
├── states-of-matter-year8-complete.json   # 80 new questions (sets 1-8)
├── states-of-matter-year8-classic.json    # 50 migrated questions (sets 9-13)
├── cells-year8-complete.json              # Another topic
└── validation-report.json                 # From /edu:validate
```

### Question File Format
```json
{
  "metadata": {
    "topic": "States of Matter",
    "topicSlug": "states-of-matter",
    "outcomeCode": "ACSSU151",
    "year": 8,
    "subject": "Science",
    "strand": "Chemical Sciences",
    "questionCount": 80,
    "generatedAt": "2024-01-07",
    "setsRange": "1-8"
  },
  "questions": [
    {
      "questionId": "states-matter-y8-001",
      "questionType": "MCQ",
      "stem": "What are the three common states of matter?",
      "mcqOptions": [...],
      "solution": "...",
      "hints": [...],
      "difficulty": 2,
      "curriculum": {...},
      "learningArc": {
        "phase": 1,
        "phasePosition": 1,
        "conceptsUsed": ["c1"],
        "buildsOn": [],
        "preparesFor": ["states-matter-y8-002"]
      },
      "pedagogy": {
        "type": "scaffolded",
        "targetFeeling": "I can do this!"
      },
      "richContent": {
        "hasEquations": false,
        "hasTables": false,
        "hasDiagrams": false
      },
      "paperMetadata": {
        "section": "year8-science",
        "setId": "year8-states-of-matter-set1",
        "sequenceInPaper": 1
      },
      "status": "published"
    }
  ]
}
```

---

## Upload Script Template

### Combined Upload Script
Create `scripts/upload-all-{topic}.js`:

```javascript
#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '../../REFERENCE-flutter-app/thebrainspark-project-firebase-adminsdk-fbsvc-2d1f468a9e.json');

  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://thebrainspark-project.firebaseio.com'
  });
}

const db = admin.firestore();

async function uploadQuestions() {
  console.log('======================================================');
  console.log(' UPLOAD ALL {TOPIC} QUESTIONS');
  console.log('======================================================\n');

  const questionsDir = path.join(__dirname, 'questions');

  // Load new questions (sets 1-8)
  const newQuestionsPath = path.join(questionsDir, '{topic}-year{year}-complete.json');
  // Load classic questions (sets 9-13)
  const classicQuestionsPath = path.join(questionsDir, '{topic}-year{year}-classic.json');

  let newQuestions = [];
  let classicQuestions = [];

  if (fs.existsSync(newQuestionsPath)) {
    const newData = JSON.parse(fs.readFileSync(newQuestionsPath, 'utf8'));
    newQuestions = newData.questions || [];
    console.log(`[NEW] Loaded ${newQuestions.length} questions`);
  }

  if (fs.existsSync(classicQuestionsPath)) {
    const classicData = JSON.parse(fs.readFileSync(classicQuestionsPath, 'utf8'));
    classicQuestions = classicData.questions || [];
    console.log(`[CLASSIC] Loaded ${classicQuestions.length} questions`);
  }

  const allQuestions = [...newQuestions, ...classicQuestions];

  if (allQuestions.length === 0) {
    console.error('ERROR: No questions to upload!');
    process.exit(1);
  }

  console.log(`\nTOTAL: ${allQuestions.length} questions to upload\n`);

  // Show distribution by setId
  const setIdCounts = {};
  allQuestions.forEach(q => {
    const setId = q.paperMetadata?.setId || 'unknown';
    setIdCounts[setId] = (setIdCounts[setId] || 0) + 1;
  });

  console.log('Distribution by setId:');
  Object.entries(setIdCounts).sort().forEach(([setId, count]) => {
    console.log(`  ${setId}: ${count} questions`);
  });

  // Upload in batches (Firestore limit is 500)
  const batchSize = 400;
  const batches = [];

  for (let i = 0; i < allQuestions.length; i += batchSize) {
    batches.push(allQuestions.slice(i, i + batchSize));
  }

  let totalUploaded = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = db.batch();
    const currentBatch = batches[batchIndex];

    console.log(`\nProcessing batch ${batchIndex + 1}/${batches.length}...`);

    for (const question of currentBatch) {
      const docRef = db.collection('questions').doc(question.questionId);
      batch.set(docRef, question);
      totalUploaded++;
    }

    await batch.commit();
    console.log(`  Batch ${batchIndex + 1} committed successfully`);
  }

  console.log(`\n======================================================`);
  console.log(` Successfully uploaded ${totalUploaded} questions!`);
  console.log(`======================================================\n`);
}

uploadQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
```

---

## App Integration Checklist

After uploading questions, the app must be updated to support the new sets:

### 1. Update generateStaticParams
File: `src/app/curriculum/science/{topic}/set/[setNumber]/page.tsx`

```typescript
export function generateStaticParams() {
  return [
    { setNumber: '1' },
    { setNumber: '2' },
    // ... add all set numbers
    { setNumber: '13' },
  ];
}
```

### 2. Update Set Metadata
Same file, add metadata for each set:

```typescript
const setMetadata: Record<number, {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  firestoreSetId: string;  // CRITICAL: Must match setId in Firestore
  topics: string[];
}> = {
  1: {
    id: 'year8-science-states-of-matter-set1',
    title: 'States & Particles',
    subtitle: 'Introduction to the three states and particle model',
    icon: '⚛️',
    color: 'blue',
    firestoreSetId: 'year8-states-of-matter-set1',  // Used in Firestore query
    topics: ['Three states', 'Particle model', 'Arrangement', 'Movement'],
  },
  // ... all sets
};
```

### 3. Update Topic Page Sets Array
File: `src/app/curriculum/science/{topic}/page.tsx`

```typescript
const difficultyLevels = [
  {
    id: 'medium',
    name: 'Standard',
    sets: [
      { setNumber: 1, id: '...', title: '...', questions: 10, ... },
      { setNumber: 2, ... },
      // ... add all sets
    ],
  },
];
```

### 4. Add Missing Colors
File: `src/components/SetPlayerClient.tsx`

If using new colors (slate, stone, zinc, gray, neutral), add to `getColorClasses`:

```typescript
gray: {
  bg: 'bg-gray-500',
  bgLight: 'bg-gray-50',
  text: 'text-gray-600',
  // ... all color properties
},
neutral: {
  bg: 'bg-neutral-500',
  // ...
},
```

Also add to topic page's `getColorClasses` and `setColors` array.

### 5. Verify SetPlayerClient Query
Ensure SetPlayerClient queries by exact setId (not slicing):

```typescript
// CORRECT: Query by specific setId
const q = query(
  collection(db, 'questions'),
  where('paperMetadata.setId', '==', setMeta.firestoreSetId)
);

// Use all questions returned (no slicing needed)
setQuestions(allQuestions);
```

---

## Migration Script Template

For migrating existing questions to new per-set format:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Set configuration
const OLD_SET_ID = 'year8-science-states-of-matter-medium';
const NEW_SET_PREFIX = 'year8-states-of-matter-set';
const QUESTIONS_PER_SET = 10;
const STARTING_SET_NUMBER = 9;  // Classic sets start at 9

function migrateQuestions() {
  const oldPath = path.join(__dirname, 'old-questions.json');
  const oldData = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
  const oldQuestions = oldData.questions;

  console.log(`Found ${oldQuestions.length} questions to migrate`);

  const migratedQuestions = oldQuestions.map((q, index) => {
    const setNumber = Math.floor(index / QUESTIONS_PER_SET) + STARTING_SET_NUMBER;
    const newSetId = `${NEW_SET_PREFIX}${setNumber}`;

    // Normalize questionType
    let normalizedType = q.questionType;
    if (normalizedType === 'short-answer') normalizedType = 'SHORT_ANSWER';
    if (normalizedType === 'mcq') normalizedType = 'MCQ';

    return {
      ...q,
      questionType: normalizedType,
      paperMetadata: {
        ...q.paperMetadata,
        setId: newSetId,
        sequenceInPaper: (index % QUESTIONS_PER_SET) + 1,
      },
      // Add missing fields with defaults
      learningArc: q.learningArc || {
        phase: 1,
        phasePosition: (index % QUESTIONS_PER_SET) + 1,
        conceptsUsed: ['c1'],
        buildsOn: [],
        preparesFor: [],
      },
      pedagogy: q.pedagogy || {
        type: 'scaffolded',
        targetFeeling: 'I can do this!',
      },
      richContent: q.richContent || {
        hasEquations: false,
        hasTables: false,
        hasDiagrams: false,
      },
    };
  });

  // Show distribution
  const setCounts = {};
  migratedQuestions.forEach(q => {
    const setId = q.paperMetadata.setId;
    setCounts[setId] = (setCounts[setId] || 0) + 1;
  });

  console.log('\nMigrated setId distribution:');
  Object.entries(setCounts).sort().forEach(([setId, count]) => {
    console.log(`  ${setId}: ${count} questions`);
  });

  // Write output
  const output = {
    metadata: {
      topic: "Topic Name (Classic)",
      migratedAt: new Date().toISOString().split('T')[0],
      setsRange: `${STARTING_SET_NUMBER}-${STARTING_SET_NUMBER + Math.ceil(oldQuestions.length / QUESTIONS_PER_SET) - 1}`,
    },
    questions: migratedQuestions,
  };

  const outputPath = path.join(__dirname, 'questions/topic-year-classic.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nMigrated ${migratedQuestions.length} questions to ${outputPath}`);
}

migrateQuestions();
```

---

## Verification Steps

### 1. Check Firestore Console
Navigate to Firebase Console > Firestore > questions collection
Filter by: `paperMetadata.setId == "year8-states-of-matter-set1"`

### 2. Test App Locally
```bash
npm run dev
# Navigate to http://localhost:3000/curriculum/science/year8-states-of-matter
# Click on each set, verify questions load
```

### 3. Build Test
```bash
npm run build
# Should show all set paths generated
```

---

## Rollback Support

### Create Rollback File
Each upload should save document IDs:
```javascript
const uploadedIds = allQuestions.map(q => q.questionId);
fs.writeFileSync(
  `scripts/uploads/${topic}-${date}-ids.json`,
  JSON.stringify(uploadedIds, null, 2)
);
```

### Rollback Script
```javascript
const idsToDelete = require('./uploads/{topic}-ids.json');
const batch = db.batch();

idsToDelete.forEach(id => {
  batch.delete(db.collection('questions').doc(id));
});

await batch.commit();
console.log(`Deleted ${idsToDelete.length} documents`);
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "No questions found for this set" | SetId mismatch | Verify `firestoreSetId` in app matches `paperMetadata.setId` in Firestore |
| Questions showing in wrong set | Using old slice approach | Update SetPlayerClient to query by exact setId, remove slicing |
| Missing colors | Color not defined | Add color to both SetPlayerClient and topic page |
| Set not appearing | generateStaticParams missing | Add set number to generateStaticParams array |
| Build fails | Metadata missing | Add set to setMetadata object |

---

## Related Skills

- `/edu:generate` - Generate questions before upload
- `/edu:validate` - Validate questions before upload
- `/edu:full` - Full pipeline includes upload
- `/edu:map` - Map curriculum structure

---

## Summary: End-to-End Flow

```
1. /edu:map           → Understand curriculum structure
2. /edu:research      → Deep research on topic
3. /edu:generate      → Generate 80 questions (sets 1-8)
4. /edu:validate      → Validate all questions
5. migrate-old        → Migrate existing questions (sets 9+)
6. /edu:upload        → Upload all to Firestore
7. App Updates        → generateStaticParams, metadata, colors
8. npm run build      → Verify build passes
9. npm run dev        → Test locally
10. firebase deploy   → Deploy to production
```
