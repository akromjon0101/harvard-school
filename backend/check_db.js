import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from './models/Exam.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const checkExams = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const exams = await Exam.find({}, 'title status createdAt');
        console.log('📚 DATABASE EXAMS LIST:');
        console.log(JSON.stringify(exams, null, 2));
        process.exit();
    } catch (err) {
        console.error('❌ Error checking database:', err);
        process.exit(1);
    }
};

checkExams();
