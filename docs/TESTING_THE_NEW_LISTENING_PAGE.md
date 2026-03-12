# 🧪 HOW TO TEST THE NEW LISTENING PAGE

## ⚡ QUICK START

```bash
# 1. Hard refresh browser
Cmd + Shift + R

# 2. Go to student listening test
http://localhost:5175/dashboard

# 3. Click "Listening" → "Start Test"
```

---

## 📸 WHAT YOU'LL SEE

### **Screen 1: Test Selection**
```
Available Listening Tests

[Test Card] [Test Card] [Test Card]
Name: IELTS Listening
Description: Official practice test
Button: "Start Test"
```

### **Screen 2: Test Introduction**
```
╔═══════════════════════════════╗
║ IELTS Listening - Test 1      ║
║ Duration: 30 minutes          ║
║ There are 4 sections in this  ║
║ test.                         ║
║                               ║
║ [▶ Start Listening Test]      ║
╚═══════════════════════════════╝
```

### **Screen 3: Active Test (NEW DESIGN!) 🎯**

#### Top Header:
```
┌─────────────────────────────────────────────────┐
│ [SECTION 1/4] ⏱ 00:30:00        [FINISH]     │
└─────────────────────────────────────────────────┘
```

- 🔴 Red "SECTION 1/4" badge (left)
- ⏱️ Blue timer (center-right)
- 🔴 Red "FINISH" button (right)

#### Audio Section:
```
┌─────────────────────────────────────────────────┐
│ 🎧 You will hear the recording for SECTION 1   │
│    ONCE ONLY. Use the time to read questions.  │
│                                                 │
│    ╔═════════════════════════════════════╗     │
│    ║ ⏯ || ⊙ ▬▬▬▬▬▬▬▬▬▬▬▬▬ 🔊 100%    ║     │
│    ╚═════════════════════════════════════╝     │
└─────────────────────────────────────────────────┘
```

- 📝 Official IELTS instruction text
- 🎵 Standard audio player (play, pause, volume)
- Stays at top when scrolling ✅

#### Main Content Area (Two Columns):
```
┌────────────────────────┬──────────────────────────┐
│                        │                          │
│   QUESTIONS 1-5        │  ✍️ ANSWER SHEET - S1  │
│   ════════════════     │  ═════════════════════  │
│                        │                          │
│  1️⃣ What is the        │  1  [ A ]  [ B ] [ C ]  │
│     telephone          │                          │
│     number?            │  2  ___________________ │
│                        │                          │
│  [Small images]        │  3  [ A ]  [ B ] [ C ]  │
│  A  B  C               │                          │
│                        │  4  ___________________ │
│  2️⃣ What type of      │                          │
│     accommodation?     │  5  ___________________ │
│                        │                          │
│  A) Hotel              │                          │
│  B) Hostel             │  Write your answers in  │
│  C) Apartment          │  CAPITAL LETTERS        │
│                        │                          │
│  3️⃣ How many rooms?   │                          │
│                        │                          │
│  4️⃣ Budget?            │                          │
│                        │                          │
│  5️⃣ Name?              │                          │
│                        │                          │
└────────────────────────┴──────────────────────────┘
```

**LEFT PANEL (Questions):**
- 📋 Questions to read
- 🔵 Blue question numbers
- 📸 Picture thumbnails (if applicable)
- 🔤 Multiple choice options
- 📌 Scrollable if more than 5 questions
- White background

**RIGHT PANEL (Answer Sheet):**
- 📄 Cream/off-white paper color
- 🟫 Gold/brown border (like real IELTS)
- ✍️ Underlines for writing answers
- 🔵 Radio buttons for MCQ
- 📝 Professional answer sheet appearance
- 📌 Scrollable
- ⚠️ Says "Write in CAPITAL LETTERS"

---

## 🖱️ HOW TO USE IT

### **Answering Multiple Choice (Picture Choice)**

1. **See on LEFT panel:** 
   ```
   1️⃣ Which image matches?
   [Picture A] [Picture B] [Picture C]
   ```

2. **Do on RIGHT panel:**
   ```
   Click the circle for your choice:
   
   1  [ A ]  [ B ]  [ C ]  ← Click one
        ○     ○      ○
   ```

3. **What happens:**
   - Circle becomes blue ✓
   - Answer is saved
   - Circle is filled in

### **Answering Short Answer**

