import Exam from '../models/Exam.js';

// Ensure every question has questionNumber and type (required by schema)
function normalizeQuestion(q) {
    const num = Number(q?.questionNumber ?? q?.startNumber ?? 1);
    return {
        ...q,
        questionNumber: Number.isFinite(num) ? num : 1,
        type: q?.type || 'gap-fill',
    };
}

function normalizeSection(sec) {
    return {
        ...sec,
        questions: (sec.questions || []).map(normalizeQuestion),
    };
}

function normalizeModules(modules) {
    return {
        listening: (modules.listening || []).map(normalizeSection),
        reading: (modules.reading || []).map(normalizeSection),
        writing: (modules.writing || []).map(normalizeSection),
    };
}

export const createExam = async (req, res) => {
    try {
        const { title, description, testLevel, modules, aiGradingEnabled, status } = req.body;

        // basic server-side validation
        if (!title) {
            return res.status(400).json({ error: 'Exam title is required' });
        }

        // Ensure modules structure is valid (basic check)
        if (!modules || !modules.listening || !modules.reading || !modules.writing) {
            return res.status(400).json({ error: 'Invalid exam structure: Missing modules' });
        }

        const normalizedModules = normalizeModules(modules);

        const newExam = new Exam({
            title,
            description,
            testLevel,
            modules: normalizedModules,
            status: status || 'draft',
            aiGradingEnabled: aiGradingEnabled || false
        });

        const savedExam = await newExam.save();
        res.status(201).json(savedExam);
    } catch (err) {
        console.error("Error creating exam:", err);
        res.status(400).json({ error: err.message });
    }
};

export const getExams = async (req, res) => {
    try {
        // Return summary only — modules are large and not needed for listing
        const exams = await Exam.find()
            .select('title description status testLevel aiGradingEnabled createdAt')
            .sort({ createdAt: -1 })
            .lean();
        res.json(exams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const stripAnswers = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(stripAnswers);
    
    const newObj = { ...obj };
    delete newObj.correctAnswer;
    delete newObj.correctAnswers;
    
    // Recursively handle nested objects/arrays
    for (const key in newObj) {
        newObj[key] = stripAnswers(newObj[key]);
    }
    return newObj;
};

export const getExamById = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id).lean();
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        
        // Block answers for non-admins
        if (!req.user || req.user.role !== 'admin') {
            const filteredExam = stripAnswers(exam);
            return res.json(filteredExam);
        }
        
        res.json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        res.json({ message: 'Exam deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
