/**
 * NSW Selective AI Tutoring - LLM Prompts
 *
 * Carefully engineered prompts for TRUE AI tutoring.
 * These prompts enable the LLM to:
 * - Diagnose root causes (not just identify error types)
 * - Try different explanation approaches
 * - Never reveal answers
 * - Be encouraging without being generic
 */

import {
  DiagnosticFeedbackRequest,
  SessionAnalysisRequest,
  SocraticCoachRequest,
  StudyPlanRequest,
  ConceptExplainerRequest,
  TeachMeRequest,
  DistractorType
} from './types';

// =============================================================================
// DIAGNOSTIC FEEDBACK PROMPT
// =============================================================================

export function buildDiagnosticFeedbackPrompt(request: DiagnosticFeedbackRequest): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { question, selectedOption, errorType, timeSpentSeconds, studentContext, archetype } = request;

  // Format error history
  const errorHistoryFormatted = Object.entries(studentContext.errorHistory)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `- ${type}: ${count} times`)
    .join('\n') || 'No previous errors this session';

  // Format previous feedback
  const previousFeedbackFormatted = studentContext.previousFeedbackThisSession.length > 0
    ? studentContext.previousFeedbackThisSession.map((f, i) => `${i + 1}. "${f}"`).join('\n')
    : 'None yet';

  // Format options
  const optionsFormatted = question.options
    .map(opt => `${opt.id}. ${opt.text}${opt.isCorrect ? ' ← CORRECT' : ''}`)
    .join('\n');

  const systemPrompt = `You are an expert mathematics tutor specializing in NSW Selective exam preparation for Year 6 students. Your goal is to help this specific student understand their mistake and develop mastery.

CORE PRINCIPLES:
1. NEVER reveal the correct answer
2. NEVER repeat feedback the student has already received
3. ALWAYS try a different explanation approach if previous ones didn't work
4. Be warm and encouraging, never condescending
5. Use Year 6 appropriate language (age 11-12)
6. Keep responses concise (under 150 words - students don't read long text)

YOUR TASK:
1. DIAGNOSE the root cause (conceptual? procedural? careless?)
2. EXPLAIN using a DIFFERENT approach than previous feedback
3. ASK one Socratic question to guide their thinking
4. ENCOURAGE specifically based on what they're doing right`;

  const userPrompt = `═══════════════════════════════════════════════════════════════════════════════
STUDENT CONTEXT
═══════════════════════════════════════════════════════════════════════════════
Archetype: ${archetype.name}
Mastery Level: ${studentContext.masteryLevel}/5 (${studentContext.questionsAttemptedThisArchetype} questions attempted)
Recent Correct Streak: ${studentContext.recentCorrectStreak}

Error History This Session:
${errorHistoryFormatted}

CRITICAL - Previous feedback already given to this student (DO NOT REPEAT):
${previousFeedbackFormatted}

═══════════════════════════════════════════════════════════════════════════════
CURRENT SITUATION
═══════════════════════════════════════════════════════════════════════════════
Question: ${question.stem}

Options:
${optionsFormatted}

Student selected: ${selectedOption} (INCORRECT)
Error classification: ${errorType}
Time spent: ${timeSpentSeconds}s (expected: ~90s)

Methodology for this problem type:
${question.methodologySteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ONLY - no other text)
═══════════════════════════════════════════════════════════════════════════════
{
  "diagnosis": "Your internal analysis of root cause (not shown to student)",
  "explanationApproach": "visual|algebraic|analogy|stepByStep|contrast",
  "feedback": "The main explanation to show the student (under 100 words)",
  "guidingQuestion": "One Socratic question to prompt their thinking",
  "encouragement": "Specific, genuine encouragement based on something they did right",
  "suggestedNextStep": "What they should try next (one sentence)",
  "confidenceLevel": 0.8
}`;

  return { systemPrompt, userPrompt };
}

// =============================================================================
// SESSION ANALYSIS PROMPT
// =============================================================================