1. **See on LEFT panel:**
   ```
   2️⃣ How many students attended?
   ```

2. **Do on RIGHT panel:**
   ```
   2  _______________________  ← Click here to type
   ```

3. **What happens:**
   - Cursor appears
   - Type your answer: `25`
   - Auto-converts to: `25` (uppercase)
   - Underline shows you've answered

### **Answering Matching**

1. **See on LEFT panel:**
   ```
   3️⃣ Match descriptions
   A) Teacher
   B) Engineer
   C) Doctor
   ```

2. **Do on RIGHT panel:**
   ```
   3  [Select option ▼]  ← Click dropdown
   ```

3. **Options appear:**
   ```
   A) Teacher
   B) Engineer
   C) Doctor
   ```

4. **Click selection:**
   ```
   3  [Teacher ▼]  ← Shows your choice
   ```

### **Moving Between Questions**

- **Scroll UP/DOWN** in panels to see more questions
- Both panels scroll together (linked)
- Questions panel shows questions 1-5
- Answer sheet shows answers 1-5

### **Moving to Next Section**

1. **When done with Section 1:**
   ```
   ┌─────────────────────────────┐
   │  [NEXT SECTION (Part 2) →]  │
   └─────────────────────────────┘
   ```

2. **Click button:**
   - Questions change to Section 2
   - Answer sheet updates to Section 2
   - Audio player resets
   - Timer continues

### **Submitting Test**

1. **After Section 4:**
   ```
   ┌──────────────────────────┐
   │     [SUBMIT TEST]        │
   └──────────────────────────┘
   ```

2. **Click button:**
   - All answers recorded
   - Test marked as complete
   - See confirmation page

---

## 🎯 TESTING SCENARIOS

### Scenario 1: Multiple Choice
```
WHAT YOU'LL TEST:
✅ Can see 3 options (A, B, C)
✅ Can click radio button
✅ Button turns blue when selected
✅ Only 1 can be selected at a time
✅ Answer is recorded
```

### Scenario 2: Short Answer
```
WHAT YOU'LL TEST:
✅ Can click on underline
✅ Cursor appears
✅ Can type answer
✅ Text appears as you type
✅ Auto-capitalizes (try lowercase)
✅ Max 80 characters
```

### Scenario 3: Text Matching
```
WHAT YOU'LL TEST:
✅ Dropdown appears
✅ Can click dropdown
✅ Options show
✅ Can select one
✅ Selection stays
✅ Can change selection
```

### Scenario 4: Panel Scrolling
```
WHAT YOU'LL TEST:
✅ Scroll left panel (questions)
✅ Scroll right panel (answers)
✅ Both panels work independently
✅ Headers stay at top
✅ Questions remain visible
✅ Answer sheet remains visible
```

### Scenario 5: Audio Player
```
WHAT YOU'LL TEST:
✅ Audio player visible at top
✅ Play button works
✅ Pause button works
✅ Volume slider works
✅ Progress bar works
✅ Stays at top when scrolling
```

### Scenario 6: Timer
```
WHAT YOU'LL TEST:
✅ Timer shows 30:00
✅ Timer counts down
✅ Timer is blue
✅ Updates every second
✅ Visible in header
```

### Scenario 7: Section Navigation
```
WHAT YOU'LL TEST:
✅ Section 1/4 shows at start
✅ Click NEXT → Section 2/4
✅ Click NEXT → Section 3/4
✅ Click NEXT → Section 4/4
✅ Click SUBMIT → Test complete
✅ Questions change per section
```

---

## 🎨 VISUAL CHECKS

Make sure you see:

