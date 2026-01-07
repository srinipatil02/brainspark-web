# CLAUDE.md - BrainSpark Next.js Web Application

## CRITICAL: PROJECT IDENTIFICATION
- **Project**: BrainSpark Web (Next.js)
- **Location**: /Users/srini/code/brainspark-web
- **Type**: Next.js 16.1.1 + React 19 + TypeScript
- **Firebase**: thebrainspark-project
- **Status**: ACTIVE - Primary development project

## DO NOT CONFUSE WITH:
- ❌ /Users/srini/code/REFERENCE-flutter-app (Flutter - reference only, do not develop here)
- ❌ /Users/srini/code/brainspark (deleted - was empty template)

## Technology Stack
- Next.js 16.1.1 with App Router
- React 19.2.3
- TypeScript
- Tailwind CSS
- Firebase SDK 12.7.0

## Commands
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
```

## Project Structure
```
src/
├── app/           # Next.js App Router pages
│   ├── page.tsx                 # Landing/dashboard
│   ├── login/                   # Authentication
│   ├── signup/
│   ├── curriculum/              # Year 8 practice
│   │   ├── page.tsx            # Subject/topic selector
│   │   └── science/
│   │       ├── year8-cells/
│   │       ├── year8-states-of-matter/
│   │       ├── year8-elements-compounds/
│   │       ├── year8-chemical-reactions/
│   │       ├── year8-rocks-minerals/
│   │       └── year8-energy/
│   └── selective/               # NSW Selective exam prep
│       ├── page.tsx
│       ├── mathematics/
│       ├── reading/
│       ├── thinking-skills/
│       └── writing/
├── components/    # React components
│   └── chat/     # ConceptChatModal
├── contexts/      # React contexts (AuthContext)
├── hooks/         # Custom hooks (useSetProgress, useAuth)
├── lib/           # Firebase initialization
│   └── firebase.ts
├── services/      # Firestore data layer
│   ├── questionService.ts
│   ├── questionTransformer.ts
│   ├── progressService.ts
│   ├── passageService.ts
│   ├── conceptChatService.ts
│   └── writingGradingService.ts
└── types/         # TypeScript interfaces
    └── index.ts   # FirestoreQuestion, FirestorePassage, etc.
```

## Firebase Configuration
- **Project ID**: thebrainspark-project
- **Functions Region**: us-central1
- **Environment File**: .env.local
- **Service Account**: /Users/srini/code/my_learning_path/thebrainspark-project-firebase-adminsdk-fbsvc-2d1f468a9e.json

## Current Features
✅ Curriculum Practice (6 Science topics, 320 questions)
✅ NSW Selective Exam (4 sections)
✅ Question Player (MCQ, short answer, extended response)
✅ AI Chat (ConceptChatModal)
✅ Hints System (3-level progressive)
✅ Authentication (email/password, roles)

## Firestore Collections Used
- `users` - User profiles with roles
- `questions` - Question bank (500+ questions)
  - Filtered by: `paperMetadata.section`, `curriculum.subject`, `status`
  - Organized by: `setId` (e.g., `year8-science-cells-medium`)
- `sets` - Question set metadata
- `stimuli` - Reading comprehension passages
- `passages` - Full reading passage content

## Key TypeScript Interfaces (src/types/index.ts)
```typescript
interface FirestoreQuestion {
  questionId: string;
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'EXTENDED_RESPONSE';
  stem: string;
  mcqOptions?: FirestoreMCQOption[];
  solution?: string;
  hints?: FirestoreHint[];
  curriculum?: {
    system: string;
    codes: string[];
    year: number;
    subject: string;
    strand: string;
  };
  difficulty: number;
  paperMetadata?: {
    section: string;
    setId: string;
  };
  status: string;
}
```

## Development Workflow

### Starting Development Server
```bash
cd /Users/srini/code/brainspark-web
npm run dev
# Navigate to http://localhost:3000
```

### Uploading Questions to Firebase
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/Users/srini/code/my_learning_path/thebrainspark-project-firebase-adminsdk-fbsvc-2d1f468a9e.json"
cd /Users/srini/code/brainspark-web/scripts
node upload-single-set.js energy-set1-q1-q10.json
```

### Testing Firebase Connection
```bash
# Ensure .env.local has correct Firebase config
npm run dev
# Check browser console for Firebase connection logs
```

## Using Flutter as Reference

When implementing new features, reference the Flutter codebase at:
**`/Users/srini/code/REFERENCE-flutter-app`** (after renaming)

**DO NOT copy-paste Flutter code.** Use it to understand:
- Firestore data structures and query patterns
- Business logic flows and validation rules
- Feature requirements and acceptance criteria
- UI/UX patterns and user flows

Then **reimplement in React/TypeScript** using Next.js patterns.

### Example: Adding a New Feature
1. Check if Flutter has the feature: `/Users/srini/code/REFERENCE-flutter-app/lib/services/`
2. Understand the logic: Read Dart code, Firestore queries, data models
3. Design React implementation: Plan components, hooks, services
4. Implement in Next.js: Create TypeScript services, React components
5. Test with existing Firebase data

## Important Notes

### Progress Tracking
Currently uses **localStorage** (not synced to Firestore). This means:
- Progress is device-specific
- Not accessible across different browsers/devices
- Future enhancement: Sync to Firestore (`students/{uid}/progress/`)

### AI Chat Integration
Uses Cloud Function: `getConceptChatResponse` (deployed from Flutter project)
- Function Region: `us-central1`
- Callable via Firebase Functions SDK
- Shares AI provider configuration with Flutter app

### Question Upload Scripts
Located in `/Users/srini/code/brainspark-web/scripts/`:
- `upload-single-set.js` - Upload individual question sets
- `upload-nsw-selective.js` - Upload NSW Selective exam questions
- JSON files with question data (energy-set*.json, etc.)

### Deployment
**✅ Self-contained setup complete!** Everything deploys from brainspark-web.

What's Ready:
- ✅ Firebase config files migrated (.firebaserc, firebase.json, firestore.rules, indexes)
- ✅ firebase.json configured for Next.js (hosting: `out/`)
- ✅ next.config.ts configured for static export
- ✅ Cloud Functions built and ready (`functions/lib/`)

Deployment Commands:
```bash
# Build Next.js app
npm run build

# Deploy hosting + functions
firebase deploy --only hosting,functions

# Or deploy separately:
firebase deploy --only hosting
firebase deploy --only functions
```

Production URL: https://thebrainspark-project.web.app

## Troubleshooting

### Firebase Connection Issues
1. Check `.env.local` has all required Firebase config
2. Verify Firebase initialization in `src/lib/firebase.ts`
3. Check browser console for connection errors

### Question Loading Issues
1. Verify question data exists in Firestore: Check Firebase Console
2. Check `setId` matches in code and Firestore
3. Verify `questionService.ts` query logic

### Authentication Issues
1. Check Firebase Auth enabled in Firebase Console
2. Verify `AuthContext` properly initialized
3. Check email verification settings

## Next Steps (as needed)

1. **Migrate Cloud Functions** to this project (copy from Flutter's `functions/` directory)
2. **Implement Firestore Progress Tracking** (replace localStorage)
3. **Build Teacher Dashboard** (reference Flutter implementation)
4. **Deploy to Firebase Hosting** (replace Flutter build)