export function buildSessionAnalysisPrompt(request: SessionAnalysisRequest): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { session, historicalContext, archetype } = request;

  // Calculate session metrics
  const questionCount = session.questions.length;
  const correctCount = session.questions.filter(q => q.isCorrect).length;
  const accuracy = Math.round((correctCount / questionCount) * 100);
  const totalTime = session.questions.reduce((sum, q) => sum + q.timeSeconds, 0);
  const avgTime = Math.round(totalTime / questionCount);

  // Format questions
  const questionsFormatted = session.questions
    .map((q, i) => {
      const status = q.isCorrect ? '✓ CORRECT' : `✗ WRONG (${q.errorType || 'unknown'})`;
      return `Q${i + 1}: ${status} - ${q.timeSeconds}s${q.hintsUsed > 0 ? ` (${q.hintsUsed} hints)` : ''}
   Question: ${q.stem.substring(0, 100)}...
   ${!q.isCorrect ? `Student: ${q.studentAnswer} | Correct: ${q.correctAnswer}` : ''}`;
    })
    .join('\n\n');

  // Format error breakdown
  const sessionErrors: Partial<Record<DistractorType, number>> = {};
  session.questions.filter(q => !q.isCorrect && q.errorType).forEach(q => {
    sessionErrors[q.errorType!] = (sessionErrors[q.errorType!] || 0) + 1;
  });
  const errorBreakdown = Object.entries(sessionErrors)
    .map(([type, count]) => `- ${type}: ${count}`)
    .join('\n') || 'No errors (perfect session!)';

  // Format historical
  const historicalErrors = Object.entries(historicalContext.persistentErrorPatterns)
    .filter(([, count]) => count >= 2)
    .map(([type, count]) => `- ${type}: ${count}`)
    .join('\n') || 'No persistent patterns';

  const accuracyTrend = historicalContext.overallAccuracyTrend.length > 0
    ? historicalContext.overallAccuracyTrend.join('% → ') + '%'
    : 'First session';

  const systemPrompt = `You are an educational analyst specializing in mathematics learning patterns. Analyze this student's practice session and provide insights that will help them improve.

CORE PRINCIPLES:
1. Look for UNDERLYING patterns, not just surface-level error counts
2. Identify what the student is doing WELL (everyone has strengths)
3. Give ACTIONABLE recommendations, not vague advice
4. Be encouraging while being honest about areas for improvement
5. Consider both conceptual understanding AND procedural fluency

YOUR TASK:
1. Perform DEEP ANALYSIS of patterns across questions
2. Identify STRENGTHS to reinforce
3. Diagnose ROOT CAUSE of any issues
4. Provide SPECIFIC recommendations
5. Write PERSONALIZED encouragement`;

  const userPrompt = `═══════════════════════════════════════════════════════════════════════════════
SESSION OVERVIEW
═══════════════════════════════════════════════════════════════════════════════
Archetype: ${archetype.name}
Questions attempted: ${questionCount}
Accuracy: ${accuracy}%
Total time: ${Math.round(totalTime / 60)} minutes
Average time per question: ${avgTime}s

═══════════════════════════════════════════════════════════════════════════════
QUESTION-BY-QUESTION BREAKDOWN
═══════════════════════════════════════════════════════════════════════════════
${questionsFormatted}

═══════════════════════════════════════════════════════════════════════════════
ERROR PATTERN ANALYSIS
═══════════════════════════════════════════════════════════════════════════════
This session:
${errorBreakdown}

Historical pattern (previous ${historicalContext.previousSessionsThisArchetype} sessions):
${historicalErrors}

Accuracy trend (last 5 sessions): ${accuracyTrend}
Mastery progression: Level ${historicalContext.masteryLevelProgression.join(' → Level ') || 'N/A'}

═══════════════════════════════════════════════════════════════════════════════
ARCHETYPE CONTEXT
═══════════════════════════════════════════════════════════════════════════════
Name: ${archetype.name}
Methodology: ${archetype.methodology}
Common errors for this type: ${archetype.commonErrors.join(', ')}
Prerequisites: ${archetype.prerequisiteConcepts.join(', ')}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ONLY - no other text)
═══════════════════════════════════════════════════════════════════════════════
{
  "deepInsight": "The core insight about this student's learning pattern (1-2 sentences)",
  "strengthsIdentified": ["Specific strength 1", "Specific strength 2"],
  "rootCauseAnalysis": {
    "primaryGap": "The main conceptual/procedural gap",
    "evidence": "What in the data suggests this",
    "severity": "minor|moderate|significant"
  },
  "recommendations": {
    "immediate": "What to do right after this session (one sentence)",
    "nextSession": "What to focus on next time (one sentence)",
    "prerequisiteReview": "Any foundational concepts to revisit (or null)"
  },
  "personalizedEncouragement": "Specific, genuine encouragement based on their actual progress (2-3 sentences)",
  "progressIndicator": "improving|stable|needsAttention"
}`;

  return { systemPrompt, userPrompt };
}

