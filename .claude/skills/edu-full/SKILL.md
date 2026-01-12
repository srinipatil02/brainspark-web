---
name: edu-full
description: End-to-end educational content generation pipeline. Maps curriculum, researches topic, generates 80 questions, validates, and uploads to Firestore. Single command for complete question set creation.
allowed-tools: Read, Write, Glob, Task, Bash, WebSearch, WebFetch
---

# Full Content Generation Pipeline

Orchestrates the complete workflow from curriculum mapping to Firestore upload, producing validated 80-question learning arc sets.

## Quick Start

```
/edu:full year=8 subject=science topic="States of Matter"
```

## Input Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| year | Yes | Target year level (6-12) |
| subject | Yes | Subject area (science, mathematics, english) |
| topic | Yes | Topic name from curriculum |
| outcome_code | No | ACARA code (auto-detected if curriculum mapped) |
| skip_upload | No | Stop after validation (default: false) |
| human_review | No | Pause for human review before upload (default: true) |

## Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────┐
│                    FULL PIPELINE WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 1: CURRICULUM MAPPING                                    │
│  └─ /edu:map year={year} subject={subject}                      │
│     └─ Output: Curriculum tree with outcome codes               │
│                         │                                       │
│                         ▼                                       │
│  Stage 2: DEEP RESEARCH                                         │
│  └─ /edu:research topic={topic} outcome_code={code}             │
│     └─ Output: Concepts, misconceptions, phenomena              │
│                         │                                       │
│                         ▼                                       │
│  Stage 3: CONCEPT MAPPING                                       │
│  └─ /edu:concept-map topic={topic}                              │
│     └─ Output: Concept dependency graph                         │
│                         │                                       │
│                         ▼                                       │
│  Stage 4: QUESTION GENERATION                                   │
│  └─ /edu:generate topic={topic} (parallel agents)               │
│     └─ Output: 80 questions across 4 phases                     │
│                         │                                       │
│                         ▼                                       │
│  Stage 5: VALIDATION                                            │
│  └─ /edu:validate questions_file={file}                         │
│     └─ Output: Validation report + flagged items                │
│                         │                                       │
│                         ▼                                       │
│  Stage 6: HUMAN REVIEW (if enabled)                             │
│  └─ Review flagged questions                                    │
│     └─ Approve or request regeneration                          │
│                         │                                       │
│                         ▼                                       │
│  Stage 7: UPLOAD TO FIRESTORE                                   │
│  └─ /edu:upload questions_file={file} set_id={id}               │
│     └─ Output: Upload report + rollback instructions            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Stage Details

### Stage 1: Curriculum Mapping
```
Status: Checking for cached curriculum...
✓ Found: .claude/knowledge/edu/curricula/science-year8.json

OR

Status: Mapping curriculum for Year 8 Science...
Agent: curriculum-researcher
Output: .claude/knowledge/edu/curricula/science-year8.json
```

### Stage 2: Deep Research
```
Status: Researching "States of Matter" (ACSSU151)...
Agents: curriculum-researcher, behavioral-scientist
Tasks:
  - Extract key concepts (8 found)
  - Identify misconceptions (6 found)
  - Find real-world phenomena (8 found)
  - Map vocabulary progression (4 tiers)
Output: .claude/knowledge/edu/research/states-of-matter-year8.json
```

### Stage 3: Concept Mapping
```
Status: Creating concept dependency graph...
Concepts: 12 nodes
Dependencies: 18 edges
Phases: Concepts assigned to phases 1-4
Output: Concept map embedded in research file
```

### Stage 4: Question Generation
```
Status: Generating 80 questions (parallel)...
Agent: question-set-orchestrator
Sub-agents: 4 × question-generator

Progress:
  Phase 1 (Foundation): ████████████████████ 20/20 ✓
  Phase 2 (Application): ████████████████████ 20/20 ✓
  Phase 3 (Connection): ████████████████████ 20/20 ✓
  Phase 4 (Mastery): ████████████████████ 20/20 ✓

Output: scripts/questions/states-of-matter-year8-questions.json
```

### Stage 5: Validation
```
Status: Validating question set...
Agent: content-validator

Layer 1 (Schema): ████████████████████ 80/80 ✓
Layer 2 (Content): ███████████████████░ 79/80 ⚠
Layer 3 (Pedagogy): ████████████████████ 80/80 ✓
Layer 4 (Presentation): ████████████████████ 80/80 ✓

Issues: 1 warning, 0 errors
Human Review Flags: 2 questions

Output: scripts/questions/states-of-matter-year8-validation.json
```

