// =============================================================================
// MATH SOCRATIC CHAT SERVICE (Phase 5)
// Pure Socratic AI tutor for mathematics - NEVER gives direct answers
// =============================================================================

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import type { WorkLine } from '@/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface MathChatContext {
  /** The problem stem/question */
  problemStem: string;
  /** Starting expression */
  startingExpression: string;
  /** Expected answer(s) - AI uses this to guide, never reveal */
  expectedAnswers: string[];
  /** Student's current work */
  studentWork: WorkLine[];
  /** Student's current attempt at final answer */
  studentFinalAnswer?: string;
  /** Topic being studied */
  topic: string;
  /** Year level */
  year: number;
  /** Key concepts relevant to this problem */
  keyConcepts: string[];
}

export interface MathChatRequest {
  /** Student's question or message */
  question: string;
  /** Math context */
  context: MathChatContext;
  /** Chat mode */
  mode: 'socratic' | 'check_work' | 'explain_concept';
  /** Conversation history (last 10 messages) */
  history?: MathChatMessage[];
}

export interface MathChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MathChatResponse {
  ok: boolean;
  response?: string;
  /** Guiding questions to prompt student thinking */
  guidingQuestions?: string[];
  /** Related concepts to explore */
  relatedConcepts?: string[];
  /** Hint level used (if any) */
  hintLevel?: 'gentle' | 'moderate' | 'strong';
  /** Whether LaTeX is included in response */
  hasLatex?: boolean;
  error?: string;
}

export interface WorkCheckResult {
  /** Overall assessment */
  assessment: 'correct_path' | 'minor_error' | 'significant_error' | 'excellent';
  /** Step-by-step feedback (without revealing answers) */
  stepFeedback: {
    stepNumber: number;
    status: 'correct' | 'needs_attention' | 'good_approach';
    guidingQuestion: string;
  }[];
  /** Encouraging message */
  encouragement: string;
  /** Next step suggestion (Socratic, not answer) */
  nextStepHint: string;
}

// -----------------------------------------------------------------------------
// Socratic Prompts
// -----------------------------------------------------------------------------

/**
 * CORE PRINCIPLE: Never give direct answers, only guide to discovery
 */
export const SOCRATIC_SYSTEM_PROMPT = `
You are a supportive, encouraging math tutor who uses the Socratic method.
Your role is to guide students to discover answers themselves, not to give them directly.

ABSOLUTE RULES:
1. NEVER provide a direct answer to the current problem
2. NEVER show a complete solution step-by-step
3. NEVER say "the answer is..." or reveal final answers
4. NEVER solve the problem for the student
5. ALWAYS respond with guiding questions
6. ALWAYS be encouraging and positive
7. Use LaTeX for math expressions: inline $x$ or block $$equation$$

ALLOWED RESPONSES:
- Ask clarifying questions: "What have you tried so far?"
- Point to relevant concepts: "Remember how we balance equations..."
- Use analogies: "Think of it like a balance scale..."
- Validate partial work: "Your first step is correct, now what comes next?"
- Break problems into parts: "Let's focus on just the left side first..."
- Reference similar (not same) examples: "In problems like 2x + 3 = 7, what did we do first?"
- Remind of relevant rules: "What happens when we multiply both sides by the same number?"

WHEN STUDENT IS STUCK:
1. Ask what they've already tried
2. Identify the specific concept they need
3. Provide a smaller, simpler example of the same concept
4. Use visual or real-world analogies
5. Suggest looking at their notes or hints

WHEN STUDENT ASKS FOR THE ANSWER DIRECTLY:
- Respond: "I know it's tempting to want the answer, but you'll learn so much more by discovering it yourself! Let's break this down together..."
- Then ask a guiding question about their current step

FORMATTING:
- Use LaTeX for all math: $x + 5 = 12$
- Keep responses concise (3-5 sentences)
- End with a guiding question
`;

/**
 * Math-specific guiding questions by error type
 */
export const MATH_GUIDING_QUESTIONS = {
  algebraic_manipulation: [
    "What operation would help isolate the variable?",
    "If you do something to one side of the equation, what must you do to the other?",
    "Can you identify the inverse operation needed here?",
  ],
  arithmetic: [
    "Let's double-check that calculation. What's the operation you need to perform?",
    "Can you break this into smaller steps?",
    "What basic fact can help you here?",
  ],
  sign_errors: [
    "What happens to the sign when we move a term to the other side?",
    "Is this number positive or negative? How do you know?",
    "When we multiply or divide by a negative, what happens to the inequality sign?",
  ],
  fraction_operations: [
    "When we have fractions, what's a useful first step?",
    "What's the relationship between the numerator and denominator here?",
    "How can we create a common denominator?",
  ],
  order_of_operations: [
    "Which operation should we perform first? Why?",
    "Remember PEMDAS/BODMAS - what comes next?",
    "Are there any brackets or parentheses to deal with first?",
  ],
  distribution: [
    "What does it mean to 'distribute'?",
    "What happens when we multiply something by everything inside the brackets?",
    "Can you show me what $a(b + c)$ becomes?",
  ],
  general: [
    "What do you notice about this problem?",
    "What strategy might work here?",
    "What have you tried so far?",
    "What's the first step you want to take?",
  ],
};

