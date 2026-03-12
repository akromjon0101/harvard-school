import express  from 'express';
import multer   from 'multer';
import path     from 'path';
import fs       from 'fs';
import { fileURLToPath } from 'url';
import { adminAuth } from '../middleware/auth.js';
import {
    processPdf,
    listDocuments,
    getDocument,
    updateDocument,
    deleteDocument,
} from '../controllers/pdfController.js';

const router = express.Router();

// ── Temp storage for incoming PDFs ────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_TMP   = path.join(__dirname, '..', 'uploads', 'pdf-tmp');
if (!fs.existsSync(PDF_TMP)) fs.mkdirSync(PDF_TMP, { recursive: true });

const pdfStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PDF_TMP),
    filename:    (_req,  file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safe}`);
    },
});

const pdfUpload = multer({
    storage:    pdfStorage,
    limits:     { fileSize: 50 * 1024 * 1024 },  // 50 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed.'));
        }
    },
});

// ── Routes (all admin-only) ───────────────────────────────────────────────────
router.post(  '/process',           adminAuth, pdfUpload.single('pdf'), processPdf);
router.get(   '/documents',         adminAuth, listDocuments);
router.get(   '/documents/:id',     adminAuth, getDocument);
router.put(   '/documents/:id',     adminAuth, updateDocument);
router.delete('/documents/:id',     adminAuth, deleteDocument);

// Multer error handler
router.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError || err.message) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Upload failed.' });
});

export default router;
