# 🎨 Text Size Feature - Visual Guide

## Admin Panel - Exam Creation

```
┌──────────────────────────────────────────────────────────────┐
│  Test Creator - Step 1: Test Information                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Test Title *                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ IELTS Academic Mock Test - April 2025                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Description (optional)                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Full Academic mock — covers all 3 sections           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Which sections does this test include?                      │
│  ┌────────────┬────────────┬────────────┬────────────┐      │
│  │ 🎧 Listen  │ 📖 Reading │ ✍️ Writing │ 🎤 Speaking│      │
│  │ ☑ Selected │ ☑ Selected │ ☑ Selected │ ☐ Not sel  │      │
│  └────────────┴────────────┴────────────┴────────────┘      │
│                                                              │
│  🤖 AI Auto-Grading                                         │
│  ┌─────────────────────────────────┐                        │
│  │ Enable AI to check writing &    │ [AI OFF]               │
│  │ speaking automatically          │                        │
│  └─────────────────────────────────┘                        │
│                                                              │
│  🔤 Default Text Size                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Set the default font size for all students.           │ │
│  │ Students can adjust their own text size while         │ │
│  │ taking the test. This is the starting size they'll    │ │
│  │ see.                                                  │ │
│  │                                                        │ │
│  │   [● Small]  [○ Normal]  [○ Large]  ← NEW FEATURE     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [← Previous]                          [Next: Add Questions →│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Student Exam Page - Listening

### Header with Text Size Selector

```
┌──────────────────────────────────────────────────────────────┐
│ 🎧 LISTENING — Part 1      Q 1–10      01:30:45   A A A Finish
│                                         ↑ ↑ ↑
│                                    Small Normal Large
└──────────────────────────────────────────────────────────────┘
```

### Before/After Text Size

```
TEXT SIZE: SMALL
┌─────────────────────────────────┐
│ Instructions: Write NO MORE     │
│ THAN TWO WORDS.                 │
│                                 │
│ Question 1: What is the main    │
│ topic discussed?                │
└─────────────────────────────────┘

TEXT SIZE: NORMAL (DEFAULT)
┌──────────────────────────────────────────┐
│ Instructions: Write NO MORE              │
│ THAN TWO WORDS AND/OR A NUMBER.         │
│                                          │
│ Question 1: What is the main             │
│ topic discussed in the                   │
│ conversation?                            │
└──────────────────────────────────────────┘

TEXT SIZE: LARGE
┌────────────────────────────────────────────────────────────┐
│ Instructions: Write NO MORE THAN TWO WORDS                │
│ AND/OR A NUMBER.                                           │
│                                                            │
│ Question 1: What is the main topic discussed              │
│ in the conversation?                                       │
└────────────────────────────────────────────────────────────┘
```

---

## Student Exam Page - Reading

### Header with Text Size Selector

```
┌──────────────────────────────────────────────────────────────┐
│ IELTS Reading — Test Name                                    │
│                          Time: 00:45:20  A A A  Finish       │
│                                          ↑ ↑ ↑
│                                   Small Normal Large
│ 22/40 answered                                               │
└──────────────────────────────────────────────────────────────┘
```

### Passage & Questions Layout

```
┌──────────────────────────────────────────────────────────────┐
│  SMALL TEXT                │ QUESTIONS (Right Pane)          │
│  ┌─────────────────────┐   │ ┌──────────────────────────────┐│
│  │ PASSAGE TITLE       │   │ │ Q1: True / False / Not Given │
│  │                     │   │ │ Statement: ...               │
│  │ The passage content │   │ │ ◉ True ○ False ○ Not Given   │
│  │ appears very small, │   │ │                              │
│  │ fits more text per  │   │ │ Q2: Multiple Choice          │
│  │ view, harder to     │   │ │ Which of the following...    │
│  │ read for many.      │   │ │ ☐ Option A ☐ Option B       │
│  │                     │   │ │                              │
│  └─────────────────────┘   │ └──────────────────────────────┘│
│                            │                                 │
│ NORMAL TEXT (DEFAULT)      │ QUESTIONS                       │
│ ┌──────────────────────┐   │ ┌──────────────────────────────┐│
│ │ PASSAGE TITLE        │   │ │ Q1: True / False / Not Given │
│ │                      │   │ │ The company was established  │
│ │ The passage content  │   │ │ in 1950.                     │
│ │ appears at standard  │   │ │ ◉ True ○ False ○ Not Given   │
│ │ size, perfect for    │   │ │                              │
│ │ most readers.        │   │ │ Q2: Multiple Choice          │
│ │                      │   │ │ What is the primary focus... │
│ │                      │   │ │ ☐ Technology ☐ History      │
│ │ ┌─────────────────┐  │   │ │                              │
│ │ │ [MORE TEXT]     │  │   │ └──────────────────────────────┘│
│ │ └─────────────────┘  │   │                                 │
│ └──────────────────────┘   │                                 │
│                            │                                 │
│ LARGE TEXT                 │ QUESTIONS                       │
│ ┌────────────────────────┐ │ ┌──────────────────────────────┐│
│ │ PASSAGE TITLE          │ │ │ Q1: True / False / Not Given │
│ │                        │ │ │ The company was established  │
│ │ The passage content    │ │ │ in 1950 as a private firm.   │
│ │ appears VERY large,    │ │ │ ◉ True ○ False ○ Not Given   │
│ │ easier to read, less   │ │ │                              │
│ │ text visible per view. │ │ │ Q2: Multiple Choice          │
│ │                        │ │ │ What is the primary focus    │
│ │                        │ │ │ of the passage?              │
│ │                        │ │ │ ☐ Technology                 │
│ │                        │ │ │ ☐ History                    │
│ │ ┌──────────────────┐   │ │ │                              │
│ │ │ [CONT...]        │   │ │ └──────────────────────────────┘│
│ │ └──────────────────┘   │ │                                 │
│ └────────────────────────┘ │                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## Button States

