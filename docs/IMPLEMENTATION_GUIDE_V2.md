# IELTS Mock Test Platform - Production Implementation Guide (MVP v2)

As per your request for a **production-ready, simplified MVP**, here is the architectural blueprint and implementation details.

## 📂 1. Folder Structure (Standard MERN)

```text
/root
├── backend                 # Node/Express API
│   ├── controllers         # Route handlers (Business logic)
│   ├── middleware          # jwtAuth, adminAuth
│   ├── models              # Mongoose Schemas (Exam.js, User.js, Submission.js)
│   ├── routes              # API Endpoints (examRoutes.js, authRoutes.js)
│   └── server.js           # Server Entry
└── frontend                # React/Vite App
    ├── src
    │   ├── components
    │   │   ├── admin       # Modular QuestionBuilders (QuestionForm.jsx)
    │   │   └── student     # Simulation blocks
    │   ├── pages
    │   │   ├── admin       # AddExam.jsx, Dashboard.jsx
    │   │   └── student     # SimulationSession.jsx (2-column layout)
    │   ├── services        # Axios API wrappers
    │   └── styles          # simulation.css (Official Theme)
```

## 🗄️ 2. MongoDB Schema (Modular & Scalable)

We use a **Recursive Schema** approach to allow arbitrary nesting of groups and questions while keeping the document lean.

```javascript
/* Exam.js Schema Snippet */
const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  testLevel: { type: String, enum: ['Standard', 'High-Pressure'], default: 'Standard' },
  modules: {
    listening: {
      sections: [{
        audioUrl: String,           // External S3/Firebase URL
        questionGroups: [{
          title: String,            // e.g. "Questions 1-5"
          instruction: String,      // e.g. "Write NO MORE THAN TWO WORDS"
          type: String,             // mcq-single, gap-fill, tfng
          questions: [{
            questionNumber: Number,
            questionText: String,   // For gap-fill: "The building was [input]."
            options: [String],      // For MCQs
            correctAnswer: String,  // Strict key for auto-grading
            mediaUrl: String        // Per-question optional URL
          }]
        }]
      }]
    },
    reading: {
      passages: [{
        passageTitle: String,
        passageContent: String,    // Stored as text/markdown
        questionGroups: [/* Recursive structure same as listening */]
      }]
    }
  },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' }
});
```

## 🚀 3. API Route Structure (Test CRUD)

All routes are protected by `jwtAuth` and `adminAuth` middleware.

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/exams` | Create a new test (Draft or Published) | Admin |
| `GET` | `/api/exams` | List all exams (for admin) | Admin |
| `GET` | `/api/exams/published` | List published exams for student dashboard | Student |
| `GET` | `/api/exams/:id` | Fetch full test data for simulation | Auth |
| `PUT` | `/api/exams/:id` | Update test content/status | Admin |
| `DELETE` | `/api/exams/:id`| Remove test | Admin |
| `POST` | `/api/submissions`| Submit student answers for auto-grading | Student |

## 🧩 4. Dynamic Question Implementation (Frontend)

The **Admin Panel** uses a strategy-pattern to render specific forms based on `type`.

```javascript
/* Simplified logic inside AddExam.jsx */
const renderForm = (type, question) => {
  switch(type) {
    case 'mcq-single': 
      return <MCQForm data={question} />;
    case 'true-false-notgiven': 
      return <TFNGForm data={question} />;
    default: 
      return <GapFillForm data={question} />;
  }
};
```

## 🛡️ 5. Security & Performance Best Practices

1.  **RBAC (Role Based Access Control)**:
    *   Ensure the `Register` route defaults to `student`.
    *   `admin` role can only be assigned via DB or a secure master-admin interface.
2.  **Stateless Auth**:
    *   Use **JWT** stored in `HTTPOnly Cookies` (recommended) or `LocalStorage` with short expiry.
    *   Include `iat` (Issued At) to invalidate old tokens.
3.  **Media Strategy (MVP)**:
    *   **External Store**: Store images/audio in AWS S3 or Firebase.
    *   **Light Document**: Only store the **final URL string** in MongoDB. This prevents the 16MB BSON limit and keeps queries fast.
4.  **Auto-Saving**:
    *   Frontend should trigger a `PUT` request to `/api/exams/:id` every 30 seconds if the form is "dirty".
5.  **Data Integrity**:
    *   Use Mongoose `runValidators: true` on updates to prevent schema corruption.

## 🎓 6. Student UI Specs (Computer-Based)

*   **Reading**: 2-pane view using `overflow-y: auto`. Left pane for text, Right for questions.
*   **Listening**: Fixed `audio-dock` at the top with a central scrollable list.
*   **Answer Sheet**: Bottom persistent bar showing progress (Black = Answered, White = Empty).
```

This guide ensures your platform is ready for production scaling.