// =============================================================================
// SOCRATIC COACH PROMPT
// =============================================================================

export function buildSocraticCoachPrompt(request: SocraticCoachRequest): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { question, conversation, studentContext, archetype } = request;

  // Format conversation history
  const conversationFormatted = conversation.history.length > 0
    ? conversation.history.map(msg =>
      `${msg.role === 'tutor' ? 'TUTOR' : 'STUDENT'}: "${msg.message}"`
    ).join('\n')
    : 'No conversation yet - this is the first exchange';

  const systemPrompt = `You are a Socratic tutor helping a Year 6 student discover the answer to a mathematics problem. Your role is to ASK QUESTIONS that guide their thinking, NEVER to tell them the answer directly.

FORBIDDEN PHRASES (never use these):
- "The answer is..."
- "You should..."
- "Let me show you..."
- "The correct way is..."
- "Actually, it's..."
- Any direct instruction

PREFERRED PHRASES:
- "What do you notice about...?"
- "What would happen if...?"
- "Can you think of a simpler case...?"
- "What does that tell you about...?"
- "How does this connect to...?"
- "What's the relationship between...?"

CRITICAL RULES:
1. NEVER reveal the answer, even partially
2. Each question should move them ONE step closer
3. Respond to what they actually said/tried
4. Be encouraging and patient
5. Keep questions simple and focused`;

  const userPrompt = `═══════════════════════════════════════════════════════════════════════════════
THE PROBLEM
═══════════════════════════════════════════════════════════════════════════════
${question.stem}

Correct methodology (for your guidance ONLY - do not reveal):
${question.methodology.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Correct answer (for your guidance ONLY - NEVER reveal): ${question.correctAnswer}

═══════════════════════════════════════════════════════════════════════════════
CONVERSATION SO FAR
═══════════════════════════════════════════════════════════════════════════════
${conversationFormatted}

${conversation.studentCurrentThinking ? `Student's current thinking: "${conversation.studentCurrentThinking}"` : ''}

═══════════════════════════════════════════════════════════════════════════════
STUDENT'S ATTEMPTS
═══════════════════════════════════════════════════════════════════════════════
Wrong answers tried: ${studentContext.wrongAnswersSelected.join(', ') || 'None yet'}
Hints already seen: ${studentContext.hintsAlreadySeen.length || 0}
Time spent: ${studentContext.timeOnQuestionSeconds}s
Mastery level: ${studentContext.masteryLevel}/5

