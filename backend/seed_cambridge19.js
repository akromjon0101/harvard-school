import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from './models/Exam.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const seedCambridge19 = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // Check if already exists
        const existing = await Exam.findOne({ title: 'Cambridge 19 Test 3 Official Mock' });
        if (existing) {
            console.log('⚠️ Exam already exists. Updating...');
            await Exam.deleteOne({ _id: existing._id });
        }

        const examData = {
            title: 'Cambridge 19 Test 3 Official Mock',
            description: 'Full simulation of Cambridge IELTS 19 Academic Test 3.',
            status: 'published',
            aiGradingEnabled: true,
            modules: {
                listening: [
                    {
                        title: 'Part 1: Harbour Cruise',
                        instructions: 'Complete the notes/table below. Write ONE WORD AND/OR A NUMBER for each answer.',
                        questionRange: '1-10',
                        questions: [
                            { questionNumber: 1, type: 'note-completion', questionText: 'harbour [input]', correctAnswer: 'harbour' },
                            { questionNumber: 2, type: 'note-completion', questionText: 'bridge [input]', correctAnswer: 'bridge' },
                            { questionNumber: 3, type: 'note-completion', questionText: 'Time: [input]', correctAnswer: '3.30' },
                            { questionNumber: 4, type: 'note-completion', questionText: 'Name: [input]', correctAnswer: 'Rose' },
                            { questionNumber: 5, type: 'note-completion', questionText: 'Check the [input]', correctAnswer: 'sign' },
                            { questionNumber: 6, type: 'note-completion', questionText: 'Color: [input]', correctAnswer: 'purple' },
                            { questionNumber: 7, type: 'table-completion', questionText: 'Fish market: [input]', correctAnswer: 'samphire' },
                            { questionNumber: 8, type: 'table-completion', questionText: 'Organic shop (dessert): [input]', correctAnswer: 'melon' },
                            { questionNumber: 9, type: 'table-completion', questionText: 'Organic shop (to buy): [input]', correctAnswer: 'coconut' },
                            { questionNumber: 10, type: 'table-completion', questionText: 'Bakery (tart): [input]', correctAnswer: 'strawberry' }
                        ]
                    },
                    {
                        title: 'Part 2: Children’s Book Festival Workshops',
                        instructions: 'Questions 11-16: Choose SIX answers from the box. Questions 17-20: Choose TWO letters.',
                        questionRange: '11-20',
                        questions: [
                            { questionNumber: 11, type: 'matching', questionText: 'Superheroes', correctAnswer: 'C' },
                            { questionNumber: 12, type: 'matching', questionText: 'Just do it', correctAnswer: 'D' },
                            { questionNumber: 13, type: 'matching', questionText: 'Count on me', correctAnswer: 'F' },
                            { questionNumber: 14, type: 'matching', questionText: 'Speak up', correctAnswer: 'G' },
                            { questionNumber: 15, type: 'matching', questionText: 'Jump for joy', correctAnswer: 'B' },
                            { questionNumber: 16, type: 'matching', questionText: 'Sticks and stones', correctAnswer: 'H' },
                            { questionNumber: 17, type: 'mcq-multiple', questionText: 'Alive and Kicking recommendation reasons (1)', correctAnswer: 'D' },
                            { questionNumber: 18, type: 'mcq-multiple', questionText: 'Alive and Kicking recommendation reasons (2)', correctAnswer: 'E' },
                            { questionNumber: 19, type: 'mcq-multiple', questionText: 'Advice to parents (1)', correctAnswer: 'B' },
                            { questionNumber: 20, type: 'mcq-multiple', questionText: 'Advice to parents (2)', correctAnswer: 'C' }
                        ]
                    },
                    {
                        title: 'Part 3: Science Experiment',
                        instructions: 'Questions 21-25: MCQ. Questions 26-30: Flowchart.',
                        questionRange: '21-30',
                        questions: [
                            { questionNumber: 21, type: 'mcq-single', questionText: 'Clare feelings', correctAnswer: 'C' },
                            { questionNumber: 22, type: 'mcq-single', questionText: 'Jake reaction', correctAnswer: 'B' },
                            { questionNumber: 23, type: 'mcq-single', questionText: 'Animal experiment problem', correctAnswer: 'A' },
                            { questionNumber: 24, type: 'mcq-single', questionText: 'Experiment focus', correctAnswer: 'A' },
                            { questionNumber: 25, type: 'mcq-single', questionText: 'Clare future experiment', correctAnswer: 'C' },
                            { questionNumber: 26, type: 'flowchart-completion', questionText: 'Mice same [input]', correctAnswer: 'C' },
                            { questionNumber: 27, type: 'flowchart-completion', questionText: 'Different [input]', correctAnswer: 'H' },
                            { questionNumber: 28, type: 'flowchart-completion', questionText: 'Sugar in [input]', correctAnswer: 'E' },
                            { questionNumber: 29, type: 'flowchart-completion', questionText: 'To prevent [input]', correctAnswer: 'B' },
                            { questionNumber: 30, type: 'flowchart-completion', questionText: 'Necessary [input]', correctAnswer: 'F' }
                        ]
                    },
                    {
                        title: 'Part 4: Microplastics',
                        instructions: 'Complete the notes below. Write ONE WORD ONLY for each answer.',
                        questionRange: '31-40',
                        questions: [
                            { questionNumber: 31, type: 'note-completion', questionText: 'fibres from [input]', correctAnswer: 'clothing' },
                            { questionNumber: 32, type: 'note-completion', questionText: 'injuries to [input]', correctAnswer: 'mouths' },
                            { questionNumber: 33, type: 'note-completion', questionText: 'tap water, [input]', correctAnswer: 'salt' },
                            { questionNumber: 34, type: 'note-completion', questionText: 'product and [input]', correctAnswer: 'toothpaste' },
                            { questionNumber: 35, type: 'note-completion', questionText: 'rain and [input]', correctAnswer: 'fertilisers' },
                            { questionNumber: 36, type: 'note-completion', questionText: 'add [input] to soil', correctAnswer: 'nutrients' },
                            { questionNumber: 37, type: 'note-completion', questionText: 'affect [input] of plants', correctAnswer: 'growth' },
                            { questionNumber: 38, type: 'note-completion', questionText: 'caused [input] loss', correctAnswer: 'weight' },
                            { questionNumber: 39, type: 'note-completion', questionText: 'level of [input] in soil', correctAnswer: 'acid' },
                            { questionNumber: 40, type: 'note-completion', questionText: 'damage ecosystems and [input]', correctAnswer: 'society' }
                        ]
                    }
                ],
                reading: [
                    {
                        title: 'Passage 1: Prehistoric Island Settlers',
                        instructions: 'Questions 1-7: True/False/Not Given. Questions 8-13: Notes Completion.',
                        questionRange: '1-13',
                        passageContent: 'This passage describes the research conducted by Dr. Ceri Shipton and his team on the Indonesian island of Obi... (Full content available in kit)',
                        questions: [
                            { questionNumber: 1, type: 'tfng', questionText: 'Expedition was planned for years', correctAnswer: 'FALSE' },
                            { questionNumber: 2, type: 'tfng', questionText: 'Team found iron tools', correctAnswer: 'FALSE' },
                            { questionNumber: 3, type: 'tfng', questionText: 'Settlers voyaged between islands', correctAnswer: 'TRUE' },
                            { questionNumber: 4, type: 'tfng', questionText: 'Climate change caused war', correctAnswer: 'NOT GIVEN' },
                            { questionNumber: 5, type: 'tfng', questionText: 'Caves were near Kelo', correctAnswer: 'TRUE' },
                            { questionNumber: 6, type: 'tfng', questionText: 'Population grew fast', correctAnswer: 'NOT GIVEN' },
                            { questionNumber: 7, type: 'tfng', questionText: 'Researchers left early', correctAnswer: 'FALSE' },
                            { questionNumber: 8, type: 'note-completion', questionText: 'Found [input]', correctAnswer: 'caves' },
                            { questionNumber: 9, type: 'note-completion', questionText: 'Made of [input]', correctAnswer: 'stone' },
                            { questionNumber: 10, type: 'note-completion', questionText: 'Animal [input]', correctAnswer: 'bones' },
                            { questionNumber: 11, type: 'note-completion', questionText: 'Specific [input]', correctAnswer: 'beads' },
                            { questionNumber: 12, type: 'note-completion', questionText: 'Type of [input]', correctAnswer: 'pottery' },
                            { questionNumber: 13, type: 'note-completion', questionText: 'Selling [input]', correctAnswer: 'spices' }
                        ]
                    },
                    {
                      title: 'Passage 2: Global Importance of Wetlands',
                      instructions: 'Questions 14-26.',
                      questionRange: '14-26',
                      passageContent: 'This passage discusses the environmental significance of wetlands, carbon emissions, and peatland drainage.',
                      questions: [
                        { questionNumber: 14, type: 'matching', questionText: 'Para G', correctAnswer: 'G' },
                        { questionNumber: 18, type: 'note-completion', questionText: 'release [input]', correctAnswer: 'carbon' },
                        { questionNumber: 19, type: 'note-completion', questionText: 'risk of [input]', correctAnswer: 'fires' },
                        { questionNumber: 20, type: 'note-completion', questionText: 'loss of [input]', correctAnswer: 'biodiversity' }
                      ]
                    }
                ],
                speaking: [
                    {
                        title: 'Part 1: Introduction',
                        instructions: 'Answer basic questions about yourself.',
                        questions: [
                            { questionNumber: 1, type: 'speaking', questionText: 'What is your name?' },
                            { questionNumber: 2, type: 'speaking', questionText: 'Do you work or study?' }
                        ]
                    },
                    {
                      title: 'Part 2: Cue Card',
                      instructions: 'Describe a place you like to visit.',
                      questions: [
                        { questionNumber: 3, type: 'speaking', questionText: 'Describe a significant historical site.' }
                      ]
                    }
                ]
            }
        };

        const newExam = new Exam(examData);
        await newExam.save();

        console.log('🚀 Cambridge 19 Test 3 Seeded Successfully!');
        process.exit();
    } catch (err) {
        console.error('❌ Error Seeding:', err);
        process.exit(1);
    }
};

seedCambridge19();
