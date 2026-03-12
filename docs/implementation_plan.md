# IELTS Platform Enhancement Plan

## 1. Student Page (Frontend)
### Layout
- **Reading**: Use `ielts-split-layout` (already in CSS) to ensure a proper split screen. Left side scrollable passage, right side scrollable questions.
- **Listening**: Questions centered in blocks.
- **Navigation**: Bottom footer with question dots (already in `PremiumExamSession.jsx`).

### New/Enhanced Question Components
- **Gap Fill**: Support `maxWords` validation. Show "[input]" as underscore in preview.
- **Multiple Choice**: Radio-button style.
- **Checkbox**: Multi-selection.
- **Matching**: Select-based matching for now (as per existing `Matching.jsx`), with IELTS styling.

### State & Validation
- **State Management**: Real-time save to `localStorage` (ensure it's robust across page reloads).
- **Validation**: Strict word count checking for input fields.

## 2. Admin Panel (Backend & UX)
### Visual Editor
- Create a `SplitEditor` for `AddExam.jsx`.
- Left: Form fields for creating/editing sections and questions.
- Right: Real-time "Student View" preview using `QuestionRenderer`.

### Bulk Import & Smart Parser
- **Smart Parser**: Enhance the existing `SmartParser` to handle more varied formats and multiple question types.
- **Bulk Import**: Support for a ready-made template (JSON/Excel).

### Audio Management
- Dedicated timer for each section for listening (e.g. "Section 1 starts at 0:00, Section 2 starts at 10:00").

---

## Technical Details
- Use `localStorage` for real-time saving.
- Enforce validation rules in `GapFill` component.
- Redesign `AddExam.jsx` to include a preview pane.
