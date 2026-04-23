# Text Size Control Feature - O'quv Qoʻllanmasi 📖

## Xulosa (Summary)

Biz exam tizimiga **text size control** feature qo'shdik. Endi:

- **Admin tomonida** 🔧: Exam yaratishda default text size-ni (Small/Normal/Large) belgilashi mumkin
- **Student tomonida** 👨‍🎓: Listening va Reading testlarida text size-ni o'z ichiga o'zgartira oladi

---

## Admin Panel - Exam Yaratishda Text Size Belgilash

### Qadamlar:

1. **Admin dashboard**ga kirish
2. **"+ Create New Test"** tugmasini bosish
3. **Step 1: Test Information**da:
   - Test nomi, tasnifi va modullarni tanlash
   - **"Default Text Size"** bo'limiga e'tibor berish

### Text Size Variantlari:

| Size    | Qo'llaniladi                    | Miqdori |
|---------|--------------------------------|--------|
| 🔤 Small  | Katta matn xohlaydiganlar uchun  | 13-16px |
| 🔤 Normal | Standart, default              | 15-20px |
| 🔤 Large  | Yaxshi ko'rishni xohlaydiganlar | 17-28px |

### Misol:

```
Test Title: IELTS Academic Mock Test - April 2025
Description: Full test covering all modules
Modules: ☑ Listening ☑ Reading ☑ Writing

Default Text Size:
  ☑ Small  ○ Normal  ○ Large
```

---

## Student Interface - Exam Oʻylovda Text Size Oʻzgartirish

### Qayerda?

**Exam Page ning yuqori o'ng burchagida** text size selector joylashgan:

```
LISTENING/READING — Section Title    Time: 01:15:30    [A] [A] [A]  [Finish]
                                                        ↑   ↑   ↑
                                                    Small | Normal | Large
```

### Qanday Ishlashini?

1. Exam-ni ochish (Listening yoki Reading)
2. Yuqori right ko'rpa-da text size tugmalarini ko'rish
3. Istalgan size-ni bosish:
   - **Kichik A** → Matn kichikroq ko'rinadi
   - **O'rta A** → Standart size (default)
   - **Katta A** → Matn kattaroq ko'rinadi

### Real-Time O'zgarish:

