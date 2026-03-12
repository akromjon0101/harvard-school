import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from './models/Exam.js';

dotenv.config();

const seedExam = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const existing = await Exam.findOne({ title: 'Academic IELTS Mock #1' });
        if (existing) {
            console.log('Exam already exists');
            process.exit();
        }

        const exam = new Exam({
            title: 'Academic IELTS Mock #1',
            description: 'Full simulation including Listening Section 1-4 with professional audio scripts.',
            testLevel: 'High-Pressure',
            modules: {
                listening: {
                    sections: [
                        {
                            sectionNumber: 1,
                            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                            audioScript: 'Registration for the library... Name: John Watson...',
                            difficulty: 'easy',
                            questionGroups: [
                                {
                                    title: 'Questions 1-5',
                                    instruction: 'Write ONE WORD AND/OR A NUMBER for each answer.',
                                    questions: [
                                        { questionNumber: 1, questionText: 'Name: [input]', correctAnswer: 'Watson', skillTag: 'spelling' },
                                        { questionNumber: 2, questionText: 'Address: [input] Baker Street', correctAnswer: '221B', skillTag: 'numbers' }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                reading: { passages: [] },
                writing: {
                    task1: { instruction: 'Describe the graph showing population growth.', imageUrl: '' },
                    task2: { instruction: 'Discuss the advantages and disadvantages of online education.' }
                }
            }
        });

        await exam.save();
        console.log('Sample exam seeded!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedExam();
