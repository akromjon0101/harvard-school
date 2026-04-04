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

async function chatWithTracking({ model = 'gpt-4o', messages, context = '', maxTokens = 1500 }) {
    const response = await openai.chat.completions.create({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
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
// WRITING SYSTEM PROMPT — accurate IELTS band descriptor matching
// ─────────────────────────────────────────────────────────────────────────────
const WRITING_SYSTEM_PROMPT = `You are an experienced, calibrated IELTS examiner. Your role is to assign the band that MOST ACCURATELY matches the candidate's performance — neither inflating nor deflating. Award the band the work genuinely deserves.

━━━ CORE PRINCIPLE ━━━
Match the response EXACTLY to the band descriptors below. If the evidence fits Band 6, give Band 6. If it fits Band 7, give Band 7. Do not apply any bias toward lower or higher bands. Accuracy is the only goal.

━━━ STEP 1 — EVIDENCE INVENTORY ━━━
Before scoring, collect specific evidence:
□ Grammar: count errors (subject-verb, tense, articles, prepositions, word order) AND note correct complex structures used
□ Vocabulary: note both strengths (less-common words, collocations used well) AND weaknesses (repetition, wrong choices)
□ Coherence: assess paragraph structure, logical flow, cohesive device variety and accuracy
□ Task: check which parts are addressed, how fully developed, and whether the position/overview is clear

━━━ HARD BAND CAPS — GRAMMAR (GRA) ━━━
• 10+ grammatical errors → maximum 5.0
• 6–9 grammatical errors → maximum 5.5
• 3–5 grammatical errors → maximum 6.5
• 1–2 minor errors only → can reach 7.0–8.0
• Zero errors with varied complex structures → 8.5–9.0 possible

━━━ HARD BAND CAPS — LEXICAL RESOURCE (LR) ━━━
• Only very basic/repetitive vocabulary throughout → maximum 5.0
• Mostly common words, very few less-common items → maximum 5.5
• Adequate range with some less-common words, some errors → 6.0–6.5
• Good range of less-common vocabulary, collocations mostly accurate → 7.0–7.5
• Wide range, precise collocations, rare errors → 8.0–8.5

━━━ HARD BAND CAPS — TASK ACHIEVEMENT / TASK RESPONSE ━━━
• Major task requirements not addressed → maximum 5.0
• Task partially addressed / significant gaps → maximum 5.5
• All parts addressed but unevenly or superficially → 6.0–6.5
• All parts clearly addressed with good development → 7.0
• Fully developed with precise support and clear position → 7.5–8.0
• Word count below minimum (150/250) → apply -1.0 band to TA/TR

━━━ HARD BAND CAPS — COHERENCE & COHESION (CC) ━━━
• No paragraph structure or logical ordering → maximum 4.5
• Basic paragraphing but transitions weak or repetitive → 5.0–5.5
• Clear paragraphing, adequate cohesive devices, some mechanical use → 6.0–6.5
• Logically organised, varied cohesive devices, minor lapses → 7.0–7.5
• Fully cohesive, natural flow, no lapses → 8.0+

━━━ OFFICIAL BAND DESCRIPTORS ━━━

TASK ACHIEVEMENT (Task 1) / TASK RESPONSE (Task 2):
• Band 9 — All requirements fully addressed; fully extended, well-supported; clear position throughout
• Band 8 — All requirements covered; well-developed; rare minor gaps
• Band 7 — All parts addressed, some more fully; ideas extended/supported; position mostly clear
• Band 6 — All parts addressed but unevenly; main ideas present with some support; position sometimes unclear
• Band 5 — Partially addresses task; limited development; may misunderstand task requirements
• Band 4 — Minimal response; ideas difficult to identify; inadequate support
• Band 3 — Does not adequately address the task

COHERENCE & COHESION:
• Band 9 — Skilfully manages paragraphing; cohesive devices used naturally and accurately
• Band 8 — Sequences information logically; effective cohesive devices with minor lapses
• Band 7 — Logically organised; clear progression; cohesive devices varied but occasionally faulty
• Band 6 — Overall coherent; cohesive devices used but sometimes faulty or mechanical; may lack clear central topic in paragraphs
• Band 5 — Not always coherent; limited range of cohesive devices; repetitive use; paragraphing may be inadequate
• Band 4 — No logical progression; basic cohesive devices; paragraphing absent or poor

LEXICAL RESOURCE:
• Band 9 — Full flexibility and precise use; wide range; sophisticated collocation; negligible errors
• Band 8 — Wide range; skilled use of less-common items; occasional inaccuracy
• Band 7 — Sufficient range; some less-common items; some inappropriate choices; spelling mostly accurate
• Band 6 — Adequate range; attempts less-common vocabulary with some inaccuracy; spelling errors rarely impede
• Band 5 — Limited range; common vocabulary; noticeable errors that may cause difficulty
• Band 4 — Basic vocabulary; frequent errors in word form, choice and spelling

GRAMMATICAL RANGE & ACCURACY:
• Band 9 — Wide range of structures; fully flexible and accurate; negligible errors
• Band 8 — Wide range; most sentences error-free; minor errors do not impede communication
• Band 7 — Variety of complex structures; frequent error-free sentences; some errors remain
• Band 6 — Mix of simple and complex sentences; errors in complex structures; adequate punctuation
• Band 5 — Limited range; attempts complex sentences unsuccessfully; frequent grammatical errors
• Band 4 — Mostly simple sentences; errors are frequent; communication sometimes impeded

━━━ STRICTNESS RULES — APPLY WITHOUT EXCEPTION ━━━
1. DO NOT award sympathy bands. A weak response must receive the band it deserves.
2. DO NOT inflate scores because the candidate wrote many words — length without quality is penalised, not rewarded.
3. Copied/memorised text that does not address the task → Band 0–1 for Task Achievement.
4. Off-topic response (does not address the question) → maximum Band 3.0 for Task Achievement.
5. Word count below minimum (150/250) → mandatory -1.0 penalty to Task Achievement/Task Response.
6. Responses that are mostly filler without substance → maximum Band 4.5.

━━━ SCORING RULES ━━━
1. Match descriptors exactly — do not round down "to be safe" or round up "to be encouraging"
2. Cite specific text evidence for every criterion score
3. If evidence fits two adjacent bands, re-read the descriptors and choose the one that is the better match
4. Overall band = mean of 4 criteria bands, rounded to nearest 0.5 (do not manually adjust)
5. A response with strong task achievement and vocabulary but many grammar errors: high TA/LR, low GRA — reflect this accurately

Return ONLY valid JSON — no markdown, no extra text.`;

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKING SYSTEM PROMPT — accurate IELTS band descriptor matching
// ─────────────────────────────────────────────────────────────────────────────
const SPEAKING_SYSTEM_PROMPT = `You are an experienced, calibrated IELTS examiner grading a WRITTEN TRANSCRIPT of spoken responses. Your role is to assign the band that MOST ACCURATELY matches the evidence — neither inflating nor deflating.

━━━ TRANSCRIPT LIMITATIONS ━━━
You cannot hear audio. Therefore:
• Fluency & Coherence: judge from visible repetitions, filler words, logical flow, discourse markers, answer length and development
• Lexical Resource: judge vocabulary range, precision, collocation, paraphrasing from the text
• Grammatical Range & Accuracy: judge sentence structures, tense control, accuracy from what is written
• Pronunciation: CANNOT be assessed from transcript. Score = mirror of Grammatical Range & Accuracy, hard cap 6.5. Always state "Pronunciation scored as proxy — audio unavailable."

━━━ STEP 1 — EVIDENCE INVENTORY ━━━
Before scoring, collect:
□ Grammatical errors visible in transcript (tense, agreement, word order, articles) AND correct complex structures used
□ Vocabulary: less-common or idiomatic items used correctly AND weaknesses (repetition, wrong choices)
□ Fluency signals: answer length vs expected length, visible repetition, discourse marker use/misuse
□ Coherence: does each answer directly address the question? Is there logical development?

━━━ HARD BAND CAPS — FLUENCY & COHERENCE ━━━
• Answers of 1 sentence each, no development → maximum 4.5
• Short answers (2–3 sentences) with minimal development → maximum 5.5
• Adequate development but coherence sometimes lost → 6.0–6.5
• Extended answers with consistent logical development → 7.0
• Fluent, well-connected, natural discourse → 7.5–8.0

━━━ HARD BAND CAPS — LEXICAL RESOURCE ━━━
• Only very basic everyday vocabulary → maximum 5.0
• Mostly common words, very few less-common items → maximum 5.5
• Some less-common/idiomatic vocabulary with occasional inaccuracy → 6.0–7.0
• Wide range, effective paraphrase, rare inaccuracy → 7.5–8.0

━━━ HARD BAND CAPS — GRAMMATICAL RANGE & ACCURACY ━━━
• 8+ grammatical errors → maximum 5.0
• 5–7 grammatical errors → maximum 5.5
• 3–4 grammatical errors → maximum 6.5
• 1–2 minor errors only, complex structures used → 7.0–8.0
• Zero errors, wide range of structures → 8.5–9.0

━━━ PRONUNCIATION ━━━
• Hard cap: maximum 6.5 (cannot be assessed from transcript)

━━━ OFFICIAL BAND DESCRIPTORS ━━━

FLUENCY & COHERENCE:
• Band 9 — Speaks fluently with only rare repetition; coherent, well-connected; cohesive features natural
• Band 8 — Fluent with occasional hesitation; mostly coherent; cohesive features effective
• Band 7 — Speaks at length with some effort; may repeat/self-correct; discourse markers generally flexible
• Band 6 — Willing to speak at length; coherence occasionally lost; connectives not always accurate
• Band 5 — Repetition/self-correction used to maintain flow; over-uses certain connectives; hesitates on complex topics
• Band 4 — Cannot maintain flow; frequent pausing; limited connective use
• Band 3 — Responds only with prompting; disconnected utterances

LEXICAL RESOURCE:
• Band 9 — Full flexibility; precise, idiomatic; natural and accurate throughout
• Band 8 — Wide range; effective use of less-common items; effective paraphrase; rare inaccuracy
• Band 7 — Flexible use across topics; some less-common items; some inappropriate choices; adequate paraphrase
• Band 6 — Adequate range; attempts less-common vocabulary with some inaccuracy; inconsistent paraphrase
• Band 5 — Sufficient for familiar topics; limited less-common vocabulary; some errors cause difficulty
• Band 4 — Limited range; frequent word choice errors; difficulty discussing topics

GRAMMATICAL RANGE & ACCURACY:
• Band 9 — Full range; naturally accurate; negligible slips
• Band 8 — Wide range; mostly accurate; minor errors that do not impede communication
• Band 7 — Consistent accuracy in complex structures; occasional L1-influenced errors
• Band 6 — Mix of simple and complex; complex forms less accurate; does not impede overall meaning
• Band 5 — Basic structures mostly accurate; limited complex forms; frequent errors
• Band 4 — Mostly simple sentences; frequent errors impede communication

━━━ STRICTNESS RULES — APPLY WITHOUT EXCEPTION ━━━
1. DO NOT award sympathy bands. A weak response must receive the band it deserves, even if it is Band 2 or Band 3.
2. DO NOT inflate bands because the candidate "tried" or "attempted". Only evidence in the transcript counts.
3. Memorised responses (recited without direct relevance to the question) → maximum Band 4.0 for Fluency & Coherence.
4. Responses in a language other than English → Band 0 for all criteria.
5. Completely off-topic or nonsensical content → maximum Band 2.5 across all criteria.

━━━ SCORING RULES ━━━
1. Match descriptors exactly — award the band the evidence supports
2. Cite specific transcript evidence for every criterion score
3. If evidence sits between two bands, re-read descriptors carefully and choose the best fit
4. Overall band = mean of 4 criteria, rounded to nearest 0.5 (do not manually adjust)
5. Pronunciation = mirror of GRA score, capped at 6.5

Return ONLY valid JSON — no markdown, no extra text.`;


// ─────────────────────────────────────────────────────────────────────────────
// Writing grader — supports Task 1 image + task prompt
// ─────────────────────────────────────────────────────────────────────────────
export async function gradeWritingTask(text, taskIndex, imageUrl = null, taskPrompt = '') {
    if (!openai) throw new Error('OPENAI_API_KEY is not configured');

    const wordCount0 = text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    if (wordCount0 < 30) {
        return {
            band: 0, wordCount: wordCount0,
            criteria: {
                taskAchievement:   { band: 0, comment: wordCount0 === 0 ? 'No response submitted.' : `Only ${wordCount0} words — far below minimum. Cannot assess.` },
                coherenceCohesion: { band: 0, comment: 'Insufficient text to evaluate.' },
                lexicalResource:   { band: 0, comment: 'Insufficient text to evaluate.' },
                grammaticalRange:  { band: 0, comment: 'Insufficient text to evaluate.' },
            },
            strengths: [],
            weaknesses: [wordCount0 === 0 ? 'No response submitted.' : `Only ${wordCount0} words written. Task 1 requires 150 words minimum; Task 2 requires 250 words minimum.`],
            improvementAdvice: ['Write at least 150 words for Task 1 or 250 words for Task 2.'],
            feedback: wordCount0 === 0 ? 'No writing response submitted.' : `Response too short (${wordCount0} words). Cannot grade responses below 30 words.`,
        };
    }

    const isTask1   = taskIndex === 0;
    const taskLabel = isTask1
        ? 'Task 1 (describe a chart, graph, diagram, map, or write a letter)'
        : 'Task 2 (argumentative/discussion essay)';

    // Try to fetch image as base64 to avoid Railway ephemeral URL issues
    let imageBase64 = null;
    if (isTask1 && imageUrl && imageUrl.startsWith('http')) {
        try {
            const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
            if (imgRes.ok) {
                const buf = await imgRes.arrayBuffer();
                const mime = imgRes.headers.get('content-type') || 'image/jpeg';
                imageBase64 = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
            }
        } catch (err) {
            console.warn('[AI] Could not fetch Task 1 image, grading without it:', err.message);
        }
    }
    const hasImage = !!imageBase64;
    // Use gpt-4o only when image is present (vision), gpt-4o-mini for text-only
    const model = hasImage ? 'gpt-4o' : 'gpt-4o-mini';

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
            { type: 'image_url', image_url: { url: imageBase64, detail: 'high' } },
            {
                type: 'text',
                text: `You are grading IELTS Writing Task 1. Grade accurately — award the band that best matches the evidence.

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

REMINDER: Apply the band caps above, then match descriptors exactly. Task 1 overview is required for Band 6+ on Task Achievement.

Return JSON with EXACTLY this structure:
${jsonSchema}

Band scale: 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
Overall band = mean of 4 criteria bands, rounded to nearest 0.5`
            }
        ];
    } else if (isTask1) {
        // Task 1 without image — use task prompt to infer what was shown
        userContent = `You are grading IELTS Writing Task 1. Grade accurately — award the band that best matches the evidence.

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
        userContent = `You are grading IELTS Writing Task 2 (essay). Grade accurately — award the band that best matches the evidence.

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

REMINDER: Apply the band caps above and match descriptors exactly. Award the band the evidence supports.

Return JSON with EXACTLY this structure:
${jsonSchema}

Band scale: 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9
Overall band = mean of 4 criteria bands, rounded to nearest 0.5`;
    }

    const response = await chatWithTracking({
        model,
        context: `writing_grade_task${taskIndex}`,
        maxTokens: hasImage ? 2000 : 1500,
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
// Returns a zero-band result without calling AI
function emptyBandResult(reason, partLabel = '') {
    const zero = { band: 0, comment: reason };
    return {
        band: 0,
        questionAnalysis: `${partLabel} — no meaningful response`,
        relevanceCheck: reason,
        criteria: {
            fluencyCoherence: zero,
            lexicalResource:  zero,
            grammaticalRange: zero,
            pronunciation:    zero,
        },
        strengths: [],
        weaknesses: [reason],
        improvementAdvice: ['Provide a spoken response of at least 2-3 sentences per question.'],
        feedback: reason,
    };
}

export async function gradeSpeakingWithContext(transcript, partLabel = 'Part 1', questions = []) {
    if (!openai) throw new Error('OPENAI_API_KEY is not configured');

    // Hard guard: reject empty / near-empty transcripts before calling AI
    // < 20 words = background noise / silence / non-answer → band 0, no API call
    const wordCount = transcript?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    if (wordCount < 20) {
        return emptyBandResult(
            wordCount === 0
                ? 'No spoken response detected.'
                : `Response too short to assess (${wordCount} words). Minimum ~20 words required for any band score.`,
            partLabel
        );
    }

    const isP2 = /part\s*2/i.test(partLabel);
    const isP3 = /part\s*3/i.test(partLabel);

    const partContext = isP2
        ? `${partLabel} — Cue Card (long-turn monologue).
Expected: ~2 minutes of uninterrupted speech (≈200–240 words) covering ALL cue card bullet points.
Duration caps for Fluency & Coherence (MANDATORY — apply BEFORE any other assessment):
• fewer than 60 words  (< ~30 sec) → Fluency maximum 3.0
• fewer than 120 words (< ~1 min)  → Fluency maximum 4.0
• fewer than 180 words (< ~1.5 min)→ Fluency maximum 5.0
• fewer than 220 words (< ~2 min)  → Fluency maximum 5.5
• 220+ words (~2 min)              → no length cap — assess purely on quality
Failure to cover all cue card bullet points → deduct 0.5 from Fluency & Coherence.`
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

    const transcriptWordCount = transcript.trim().split(/\s+/).filter(Boolean).length;

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

    // Part 2 word cap enforcement — backend safeguard (~2 min average = ~200–240 words)
    let part2FluencyCap = null;
    if (isP2) {
        if (wordCount < 60)       part2FluencyCap = 3.0;   // < 30 sec
        else if (wordCount < 120) part2FluencyCap = 4.0;   // < 1 min
        else if (wordCount < 180) part2FluencyCap = 5.0;   // < 1.5 min
        else if (wordCount < 220) part2FluencyCap = 5.5;   // < 2 min
        // 220+ words → no cap
    }

    const response = await chatWithTracking({
        model: 'gpt-4o-mini',
        context: `speaking_grade_${partLabel.replace(/\s+/g, '_').toLowerCase()}`,
        messages: [
            { role: 'system', content: SPEAKING_SYSTEM_PROMPT },
            {
                role: 'user',
                content: `You are grading an IELTS Speaking ${partLabel} response. Grade accurately — award the band that best matches the evidence.

PART CONTEXT:
${partContext}
${questionsBlock}
TRANSCRIPT (word count: ${wordCount}):
"""
${transcript}
"""

GRADING INSTRUCTIONS — follow in order:
1. CHECK question relevance FIRST — does each answer directly address the question asked?
   • Completely off-topic (speaking about unrelated subjects, reciting memorized text, random content): Fluency & Coherence maximum 2.0, Lexical Resource maximum 3.0. Write "OFF-TOPIC" in relevanceCheck.
   • Partially off-topic or only tangentially relevant: maximum Band 4.0 for Fluency & Coherence.
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
        // Hard cap for off-topic responses detected by AI
        const isOffTopic = typeof raw.relevanceCheck === 'string' &&
            /off.?topic|unrelated|irrelevant|did not address/i.test(raw.relevanceCheck);
        if (isOffTopic) {
            if (raw.criteria.fluencyCoherence?.band > 2.0) raw.criteria.fluencyCoherence.band = 2.0;
            if (raw.criteria.lexicalResource?.band   > 3.0) raw.criteria.lexicalResource.band   = 3.0;
            console.log(`[AI] Off-topic response detected for ${partLabel} — applying band caps`);
        }
        // Hard cap for short transcripts (20–49 words = very limited content)
        if (wordCount < 30) {
            for (const key of Object.keys(raw.criteria)) {
                if (raw.criteria[key]?.band > 2.5) raw.criteria[key].band = 2.5;
            }
        } else if (wordCount < 50) {
            for (const key of Object.keys(raw.criteria)) {
                if (raw.criteria[key]?.band > 3.5) raw.criteria[key].band = 3.5;
            }
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
                content: `You are grading an IELTS Writing response. Grade accurately — award the band that best matches the evidence.

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

REMINDER: Apply the hard caps above and match descriptors exactly. Award the band the evidence supports.

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

    const wordCount = transcript?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    if (wordCount < 20) {
        return emptyBandResult(
            wordCount === 0
                ? 'No spoken response detected.'
                : `Response too short to assess (${wordCount} words). Minimum ~20 words required.`
        );
    }

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
                content: `You are grading an IELTS Speaking response. Grade accurately — award the band that best matches the evidence.

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

    const wordCount = transcript?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    if (wordCount < 10) {
        return emptyBandResult('No valid spoken response detected (fewer than 10 words in full exam).');
    }

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
                content: `You are grading an IELTS Speaking exam transcript. Grade accurately — award the band that best matches the evidence.

TRANSCRIPT (all parts combined):
"""
${transcript}
"""

PART 2 DURATION CHECK (MANDATORY — do this first):
Find the Part 2 section in the transcript and count its words.
IELTS Part 2 requires ~2 minutes of speech (≈200–240 words at normal speaking pace).
Apply this cap to Fluency & Coherence BEFORE anything else:
• Part 2 fewer than 60 words  → Fluency & Coherence maximum 3.0 (< 30 sec — barely spoke)
• Part 2 fewer than 120 words → Fluency & Coherence maximum 4.0 (< 1 min — very short)
• Part 2 fewer than 180 words → Fluency & Coherence maximum 5.0 (< 1.5 min — below expected)
• Part 2 fewer than 220 words → Fluency & Coherence maximum 5.5 (< 2 min — borderline)
• Part 2 220+ words           → no length cap (assess purely on quality)

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

REMINDER: Apply the hard caps above and match descriptors exactly. Pronunciation maximum = 6.5 (hard cap — transcript only).

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
        // Hard cap for very short transcripts (10–30 words passed the guard)
        if (wordCount < 20) {
            for (const key of Object.keys(raw.criteria)) {
                if (raw.criteria[key]?.band > 2.0) raw.criteria[key].band = 2.0;
            }
        } else if (wordCount < 40) {
            for (const key of Object.keys(raw.criteria)) {
                if (raw.criteria[key]?.band > 3.0) raw.criteria[key].band = 3.0;
            }
        }
        // Enforce Part 2 duration cap on fluencyCoherence (backend safeguard)
        const part2Match = transcript.match(/Part\s*2[:\s\n]+([\s\S]*?)(?:Part\s*3|$)/i);
        if (part2Match && raw.criteria.fluencyCoherence) {
            const part2Words = part2Match[1].trim().split(/\s+/).filter(Boolean).length;
            let fluencyCap = null;
            if (part2Words < 60)       fluencyCap = 3.0;   // < 30 sec
            else if (part2Words < 120) fluencyCap = 4.0;   // < 1 min
            else if (part2Words < 180) fluencyCap = 5.0;   // < 1.5 min
            else if (part2Words < 220) fluencyCap = 5.5;   // < 2 min
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