/**
 * Encouraging messages for different situations
 */
export const MATH_ENCOURAGEMENTS = {
  correct_step: [
    "Excellent work! You're on the right track.",
    "That's correct! Your mathematical thinking is solid.",
    "Well done! Now, what comes next?",
    "Great progress! Keep going!",
  ],
  making_progress: [
    "Good effort! Let's think about this together.",
    "You're getting closer! Let me guide you a bit.",
    "I can see you're working hard on this!",
    "You've got the right idea, let's refine it.",
  ],
  stuck: [
    "It's okay to find this challenging - that's how we learn!",
    "Let's break this down into smaller pieces.",
    "Even mathematicians get stuck sometimes. Let's work through this.",
    "You've got this! Let's take it one step at a time.",
  ],
  asking_for_answer: [
    "I know it's frustrating, but discovering the answer yourself is so much more rewarding!",
    "Let me help you figure this out step by step.",
    "You're closer than you think! Let's keep exploring.",
    "The satisfaction of solving it yourself is worth the effort!",
  ],
};

// -----------------------------------------------------------------------------
// Cloud Function Calls
// -----------------------------------------------------------------------------

/**
 * Send a Socratic chat message to the AI tutor
 * The AI will NEVER give direct answers, only guide with questions
 */
export async function sendMathSocraticMessage(
  request: MathChatRequest
): Promise<MathChatResponse> {
  try {
    // Build the prompt with Socratic constraints
    const prompt = buildSocraticPrompt(request);

    // Call the Cloud Function
    const mathChat = httpsCallable<{ prompt: string; context: string }, {
      response: string;
      guidingQuestions?: string[];
    }>(functions, 'mathSocraticChat');

    const result = await mathChat({
      prompt,
      context: JSON.stringify(request.context),
    });

    // Extract guiding questions from response if present
    const { response: rawResponse, guidingQuestions } = result.data;
    const processedResponse = processLatexInResponse(rawResponse);

    return {
      ok: true,
      response: processedResponse,
      guidingQuestions: guidingQuestions || extractGuidingQuestions(rawResponse),
      hasLatex: containsLatex(processedResponse),
    };
  } catch (error) {
    console.error('Math Socratic chat error:', error);

    // Fallback to local Socratic response
    return generateLocalSocraticResponse(request);
  }
}

/**
 * Check student's work and provide Socratic feedback (no answers!)
 */
export async function checkStudentWork(
  context: MathChatContext
): Promise<WorkCheckResult> {
  try {
    const checkWorkFn = httpsCallable<{ context: string }, WorkCheckResult>(
      functions,
      'checkMathWork'
    );

    const result = await checkWorkFn({ context: JSON.stringify(context) });
    return result.data;
  } catch (error) {
    console.error('Check work error:', error);

    // Fallback to local assessment
    return generateLocalWorkCheck(context);
  }
}

// -----------------------------------------------------------------------------
// Prompt Building
// -----------------------------------------------------------------------------

/**
 * Build a Socratic prompt for the AI
 */