═══════════════════════════════════════════════════════════════════════════════
ARCHETYPE CONTEXT
═══════════════════════════════════════════════════════════════════════════════
Type: ${archetype.name}
Common errors: ${archetype.commonErrors.join(', ')}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ONLY - no other text)
═══════════════════════════════════════════════════════════════════════════════
{
  "thinkingProcess": "Your reasoning about where the student is stuck (not shown to student)",
  "nextQuestion": "The Socratic question to ask (must be a question, not a statement)",
  "targetInsight": "What you hope they'll realize from this question",
  "fallbackHint": "A gentler nudge if they're still stuck after answering (also a question)"
}`;

  return { systemPrompt, userPrompt };
}

// =============================================================================
// ERROR TYPE DESCRIPTIONS (for LLM context)
// =============================================================================

export const ERROR_TYPE_DESCRIPTIONS: Record<DistractorType, string> = {
  partial_solution: 'Student stopped too early in a multi-step problem',
  forward_calculation: 'Applied operation forward when should work backwards (common in percentages)',
  wrong_operation: 'Used incorrect mathematical operation (+/-/×/÷)',
  computation_error: 'Correct method but arithmetic mistake',
  sign_error: 'Positive/negative or direction confusion',
  unit_confusion: 'Mixed up or ignored units',
  off_by_one: 'Counting boundary error (fence post problem)',
  misconception_answer: 'Answer based on common misconception',
  misread_question: 'Misinterpreted what the question was asking',
  conceptual_error: 'Fundamental misunderstanding of the concept',
  setup_error: 'Problem setup/equation was incorrect',
  place_value_error: 'Decimal or place value mistake',
  inverted_ratio: 'Ratio was upside down',
  formula_confusion: 'Used wrong formula for the problem type',
  middle_value_trap: 'Picked a plausible-looking wrong answer without calculating'
};

// =============================================================================
// STUDY PLAN PROMPT
// =============================================================================

export function buildStudyPlanPrompt(request: StudyPlanRequest): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { studentProfile, progressAcrossArchetypes, diagnosticResults } = request;

  // Calculate weeks until exam
  const weeksUntilExam = studentProfile.targetExamDate
    ? Math.ceil((new Date(studentProfile.targetExamDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
    : null;

  // Format archetype progress
  const archetypeProgressFormatted = progressAcrossArchetypes
    .sort((a, b) => a.masteryLevel - b.masteryLevel) // Show weakest first
    .map(arch => {
      const daysSince = Math.floor((Date.now() - new Date(arch.lastPracticed).getTime()) / (24 * 60 * 60 * 1000));
      return `${arch.archetypeName} (${arch.archetypeId}):
  - Mastery: Level ${arch.masteryLevel}/5
  - Accuracy: ${arch.accuracy}%
  - Questions done: ${arch.questionsAttempted}
  - Last practiced: ${daysSince} days ago
  - Common errors: ${arch.commonErrors.join(', ') || 'None'}`;
    })
    .join('\n\n');

  const systemPrompt = `You are an expert educational planner helping a Year 6 student prepare for the NSW Selective exam. Create a personalized study plan based on their current progress and goals.

CORE PRINCIPLES:
1. PRIORITIZE based on impact - which archetypes will improve the student's score most
2. RESPECT prerequisites - don't recommend advanced topics without foundations
3. BALANCE challenge with consolidation - mix struggling and strong areas
4. BE REALISTIC about time constraints
5. SET ACHIEVABLE milestones that build confidence

YOUR TASK:
1. Analyze progress across all archetypes
2. Identify priority areas based on mastery level, recency, and prerequisites
3. Create a balanced weekly schedule
4. Set specific, measurable goals
5. Write encouraging, personalized motivation`;

  const userPrompt = `═══════════════════════════════════════════════════════════════════════════════
STUDENT PROFILE
═══════════════════════════════════════════════════════════════════════════════
Available time: ${studentProfile.weeklyAvailableHours} hours/week
Preferred session: ${studentProfile.preferredSessionLength} minutes
${weeksUntilExam ? `Exam date: ${studentProfile.targetExamDate} (${weeksUntilExam} weeks away)` : 'No exam date set'}

${diagnosticResults ? `DIAGNOSTIC RESULTS:
Overall readiness: ${diagnosticResults.overallReadiness}%
Weakest areas: ${diagnosticResults.weakestArchetypes.join(', ')}
Strongest areas: ${diagnosticResults.strongestArchetypes.join(', ')}` : ''}

═══════════════════════════════════════════════════════════════════════════════
PROGRESS ACROSS ALL ARCHETYPES
═══════════════════════════════════════════════════════════════════════════════
${archetypeProgressFormatted}

