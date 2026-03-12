import WritingTest from '../models/WritingTest.js';

// Get all writing tests
export const getAllWritingTests = async (req, res) => {
    try {
        const tests = await WritingTest.find().sort({ createdAt: -1 });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single writing test
export const getWritingTest = async (req, res) => {
    try {
        const test = await WritingTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        res.json(test);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new writing test
export const createWritingTest = async (req, res) => {
    try {
        const newTest = new WritingTest(req.body);
        const savedTest = await newTest.save();
        res.status(201).json(savedTest);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update writing test
export const updateWritingTest = async (req, res) => {
    try {
        const updatedTest = await WritingTest.findByIdAndUpdate(
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

// Delete writing test
export const deleteWritingTest = async (req, res) => {
    try {
        const deletedTest = await WritingTest.findByIdAndDelete(req.params.id);
        if (!deletedTest) {
            return res.status(404).json({ error: 'Test not found' });
        }
        res.json({ message: 'Test deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add task to test
export const addTask = async (req, res) => {
    try {
        const test = await WritingTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        test.tasks.push(req.body);
        await test.save();
        res.json(test);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update task
export const updateTask = async (req, res) => {
    try {
        const test = await WritingTest.findById(req.params.testId);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        const task = test.tasks.id(req.params.taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        Object.assign(task, req.body);
        await test.save();
        res.json(test);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete task
export const deleteTask = async (req, res) => {
    try {
        const test = await WritingTest.findById(req.params.testId);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        test.tasks.id(req.params.taskId).remove();
        await test.save();
        res.json(test);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