### Text Size Button - Inactive (Not Selected)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  A  Small   │  │  A  Normal  │  │  A  Large   │
├─────────────┤  ├─────────────┤  ├─────────────┤
│ background: │  │ background: │  │ background: │
│   #f8fafc   │  │   #f8fafc   │  │   #f8fafc   │
│ border-color│  │ border-color│  │ border-color│
│   #e2e8f0   │  │   #e2e8f0   │  │   #e2e8f0   │
│ text-color: │  │ text-color: │  │ text-color: │
│   #64748b   │  │   #64748b   │  │   #64748b   │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Text Size Button - Active (Selected)

```
┌─────────────┐
│  A Normal   │  ← SELECTED
├─────────────┤
│ background: │
│   #dbeafe   │  (Light blue)
│ border-color│
│   #3b82f6   │  (Blue)
│ text-color: │
│   #1e40af   │  (Dark blue)
│ font-weight │
│    600      │  (Bold)
└─────────────┘
```

---

## Font Size Scaling Table

| Element | Small | Normal | Large |
|---------|-------|--------|-------|
| Body text | 13px | 15px | 17px |
| Labels | 14px | 16px | 18px |
| Subtitles | 15px | 18px | 20px |
| Section titles | 16px | 20px | 22px |
| Main titles | 18px | 24px | 28px |

---

## Responsive Behavior

### Mobile/Tablet (< 768px)
- Text size selector still visible in header
- Might be compact: `[A] [A] [A]` instead of buttons
- Tap to change

### Desktop (≥ 768px)
- Full-sized buttons with labels
- Hover effects
- Smooth transition

---

## Animation & Transitions

```javascript
// CSS Transition
transition: all 0.2s;

// Changes:
- Background color (smooth)
- Border color (smooth)
- Text color (smooth)
- No page reload
- No flickering
```

---

## Accessibility Features

✅ **Keyboard Navigation**
- Tab to navigate between size buttons
- Enter/Space to select

✅ **Screen Readers**
- `title` attribute on buttons
- `aria-label` on selectors

✅ **Color Contrast**
- Active state: #1e40af on #dbeafe (WCAG AAA)
- Inactive state: #64748b on #f8fafc (WCAG AA)

✅ **Visual Indicators**
- Clear active state (blue background)
- Border color change
- Font weight change

---

## User Experience Flow

```
1. Admin Creates Exam
   ↓
   Selects "Default Text Size: Large"
   ↓
   Exam Saved (MongoDB: defaultTextSize: 'large')
   ↓

2. Student Starts Test
   ↓
   Loads exam → Text appears in LARGE size (admin's choice)
   ↓
   Can see text size selector in header
   ↓
   Student clicks [Small] → Text becomes small (immediately)
   ↓
   Preference saved locally → Next view uses "Small"
   ↓
   Test continues with preferred size
   ↓
   Submit test
   
3. After Test
   ↓
   Results page shows text in student's preferred size
   ↓
   Preference persists across sessions (localStorage)
```

---

**Visual Design Complete! 🎨 Ready for User Testing**
