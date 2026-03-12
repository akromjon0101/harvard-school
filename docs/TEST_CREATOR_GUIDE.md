# 📝 IELTS Listening Test Creator - Complete Guide

## Overview

I've created an **easy, visual system** to create IELTS listening tests without coding. Now you can:

✅ Create tests with a friendly UI (no coding needed)
✅ Support all 8 question types
✅ Easily switch between different question formats
✅ Export test data as JSON
✅ Copy/paste into your test files

---

## 🎯 Quick Start

### Access the Test Creator
**URL:** `http://localhost:5175/admin/create-test`

### Steps to Create a Test:

1. **Fill Test Info**
   - Name: "My First Test"
   - Description: "Cambridge IELTS style test"
   - Duration: 20 minutes

2. **Select Question Type** (8 buttons at top)
   - Click on the type you want (e.g., "Form Fill", "MCQ Single")

3. **Fill Question Details**
   - Question text
   - Options/answers based on type
   - Correct answer(s)
   - Points

4. **Click "Add This Question"**
   - Question appears in the list below

5. **Repeat Steps 2-4** for more questions

6. **Export Your Test**
   - Copy to Clipboard
   - Download JSON file

7. **Paste into Your Test File**
   - Copy the JSON
   - Paste into `listeningTest.js`

---

## 📋 Question Types Explained

### 1. **FORM COMPLETION** (Gap Fill)
**Best for:** Notes, forms, registrations

**Example:**
```
Registration Form
Name: _______
Email: _______
Phone: _______
```

**How to Create:**
- Write the form with `_______` for blanks
- Add correct answers in order
- Set max words (usually 2-3)

**Example Output:**
```json
{
  "questionType": "form-completion",
  "template": "Name: _______\nEmail: _______",
  "correctAnswers": ["John Smith", "john@email.com"],
  "maxWords": 3
}
```

---

### 2. **MCQ SINGLE** (Choose One)
**Best for:** Multiple choice questions with 1 answer

**Example:**
```
What did the student order?
A) Coffee
B) Tea
C) Juice
D) Water
```

**How to Create:**
- Add 4 options (one per line)
- Type exact text of correct answer

**Example Output:**
```json
{
  "questionType": "mcq-single",
  "options": ["Coffee", "Tea", "Juice", "Water"],
  "correctAnswer": "Coffee"
}
```

---

### 3. **MCQ MULTIPLE** (Choose Two)
**Best for:** Select 2+ correct answers from 5 options

**Example:**
```
Which TWO things were mentioned?
A) Location
B) Salary
C) Hours
D) History
E) Training
```

**How to Create:**
- Add 5 options
- Select how many to choose (usually 2)
- Enter correct answers

**Example Output:**
```json
{
  "questionType": "mcq-multiple",
  "options": ["Location", "Salary", "Hours", "History", "Training"],
  "correctAnswers": ["Salary", "Training"],
  "chooseNumber": 2
}
```

---

### 4. **PICTURE CHOICE**
**Best for:** Identify items by picture

**Example:**
- Show 4 coffee pictures
- Student selects which one was ordered

**How to Create:**
- Paste 4 image URLs (one per line)
- Select correct picture number (0, 1, 2, or 3)

**Example Output:**
```json
{
  "questionType": "picture-choice",
  "pictureOptions": [
    "https://example.com/espresso.jpg",
    "https://example.com/latte.jpg",
    "https://example.com/cappuccino.jpg",
    "https://example.com/americano.jpg"
  ],
  "correctAnswer": 1
}
```

---

### 5. **SHORT ANSWER**
**Best for:** One sentence answers

**Example:**
```
Question: How much did it cost?
Answer: $25 (or "25 dollars" or "twenty five")
```

**How to Create:**
- Add multiple acceptable answers (for variations)
- Set max words (usually 1-3)

**Example Output:**
```json
{
  "questionType": "short-answer",
  "correctAnswers": ["$25", "25 dollars", "twenty five dollars"],
  "maxWords": 3
}
```

---

### 6. **MATCHING**
**Best for:** Match names to professions, etc.

**Example:**
```
Column A          Column B
Sarah      ---    Doctor
David      ---    Teacher
Emma       ---    Lawyer
           ---    Engineer
           ---    Nurse
```

**How to Create:**
- Left items: 5 items
- Right options: 7-8 options (more than left)
- Order matters! Enter correct matches in order

