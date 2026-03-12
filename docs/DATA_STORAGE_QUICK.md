# 📊 Data Storage - QUICK ANSWER

## Sizning Savollaringiz: "Xozir malumotlar qayerga sqlanadi?" 
## (Where is data stored right now?)

---

## ✅ QISQA JAVOB (Quick Answer):

### **HOZIR** (Right Now):
```
📱 BROWSER LOCALSTORAGE
   ↓
   F12 ni bosing
   ↓
   Application → Local Storage
   ↓
   http://localhost:5178/
   ↓
   Bu yerda barcha ma'lumotlar saqlanadi!
```

---

## 🎯 DATA QAYERDA?

### 1️⃣ localStorage (Browser)
```
✅ Hozir ishlaydi
✅ Harcha qadar saqlanadi
✅ F12 orqali ko'rish mumkin

Masalan:
- Sizning exam-lar
- Login ma'lumoti
- Test natijalar
- Barcha javoblar
```

### 2️⃣ MongoDB (Internet - Optional)
```
⚠️ Vaziyfali emas (optional)
✅ Cheksiz saqlanadi
✅ Hamma joydan access
✅ URL: mongodb+srv://...
```

---

## 📍 QANDAY KO'RISH? (How to Check?)

```
STEP 1: Browser ochish (http://localhost:5178/)
        ↓
STEP 2: F12 ni bosish (Developer Tools)
        ↓
STEP 3: "Application" tabni bosish
        ↓
STEP 4: "Local Storage" ni bosish
        ↓
STEP 5: "http://localhost:5178/" ni bosish
        ↓
STEP 6: Barcha ma'lumotlar shu yerda!
        - "user" - login info
        - "exams" - sizning exam-lar
        - "testResults" - test natijalar
```

---

## 💡 ESLAB QOLISH:

| Xususiyat | localStorage | MongoDB |
|-----------|-------------|---------|
| **Qayerda** | Browser | Internet |
| **Tezligi** | ⚡⚡⚡ Juda tez | ⚡ Sekin |
| **Qancha** | ~5-10 MB | Cheksiz |
| **Abadiy** | Yo'q | Ha ✅ |
| **Zarur** | Ha ✅ | Yo'q |

---

## 🎯 JAVOB:

**Xozir malumotlar:**
```
✅ Browser localStorage-da
✅ Hamma joydan ko'rinadi
✅ Hamma vaqt saqlanadi
✅ F12 orqali tekshirish mumkin
```

---

## ✨ BAS!

**Malumotlar xavfli va saqlanadi!** ✅

Tekshirish uchun: F12 bosing → Application → Local Storage! 🎉
