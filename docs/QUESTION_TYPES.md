Question types reference (for admins)
===================================

This document describes the available question types for Listening tests, how they appear to students, and example JSON shapes you can use when creating tests via the admin UI or API.

1) mcq-single (Multiple choice — single answer)
- Student sees options labeled A, B, C, D (text). Use when answers are short text choices.
- Example JSON:

  {
    "questionNumber": 1,
    "questionType": "mcq-single",
    "section": 1,
    "questionText": "What does the woman order to drink?",
    "options": ["Coke","Tea","Smoothie","Juice"],
    "correctAnswer": "Tea",
    "points": 1
  }

2) picture-choice (Picture choice / Picture MCQ)
- Student sees images labeled A, B, C, D and selects the correct picture. Use for map/visual/food/drink choices like in real IELTS.
- Example JSON:

  {
    "questionNumber": 1,
    "questionType": "picture-choice",
    "section": 1,
    "questionText": "What does the woman order to drink?",
    "pictureOptions": ["https://.../coke.jpg","https://.../tea.jpg","https://.../shake.jpg","https://.../juice.jpg"],
    "correctAnswer": 1, // integer index (0=A, 1=B, ...)
    "points": 1
  }

3) form-completion / note / table / flowchart (Completion types)
- Student fills blanks in a template. Specify `maxWords` (NO MORE THAN X WORDS).
- Example JSON:

  {
    "questionNumber": 6,
    "questionType": "form-completion",
    "section": 2,
    "questionText": "Complete the registration form using NO MORE THAN THREE WORDS.",
    "templateType": "form",
    "template": "Name of student: ___\nAddress: Flat 5/ ___\nTown: ___",
    "blanks": [{"blankNumber":1},{"blankNumber":2},{"blankNumber":3}],
    "correctAnswer": ["John Smith","Hillview Road","Bayside"],
    "maxWords": 3
  }

4) matching, labelling, sentence completion, short answer, classification, number completion
- All supported; use admin builder to supply items / labels / answers. See the builder form for input fields and validations.

Notes
- The Add Listening admin page has a built-in "Load sample test" and per-question "Load example" so you can see exact fields and upload example images directly.
- Picture options can be uploaded as base64 (using drag-and-drop) or referenced via an absolute image URL.

If you want, I can expand this document into a rendered help page inside the admin UI.
