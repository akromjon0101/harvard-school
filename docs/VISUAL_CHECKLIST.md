# Visual Checklist – What Changed and How to Verify

## ✅ CHANGES YOU SHOULD SEE IN BROWSER

### 1. **Admin Add Listening Page** (http://localhost:5175/admin/add-listening)

#### ✨ New Features to Test:

**A) Load Sample Test**
- [ ] Click "📋 Load Sample Test" button at the top
- [ ] All form fields should auto-fill with Cambridge IELTS Test 4 data:
  - Test Name: "Cambridge IELTS 4 Listening Test"
  - Description: "Official practice test with picture choice, MCQ, form completion..."
  - Duration: 30 minutes
  - Questions list should show 10+ questions with different types
  
**B) Question Type Dropdown**
- [ ] Click "Choose Question Type" select dropdown
- [ ] Should show 16 different question types (was probably showing blank before):
  - 1️⃣ Multiple Choice - Single Answer
  - 1️⃣ Multiple Choice - Multiple Answers
  - 2️⃣ Matching
  - 3️⃣ Map Labelling
  - 3️⃣ Plan Labelling
  - 3️⃣ Diagram Labelling
  - 4️⃣ Form Completion
  - 4️⃣ Note Completion
  - 4️⃣ Table Completion
  - 4️⃣ Flow-chart Completion
  - 5️⃣ Sentence Completion
  - 6️⃣ Short Answer
  - 7️⃣ Diagram Completion
  - 8️⃣ Picture Choice
  - 9️⃣ Classification
  - etc.

**C) Add Question with Validation**
- [ ] Try adding a Picture Choice question without uploading images
  - Result: Should show error "❌ Picture choice requires at least 2 images"
- [ ] Try adding a Form Completion without "___" in template
  - Result: Should show error "❌ Template must contain '___' placeholders"
- [ ] Add a valid MCQ with 2+ options and select correct answer
  - Result: Should show green success message "✓ Question added!"

**D) Preview Modal**
- [ ] Click "👁️ Preview" button when adding a question
- [ ] Modal should show:
  - **For Picture Choice:** Grid with 4 images labeled A, B, C, D
  - **For MCQ:** Numbered options (A, B, C, D...)
  - **For Form Completion:** Template with "___" shown as input fields
  - **For Diagram Labelling:** Image display with numbered answer inputs
  - **For Matching:** Left-side items and right-side options
  - **For Classification:** Items and category list

---

## 📊 DETAILED CHANGE LOG

### File: `src/data/listeningTest.js`
**What changed:**
- Replaced old sample test with 4 new Cambridge IELTS-style test templates
- Each test now has proper question numbering (1-40 across sections)
- Questions include real IELTS question types with correct structure

**How to verify:**
```
Click "Load Sample Test" → Check if questions load with proper numbering (Q1, Q2, Q3...)
```

### File: `src/pages/admin/AddListening.jsx`
**What changed:**
- Added type-specific validation in `addQuestion()` function
- Enhanced preview modal to show all 10+ question types
- Added success message when question is added
- Added comprehensive error messages in English + Uzbek

**How to verify:**
```
Try adding invalid questions → Check for error messages
Click "Preview" → Check if modal shows question correctly
Try adding valid question → Check for "✓ Question added!" message
```

### File: `src/components/admin/QuestionTypeComponents.jsx`
**What changed:**
- Added image upload support to `CompletionForm` (for diagram/table questions)
- Added `diagramImage` state to store uploaded image
- Added `handleDiagramUpload` function to handle image selection

**How to verify:**
```
Select "Form Completion" or "Diagram Completion" question type
→ Should see "Upload diagram/table image" button
→ Click and upload an image
→ Image should show "Image uploaded: [filename]"
```

### File: `src/styles/admin.css`
**What changed:**
- Added 100+ lines of CSS for:
  - Modal preview styling (`.modal-preview`, `.preview-card`)
  - Picture grid preview (`.picture-grid-admin`, `.preview-pic`, `.opt-label`)
  - Form preview (`.preview-form`)
  - Matching/Classification preview (`.preview-matching`, `.preview-classification`)
  - Diagram image styling (`.preview-diagram img`)

**How to verify:**
```
Click "Preview" button → Check if modal looks clean and professional
Check image display in preview → Should be properly sized and centered
```

---

## 🚀 HOW TO THOROUGHLY TEST

### Test 1: Load Sample Test
```
1. Go to http://localhost:5175/admin/add-listening
2. Click "📋 Load Sample Test" button
3. Check:
   ✓ Test name filled in
   ✓ Description filled in
   ✓ Questions list populated with 10+ items
   ✓ Each question shows number, type, and preview thumbnail (for picture-choice)
4. Expected: Page should show sample test with all fields auto-filled
```

