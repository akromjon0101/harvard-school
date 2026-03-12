import ReadingTest from '../models/ReadingTest.js';

// Get all reading tests
export const getAllReadingTests = async (req, res) => {
    try {
        const tests = await ReadingTest.find().sort({ createdAt: -1 });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single reading test
export const getReadingTest = async (req, res) => {
    try {
        const test = await ReadingTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        res.json(test);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new reading test
export const createReadingTest = async (req, res) => {
    try {
        const newTest = new ReadingTest(req.body);
        const savedTest = await newTest.save();
        res.status(201).json(savedTest);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update reading test
export const updateReadingTest = async (req, res) => {
    try {
        const updatedTest = await ReadingTest.findByIdAndUpdate(
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

// Delete reading test
export const deleteReadingTest = async (req, res) => {
    try {
        const deletedTest = await ReadingTest.findByIdAndDelete(req.params.id);
        if (!deletedTest) {
            return res.status(404).json({ error: 'Test not found' });
        }
        res.json({ message: 'Test deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add passage to test
export const addPassage = async (req, res) => {
    try {
        const test = await ReadingTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        test.passages.push(req.body);
        await test.save();
        res.json(test);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update passage
export const updatePassage = async (req, res) => {
    try {
        const test = await ReadingTest.findById(req.params.testId);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        const passage = test.passages.id(req.params.passageId);
        if (!passage) {
            return res.status(404).json({ error: 'Passage not found' });
        }
        Object.assign(passage, req.body);
        await test.save();
        res.json(test);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete passage
export const deletePassage = async (req, res) => {
    try {
        const test = await ReadingTest.findById(req.params.testId);
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }
        test.passages.id(req.params.passageId).remove();
        await test.save();
        res.json(test);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