function buildSocraticPrompt(request: MathChatRequest): string {
  const { question, context, mode, history } = request;

  const workSummary = context.studentWork
    .map((w, i) => `Step ${i + 1}: ${w.latex}`)
    .join('\n');

  let modeInstruction = '';
  switch (mode) {
    case 'socratic':
      modeInstruction = 'Guide the student with questions. Never reveal the answer.';
      break;
    case 'check_work':
      modeInstruction = 'Review their work and ask guiding questions about any issues. Never give the correct answer.';
      break;
    case 'explain_concept':
      modeInstruction = 'Explain the concept using analogies and examples, then ask if they can apply it.';
      break;
  }

  const historyContext = history
    ? history.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')
    : '';

  return `
${SOCRATIC_SYSTEM_PROMPT}

CURRENT PROBLEM:
${context.problemStem}

STARTING EXPRESSION:
${context.startingExpression}

TOPIC: ${context.topic}
KEY CONCEPTS: ${context.keyConcepts.join(', ')}

STUDENT'S WORK SO FAR:
${workSummary || '(No work yet)'}

${context.studentFinalAnswer ? `STUDENT'S ANSWER ATTEMPT: ${context.studentFinalAnswer}` : ''}

PREVIOUS CONVERSATION:
${historyContext || '(New conversation)'}

MODE: ${modeInstruction}

STUDENT'S MESSAGE:
"${question}"

Remember: NEVER give the answer. Guide with questions. Be encouraging. Use LaTeX.
`;
}

// -----------------------------------------------------------------------------
// Response Processing
// -----------------------------------------------------------------------------

/**
 * Ensure LaTeX is properly formatted for rendering
 */
function processLatexInResponse(response: string): string {
  // Ensure inline LaTeX uses $ delimiters
  let processed = response;

  // Convert \( \) to $$ for inline
  processed = processed.replace(/\\\(/g, '$');
  processed = processed.replace(/\\\)/g, '$');

  // Convert \[ \] to $$ for block
  processed = processed.replace(/\\\[/g, '$$');
  processed = processed.replace(/\\\]/g, '$$');

  return processed;
}

/**
 * Check if response contains LaTeX
 */
function containsLatex(response: string): boolean {
  return /\$[^$]+\$|\$\$[^$]+\$\$/.test(response);
}

/**
 * Extract guiding questions from the response
 */
function extractGuidingQuestions(response: string): string[] {
  const questions: string[] = [];

  // Pattern: Sentences ending with ?
  const questionPattern = /[^.!?]*\?/g;
  let match;
  while ((match = questionPattern.exec(response)) !== null) {
    const question = match[0].trim();
    if (question.length > 10 && !questions.includes(question)) {
      questions.push(question);
    }
  }

  return questions.slice(0, 3);
}

// -----------------------------------------------------------------------------
// Local Fallbacks (when Cloud Function unavailable)
// -----------------------------------------------------------------------------

/**
 * Generate a local Socratic response when AI is unavailable
 */
function generateLocalSocraticResponse(request: MathChatRequest): MathChatResponse {
  const { question, context } = request;
  const lowerQuestion = question.toLowerCase();

  // Detect what kind of help they need
  let response = '';
  let guidingQuestions: string[] = [];

  if (lowerQuestion.includes('answer') || lowerQuestion.includes('tell me') || lowerQuestion.includes('what is')) {
    // Asking for direct answer
    response = getRandomItem(MATH_ENCOURAGEMENTS.asking_for_answer);
    guidingQuestions = MATH_GUIDING_QUESTIONS.general.slice(0, 2);
  } else if (lowerQuestion.includes('stuck') || lowerQuestion.includes("don't know") || lowerQuestion.includes('help')) {
    // Stuck
    response = getRandomItem(MATH_ENCOURAGEMENTS.stuck);
    guidingQuestions = [
      "What have you tried so far?",
      "What part is confusing you the most?",
      "Can you identify the first operation you need to do?",
    ];
  } else if (lowerQuestion.includes('right') || lowerQuestion.includes('correct')) {
    // Checking if correct
    response = "Let's think about this together. " + getRandomItem(MATH_GUIDING_QUESTIONS.general);
    guidingQuestions = [
      "What makes you think that's the right approach?",
      "Can you check your work by substituting your answer back in?",
    ];
  } else {
    // General question
    response = "That's a great question to explore! " + getRandomItem(MATH_GUIDING_QUESTIONS.general);
    guidingQuestions = MATH_GUIDING_QUESTIONS.general.slice(0, 2);
  }

  // Add encouragement
  response = getRandomItem(MATH_ENCOURAGEMENTS.making_progress) + " " + response;

  return {
    ok: true,
    response,
    guidingQuestions,
    hasLatex: false,
  };
}

/**
 * Generate local work check when AI is unavailable
 */
function generateLocalWorkCheck(context: MathChatContext): WorkCheckResult {
  const steps = context.studentWork;

  // Basic validation - can't do deep analysis locally
  const stepFeedback = steps.slice(1).map((_, index) => ({
    stepNumber: index + 1,
    status: 'good_approach' as const,
    guidingQuestion: getRandomItem(MATH_GUIDING_QUESTIONS.general),
  }));

  return {
    assessment: 'correct_path',
    stepFeedback,
    encouragement: getRandomItem(MATH_ENCOURAGEMENTS.making_progress),
    nextStepHint: "What operation would help you get closer to isolating the variable?",
  };
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get topic-specific follow-up questions
 */
export function getMathFollowUpQuestions(topic: string): string[] {
  const topicQuestions: Record<string, string[]> = {
    'linear-equations': [
      "What does it mean to 'solve' an equation?",
      "Why do we need to do the same thing to both sides?",
      "Can you think of a real-life situation that uses equations?",
    ],
    'quadratics': [
      "What shape does a quadratic equation make when graphed?",
      "Why might a quadratic have two solutions?",
      "Where do we see parabolas in the real world?",
    ],
    'fractions': [
      "What does a fraction actually represent?",
      "Why do we need common denominators to add fractions?",
      "Can you think of when you use fractions in daily life?",
    ],
    'algebra': [
      "Why do we use letters to represent unknown numbers?",
      "What's the difference between an expression and an equation?",
      "How is algebra useful in real life?",
    ],
    default: [
      "What concept do you find most challenging here?",
      "Can you explain your thinking so far?",
      "What strategy might help you solve this?",
    ],
  };

  return topicQuestions[topic] || topicQuestions.default;
}

/**
 * Format student work for display in chat
 */
export function formatWorkForChat(work: WorkLine[]): string {
  if (work.length === 0) return '_No work shown yet_';

  return work
    .map((line, i) => {
      if (i === 0) return `**Start:** $${line.latex}$`;
      return `**Step ${i}:** $${line.latex}$`;
    })
    .join('\n');
}