### Test 2: Question Type Dropdown
```
1. Scroll down to "Choose Question Type" select
2. Click on dropdown
3. Check:
   ✓ Shows 16 different question types
   ✓ Types have emoji indicators (1️⃣, 2️⃣, 3️⃣, etc.)
   ✓ Can select each type without page breaking
4. Expected: Dropdown should show all types clearly
```

### Test 3: Add Picture Choice Question
```
1. Select "8️⃣ Picture Choice" from question type
2. Enter question text: "Which image shows a car?"
3. Click "Choose Images" button (4 times to upload 4 images)
4. Select correct answer (e.g., "Image 1 is correct")
5. Click "➕ Add Picture Choice"
6. Check:
   ✓ Message "✓ Question added!" appears in green
   ✓ Question appears in questions list below
   ✓ List shows picture thumbnails for the 4 images
7. Expected: Question should be added without errors
```

### Test 4: Add Invalid Question (Validation Test)
```
1. Select "8️⃣ Picture Choice"
2. Enter question text
3. Upload only 1 image
4. Click "➕ Add Picture Choice"
5. Check:
   ✓ Error message appears: "❌ Picture choice requires at least 2 images"
   ✓ Question is NOT added to list
6. Expected: Validation should prevent invalid questions
```

### Test 5: Preview Modal
```
1. Select "1️⃣ Multiple Choice - Single Answer"
2. Enter question text and 3+ options
3. Click "👁️ Preview" button
4. Check:
   ✓ Modal opens with semi-transparent overlay
   ✓ Shows question text and options
   ✓ Can close modal with X button or by clicking outside
5. Expected: Modal should display question exactly as students will see it
```

---

## 📱 RESPONSIVE DESIGN CHECKS

### Desktop (1200px+)
- [ ] Question type select is visible and clickable
- [ ] Preview modal is centered on screen
- [ ] Questions list shows thumbnails in a grid
- [ ] Form inputs have proper spacing

### Tablet (768-1200px)
- [ ] All elements responsive
- [ ] Preview modal still readable
- [ ] No text overflow

### Mobile (< 768px)
- [ ] Question type select still visible
- [ ] Form fields stack vertically
- [ ] Preview modal takes up 90% width
- [ ] Buttons have touch-friendly sizes (44px+ height)

---

## 🐛 TROUBLESHOOTING

### "Nothing changed" / "Page still blank"
**Solution:**
1. Hard refresh browser: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
2. Check terminal: Make sure `npm run dev` is still running
3. Check browser console: `Cmd + Option + J` (Mac) or `F12` (Windows)
4. Look for red errors in the console

### "Questions not loading"
**Solution:**
1. Check if `src/data/listeningTest.js` exists and has content
2. Make sure `import sampleListeningTests from '../../data/listeningTest'` is in AddListening.jsx
3. Check browser console for import errors

### "Preview modal not showing"
**Solution:**
1. Check if CSS file is imported: `import '../../styles/admin.css'` in AddListening.jsx
2. Check if `.modal-overlay` and `.modal-content` classes exist in admin.css
3. Open DevTools → Inspect preview button → check if it triggers the modal

### "Images not uploading"
**Solution:**
1. Check if `ImageUploader` component exists in `src/components/admin/`
2. Verify image size is < 50MB (if upload limit exists)
3. Check browser console for specific error messages
4. Try uploading a different image format (JPG, PNG)

---

## 📋 CHECKLIST FOR COMPLETION

After testing all above, mark these as complete:

- [ ] Sample test loads with "Load Sample Test" button
- [ ] Question type dropdown shows 16 types
- [ ] Can add Picture Choice question with validation
- [ ] Can add Form Completion with template validation
- [ ] Preview modal displays correctly for all question types
- [ ] Success message "✓ Question added!" appears
- [ ] Error messages prevent invalid questions
- [ ] Responsive design works on mobile/tablet
- [ ] No console errors in DevTools
- [ ] All features work as expected

**Once all ✓:** You can proceed to implement Phase 1 (Backend) from IMPLEMENTATION_CHECKLIST.md

---

## 🎯 NEXT STEPS

After verifying these changes work:

1. **Backend Implementation** (Week 1-2)
   - Set up User schema with password hashing
   - Implement JWT authentication
   - Create test approval status field
   - Build all 17 API endpoints

2. **Separate Admin/User Logins** (Week 2)
   - Create `/login` and `/admin/login` pages
   - Implement role-based access control
   - Add protected routes

3. **Image Upload System** (Week 3)
   - Implement `/api/upload` endpoint
   - Store images locally or in cloud (AWS S3, Cloudinary)
   - Display images in student exam interface

4. **Production Ready** (Week 4)
   - Security audit (password hashing, CORS, JWT validation)
   - Performance optimization
   - Deployment to production server

---

**Questions?** Check browser console (F12) for specific error messages, and share them here for debugging.
