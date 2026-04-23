# 📱 Text Size Control - Qisqa Batafsil

## ✅ Nima Qilingan?

Talabalar Listening va Reading testlarida **text sizeni oʻzgartira** oladi:

```
📖 Listening/Reading Test
┌─────────────────────────────────┐
│ Header: [🎧] LISTENING          │
│         Time: 1:30:45           │
│         [A] [A] [A] [Finish] ←← Text Size │
└─────────────────────────────────┘
```

Admin exam yaratishda default size-ni belgilaydi (Small/Normal/Large).

---

## 🔧 Admin Panel - Exam Yaratishda

**Step 1: Test Information**da:

```
Test Title: IELTS Mock Test
Description: ...
Modules: ✓ Listening ✓ Reading

Default Text Size: ○ Small ● Normal ○ Large
```

**Saqlash**: Exam MongoDB-da `defaultTextSize` bilan saqlanadi.

---

## 👨‍🎓 Student Side - Test Oʻylovda

### Qayerda Text Size?

**Exam page header-ning right burchagi:**
```
Time: 01:15:30 │ [A] [A] [A] │ Finish
               ↑   ↑   ↑
            Small Normal Large
```

### Qanday Ishlaydi?

1. Tugma bo'l → Text kichik/katta bo'lib ko'rinadi
2. Darhol o'zgaradi (reload kerak emas)
3. Avtomatik saqlanadi

---

## 📝 Maʼlumot Qayerda Saqlanadi?

| Qayerda | Ma'lumot | Format |
|---------|----------|--------|
| MongoDB | `exam.defaultTextSize` | 'small'\|'normal'\|'large' |
| Frontend | localStorage | Student text size tanlov |
| CSS | text-size.css | Variables har size uchun |

---

## 📋 Modified Files

```
Backend:
  ✅ /backend/models/Exam.js
  ✅ /backend/controllers/examController.js

Frontend:
  ✅ /src/styles/text-size.css (NEW)
  ✅ /src/pages/admin/TestCreator.jsx
  ✅ /src/pages/IELTSExamPage.jsx (Listening)
  ✅ /src/pages/StudentReadingPage.jsx (Reading)
```

---

## 🎨 Text Sizes

| Size   | Qo'llash | px |
|--------|---------|-----|
| Small  | Ko'p matn xohlaganlar | 13-16 |
| Normal | Standart (default) | 15-20 |
| Large  | Yaxshi ko'rishni xohlaganlar | 17-28 |

---

## ✨ Features

✅ Admin default size belgilashadi  
✅ Student test oʻylovda o'zgartiradi  
✅ Listening + Reading qoʻllanadi  
✅ Real-time o'zgarish (animation yo'q, darhol)  
✅ CSS variables bilan responsive  
✅ localStorage bilan auto-save  

---

## 🚀 Testlash

```
Admin:
  • Exam create → "Large" tanlash → Publish
  • Exam edit → Large saved bo'lganini check

Student:
  • Exam open → Header-da text size tugmalari ko'rinadi
  • Tugma bosilsa → Matn size o'zgaradi
  • Refresh → Size saqlanadi
```

---

## 📞 Support

Muammo bo'lsa:
- Browser cache clear: Ctrl+Shift+Del
- Console errors check: F12 → Console
- Server logs check: `docker logs backend`

---

**Done! ✅ Feature ready production-da ishlatish uchun.**
