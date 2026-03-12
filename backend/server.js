import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import listeningRoutes from './routes/listeningRoutes.js';
import writingRoutes from './routes/writingRoutes.js';
import readingRoutes from './routes/readingRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import practiceRoutes from './routes/practiceRoutes.js';
import ttsRoutes        from './routes/ttsRoutes.js';
import openaiUsageRoutes from './routes/openaiUsageRoutes.js';
import gradeRoutes       from './routes/gradeRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow /uploads to be served
}));

// Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Rate Limiting — auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS Configuration - Allow all localhost ports in development
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    // In development allow any localhost port (5173, 5174, 5178, etc.)
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    // In production only allow the configured FRONTEND_URL
    if (origin === process.env.FRONTEND_URL) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' })); // Reduced from 50mb
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Static files for uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));
// Serve extracted PDF page images
const pdfImagesDir = path.join(__dirname, 'uploads', 'pdf-images');
if (!fs.existsSync(pdfImagesDir)) fs.mkdirSync(pdfImagesDir, { recursive: true });
app.use('/uploads/pdf-images', express.static(pdfImagesDir));

// Multer Storage Configuration with Security
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename - remove path traversal attempts
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${sanitized}`);
  }
});

// File validation — checks extension OR MIME type so all common audio encodings work
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|gif|pdf|mp3|wav|m4a|ogg|webm)$/i;
const ALLOWED_MIMES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif',
  // PDF
  'application/pdf',
  // Audio — browsers report different MIME types for the same format
  'audio/mpeg',           // .mp3 (most browsers)
  'audio/mp3',            // .mp3 (some browsers)
  'audio/wav',            // .wav
  'audio/x-wav',          // .wav (older browsers)
  'audio/wave',           // .wav (Safari)
  'audio/mp4',            // .m4a
  'audio/m4a',            // .m4a
  'audio/x-m4a',          // .m4a
  'audio/ogg',            // .ogg
  'audio/vorbis',         // .ogg
  'audio/webm',           // .webm audio
  'video/webm',           // .webm (sometimes audio-only webm reports this)
]);

const fileFilter = (req, file, cb) => {
  const extOk  = ALLOWED_EXTENSIONS.test(path.extname(file.originalname));
  const mimeOk = ALLOWED_MIMES.has(file.mimetype.toLowerCase());
  if (extOk || mimeOk) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type "${file.mimetype}". Allowed: JPEG, PNG, GIF, PDF, MP3, WAV, M4A, OGG.`));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — audio files can be large
  fileFilter
});

// File Upload Endpoint - PROTECTED (Admin only)
import { adminAuth, auth } from './middleware/auth.js';
app.post('/api/upload', adminAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Speaking audio upload - PROTECTED (any logged-in user/student)
app.post('/api/speaking/upload', auth, upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// MongoDB Connection with Fallback to In-Memory
const connectDB = async () => {
  try {
    const maskedURI = process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@');
    console.log(`🔗 Connecting to: ${maskedURI}`);
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB Atlas Connected Successfully');
    } catch (err) {
    console.error('❌ Atlas Connection Error Details:', err.message);
    console.warn('⚠️ Atlas Connection Failed. Switching to In-Memory MongoDB for development...');
    console.warn('⚠️ REAL PROJECT: Set MONGODB_URI in backend/.env to your MongoDB Atlas connection string so tests PERSIST.');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('✅ In-Memory MongoDB Connected');
      console.warn('⚠️ DATA WILL NOT PERSIST — Restart = all exams/submissions lost. Fix MONGODB_URI in backend/.env for real storage.');
    } catch (memErr) {
      console.error('❌ Failed to start In-Memory MongoDB:', memErr);
    }
  }

  // Seed admin user (Only if doesn't exist)
  try {
    const { default: User } = await import('./models/User.js');
    console.log('👤 Checking Admin User...');

    const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2026!SecurePass';

    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = new User({
        name: 'Admin User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created successfully');
      console.log(`📧 Email: ${admin.email}`);
    } else {
      // Ensure stored password matches .env (handles password changes)
      const passwordMatches = await admin.matchPassword(adminPassword);
      if (!passwordMatches) {
        admin.password = adminPassword;  // pre-save hook will re-hash it
        await admin.save();
        console.log('✅ Admin password synced with .env');
      } else {
        console.log('✅ Admin user already exists');
      }
    }

  } catch (seedErr) {
    console.error('❌ Admin Seeding Error:', seedErr);
  }
};

connectDB();

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/listening', listeningRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pdf',   pdfRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/tts',          ttsRoutes);
app.use('/api/openai-usage', openaiUsageRoutes);
app.use('/api/grade',       gradeRoutes);

// Centralized Error Handler
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? (status < 500 ? err.message : 'Internal Server Error')
    : err.message;
  if (status >= 500) console.error('Server Error:', err);
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
