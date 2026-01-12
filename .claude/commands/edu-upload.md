---
description: Upload validated question sets to Firebase Firestore
argument-hint: path="scripts/questions/states-matter.json"
allowed-tools: Read, Bash, Glob
---

# Firebase Uploader

Upload questions from $1 to Firestore.

## Arguments

- **path** ($1): Path to validated questions JSON file

## Firebase Configuration

- Project: thebrainspark-project
- Collection: questions
- Service Account: Set GOOGLE_APPLICATION_CREDENTIALS environment variable

## Process

1. **Load Questions**: Read the validated JSON file
2. **Transform Data**: Ensure Firestore-compatible format (no undefined values)
3. **Generate IDs**: Use questionId field as document ID
4. **Batch Upload**: Upload in batches of 500 (Firestore limit)
5. **Verify**: Confirm all documents uploaded successfully

## Output

Provide upload summary:
- Total questions uploaded
- Success/failure count
- Document IDs created
- Rollback instructions if needed

See `.claude/skills/edu-upload/SKILL.md` for detailed process.