- Boshlang'ich size: **Admin tomonida belgilangan default**
- O'zgarish: **Immediate** (darhol ko'rinadi)
- Saqlash: **Automatic** (o'zgarish avtomatik saqlanadi)

---

## Technical Implementation (Developers uchun)

### Backend Changes

#### 1. Exam Model (`/backend/models/Exam.js`)
```javascript
defaultTextSize: { type: String, enum: ['small', 'normal', 'large'], default: 'normal' }
```

#### 2. Exam Controller (`/backend/controllers/examController.js`)
- `createExam()`: `defaultTextSize` ni qabul qiladi
- `updateExam()`: `defaultTextSize` ni update qiladi

#### 3. API Endpoints

```
POST   /api/exams     → { title, description, modules, defaultTextSize, aiGradingEnabled, status }
GET    /api/exams/:id → { ...exam, defaultTextSize }
PUT    /api/exams/:id → { ...updates, defaultTextSize }
```

---

### Frontend Changes

#### 1. CSS Utilities (`/src/styles/text-size.css`)

```css
/* Классы */
.text-size-small   { font-size: 13px; --font-size-base: 13px; }
.text-size-normal  { font-size: 15px; --font-size-base: 15px; }
.text-size-large   { font-size: 17px; --font-size-base: 17px; }
```

#### 2. Admin Panel (`/src/pages/admin/TestCreator.jsx`)

```javascript
// State
const [defaultTextSize, setDefaultTextSize] = useState('normal')

// UI
<div style={{ display: 'flex', gap: '8px' }}>
  {['small', 'normal', 'large'].map(size => (
    <label key={size}>
      <input type="radio" value={size} checked={defaultTextSize === size} 
             onChange={(e) => setDefaultTextSize(e.target.value)} />
      {size}
    </label>
  ))}
</div>

// Save
await api('/exams', 'POST', { 
  title, description, modules, 
  defaultTextSize,  // ← YANGI!
  aiGradingEnabled, 
  status 
})
```

#### 3. Exam Pages

##### IELTSExamPage (Listening) - `/src/pages/IELTSExamPage.jsx`

```javascript
// State
const [textSize, setTextSize] = useState('normal')

// Load from exam
.then(data => {
  setExam(data)
  setTextSize(data.defaultTextSize || 'normal')  // ← YANGI!
})

// UI in header
<div style={{ display: 'flex', gap: '6px' }}>
  {['small', 'normal', 'large'].map(size => (
    <button onClick={() => setTextSize(size)}>A</button>
  ))}
</div>

// Apply class
<div className={`ip-root text-size-${textSize}`}>
```

##### StudentReadingPage - `/src/pages/StudentReadingPage.jsx`

```javascript
// State
const [textSize, setTextSize] = useState('normal')

// Load from exam
setTextSize(data.defaultTextSize || 'normal')

// UI va class - IELTSExamPage kabi
<div className={`ielts-reading-simulation text-size-${textSize}`}>
```

---

## File Changes Summary

### Backend
- ✅ `backend/models/Exam.js` - Model updated
- ✅ `backend/controllers/examController.js` - Controller updated

### Frontend
- ✅ `src/styles/text-size.css` - New CSS utilities
- ✅ `src/pages/admin/TestCreator.jsx` - Admin UI + state
- ✅ `src/pages/IELTSExamPage.jsx` - Listening test UI + state
- ✅ `src/pages/StudentReadingPage.jsx` - Reading test UI + state

---

## Testing Checklist

### Admin Panel Testing:

- [ ] **Create exam** va `defaultTextSize` ko'rsatiladi
- [ ] **Small** tanlansa, exam saqlanadi (`defaultTextSize: 'small'`)
- [ ] **Normal** tanlansa, exam saqlanadi (`defaultTextSize: 'normal'`)
- [ ] **Large** tanlansa, exam saqlanadi (`defaultTextSize: 'large'`)
- [ ] **Edit exam** - eski `defaultTextSize` load bo'ladi
- [ ] **Publish** - `defaultTextSize` MongoDB-da saqlanadi

### Student Test Taking:

#### Listening Test:
- [ ] Exam open qilinsa, header-da text size selektori ko'rinadi
- [ ] Text size buttons clickable va o'zgarish darhol ko'rinadi
- [ ] **Small**: Matn kichikroq
- [ ] **Normal**: Standart o'lcham
- [ ] **Large**: Matn kattaroq
- [ ] Page refresh qilinsa ham selected size saqlanadi

#### Reading Test:
- [ ] Exam open qilinsa, header-da text size selektori ko'rinadi
- [ ] Passage va questions text size o'zgaradi
- [ ] All buttons responsive

---

## CSS Variables Reference

```css
/* Defined in text-size.css */
--font-size-base:  13px/15px/17px   (body, question text, passage)
--font-size-lg:    14px/16px/18px   (instructions, labels)
--font-size-xl:    15px/18px/20px   (section headers)
--font-size-2xl:   16px/20px/22px   (main titles)
--font-size-3xl:   18px/24px/28px   (large titles)
```

---

## Troubleshooting

### Problem: Text size tugmalari ko'rinmayapti

**Solution**: 
- `text-size.css` import qilinganini tekshiring
- Browser cache clear qiling (Ctrl+Shift+Del)

### Problem: Text size o'zgarish tugmasi bosilgan lekin o'zgarish ko'rinmayapti

**Solution**:
- `className="ip-root text-size-${textSize}"` tekshiring
- `text-size.css` fayli mavjudligini tekshiring
- Console errors tekshiring

### Problem: Admin paneldan default text size saqlanmayapti

**Solution**:
- Backend error logs tekshiring
- MongoDB connection tekshiring
- API response-ni check qiling

---

## Future Enhancements 🚀

1. **User preferences** - Student o'z default text size-ni save qilishi mumkin
2. **Per-section text size** - Har bir section uchun boshqacha size
3. **Line spacing control** - Matn orasidagi fasilani o'zgartirish
4. **Color contrast** - Ko'z shikastlikni hisobga olish (dark mode, high contrast)

---

## Questions?

Agar savollar bo'lsa yoki xatolik topilsa, admin-ga xabar bering!

**Ishlab Chiquvchilar**: GitHub Copilot
**Sana**: 24 Aprelya 2026