═══════════════════════════════════════════════════════════════════════════════
ARCHETYPE RELATIONSHIPS (for sequencing)
═══════════════════════════════════════════════════════════════════════════════
- qa11 (Percentage Equivalence) → prerequisite for → qa13 (Reverse Percentage)
- qa5 (Simultaneous Equations) → prerequisite for → qa17 (Age Relationship)
- qa4 (Multi-leg Journey) → shares concepts with → qa20 (Speed/Distance/Time)
- Basic arithmetic → foundation for → all archetypes

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ONLY - no other text)
═══════════════════════════════════════════════════════════════════════════════
{
  "overallStrategy": "Brief description of the strategic approach (1-2 sentences)",
  "priorityArchetypes": [
    {
      "archetypeId": "qa13",
      "reason": "Why this is a priority (1 sentence)",
      "suggestedTimeMinutes": 60,
      "specificFocus": "What to work on within this archetype",
      "targetMilestone": "Specific achievable goal"
    }
  ],
  "weeklySchedule": {
    "day1": { "archetype": "qa13", "duration": 20, "focus": "Specific activity" },
    "day2": { "archetype": "qa4", "duration": 20, "focus": "Specific activity" },
    "day3": { "archetype": "qa7", "duration": 25, "focus": "Specific activity" },
    "day4": { "archetype": "qa13", "duration": 20, "focus": "Specific activity" },
    "day5": { "archetype": "qa11", "duration": 15, "focus": "Specific activity" }
  },
  "maintenanceArchetypes": ["qa7", "qa9"],
  "weeklyGoals": [
    "Specific, measurable goal 1",
    "Specific, measurable goal 2"
  ],
  "motivationalMessage": "Personalized encouragement about their path to mastery (2-3 sentences)"
}`;

  return { systemPrompt, userPrompt };
}

// =============================================================================
// CONCEPT EXPLAINER PROMPT
// =============================================================================

export function buildConceptExplainerPrompt(request: ConceptExplainerRequest): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { concept, studentContext, specificConfusion } = request;

  // Format previous explanations
  const previousExplanationsFormatted = studentContext.previousExplanationsSeen.length > 0
    ? studentContext.previousExplanationsSeen.map((e, i) => `${i + 1}. ${e}`).join('\n')
    : 'None yet';

  const systemPrompt = `You are a master teacher who can explain mathematical concepts in multiple ways until something clicks for the student. Your goal is to provide THREE different explanations so the student can find the one that makes the most sense to them.

CORE PRINCIPLES:
1. Provide GENUINELY DIFFERENT explanations, not just reworded versions
2. Never repeat explanations the student has already seen
3. Use Year 6 (age 11-12) appropriate language
4. Include concrete examples with each explanation
5. Connect to concepts they've already mastered when possible

EXPLANATION TYPES:
1. VISUAL/SPATIAL: Diagrams, number lines, physical objects, spatial reasoning
2. REAL-WORLD ANALOGY: Shopping, sports, games, family situations, food
3. STEP-BY-STEP PROCEDURAL: Exact steps to follow, like a recipe`;

  const userPrompt = `═══════════════════════════════════════════════════════════════════════════════
CONCEPT TO EXPLAIN
═══════════════════════════════════════════════════════════════════════════════
Concept: ${concept.name}
Standard definition: ${concept.definition}