### Colors:
- ✅ Header: **Dark gray/black** (#1a1a1a)
- ✅ Section badge: **Red** (#d32f2f)
- ✅ Timer: **Blue** (#1976d2)
- ✅ Question numbers: **Blue circles**
- ✅ Answer sheet: **Cream/off-white** (#fffef0)
- ✅ Answer sheet border: **Gold/brown** (#c9a961)
- ✅ NEXT button: **Blue**
- ✅ SUBMIT button: **Green**

### Layout:
- ✅ **Two columns** side-by-side (desktop)
- ✅ **Left panel**: Questions
- ✅ **Right panel**: Answer sheet
- ✅ **Audio player**: Sticky at top
- ✅ **Footer buttons**: Centered
- ✅ **Responsive**: Stacks on mobile

### Typography:
- ✅ Headers in **bold**
- ✅ Questions readable
- ✅ Answer inputs visible
- ✅ Instruction text clear
- ✅ "CAPITAL LETTERS" shown

### Functionality:
- ✅ **Play audio**
- ✅ **Click answers**
- ✅ **Type in fields**
- ✅ **Select dropdowns**
- ✅ **Scroll panels**
- ✅ **Go to next section**
- ✅ **Submit test**

---

## 🐛 TROUBLESHOOTING

### Problem: Old design still showing

**Solution:**
```bash
# Hard refresh
Cmd + Shift + R

# Clear cache
Settings → Privacy → Clear browsing data → All time
```

### Problem: Right panel not showing

**Solution:**
- Maximize browser window (need space for 2 columns)
- On mobile: scroll down to see answer sheet
- Check that CSS file loaded (open DevTools)

### Problem: Audio player not working

**Solution:**
- Check browser console (F12) for errors
- Make sure audio file path is correct
- Try different audio format (MP3)

### Problem: Answers not saving

**Solution:**
- Check browser console for JavaScript errors
- Verify state management working
- Try submitting test to see answers recorded

### Problem: Layout looks broken

**Solution:**
```bash
# Check if CSS file loaded
1. Open DevTools (F12)
2. Go to "Elements"
3. Check if listening-ielts-style.css is imported
4. If not, hard refresh again

# Verify CSS path
File should be: src/styles/listening-ielts-style.css
```

---

## ✅ COMPLETION CHECKLIST

After testing, check off:

- [ ] Page loads without errors
- [ ] Header shows "SECTION 1/4"
- [ ] Timer shows and counts down
- [ ] Audio player visible at top
- [ ] Questions visible on LEFT panel
- [ ] Answer sheet visible on RIGHT panel
- [ ] Can answer MCQ (click radio buttons)
- [ ] Can answer short answers (type text)
- [ ] Can answer matching (select dropdown)
- [ ] Answers are recorded
- [ ] Can move to next section
- [ ] Can submit test
- [ ] Layout is responsive (try mobile size)
- [ ] Colors match IELTS style
- [ ] No console errors (F12)

---

## 🎬 SAMPLE TEST WALKTHROUGH

**Step 1: Navigation**
```
→ Click "Listening" in menu
→ See test list
→ Click "Start Test"
```

**Step 2: Introduction**
```
→ See test name
→ See "Start Listening Test" button
→ Click button
```

**Step 3: Section 1**
```
→ Audio player appears
→ "You will hear ONCE only" text
→ Questions appear on LEFT (1-5)
→ Answer sheet on RIGHT (blank)
→ Timer: 00:30:00
```

**Step 4: Answer Question 1**
```
→ READ on left: "What is the telephone number?"
→ CLICK on right: [ A ]  [ B ] [ C ]
→ Select answer
→ Answer fills in blue
```

**Step 5: Answer Question 2**
```
→ READ on left: "How many students?"
→ CLICK on right: ________________
→ Type: "25"
→ Shows: "25" (auto-uppercase)
```

**Step 6: Next Section**
```
→ Scroll down
→ Click "[NEXT SECTION (Part 2) →]"
→ Questions 6-10 appear
→ Answer sheet resets
→ Section shows "2/4"
```

**Step 7: Complete All Sections**
```
→ Repeat for Sections 3 and 4
→ Each section has its own audio
```

**Step 8: Submit**
```
→ After Section 4
→ Click "[SUBMIT TEST]"
→ See "Test Submitted!" confirmation
```

---

## 💡 PRO TIPS

1. **Resize window** to see responsive design
   - Large desktop
   - Tablet (medium width)
   - Mobile (small width)

2. **Open DevTools** (F12) to see:
   - HTML structure
   - CSS classes
   - JavaScript console
   - No errors should appear

3. **Test keyboard:**
   - Tab to move between fields
   - Enter to submit
   - Arrow keys to scroll

4. **Check print style:**
   - Right-click → Print
   - Should only show questions and answers
   - Should not show buttons/timer

---

## 🎉 YOU'RE READY!

**When you see:**
1. ✅ Questions on LEFT
2. ✅ Answer sheet on RIGHT
3. ✅ Professional IELTS styling
4. ✅ Everything working smoothly

**Then:** 🚀 **Success!** Your listening page is now professional and IELTS-authentic!