**Example Output:**
```json
{
  "questionType": "matching",
  "leftItems": ["Sarah", "David", "Emma"],
  "rightOptions": ["Doctor", "Teacher", "Lawyer", "Engineer", "Nurse"],
  "correctAnswers": [0, 2, 1]
}
```

---

### 7. **CLASSIFICATION**
**Best for:** Categorize items (A, B, C)

**Example:**
```
Classify as: A = Mammal, B = Bird, C = Fish

Dog      --- A
Eagle    --- B
Salmon   --- C
```

**How to Create:**
- Define categories (A, B, C, etc.)
- List items to classify
- Match each item to category letter

**Example Output:**
```json
{
  "questionType": "classification",
  "categories": [
    {"label": "A", "name": "Mammal"},
    {"label": "B", "name": "Bird"},
    {"label": "C", "name": "Fish"}
  ],
  "items": ["Dog", "Eagle", "Salmon"],
  "correctAnswers": ["A", "B", "C"]
}
```

---

### 8. **DIAGRAM LABELLING**
**Best for:** Label parts of a map/building

**Example:**
- Show building diagram
- Students label: Reception, Kitchen, etc.

**How to Create:**
- Paste diagram image URL
- Add number of blanks
- Enter labels for each blank

**Example Output:**
```json
{
  "questionType": "diagram-labelling",
  "imageUrl": "https://example.com/building.jpg",
  "blanks": [
    {"blankNumber": 1},
    {"blankNumber": 2},
    {"blankNumber": 3}
  ],
  "correctAnswers": ["Main Entrance", "Reception", "Kitchen"],
  "maxWords": 2
}
```

---

## 🔧 How to Use the Creator UI

### Step-by-Step Guide

#### **1. Access Test Creator**
```
URL: http://localhost:5175/admin/create-test
```

#### **2. Fill Test Information**
```
Test Name: Cambridge IELTS Test 5
Description: Full practice test for listening
Duration: 30 minutes
```

#### **3. Create Questions**

**For FORM COMPLETION:**
```
1. Click "📋 Form Fill" button
2. Paste form template with ___ blanks
3. Enter each correct answer
4. Set max words
5. Click "Add This Question"
```

**For MCQ SINGLE:**
```
1. Click "✓ MCQ Single" button
2. Enter question text
3. Paste 4 options (one per line)
4. Type correct answer
5. Click "Add This Question"
```

**For MCQ MULTIPLE:**
```
1. Click "✓✓ MCQ Multi" button
2. Enter question text
3. Paste 5 options
4. Set "Choose Number" (e.g., 2)
5. Enter correct answers
6. Click "Add This Question"
```

**For PICTURE CHOICE:**
```
1. Click "🖼️ Pictures" button
2. Paste 4 image URLs
3. Set correct picture (0, 1, 2, or 3)
4. Click "Add This Question"
```

**For SHORT ANSWER:**
```
1. Click "✏️ Short Answer" button
2. Enter question text
3. Add acceptable variations
4. Set max words
5. Click "Add This Question"
```

**For MATCHING:**
```
1. Click "🔗 Matching" button
2. Paste left column items
3. Paste right column options
4. Enter correct answers as indices
5. Click "Add This Question"
```

**For CLASSIFICATION:**
```
1. Click "📊 Classify" button
2. Define categories (A, B, C)
3. List items to classify
4. Assign category letters
5. Click "Add This Question"
```

**For DIAGRAM LABELLING:**
```
1. Click "📐 Diagram" button
2. Paste diagram image URL
3. Enter number of blanks
4. Add correct labels
5. Click "Add This Question"
```

#### **4. Export Your Test**

After adding all questions:

**Option A: Copy to Clipboard**
```
1. Scroll to bottom
2. Click "📋 Copy to Clipboard"
3. Paste in your test file
```

**Option B: Download JSON**
```
1. Click "📥 Download JSON"
2. Save the file
3. Open and copy the content
```

---

## 💾 How to Save Tests

### Step 1: Export from Creator
- Go to `/admin/create-test`
- Create your test
- Click "Copy to Clipboard" or "Download JSON"

### Step 2: Open Your Test File
**File:** `src/data/listeningTest.js`

### Step 3: Paste the Test Data
```javascript
export const sampleListeningTests = [
  {
    // PASTE YOUR TEST DATA HERE
    testName: 'My Test',
    description: '...',
    duration: 20,
    questions: [
      // Questions from creator...
    ]
  }
]
```

---

## 📝 Example: Complete Form Filling Test

