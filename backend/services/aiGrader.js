import OpenAI from 'openai';
import { trackChat } from './usageTracker.js';

const openai = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-key-here'
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

function roundToHalf(n) {
    return Math.round(Math.min(9, Math.max(0, Number(n) || 0)) * 2) / 2;
}

// IELTS official overall band rounding: nearest 0.5
export function roundIELTSOverall(avg) {
    return Math.round(Math.min(9, Math.max(0, avg)) * 2) / 2;
}

async function chatWithTracking({ model = 'gpt-4o', messages, context = '' }) {
    const response = await openai.chat.completions.create({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages,
    });
    trackChat({
        model,
        inputTokens:  response.usage?.prompt_tokens     ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        context,
    });
    return response;
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITING SYSTEM PROMPT — strict IELTS examiner methodology
// ─────────────────────────────────────────────────────────────────────────────
const WRITING_SYSTEM_PROMPT = `You are a strict, experienced IELTS examiner. Your role is to find errors and weaknesses FIRST, then assign the lowest band that accurately reflects the candidate's performance.

━━━ CRITICAL MINDSET ━━━
• Your DEFAULT assumption is Band 5.5. ONLY raise above 5.5 if you find CLEAR, SPECIFIC evidence.
• Band 6.0–6.5 = good performance. Band 7.0+ = genuinely advanced. Band 8.0+ = near-native.
• When uncertain between two adjacent bands, ALWAYS choose the LOWER one.
• Examiners who consistently inflate scores are removed. Be the examiner who tells the truth.
• 80% of IELTS candidates score 5.0–6.5. Only 5% score 7.0+. Reflect this in your grading.

━━━ STEP 1 — FIND ERRORS BEFORE SCORING ━━━
Before assigning any band, you MUST count and note:
□ Grammatical errors: subject-verb agreement, tense errors, article misuse, preposition errors, word order
□ Vocabulary problems: repetition of the same words, wrong word choice, awkward collocation, spelling errors
□ Coherence gaps: abrupt transitions, missing topic sentences, unclear pronoun reference, illogical ordering
□ Task gaps: which parts of the task are NOT addressed or only partially addressed

━━━ HARD BAND CAPS (non-negotiable maximums) ━━━
GRAMMATICAL RANGE & ACCURACY:
• 10+ grammatical errors → maximum 5.0
• 6–9 grammatical errors → maximum 5.5
• 3–5 grammatical errors → maximum 6.5
• 1–2 minor errors only → maximum 8.0
• Zero errors → 9.0 possible

LEXICAL RESOURCE:
• Vocabulary mostly basic/repetitive (same words repeated 3+ times) → maximum 5.5
• Only common vocabulary, no less-common items attempted → maximum 6.0
• Some less-common vocabulary with occasional inaccuracy → maximum 7.0
• Wide range, precise collocations, rare errors → 7.5–8.5

TASK ACHIEVEMENT / TASK RESPONSE:
• Significant task part(s) not addressed → maximum 5.5
• All parts addressed but superficially → maximum 6.5
• All parts addressed with some development → 7.0 possible
• Word count below minimum → deduct 1.0 band from TA/TR

COHERENCE & COHESION:
• No clear paragraph structure → maximum 5.0
• Paragraphs present but weak transitions → maximum 6.0
• Clear paragraphing with adequate connectives → 6.5–7.0

━━━ BAND DESCRIPTORS ━━━

TASK ACHIEVEMENT (Task 1) / TASK RESPONSE (Task 2):
• Band 9 — Fully addresses all requirements; well-extended, well-supported; clear fully developed position throughout.
• Band 8 — Covers requirements; well-developed; rare minor gaps in coverage or support.
• Band 7 — All parts addressed though some more fully; extends/supports ideas but may over-generalise; position mostly clear.
• Band 6 — All parts addressed but unevenly; main ideas present with some support; position sometimes unclear.
• Band 5 — Only partially addresses task; unclear/repetitive position; limited development; may over-generalise.
• Band 4 — Minimal response; ideas hard to identify; inadequate support.
• Band 3 — Does not adequately address any part.

COHERENCE & COHESION:
• Band 9 — Logical sequencing; cohesive devices used naturally; fully cohesive paragraphs.
• Band 8 — Logically organised; effective cohesive devices with minor lapses.
• Band 7 — Logically organised; clear progression; cohesive devices varied but sometimes faulty.
• Band 6 — Overall progression; cohesive devices used but sometimes faulty/mechanical; paragraphing may be inadequate.
• Band 5 — Not always logical; limited cohesive range; repetitive/inaccurate use; poor paragraphing.
• Band 4 — Not logically arranged; basic cohesive devices; paragraphing absent or poor.

LEXICAL RESOURCE:
• Band 9 — Full flexibility; wide range; precise; sophisticated collocation; rare errors.
• Band 8 — Wide range; skilled use; less common items; occasional inaccuracy.
• Band 7 — Sufficient range; some less common items; some inappropriate choices; occasional spelling errors.
• Band 6 — Adequate range; attempts less common vocab with inaccuracies; spelling errors rarely impede.
• Band 5 — Limited range; repetitive; noticeable spelling/formation errors; may cause difficulty.
• Band 4 — Basic; limited range; frequent errors in word choice and spelling.

GRAMMATICAL RANGE & ACCURACY:
• Band 9 — Full variety of structures accurately; rare slips.
• Band 8 — Wide range; most sentences error-free; minor errors don't impede.
• Band 7 — Variety of complex structures; mostly error-free; good control but some errors.
• Band 6 — Mix of simple and complex; errors rarely impede; adequate punctuation.
• Band 5 — Limited range; complex sentences with errors; frequent grammatical mistakes.
• Band 4 — Mostly simple sentences; frequent errors; may cause difficulty.

━━━ BAND 7+ BARRIER — MUST READ ━━━
Before giving 7.0 or above on ANY criterion, you MUST verify ALL of the following:
✗ No more than 2–3 grammatical errors total in the response
✗ Uses at least 5 less-common or sophisticated vocabulary items correctly
✗ Clear paragraph structure with varied, effective cohesive devices
✗ All task requirements fully addressed with specific details/examples
If ANY condition above is NOT met → the criterion cannot exceed 6.5.

━━━ ANTI-INFLATION RULES ━━━
1. Never give 7.0+ based on "general impression". Cite specific text evidence for each criterion.
2. Never give 8.0+ unless errors are so rare they would not distract a reader.
3. If a response "seems good" but you cannot find specific examples of advanced language → score 6.5, not 7.0.
4. Penalise repetition of sentence structure even if individual sentences are correct.
5. "Good effort" or "attempted to" signals a lower band — reward achievement, not attempt.
6. Overall band = mean of 4 criteria bands, rounded to nearest 0.5. DO NOT adjust the overall upward from the formula.

Return ONLY valid JSON — no markdown, no extra text.`;

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKING SYSTEM PROMPT — strict IELTS examiner methodology
// ─────────────────────────────────────────────────────────────────────────────
const SPEAKING_SYSTEM_PROMPT = `You are a strict, experienced IELTS examiner grading a WRITTEN TRANSCRIPT of spoken responses.

━━━ CRITICAL MINDSET ━━━
• Your DEFAULT assumption is Band 5.5. ONLY raise above 5.5 if you find CLEAR, SPECIFIC evidence.
• Band 6.0–6.5 = competent speaker. Band 7.0+ = genuinely advanced. Band 8.0+ = near-native.
• When uncertain between two adjacent bands, ALWAYS choose the LOWER one.
• 80% of candidates score 5.0–6.5. Only 5% reach 7.0+. Reflect this reality.

━━━ TRANSCRIPT LIMITATIONS ━━━
You cannot hear audio. Therefore:
• Fluency & Coherence: judge from visible repetitions, self-corrections, filler words, logical flow, discourse markers.
• Lexical Resource: judge vocabulary range, precision, collocation, paraphrasing from the text.
• Grammatical Range: judge sentence structures, tense control, accuracy from what is written.
• Pronunciation: CANNOT be assessed from text. Score = same as Grammatical Range & Accuracy, capped at 6.5 maximum. Always state: "Pronunciation scored as proxy — audio unavailable."

━━━ STEP 1 — FIND WEAKNESSES BEFORE SCORING ━━━
Before assigning any band, count and note:
□ Grammatical errors visible in transcript (tense, agreement, structure errors)
□ Vocabulary limitations (basic/repetitive words, wrong word choice)
□ Fluency signals: visible repetition ("I mean, I mean"), filler-heavy text ("like, you know, um"), very short answers
□ Coherence: does each answer logically address the question? Is there clear development?

━━━ HARD BAND CAPS ━━━
FLUENCY & COHERENCE:
• Answers mostly 1–2 sentences, no development → maximum 5.0
• Some development but loses coherence / over-uses connectives → maximum 6.0
• Extended answers with logical development → 6.5–7.0
• Visible repetition/filler words in text → deduct 0.5 from fluency score

LEXICAL RESOURCE:
• Mostly basic everyday vocabulary only → maximum 5.5
• No evidence of less-common or idiomatic vocabulary → maximum 6.0
• Some less-common items with occasional inaccuracy → 6.5–7.0

GRAMMATICAL RANGE & ACCURACY:
• 8+ grammatical errors → maximum 5.0
• 4–7 grammatical errors → maximum 5.5
• 2–3 grammatical errors → maximum 6.5
• 1 minor error only → maximum 8.0

PRONUNCIATION: maximum 6.5 (hard cap — transcript limitation)

━━━ BAND DESCRIPTORS ━━━

FLUENCY & COHERENCE:
• Band 9 — Fluent; rare repetition; coherent, well-connected; cohesive features natural.
• Band 8 — Fluent; occasional repetition; rare hesitation; coherent; cohesive features flexible.
• Band 7 — Speaks at length without effort; may repeat/self-correct; discourse markers flexible.
• Band 6 — Willing to speak at length; coherence occasionally lost; connectives not always used correctly.
• Band 5 — Uses repetition/self-correction to maintain flow; over-uses certain connectives; complex topics cause hesitation.
• Band 4 — Cannot maintain flow; frequent pausing; limited connectives; not sustained.
• Band 3 — Responds only with prompting; very hesitant; disconnected utterances.

LEXICAL RESOURCE:
• Band 9 — Full flexibility; precise, idiomatic; natural and accurate.
• Band 8 — Wide vocabulary; less-common words; effective paraphrase; rare inaccuracy.
• Band 7 — Flexible across topics; some less-common usage; some inappropriate choices; effective paraphrase.
• Band 6 — Adequate; attempts less-common words with inaccuracies; paraphrase inconsistent.
• Band 5 — Sufficient for familiar topics; limited less-common vocabulary; errors cause strain.
• Band 4 — Limited range; frequent word choice errors; difficult to discuss topics.

GRAMMATICAL RANGE & ACCURACY:
• Band 9 — Full range; naturally appropriate; rare slips only.
• Band 8 — Wide range; mostly accurate; minor errors don't impede.
• Band 7 — Consistent accuracy; occasional L1-influenced slips; uses complex structures.
• Band 6 — Mix of simple and complex; complex forms less accurate; errors don't prevent understanding.
• Band 5 — Basic forms reasonably accurate; limited flexibility; frequent errors in complex sentences.
• Band 4 — Limited structures; frequent errors; hard to understand.

━━━ BAND 7+ BARRIER ━━━
Before giving 7.0+ on ANY criterion, verify ALL:
✗ Extended, developed answers — not just single sentences
✗ No more than 2 grammatical errors total
✗ At least 4–5 less-common or idiomatic vocabulary items used correctly
✗ Logical, coherent response that directly addresses each question
If ANY condition above is NOT fully met → the criterion cannot exceed 6.5.

━━━ ANTI-INFLATION RULES ━━━
1. A transcript that "reads well" does NOT automatically mean 7.0+. Find specific advanced language features.
2. Short, simple answers that are grammatically correct = Band 5.0–5.5, NOT 6.5.
3. "Generally answers the question" = Band 6.0, not 7.0. Band 7 requires extended, coherent development.
4. Pronunciation maximum = 6.5. Never exceed this regardless of how fluent the text looks.
5. Overall band = mean of 4 criteria, rounded to nearest 0.5. Do NOT adjust upward from the formula.
6. If overall calculates to 7.0 or above, re-read each criterion and verify the evidence. Lower if uncertain.

Return ONLY valid JSON — no markdown, no extra text.`;


// ─────────────────────────────────────────────────────────────────────────────
// Writing grader — supports Task 1 image + task prompt
// ─────────────────────────────────────────────────────────────────────────────
export async function gradeWritingTask(text, taskIndex, imageUrl = null, taskPrompt = '') {
    if (!openai) throw new Error('OPENAI_API_KEY is not configured');

    const isTask1   = taskIndex === 0;
    const hasImage  = isTask1 && imageUrl && imageUrl.startsWith('http');
    const taskLabel = isTask1
        ? 'Task 1 (describe a chart, graph, diagram, map, or write a letter)'
        : 'Task 2 (argumentative/discussion essay)';
    // Always use gpt-4o for Task 1 (needs strong instruction-following + vision)
    const model = isTask1 ? 'gpt-4o' : 'gpt-4o-mini';

    // Word count for penalty check
    const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const minWords  = isTask1 ? 150 : 250;
    const wordNote  = wordCount < minWords
        ? `⚠ Word count: ${wordCount} words (below minimum ${minWords}). Apply -1.0 band penalty to Task Achievement criterion.`
        : `Word count: ${wordCount} words (meets minimum).`;

    const taskContext = taskPrompt?.trim()
        ? `WRITING TASK PROMPT (what the candidate was asked to write about):\n"""\n${taskPrompt}\n"""\n\n`
        : `WRITING TASK: ${taskLabel} (no specific prompt provided — grade based on whether response appears to address an appropriate task)\n\n`;

    const jsonSchema = isTask1 ? `{
  "band": 6.5,
  "wordCount": ${wordCount},
  "chartType": "e.g. bar chart / line graph / pie chart / table / process diagram / map",
  "questionAnalysis": "What the task required: what visual data to describe, what time period, what to compare",
  "keyDataPoints": ["key trend or figure from the visual that SHOULD be mentioned", "another key point"],
  "dataAccuracy": "List what the candidate got right and wrong about the actual data/trends in the visual",
  "relevanceCheck": "Does the response describe the correct visual? Are all required elements covered? Is there an overview?",
  "criteria": {
    "taskAchievement":   { "band": 6.0, "comment": "50-80 word comment: did candidate provide overview? cover key trends? use specific figures? penalise omissions or misrepresented data" },
    "coherenceCohesion": { "band": 7.0, "comment": "50-80 word comment referencing actual text evidence" },
    "lexicalResource":   { "band": 6.5, "comment": "50-80 word comment: note chart-specific vocabulary (rose, fell, peaked, fluctuated, proportion, constitute, etc.) vs general/repetitive language" },
    "grammaticalRange":  { "band": 6.0, "comment": "50-80 word comment referencing actual text evidence" }
  },
  "strengths":         ["specific strength with text example", "another strength"],
  "weaknesses":        ["specific weakness with text example", "another weakness"],
  "improvementAdvice": ["specific actionable advice", "another advice"],
  "feedback": "3-4 sentence overall summary: one strength, one main weakness (especially any data/trends missed), one improvement suggestion"
}` : `{
  "band": 6.5,
  "wordCount": ${wordCount},
  "questionAnalysis": "What the task required the candidate to do",
  "relevanceCheck": "Whether the response addresses the task; all parts covered; any off-topic content",
  "criteria": {
    "taskAchievement":   { "band": 6.0, "comment": "50-80 word specific comment referencing actual text evidence" },
    "coherenceCohesion": { "band": 7.0, "comment": "50-80 word specific comment referencing actual text evidence" },
    "lexicalResource":   { "band": 6.5, "comment": "50-80 word specific comment referencing actual text evidence" },
    "grammaticalRange":  { "band": 6.0, "comment": "50-80 word specific comment referencing actual text evidence" }
  },
  "strengths":         ["specific strength with text example", "another strength"],
  "weaknesses":        ["specific weakness with text example", "another weakness"],
  "improvementAdvice": ["specific actionable advice", "another advice"],
  "feedback": "3-4 sentence overall summary: highlight one strength, one main weakness, specific improvement suggestion"
}`;

    let userContent;
    if (hasImage) {
        userContent = [
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
            {
                type: 'text',
                text: `You are grading IELTS Writing Task 1. Start from Band 5.5 and only raise with clear evidence.

${taskContext}The image above is the chart/graph/diagram/map/table the candidate was asked to describe.

${wordNote}

CANDIDATE RESPONSE:
"""
${text}
"""

━━━ TASK 1 GRADING — FOLLOW THESE STEPS IN ORDER ━━━

STEP 1 — ANALYSE THE VISUAL (do this before reading the candidate's response):
• Identify chart type (bar chart / line graph / pie chart / table / process diagram / map / mixed)
• List ALL key data points: highest, lowest, most notable trends, important comparisons, time changes
• Note the main overall trend or pattern that a good response MUST mention

STEP 2 — READ CANDIDATE RESPONSE AGAINST THE VISUAL:
• Did they include a clear OVERVIEW (summary of the main trend/pattern)? — NO overview = max Band 5 for Task Achievement
• Did they report SPECIFIC FIGURES from the visual (e.g. "45%", "rose to 200", "in 2020")? — only general statements = max Band 6 for Task Achievement
• Did they make COMPARISONS between data points where appropriate?
• Are any KEY DATA POINTS missing, incorrect, or misrepresented? List them explicitly.
• Is there ACCURATE DATA REPORTING or did the candidate fabricate/misread values?

STEP 3 — LANGUAGE ANALYSIS:
• Grammar: count all errors (tense, agreement, article, preposition, word order)
• Vocabulary: look specifically for CHART-SPECIFIC language:
  — Trend verbs: rose, fell, dropped, increased, decreased, peaked, bottomed out, fluctuated, levelled off, remained stable
  — Proportion language: accounted for, constituted, comprised, made up, represented
  — Comparative language: higher than, significantly more, nearly double, approximately, roughly
  — Missing these and using only basic words (went up, went down, big, small) = lower Lexical Resource
• Coherence: does the response move logically through the data with clear paragraph structure?

STEP 4 — ASSIGN BANDS applying hard caps:
• Task Achievement CAPS for Task 1:
  - No overview at all → maximum 5.0
  - Overview present but no specific figures → maximum 6.0
  - Overview + specific figures + main comparisons → 6.5–7.0 possible
  - Key data points missing or data misrepresented → deduct at least 0.5–1.0
• Apply all caps from system prompt for other criteria

REMINDER: Most Task 1 responses score 5.5–6.5. 7.0+ requires overview + accurate specific data + chart vocabulary + grammar control.

Return JSON with EXACTLY this structure:
${jsonSchema}

Band scale: 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
Overall band = mean of 4 criteria bands, rounded to nearest 0.5`
            }
        ];
    } else if (isTask1) {
        // Task 1 without image — use task prompt to infer what was shown
        userContent = `You are grading IELTS Writing Task 1. Start from Band 5.5 and only raise with evidence.

${taskContext}${wordNote}

CANDIDATE RESPONSE:
"""
${text}
"""

━━━ TASK 1 GRADING — FOLLOW THESE STEPS IN ORDER ━━━

STEP 1 — DETERMINE TASK TYPE from the prompt above:
• Is this a chart/graph description (bar, line, pie, table)? OR a letter? OR a process/map description?
• If chart/graph: look for data reporting in the response
• If letter: check tone, format, all bullet points addressed

STEP 2 — FOR CHART/GRAPH TASKS, check the response for:
• OVERVIEW — a general summary of the main trend (REQUIRED; no overview = max Band 5 for Task Achievement)
• SPECIFIC DATA — figures, percentages, years, numbers from the chart mentioned (no figures = max Band 6)
• KEY COMPARISONS — highest/lowest, changes over time, differences between categories
• CHART VOCABULARY — rose, fell, peaked, fluctuated, accounted for, constituted, etc.
  (only basic words used = lower Lexical Resource)

STEP 3 — FOR LETTER TASKS, check:
• Appropriate tone (formal/informal/semi-formal matching the task)
• All three bullet points from the task addressed
• Correct letter format (opening, closing, appropriate phrases)

STEP 4 — COUNT errors and assign bands:
1. COUNT all grammatical errors (list specific ones)
2. CHECK vocabulary range for task-specific language
3. CHECK paragraph structure and cohesive devices
4. APPLY band caps from system prompt + Task 1 caps above

REMINDER: A Task 1 with no overview scores maximum 5.0 for Task Achievement. Most responses score 5.5–6.5. Only give 7.0+ if ALL Band 7+ conditions are met.

Return JSON with EXACTLY this structure:
${jsonSchema}

Band scale: 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
Overall band = mean of 4 criteria bands, rounded to nearest 0.5`;
    } else {
        // Task 2
        userContent = `You are grading IELTS Writing Task 2 (essay). Start from Band 5.5 and only raise with evidence.

${taskContext}${wordNote}

CANDIDATE RESPONSE:
"""
${text}
"""

GRADING INSTRUCTIONS — follow in order:
1. COUNT all grammatical errors (list specific ones in your comment — tense, agreement, article, preposition errors)
2. COUNT vocabulary repetitions; identify any less-common vocabulary used correctly
3. CHECK if all task requirements are fully addressed (not just mentioned — developed with examples/reasons)
4. CHECK paragraph structure, topic sentences, cohesive device variety
5. THEN assign bands — apply hard caps from system prompt rules
6. For each criterion: state the evidence THEN give the band — not the other way round

REMINDER: Most responses score 5.0–6.5. A score of 6.0–6.5 is a good, honest score. Only give 7.0+ if ALL Band 7+ conditions are met.

Return JSON with EXACTLY this structure:
${jsonSchema}

Band scale: 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
Overall band = mean of 4 criteria bands, rounded to nearest 0.5`;
    }

    const response = await chatWithTracking({
        model,
        context: `writing_grade_task${taskIndex}`,
        messages: [
            { role: 'system', content: WRITING_SYSTEM_PROMPT },
            { role: 'user',   content: userContent },
        ],
    });

    const raw = JSON.parse(response.choices[0].message.content);
    raw.band = roundToHalf(raw.band);
    if (raw.criteria) {
        for (const key of Object.keys(raw.criteria)) {
            if (raw.criteria[key]?.band != null) {
                raw.criteria[key].band = roundToHalf(raw.criteria[key].band);
            }
        }
    }
    // Enforce: overall band = mean of criteria, rounded to nearest 0.5
    if (raw.criteria) {
        const vals = Object.values(raw.criteria).map(c => c.band).filter(b => typeof b === 'number');
        if (vals.length > 0) {
            const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
            raw.band = roundToHalf(mean);
        }
    }
    return raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// Speaking grader WITH question context + part awareness (Part 1 / 2 / 3)
// ─────────────────────────────────────────────────────────────────────────────
export async function gradeSpeakingWithContext(transcript, partLabel = 'Part 1', questions = []) {
    if (!openai) throw new Error('OPENAI_API_KEY is not configured');

    const isP2 = /part\s*2/i.test(partLabel);
    const isP3 = /part\s*3/i.test(partLabel);

    const partContext = isP2
        ? `${partLabel} — Cue Card (long-turn monologue).
Expected: 1–2 minute uninterrupted speech (≈120–240 words) covering ALL cue card bullet points.
Cap: fewer than 120 words → Fluency maximum 5.0. Failure to cover key cue points → Task Relevance noted.`
        : isP3
        ? `${partLabel} — Abstract Discussion.
Expected: Extended, analytical answers showing ability to speculate, compare, evaluate.
Short/vague answers to abstract questions → maximum Band 5.5 for Fluency & Coherence.`
        : `${partLabel} — Personal Questions.
Expected: 2–3 sentence answers per question with personal detail and some development.
One-sentence answers only → maximum Band 5.0 for Fluency & Coherence.`;

    const questionsBlock = questions.length > 0
        ? `\nQUESTIONS ASKED IN THIS PART:\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
        : '';

    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

    const jsonSchema = `{
  "band": 6.0,
  "questionAnalysis": "What ${partLabel} required: topic, expected length, type of answers (personal / monologue / abstract discussion)",
  "relevanceCheck": "Did the candidate address the specific questions asked? Note any off-topic, irrelevant, or incomplete answers. Quote specific questions if missed.",
  "criteria": {
    "fluencyCoherence": { "band": 6.0, "comment": "50-80 word comment with specific evidence from transcript. Note response length vs expected length." },
    "lexicalResource":  { "band": 6.0, "comment": "50-80 word comment citing specific vocabulary examples — both strong and weak." },
    "grammaticalRange": { "band": 6.0, "comment": "50-80 word comment listing specific grammatical errors found." },
    "pronunciation":    { "band": 6.0, "comment": "Scored as proxy from transcript (audio unavailable). [50-word comment]" }
  },
  "strengths":         ["strength with specific transcript evidence", "another strength"],
  "weaknesses":        ["weakness with specific evidence", "another weakness"],
  "improvementAdvice": ["actionable advice for this specific part", "another advice"],
  "feedback": "3-4 sentence examiner summary for ${partLabel}: one strength, one main weakness, one specific suggestion"
}`;

    // Part 2 word cap enforcement (backend safeguard)
    let part2FluencyCap = null;
    if (isP2) {
        if (wordCount < 60)       part2FluencyCap = 4.5;
        else if (wordCount < 100) part2FluencyCap = 5.0;
        else if (wordCount < 150) part2FluencyCap = 5.5;
        else if (wordCount < 200) part2FluencyCap = 6.5;
    }

    const response = await chatWithTracking({
        model: 'gpt-4o-mini',
        context: `speaking_grade_${partLabel.replace(/\s+/g, '_').toLowerCase()}`,
        messages: [
            { role: 'system', content: SPEAKING_SYSTEM_PROMPT },
            {
                role: 'user',
                content: `You are grading an IELTS Speaking ${partLabel} response. Start from Band 5.5. Only raise with clear evidence.

PART CONTEXT:
${partContext}
${questionsBlock}
TRANSCRIPT (word count: ${wordCount}):
"""
${transcript}
"""

GRADING INSTRUCTIONS — follow in order:
1. CHECK question relevance — does each answer directly address the question asked? Flag irrelevant/missing answers.
2. CHECK response length vs expected (see part context above) — apply Fluency cap if too short
3. COUNT all grammatical errors (list specific examples in your comment)
4. ASSESS vocabulary: any less-common items? Repetition? Wrong choices?
5. EVALUATE fluency signals: one-sentence answers, over-used connectives, repetition
6. THEN assign bands — apply all hard caps from system prompt

REMINDER: Short but correct answers = Band 5.0–5.5. Only 7.0+ if ALL Band 7+ conditions fully met. Pronunciation maximum = 6.5.

Return JSON with EXACTLY this structure:
${jsonSchema}

Band scale: 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
Overall band = mean of 4 criteria, rounded to nearest 0.5`,
            },
        ],
    });

    const raw = JSON.parse(response.choices[0].message.content);
    raw.band = roundToHalf(raw.band);
    if (raw.criteria) {
        for (const key of Object.keys(raw.criteria)) {
            if (raw.criteria[key]?.band != null) raw.criteria[key].band = roundToHalf(raw.criteria[key].band);
        }
        // Enforce pronunciation cap
        if (raw.criteria.pronunciation?.band > 6.5) raw.criteria.pronunciation.band = 6.5;
        // Enforce Part 2 word-count cap on fluency
        if (part2FluencyCap !== null && raw.criteria.fluencyCoherence?.band > part2FluencyCap) {
            raw.criteria.fluencyCoherence.band = part2FluencyCap;
        }
        const vals = Object.values(raw.criteria).map(c => c.band).filter(b => typeof b === 'number');
        if (vals.length > 0) raw.band = roundToHalf(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
    return raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// Practice Writing grader
// ─────────────────────────────────────────────────────────────────────────────
export async function gradePracticeWriting(text, question) {
    if (!openai) throw new Error('OPENAI_API_KEY is not configured');

    const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

    const jsonSchema = `{
  "band": 6.5,
  "wordCount": ${wordCount},
  "questionAnalysis": "What the task required",
  "relevanceCheck": "Whether the response addresses the task",
  "criteria": {
    "taskAchievement":   { "band": 6.0, "comment": "50-80 word specific comment" },
    "coherenceCohesion": { "band": 7.0, "comment": "50-80 word specific comment" },
    "lexicalResource":   { "band": 6.5, "comment": "50-80 word specific comment" },
    "grammaticalRange":  { "band": 6.0, "comment": "50-80 word specific comment" }
  },
  "strengths":         ["specific strength", "another strength"],
  "weaknesses":        ["specific weakness", "another weakness"],
  "improvementAdvice": ["actionable advice", "another advice"],
  "feedback": "3-4 sentence overall summary"
}`;

    const response = await chatWithTracking({
        model: 'gpt-4o-mini',
        context: 'practice_writing_grade',
        messages: [
            { role: 'system', content: WRITING_SYSTEM_PROMPT },
            {
                role: 'user',
                content: `You are grading an IELTS Writing response. Start from Band 5.5 and only raise with evidence.

WRITING TASK / QUESTION:
"""
${question || 'General IELTS writing task'}
"""

Word count: ${wordCount}

CANDIDATE RESPONSE:
"""
${text}
"""

GRADING INSTRUCTIONS — follow in order:
1. COUNT grammatical errors (list specific ones in your comment)
2. COUNT vocabulary repetitions; identify less-common words used correctly
3. CHECK if all parts of the task are addressed and developed
4. CHECK paragraph structure and cohesive device variety
5. THEN assign bands — apply hard caps from system prompt

REMINDER: Most responses score 5.0–6.5. Give 7.0+ ONLY with clear, specific evidence of advanced language.

Return JSON with EXACTLY this structure:
${jsonSchema}

Band scale: 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
Overall band = mean of 4 criteria bands, rounded to nearest 0.5`,
            },
        ],
    });

    const raw = JSON.parse(response.choices[0].message.content);
    raw.band = roundToHalf(raw.band);
    if (raw.criteria) {
        for (const key of Object.keys(raw.criteria)) {
            if (raw.criteria[key]?.band != null) raw.criteria[key].band = roundToHalf(raw.criteria[key].band);
        }
        const vals = Object.values(raw.criteria).map(c => c.band).filter(b => typeof b === 'number');
        if (vals.length > 0) raw.band = roundToHalf(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
    return raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// Practice Speaking grader
// ─────────────────────────────────────────────────────────────────────────────
export async function gradePracticeSpeaking(transcript, question) {
    if (!openai) throw new Error('OPENAI_API_KEY is not configured');

    const jsonSchema = `{
  "band": 6.5,
  "questionAnalysis": "What the question required the candidate to say",
  "relevanceCheck": "Whether the response directly answers the question",
  "criteria": {
    "fluencyCoherence": { "band": 6.0, "comment": "50-80 word specific comment" },
    "lexicalResource":  { "band": 7.0, "comment": "50-80 word specific comment" },
    "grammaticalRange": { "band": 6.5, "comment": "50-80 word specific comment" },
    "pronunciation":    { "band": 6.0, "comment": "Pronunciation scored as proxy from transcript — audio assessment unavailable. [50-60 word comment]" }
  },
  "strengths":         ["specific strength", "another strength"],
  "weaknesses":        ["specific weakness", "another weakness"],
  "improvementAdvice": ["actionable advice", "another advice"],
  "feedback": "3-4 sentence overall summary"
}`;

    const response = await chatWithTracking({
        model: 'gpt-4o-mini',
        context: 'practice_speaking_grade',
        messages: [
            { role: 'system', content: SPEAKING_SYSTEM_PROMPT },
            {
                role: 'user',
                content: `You are grading an IELTS Speaking response. Start from Band 5.5 and only raise with evidence.

QUESTION ASKED:
"""
${question || 'General IELTS speaking question'}
"""

TRANSCRIPT:
"""
${transcript}
"""

GRADING INSTRUCTIONS — follow in order:
1. COUNT grammatical errors visible in the transcript
2. CHECK answer length and development — is it just 1-2 sentences or extended?
3. COUNT vocabulary limitations — repeated words, missing less-common vocabulary
4. LOOK for fluency signals in text: repetition, over-used connectives, filler words
5. THEN assign bands — apply hard caps from system prompt

REMINDER: A short but correct answer = Band 5.0–5.5, NOT 6.5. Only give 7.0+ if ALL Band 7+ conditions are fully met. Pronunciation maximum = 6.5 (hard cap).

Return JSON with EXACTLY this structure:
${jsonSchema}

Band scale: 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
Overall band = mean of 4 criteria bands, rounded to nearest 0.5`,
            },
        ],
    });

    const raw = JSON.parse(response.choices[0].message.content);
    raw.band = roundToHalf(raw.band);
    if (raw.criteria) {
        for (const key of Object.keys(raw.criteria)) {
            if (raw.criteria[key]?.band != null) raw.criteria[key].band = roundToHalf(raw.criteria[key].band);
        }
        // Enforce pronunciation cap
        if (raw.criteria.pronunciation?.band > 6.5) raw.criteria.pronunciation.band = 6.5;
        // Enforce overall = mean
        const vals = Object.values(raw.criteria).map(c => c.band).filter(b => typeof b === 'number');
        if (vals.length > 0) raw.band = roundToHalf(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
    return raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full exam Speaking grader (transcript from audio)
// ─────────────────────────────────────────────────────────────────────────────
export async function gradeSpeakingText(transcript) {
    if (!openai) throw new Error('OPENAI_API_KEY is not configured');

    const jsonSchema = `{
  "band": 6.5,
  "questionAnalysis": "Summary of what was expected from the candidate in this speaking task",
  "relevanceCheck": "Whether the transcript shows the candidate adequately addressed the speaking task",
  "criteria": {
    "fluencyCoherence": { "band": 6.0, "comment": "50-80 word comment with specific evidence from transcript" },
    "lexicalResource":  { "band": 7.0, "comment": "50-80 word comment with specific vocabulary examples" },
    "grammaticalRange": { "band": 6.5, "comment": "50-80 word comment with specific grammar examples" },
    "pronunciation":    { "band": 6.0, "comment": "Pronunciation scored as proxy from transcript — audio assessment unavailable. [comment]" }
  },
  "strengths":         ["specific strength with transcript evidence", "another strength"],
  "weaknesses":        ["specific weakness with transcript evidence", "another weakness"],
  "improvementAdvice": ["specific actionable advice", "another advice"],
  "feedback": "3-4 sentence overall summary: one key strength, one main weakness, one improvement suggestion"
}`;

    const response = await chatWithTracking({
        model: 'gpt-4o-mini',
        context: 'speaking_grade',
        messages: [
            { role: 'system', content: SPEAKING_SYSTEM_PROMPT },
            {
                role: 'user',
                content: `You are grading an IELTS Speaking exam transcript. Start from Band 5.5 and only raise with evidence.

TRANSCRIPT (all parts combined):
"""
${transcript}
"""

PART 2 DURATION CHECK (MANDATORY — do this first):
Find the Part 2 section in the transcript and count its words.
IELTS Part 2 requires speaking for 1–2 minutes (≈ 120–240 words at normal speaking pace).
Apply this cap to Fluency & Coherence BEFORE anything else:
• Part 2 fewer than 60 words  → Fluency & Coherence maximum 4.5 (failed to sustain speech)
• Part 2 fewer than 100 words → Fluency & Coherence maximum 5.0 (too short, did not develop topic)
• Part 2 fewer than 150 words → Fluency & Coherence maximum 5.5 (below expected length)
• Part 2 150–200 words        → Fluency & Coherence maximum 6.5 (borderline, partial development)
• Part 2 200+ words           → no length cap (assess purely on quality)

GRADING INSTRUCTIONS — follow in order:
1. EXTRACT Part 2 text and count its words → apply duration cap above
2. COUNT all grammatical errors in the full transcript (list specific examples)
3. IDENTIFY vocabulary problems: repeated words, missing less-common vocabulary, wrong word choice
4. ASSESS Part 1: are answers 2–3 sentences with some development? Short = lower fluency band
5. ASSESS Part 3: is vocabulary/grammar more complex? Simple answers = max 5.5
6. LOOK for fluency signals: repetitions, filler words, very short responses
7. THEN assign final bands applying all caps from system prompt

IELTS PART STANDARDS:
• Part 1: 2–3 developed sentences per answer expected. 1 sentence only = Band 5.0 fluency max.
• Part 2: 1–2 minute monologue required. Under 1 minute (< 120 words) = clear penalty.
• Part 3: Extended abstract discussion. Only short/vague answers = maximum Band 5.5.
• Grammar: count errors per 100 words — more than 3 errors per 100 words = Band 5.5 max for GRA.
• Vocabulary: no less-common items used correctly → maximum Band 6.0 for LR.

REMINDER: Most candidates score 5.0–6.5. Only give 7.0+ if ALL Band 7+ conditions fully met. Pronunciation maximum = 6.5 (hard cap — transcript only).

Return JSON with EXACTLY this structure:
${jsonSchema}

Band scale: 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
Overall band = mean of 4 criteria bands, rounded to nearest 0.5`,
            },
        ],
    });

    const raw = JSON.parse(response.choices[0].message.content);
    raw.band = roundToHalf(raw.band);
    if (raw.criteria) {
        for (const key of Object.keys(raw.criteria)) {
            if (raw.criteria[key]?.band != null) raw.criteria[key].band = roundToHalf(raw.criteria[key].band);
        }
        // Enforce pronunciation cap at 6.5
        if (raw.criteria.pronunciation?.band > 6.5) {
            raw.criteria.pronunciation.band = 6.5;
        }
        // Enforce Part 2 duration cap on fluencyCoherence (backend safeguard)
        const part2Match = transcript.match(/Part\s*2[:\s\n]+([\s\S]*?)(?:Part\s*3|$)/i);
        if (part2Match && raw.criteria.fluencyCoherence) {
            const part2Words = part2Match[1].trim().split(/\s+/).filter(Boolean).length;
            let fluencyCap = null;
            if (part2Words < 60)       fluencyCap = 4.5;
            else if (part2Words < 100) fluencyCap = 5.0;
            else if (part2Words < 150) fluencyCap = 5.5;
            else if (part2Words < 200) fluencyCap = 6.5;
            if (fluencyCap !== null && raw.criteria.fluencyCoherence.band > fluencyCap) {
                raw.criteria.fluencyCoherence.band = fluencyCap;
                console.log(`[AI] Part 2 word count: ${part2Words} → Fluency cap: ${fluencyCap}`);
            }
        }
        // Enforce overall = mean of criteria
        const vals = Object.values(raw.criteria).map(c => c.band).filter(b => typeof b === 'number');
        if (vals.length > 0) {
            raw.band = roundToHalf(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
    }
    return raw;
}
