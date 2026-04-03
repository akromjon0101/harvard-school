import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from './models/Exam.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const seedCambridge19V2 = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // Delete previous attempts
        await Exam.deleteMany({ title: 'Cambridge 19 Test 3 Official Mock' });
        console.log('🗑️ Deleted old exam data');

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
                            { 
                                questionNumber: 1, 
                                type: 'completion', 
                                instructionText: 'Questions 1–6: Complete the notes. ONE WORD AND/OR A NUMBER.',
                                questionText: '1 harbour [gap]\n2 bridge [gap]\n3 Time: [gap]\n4 Name: [gap]\n5 Check the [gap]\n6 Color: [gap]',
                                correctAnswers: ['harbour', 'bridge', '3.30', 'Rose', 'sign', 'purple'] 
                            },
                            {
                                questionNumber: 7,
                                type: 'table-completion',
                                instructionText: 'Questions 7–10: Complete the table below.',
                                questionText: 'Complete the table below.',
                                correctAnswers: ['samphire', 'melon', 'coconut', 'strawberry']
                            }
                        ]
                    },
                    {
                        title: 'Part 2: Children’s Book Festival Workshops',
                        instructions: 'Questions 11-16: Choose SIX answers from the box. Questions 17-20: Choose TWO letters.',
                        questionRange: '11-20',
                        questions: [
                            { 
                                questionNumber: 11, 
                                startNumber: 11,
                                type: 'matching', 
                                instructionText: 'Match information A-H to workshops 11-16.',
                                boxTitle: 'Information',
                                options: [
                                    'involves painting and drawing', 
                                    'will be led by a prize-winning author', 
                                    'is aimed at children with a disability',
                                    'involves a drama activity',
                                    'focuses on new relationships',
                                    'is aimed at a specific age group',
                                    'explores an unhappy feeling',
                                    'raises awareness of a particular culture'
                                ],
                                matchingItems: [
                                    'Superheroes', 'Just do it', 'Count on me', 'Speak up', 'Jump for joy', 'Sticks and stones'
                                ],
                                correctAnswers: ['C', 'D', 'F', 'G', 'B', 'H'] 
                            },
                            {
                                questionNumber: 17,
                                startNumber: 17,
                                type: 'mcq-multi',
                                instructionText: 'Questions 17-18: Choose TWO letters A-E. Which TWO reasons does the speaker give for recommending Alive and Kicking?',
                                options: [
                                    'It will appeal to both boys and girls.',
                                    'The author is well known.',
                                    'It has colourful illustrations.',
                                    'It is funny.',
                                    'It deals with an important topic.'
                                ],
                                correctAnswers: ['D', 'E']
                            },
                            {
                                questionNumber: 19,
                                startNumber: 19,
                                type: 'mcq-multi',
                                instructionText: 'Questions 19-20: Choose TWO letters A-E. Which TWO pieces of advice does the speaker give to parents?',
                                options: [
                                    'Encourage children to write down new vocabulary.',
                                    'Allow children to listen to audio books.',
                                    'Get recommendations from librarians.',
                                    'Give children a choice about what they read.',
                                    'Only read aloud to children until they can read independently.'
                                ],
                                correctAnswers: ['B', 'C']
                            }
                        ]
                    },
                    {
                        title: 'Part 3: Science Experiment',
                        instructions: 'Questions 21-25: MCQ. Questions 26-30: Flowchart.',
                        questionRange: '21-30',
                        questions: [
                            { questionNumber: 21, type: 'mcq-single', questionText: 'How does Clare feel about the students?', options: ['worried progression', 'challenged by behaviour', 'frustrated at lack of interest'], correctAnswer: 'C' },
                            { questionNumber: 22, type: 'mcq-single', questionText: 'Jake reaction to diet suggestion', options: ['concerned results', 'feels data difficult', 'suspects upsetting'], correctAnswer: 'B' },
                            { questionNumber: 23, type: 'mcq-single', questionText: 'Animal experiment problem', options: ['not apply to humans', 'complicated permission', 'students not happy'], correctAnswer: 'A' },
                            { questionNumber: 24, type: 'mcq-single', questionText: 'Experiment focus question', options: ['control food intake', 'sugar lead to health problems', 'supplements affect health'], correctAnswer: 'A' },
                            { questionNumber: 25, type: 'mcq-single', questionText: 'Clare future experiment involving', options: ['other supplements', 'different genetic strains', 'varying exercise'], correctAnswer: 'C' },
                            {
                                questionNumber: 26,
                                startNumber: 26,
                                type: 'matching',
                                instructionText: 'Questions 26-30: Complete the flowchart. Choose FIVE answers A-H.',
                                options: ['size', 'escape', 'age', 'water', 'cereal', 'calculations', 'changes', 'colour'],
                                matchingItems: [
                                    'Choose mice which are all the same',
                                    'Divide the mice into two groups, each with a different',
                                    'sugar contained in',
                                    'to prevent',
                                    'Do all necessary'
                                ],
                                correctAnswers: ['C', 'H', 'E', 'B', 'F']
                            }
                        ]
                    },
                    {
                        title: 'Part 4: Microplastics',
                        instructions: 'Complete the notes below. Write ONE WORD ONLY for each answer.',
                        questionRange: '31-40',
                        questions: [
                            { 
                                questionNumber: 31, 
                                type: 'completion', 
                                instructionText: 'Complete the notes. ONE WORD ONLY.',
                                questionText: 'fibres from some 31 [gap] during washing\nthe breakdown of large pieces of plastic\nwaste from industry\nthe action of vehicle tyres on roads\n\nEffects\ncause injuries to the 32 [gap] of wildlife\nenter the food chain, e.g. tap water, 33 [gap] and seafood\nbanned in skin cleaning products and 34 [gap]\nenter soil through air, rain and 35 [gap]\n\nStudy\nEarthworms add 36 [gap] to the soil\naffect the 37 [gap] of plants\ncaused 38 [gap] loss in earthworms\nfewer seeds to germinate\na rise in the level of 39 [gap] in the soil\nchanges to soil damage both ecosystems and 40 [gap]',
                                correctAnswers: ['clothing', 'mouths', 'salt', 'toothpaste', 'fertilisers', 'nutrients', 'growth', 'weight', 'acid', 'society']
                            }
                        ]
                    }
                ],
                reading: [
                    {
                        title: 'Passage 1: Prehistoric Island Settlers',
                        instructions: 'Questions 1-7: True/False/Not Given. Questions 8-13: Notes Completion.',
                        questionRange: '1-13',
                        passageContent: 'This passage describes the research conducted by Dr. Ceri Shipton and his team on the Indonesian island of Obi...',
                        questions: [
                            { 
                                questionNumber: 1, 
                                type: 'completion', 
                                instructionText: 'Questions 1-7: TRUE, FALSE or NOT GIVEN.',
                                questionText: '1 [gap] (Expedition planned years)\n2 [gap] (Found iron tools)\n3 [gap] (Settlers voyaged)\n4 [gap] (Climate change war)\n5 [gap] (Caves near Kelo)\n6 [gap] (Population grew)\n7 [gap] (Researchers left early)',
                                correctAnswers: ['FALSE', 'FALSE', 'TRUE', 'NOT GIVEN', 'TRUE', 'NOT GIVEN', 'FALSE']
                            },
                            { 
                                questionNumber: 8, 
                                type: 'completion', 
                                instructionText: 'Questions 8-13: Complete the notes.',
                                questionText: '8 [gap] (Found caves)\n9 [gap] (Made of stone)\n10 [gap] (Animal bones)\n11 [gap] (Specific beads)\n12 [gap] (Type of pottery)\n13 [gap] (Selling spices)',
                                correctAnswers: ['caves', 'stone', 'bones', 'beads', 'pottery', 'spices']
                            }
                        ]
                    }
                ]
            }
        };

        const newExam = new Exam(examData);
        await newExam.save();

        console.log('🚀 Cambridge 19 Test 3 Corrected Seeding Successful!');
        process.exit();
    } catch (err) {
        console.error('❌ Error Seeding:', err);
        process.exit(1);
    }
};

seedCambridge19V2();