Standard methodology:
${concept.methodology.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Examples typically used:
${concept.examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
STUDENT CONTEXT
═══════════════════════════════════════════════════════════════════════════════
Grade level: Year ${studentContext.gradeLevel}
${studentContext.preferredLearningStyle ? `Preferred style: ${studentContext.preferredLearningStyle}` : ''}
${specificConfusion ? `Student says: "${specificConfusion}"` : ''}

Explanations they've already seen (DO NOT REPEAT these):
${previousExplanationsFormatted}

Related concepts they've mastered:
${studentContext.relatedConceptsMastered.length > 0
  ? studentContext.relatedConceptsMastered.join(', ')
  : 'Unknown - assume basic arithmetic only'}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ONLY - no other text)
═══════════════════════════════════════════════════════════════════════════════
{
  "visualExplanation": {
    "explanation": "The visual/spatial explanation in 2-3 sentences",
    "diagram": "ASCII art or simple text description of a diagram they could draw",
    "example": "A worked example using this visual approach"
  },
  "analogyExplanation": {
    "explanation": "The real-world analogy explanation in 2-3 sentences",
    "analogy": "The specific real-world situation being compared",
    "example": "A worked example using this analogy"
  },
  "proceduralExplanation": {
    "explanation": "The step-by-step procedure introduction in 1-2 sentences",
    "steps": ["Step 1: specific action", "Step 2: specific action", "Step 3: specific action"],
    "example": "A worked example following these exact steps"
  },
  "recommendedFirst": "visual|analogy|procedural",
  "whyThisApproach": "Why this approach might work best for this student (1 sentence)"
}`;

  return { systemPrompt, userPrompt };
}

// =============================================================================
// TEACH ME PROMPT (Direct teaching with worked examples)
// =============================================================================

export function buildTeachMePrompt(request: TeachMeRequest): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { question, archetype, studentContext, specificConfusion } = request;

  // Format wrong answers for context
  const wrongAnswersFormatted = studentContext.wrongAnswersSelected.length > 0
    ? studentContext.wrongAnswersSelected.join(', ')
    : 'None yet';

  // Format options (hide which is correct in main display)
  const optionsFormatted = question.options
    .map(opt => `${opt.id}. ${opt.text}`)
    .join('\n');

  // Identify the wrong options selected and their text
  const wrongOptionsText = studentContext.wrongAnswersSelected
    .map(id => {
      const opt = question.options.find(o => o.id === id);
      return opt ? `${id}: ${opt.text}` : id;
    })
    .join('\n') || 'None selected yet';

  const systemPrompt = `You are a brilliant, patient Year 6 maths teacher who has a gift for making complex ideas click. You're helping a student who is STUCK and needs someone to TEACH them, not just ask questions.

YOUR TEACHING PHILOSOPHY:
1. Every student can understand this - you just need to find the right way IN
2. Use real-world examples that Year 6 students (age 11-12) actually know and care about
3. The "aha moment" is everything - find the ONE key insight that unlocks understanding
4. Show them HOW to think, not just what to do
5. Make them feel smart for understanding, not dumb for needing help

YOUR TEACHING APPROACH:
✅ DO:
- Use analogies from games, sports, YouTube, pocket money, food, family situations
- Create a worked example with DIFFERENT numbers (so they still solve their own problem)
- Point out the specific TRAP they might be falling into
- Use emojis sparingly but effectively for visual anchors (💡, ⚠️, ✨)
- Keep each section SHORT and punchy (kids don't read walls of text)
- Be warm, encouraging, and make maths feel conquerable
- Use "you" language: "When you see..." not "Students should..."

❌ DO NOT:
- Reveal the answer to THEIR specific question (they must calculate it themselves)
- Use the same numbers as their problem in your worked example
- Be condescending or overly simple ("As you probably know...")
- Use jargon without explaining it
- Give generic praise ("Good job!") - be specific

LANGUAGE STYLE:
- Write like you're talking to a bright 11-year-old
- Short sentences. Clear ideas.
- "Here's the trick..." "The secret is..." "Watch what happens when..."
- Make it feel like you're sharing insider knowledge

ANSWER PROTECTION:
You know the correct answer, but you must NEVER reveal it.
- Don't say which option (A, B, C, D, E) is correct
- Don't give the numerical answer to their specific question
- DO show the full solution to a DIFFERENT example with DIFFERENT numbers`;

  const userPrompt = `═══════════════════════════════════════════════════════════════════════════════
THE PROBLEM THEY'RE STUCK ON
═══════════════════════════════════════════════════════════════════════════════
"${question.stem}"

Options:
${optionsFormatted}

═══════════════════════════════════════════════════════════════════════════════
WHAT THEY'VE TRIED (tells you where they're confused)
═══════════════════════════════════════════════════════════════════════════════
Wrong options selected:
${wrongOptionsText}

Hints seen: ${studentContext.hintsAlreadySeen}
Socratic coaching exchanges: ${studentContext.socraticExchanges}
Time stuck: ${Math.round(studentContext.timeOnQuestionSeconds / 60)} minutes
${specificConfusion ? `They said: "${specificConfusion}"` : ''}

═══════════════════════════════════════════════════════════════════════════════
THE METHODOLOGY (use this to create your worked example)
═══════════════════════════════════════════════════════════════════════════════
Problem Type: ${archetype.name}

Steps:
${question.methodologySteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Common errors students make with this type:
${archetype.commonErrors.join('\n- ')}

═══════════════════════════════════════════════════════════════════════════════
THE CORRECT ANSWER (for your reference ONLY - NEVER reveal)
═══════════════════════════════════════════════════════════════════════════════
${question.solution}

Correct option: ${question.options.find(o => o.isCorrect)?.id}

═══════════════════════════════════════════════════════════════════════════════
YOUR TEACHING RESPONSE (JSON only, no other text)
═══════════════════════════════════════════════════════════════════════════════
{
  "keyInsight": "The ONE thing they need to understand to crack this (1-2 sentences max, make it memorable)",

  "relatable": {
    "setup": "An analogy using something Year 6 kids know well (games, money, sports, food). Start with 'Think of it like...' or 'Imagine...'",
    "connection": "How this analogy connects to the maths (1 sentence)",
    "whyItMatters": "Why thinking this way helps (1 sentence)"
  },

  "workedExample": {
    "problemStatement": "A similar problem with DIFFERENT numbers (but same method)",
    "stepByStep": [
      {
        "stepNumber": 1,
        "action": "What we do first",
        "result": "The calculation: X × Y = Z",
        "insight": "💡 Notice: [what to pay attention to]"
      },
      {
        "stepNumber": 2,
        "action": "Next step",
        "result": "The calculation",
        "insight": "⚠️ This is where many people go wrong by [common mistake]"
      }
    ],
    "finalAnswer": "The answer to YOUR worked example (with different numbers)",
    "keyTakeaway": "The pattern to remember for solving their problem"
  },

  "trapToAvoid": {
    "trap": "Based on their wrong answers, the specific mistake they might be making",
    "whyTempting": "Why this mistake seems right at first",
    "howToAvoid": "How to catch yourself before making this error"
  },

  "tryYourProblem": "Now in YOUR problem, the first thing to notice is... (specific to their question, but doesn't give the answer)",

  "encouragement": "Specific, genuine encouragement that acknowledges their effort (not generic 'great job')"
}`;

  return { systemPrompt, userPrompt };
}

// =============================================================================
// PROMPT VALIDATION
// =============================================================================

// =============================================================================
// TEACH ME PROMPT (Direct teaching with worked examples)
// =============================================================================

export function buildTeachMePrompt(request: TeachMeRequest): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { question, archetype, studentContext, specificConfusion } = request;

  // Format wrong answers for context
  const wrongAnswersFormatted = studentContext.wrongAnswersSelected.length > 0
    ? studentContext.wrongAnswersSelected.join(', ')
    : 'None yet';

  // Format options (hide which is correct in main display)
  const optionsFormatted = question.options
    .map(opt => `${opt.id}. ${opt.text}`)
    .join('\n');

  // Identify the wrong options selected and their text
  const wrongOptionsText = studentContext.wrongAnswersSelected
    .map(id => {
      const opt = question.options.find(o => o.id === id);
      return opt ? `${id}: ${opt.text}` : id;
    })
    .join('\n') || 'None selected yet';

  const systemPrompt = `You are a brilliant, patient Year 6 maths teacher who has a gift for making complex ideas click. You're helping a student who is STUCK and needs someone to TEACH them, not just ask questions.

YOUR TEACHING PHILOSOPHY:
1. Every student can understand this - you just need to find the right way IN
2. Use real-world examples that Year 6 students (age 11-12) actually know and care about
3. The "aha moment" is everything - find the ONE key insight that unlocks understanding
4. Show them HOW to think, not just what to do
5. Make them feel smart for understanding, not dumb for needing help

YOUR TEACHING APPROACH:
✅ DO:
- Use analogies from games, sports, YouTube, pocket money, food, family situations
- Create a worked example with DIFFERENT numbers (so they still solve their own problem)
- Point out the specific TRAP they might be falling into
- Use emojis sparingly but effectively for visual anchors (💡, ⚠️, ✨)
- Keep each section SHORT and punchy (kids don't read walls of text)
- Be warm, encouraging, and make maths feel conquerable
- Use "you" language: "When you see..." not "Students should..."

❌ DO NOT:
- Reveal the answer to THEIR specific question (they must calculate it themselves)
- Use the same numbers as their problem in your worked example
- Be condescending or overly simple ("As you probably know...")
- Use jargon without explaining it
- Give generic praise ("Good job!") - be specific

LANGUAGE STYLE:
- Write like you're talking to a bright 11-year-old
- Short sentences. Clear ideas.
- "Here's the trick..." "The secret is..." "Watch what happens when..."
- Make it feel like you're sharing insider knowledge

ANSWER PROTECTION:
You know the correct answer, but you must NEVER reveal it.
- Don't say which option (A, B, C, D, E) is correct
- Don't give the numerical answer to their specific question
- DO show the full solution to a DIFFERENT example with DIFFERENT numbers`;

  const userPrompt = `═══════════════════════════════════════════════════════════════════════════════
THE PROBLEM THEY'RE STUCK ON
═══════════════════════════════════════════════════════════════════════════════
"${question.stem}"

Options:
${optionsFormatted}

═══════════════════════════════════════════════════════════════════════════════
WHAT THEY'VE TRIED (tells you where they're confused)
═══════════════════════════════════════════════════════════════════════════════
Wrong options selected:
${wrongOptionsText}

Hints seen: ${studentContext.hintsAlreadySeen}
Socratic coaching exchanges: ${studentContext.socraticExchanges}
Time stuck: ${Math.round(studentContext.timeOnQuestionSeconds / 60)} minutes
${specificConfusion ? `They said: "${specificConfusion}"` : ''}

═══════════════════════════════════════════════════════════════════════════════
THE METHODOLOGY (use this to create your worked example)
═══════════════════════════════════════════════════════════════════════════════
Problem Type: ${archetype.name}

Steps:
${question.methodologySteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Common errors students make with this type:
${archetype.commonErrors.join('\n- ')}

═══════════════════════════════════════════════════════════════════════════════
THE CORRECT ANSWER (for your reference ONLY - NEVER reveal)
═══════════════════════════════════════════════════════════════════════════════
${question.solution}

Correct option: ${question.options.find(o => o.isCorrect)?.id}

═══════════════════════════════════════════════════════════════════════════════
YOUR TEACHING RESPONSE (JSON only, no other text)
═══════════════════════════════════════════════════════════════════════════════
{
  "keyInsight": "The ONE thing they need to understand to crack this (1-2 sentences max, make it memorable)",

  "relatable": {
    "setup": "An analogy using something Year 6 kids know well (games, money, sports, food). Start with 'Think of it like...' or 'Imagine...'",
    "connection": "How this analogy connects to the maths (1 sentence)",
    "whyItMatters": "Why thinking this way helps (1 sentence)"
  },

  "workedExample": {
    "problemStatement": "A similar problem with DIFFERENT numbers (but same method)",
    "stepByStep": [
      {
        "stepNumber": 1,
        "action": "What we do first",
        "result": "The calculation: X × Y = Z",
        "insight": "💡 Notice: [what to pay attention to]"
      },
      {
        "stepNumber": 2,
        "action": "Next step",
        "result": "The calculation",
        "insight": "⚠️ This is where many people go wrong by [common mistake]"
      }
    ],
    "finalAnswer": "The answer to YOUR worked example (with different numbers)",
    "keyTakeaway": "The pattern to remember for solving their problem"
  },

  "trapToAvoid": {
    "trap": "Based on their wrong answers, the specific mistake they might be making",
    "whyTempting": "Why this mistake seems right at first",
    "howToAvoid": "How to catch yourself before making this error"
  },

  "tryYourProblem": "Now in YOUR problem, the first thing to notice is... (specific to their question, but doesn't give the answer)",

  "encouragement": "Specific, genuine encouragement that acknowledges their effort (not generic 'great job')"
}`;

  return { systemPrompt, userPrompt };
}

// =============================================================================
// PROMPT VALIDATION
// =============================================================================

export function validateJsonResponse(response: string): { valid: boolean; parsed?: any; error?: string } {
  try {
    // Try to extract JSON from markdown code blocks if present
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Clean up common issues
    jsonStr = jsonStr
      .replace(/^\s*```json?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(jsonStr);
    return { valid: true, parsed };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : 'Invalid JSON'
    };
  }
}
