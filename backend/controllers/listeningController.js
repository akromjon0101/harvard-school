import ListeningTest from '../models/ListeningTest.js';

// Get all listening tests
export const getAllListeningTests = async (req, res) => {
    try {
        const tests = await ListeningTest.find().sort({ createdAt: -1 });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single listening test
export const getListeningTest = async (req, res) => {
    try {
        const test = await ListeningTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        res.json(test);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new listening test
export const createListeningTest = async (req, res) => {
    try {
        const newTest = new ListeningTest(req.body);
        const savedTest = await newTest.save();
        res.status(201).json(savedTest);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update listening test
export const updateListeningTest = async (req, res) => {
    try {
        const updatedTest = await ListeningTest.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedTest) {
            return res.status(404).json({ error: 'Test not found' });
        }
        res.json(updatedTest);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete listening test
export const deleteListeningTest = async (req, res) => {
    try {
        const deletedTest = await ListeningTest.findByIdAndDelete(req.params.id);
        if (!deletedTest) {
            return res.status(404).json({ error: 'Test not found' });
        }
        res.json({ message: 'Test deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add question to test
export const addQuestion = async (req, res) => {
    try {
        const test = await ListeningTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        test.questions.push(req.body);
        await test.save();
        res.json(test);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update question
export const updateQuestion = async (req, res) => {
    try {
        const test = await ListeningTest.findById(req.params.testId);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        const question = test.questions.id(req.params.questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        Object.assign(question, req.body);
        await test.save();
        res.json(test);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete question
export const deleteQuestion = async (req, res) => {
    try {
        const test = await ListeningTest.findById(req.params.testId);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        test.questions.id(req.params.questionId).remove();
        await test.save();
        res.json(test);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