### What Students See:
```
LISTENING TEST - PART 1
Listen to the conversation and complete the form.
Write NO MORE THAN TWO WORDS for each answer.

REGISTRATION FORM

Name: ___________________  (Q1)
Email: ___________________  (Q2)
Phone: ___________________  (Q3)
Course: ___________________  (Q4)
Date: ___________________  (Q5)
```

### How to Create in UI:
```
1. Test Name: "Cafe Registration Test"
2. Click "📋 Form Fill" button
3. In "Form Template" field, paste:
   REGISTRATION FORM
   Name: _______
   Email: _______
   Phone: _______
   Course: _______
   Date: _______

4. In "Correct Answers" section:
   - Answer 1: "Sarah Johnson"
   - Answer 2: "sarah@email.com"
   - Answer 3: "0121 456 7890"
   - Answer 4: "Business English"
   - Answer 5: "March 15"

5. Max Words: 2
6. Points: 5
7. Click "Add This Question"
8. Export!
```

---

## ✅ Best Practices

### Form Completion (Gap Fill)
✅ Use consistent formatting
✅ Use `_______` or `___` for blanks
✅ Keep template clear and readable
✅ Limit answers to 2-3 words

**Example:**
```
NOT: Name:                    (bad - unclear)
YES: Name: _______            (good - clear blank)
```

### Multiple Choice
✅ Make options similar length
✅ Spread correct answer
✅ Use realistic distractors
✅ Ensure options are distinct

**Example:**
```
NOT: 
A) Coffee
B) He ordered a coffee beverage which was hot
C) Tea
D) Water

YES:
A) Coffee
B) Tea  
C) Juice
D) Water
```

### Short Answers
✅ Accept multiple variations
✅ Set reasonable word limits
✅ Check spelling variations

**Example:**
```
Question: How much was the coffee?
Answers: "$5", "five dollars", "$5.00", "five"
```

### Picture Choice
✅ Use clear, distinct images
✅ Images should be same topic
✅ Only one obviously correct

**Example of BAD:**
- Car, House, Dog, Flower (too different)

**Example of GOOD:**
- Espresso, Latte, Cappuccino, Americano (all coffee types)

---

## 🎓 Quick Reference

| Question Type | Students | Creator UI | Difficulty |
|---|---|---|---|
| Form Completion | Fill blanks | Paste template | Easy |
| MCQ Single | Choose 1 | Add 4 options | Easy |
| MCQ Multiple | Choose 2+ | Add 5 options | Medium |
| Picture Choice | Choose image | Paste 4 URLs | Easy |
| Short Answer | Type answer | List variations | Easy |
| Matching | Match columns | Pair indices | Medium |
| Classification | Assign category | Assign letters | Medium |
| Diagram Labelling | Label parts | Paste image | Hard |

---

## 🚀 Advanced Tips

### Creating Realistic Tests
1. Use Cambridge IELTS as template
2. Include authentic scenarios (cafe, university, etc.)
3. Mix question types in same test
4. Progressively increase difficulty
5. Use real images for picture choice

### Test Structure
```
PART 1: Conversation (Form completion)     - Questions 1-10
PART 2: Monologue (MCQ)                     - Questions 11-20
PART 3: Discussion (Matching)               - Questions 21-30
PART 4: Lecture (Diagram labelling)         - Questions 31-40
```

### Import Limits
- Max 40 questions per test ✅
- Max 100 words per answer ✅
- Max 5 categories for classification ✅
- Max 10 options for matching ✅

---

## ❓ FAQ

**Q: Can I edit a test after creating it?**
A: Yes! Copy the JSON, modify it, paste back into `listeningTest.js`

**Q: How many questions per test?**
A: Typically 40 (like real IELTS), but you can do any number

**Q: Can I use same image multiple times?**
A: Yes! Perfect for related pictures

**Q: What format for image URLs?**
A: Any public URL works (JPG, PNG, etc.)

**Q: Do answers need exact spelling match?**
A: For form completion yes, for short answers you can list variations

**Q: Can students hear audio?**
A: Currently form-based. Audio coming soon!

---

## 📞 Support

If you have questions about creating tests:

1. **Check Examples** in `src/data/questionTypeGuide.js`
2. **Use Templates** - Copy and customize
3. **Test the UI** - Click buttons to see options
4. **Export First** - Preview JSON before saving

---

## 🎉 You're Ready!

**Go to:** `http://localhost:5175/admin/create-test`

**Create your first test now!** 🚀

All question types supported. Easy UI. No coding needed. Enjoy!