### Stage 6: Human Review Checkpoint
```
Status: PAUSED - Human review required

Flagged for review:
┌─────────────────────────────────────────────────────────────────┐
│ Q45: states-matter-y8-045                                       │
│ Reason: Scientific accuracy check - absolute zero claim         │
│ Stem: "At absolute zero, all particle movement stops..."        │
│                                                                  │
│ Actions: [Approve] [Edit] [Regenerate] [Skip]                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Q67: states-matter-y8-067                                       │
│ Reason: Vocabulary check - "intermolecular" used                │
│ Stem: "The intermolecular forces in liquids..."                 │
│                                                                  │
│ Actions: [Approve] [Edit] [Regenerate] [Skip]                   │
└─────────────────────────────────────────────────────────────────┘

Enter: approve-all, edit Q45, regenerate Q67, or continue
```

### Stage 7: Upload
```
Status: Uploading to Firestore...
Set ID: year8-science-states-of-matter-medium
Collection: questions
Documents: 80

Progress: ████████████████████ 80/80 ✓

Upload complete!
Rollback file: scripts/uploads/states-matter-y8-2024-01-07-ids.json
```

## Output Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIPELINE COMPLETE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Topic: States of Matter                                        │
│  Year: 8                                                         │
│  Outcome: ACSSU151                                              │
│                                                                  │
│  Questions Generated: 80                                         │
│  - MCQ: 40                                                       │
│  - Short Answer: 40                                              │
│                                                                  │
│  Learning Arc:                                                   │
│  - Phase 1 (Foundation): 20 questions                           │
│  - Phase 2 (Application): 20 questions                          │
│  - Phase 3 (Connection): 20 questions                           │
│  - Phase 4 (Mastery): 20 questions                              │
│                                                                  │
│  Validation: PASSED (1 warning)                                 │
│  Human Review: 2 questions approved                             │
│  Upload: SUCCESS                                                 │
│                                                                  │
│  Files Created:                                                  │
│  - .claude/knowledge/edu/research/states-of-matter-year8.json   │
│  - scripts/questions/states-of-matter-year8-questions.json      │
│  - scripts/questions/states-of-matter-year8-validation.json     │
│  - scripts/uploads/states-matter-y8-2024-01-07-ids.json         │
│                                                                  │
│  Firestore:                                                      │
│  - Collection: questions                                         │
│  - Set ID: year8-science-states-of-matter-medium                │
│  - Documents: 80                                                 │
│                                                                  │
│  Test URL:                                                       │
│  http://localhost:3000/curriculum/science/year8-states-of-matter│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Estimated Time

| Stage | Typical Duration |
|-------|-----------------|
| Curriculum Mapping | 1-2 min (cached: instant) |
| Deep Research | 3-5 min |
| Concept Mapping | 30 sec |
| Question Generation | 8-12 min (parallel) |
| Validation | 1-2 min |
| Human Review | Variable |
| Upload | 30 sec |
| **Total** | **15-20 min** (excluding review) |

## Error Recovery

### Stage Failure
If any stage fails:
1. Error logged with context
2. Partial progress saved
3. Resume command provided

```
❌ Stage 4 failed: Question generation timeout

Resume from Stage 4:
/edu:full year=8 subject=science topic="States of Matter" --resume-from=4
```

### Skip Stages
```
# Skip to validation (questions already generated)
/edu:full ... --start-from=5

# Skip upload (validation only)
/edu:full ... --skip-upload=true
```

## Configuration Options

```yaml
# .claude/config/edu-pipeline.yaml
pipeline:
  parallel_agents: 4           # For question generation
  batch_size: 400              # For Firestore upload
  validation_layers: [1,2,3,4] # Which layers to run
  human_review: true           # Pause for review
  auto_fix: true               # Auto-fix simple issues
  dry_run_upload: false        # Preview upload first
```

## Related Skills

Individual stages can be run separately:
- `/edu:map` - Stage 1
- `/edu:research` - Stage 2
- `/edu:concept-map` - Stage 3
- `/edu:generate` - Stage 4
- `/edu:validate` - Stage 5
- `/edu:upload` - Stage 7

## Best Practices

1. **Run validation first time** with `--skip-upload=true`
2. **Review flagged questions** carefully before upload
3. **Keep rollback files** for quick reversion
4. **Test locally** before deploying to production
5. **Start with one topic** to verify pipeline works
