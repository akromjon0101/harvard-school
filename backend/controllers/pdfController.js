/**
 * PDF Processing Controller — uses pdf-parse v2 (PDFParse class)
 *
 * Flow:
 *  1. getText()      → extract text from the PDF
 *  2. getScreenshot()→ render every page as a PNG image
 *  3. getImage()     → extract any embedded images (charts, figures, etc.)
 *  4. OCR fallback   → if text is sparse, run tesseract.js on the page PNGs
 *  5. Save to MongoDB (PdfDocument)
 *  6. Delete original PDF file  ← only after a successful DB save
 */

import fs   from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import PdfDocument from '../models/PdfDocument.js';
import { fileURLToPath } from 'url';

// ── Storage directories ───────────────────────────────────────────────────────
const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const IMAGES_DIR  = path.join(UPLOADS_DIR, 'pdf-images');

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// ── Helpers ───────────────────────────────────────────────────────────────────
function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function baseUrl(req) {
    return `${req.protocol}://${req.get('host')}`;
}

/**
 * Run Tesseract OCR on an array of image file paths.
 * Returns combined text, or '' if tesseract.js is unavailable.
 */
async function runOcr(imagePaths) {
    let createWorker;
    try {
        const m = await import('tesseract.js');
        createWorker = m.createWorker ?? m.default?.createWorker;
        if (!createWorker) throw new Error('createWorker not found');
    } catch {
        console.warn('⚠️  tesseract.js unavailable — OCR skipped');
        return '';
    }

    const worker  = await createWorker('eng');
    let combined  = '';

    for (let i = 0; i < imagePaths.length; i++) {
        try {
            const { data: { text } } = await worker.recognize(imagePaths[i]);
            combined += text + '\n\n';
        } catch (e) {
            console.warn(`⚠️  OCR page ${i + 1} failed:`, e.message);
        }
    }

    await worker.terminate();
    return combined.trim();
}

// ── POST /api/pdf/process ────────────────────────────────────────────────────
export const processPdf = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const pdfPath      = req.file.path;
    const originalName = req.file.originalname;
    const url          = baseUrl(req);

    // Read once — we'll pass the buffer to PDFParse
    let buffer;
    try {
        buffer = fs.readFileSync(pdfPath);
    } catch (e) {
        return res.status(500).json({ error: `Could not read uploaded file: ${e.message}` });
    }

    // Saved page image records for DB
    const savedImages = [];

    try {
        // ── 1. Extract text ──────────────────────────────────────────────────
        const textParser = new PDFParse({ data: buffer });
        let textResult;
        try {
            textResult = await textParser.getText();
        } catch (e) {
            await textParser.destroy().catch(() => {});
            throw new Error(`Text extraction failed: ${e.message}`);
        }
        await textParser.destroy().catch(() => {});

        let extractedText    = (textResult?.text || '').trim();
        const pageCount      = textResult?.meta?.pages ?? textResult?.pages?.length ?? 0;
        let processingMethod = 'text';

        // ── 2. Render pages as PNG screenshots ───────────────────────────────
        const screenshotParser = new PDFParse({ data: buffer });
        let pageScreenshots    = [];
        try {
            const ssResult  = await screenshotParser.getScreenshot({ scale: 2, imageBuffer: true, imageDataUrl: false });
            pageScreenshots = ssResult?.pages ?? [];
        } catch (e) {
            console.warn('⚠️  getScreenshot failed (non-fatal):', e.message);
        }
        await screenshotParser.destroy().catch(() => {});

        // Save page screenshots to disk
        const screenshotPaths = [];
        for (let i = 0; i < pageScreenshots.length; i++) {
            const pg = pageScreenshots[i];
            // data may be a Buffer or Uint8Array
            const imgBuf = pg?.data ?? pg?.imageBuffer;
            if (!imgBuf) continue;

            const filename = `page-${Date.now()}-${i + 1}.png`;
            const filePath = path.join(IMAGES_DIR, filename);
            try {
                fs.writeFileSync(filePath, Buffer.isBuffer(imgBuf) ? imgBuf : Buffer.from(imgBuf));
                savedImages.push({ filename, url: `${url}/uploads/pdf-images/${filename}`, page: i + 1 });
                screenshotPaths.push(filePath);
            } catch (writeErr) {
                console.warn(`⚠️  Could not save screenshot ${i + 1}:`, writeErr.message);
            }
        }

        // ── 3. Extract embedded images ────────────────────────────────────────
        const imageParser = new PDFParse({ data: buffer });
        let embeddedCount  = 0;
        try {
            const imgResult = await imageParser.getImage({ imageThreshold: 0, imageBuffer: true, imageDataUrl: false });
            const imgPages  = imgResult?.pages ?? [];

            for (let p = 0; p < imgPages.length; p++) {
                const imgs = imgPages[p]?.images ?? [];
                for (let j = 0; j < imgs.length; j++) {
                    const imgBuf  = imgs[j]?.data ?? imgs[j]?.imageBuffer;
                    const imgExt  = imgs[j]?.ext ?? 'png';
                    if (!imgBuf) continue;

                    const filename = `img-${Date.now()}-p${p + 1}-${j + 1}.${imgExt}`;
                    const filePath = path.join(IMAGES_DIR, filename);
                    try {
                        fs.writeFileSync(filePath, Buffer.isBuffer(imgBuf) ? imgBuf : Buffer.from(imgBuf));
                        savedImages.push({ filename, url: `${url}/uploads/pdf-images/${filename}`, page: p + 1 });
                        embeddedCount++;
                    } catch { /* skip */ }
                }
            }
        } catch (e) {
            console.warn('⚠️  getImage failed (non-fatal):', e.message);
        }
        await imageParser.destroy().catch(() => {});

        // ── 4. OCR fallback if text is sparse ─────────────────────────────────
        const isScanned = extractedText.length < 80;
        if (isScanned && screenshotPaths.length > 0) {
            console.log(`📷 Sparse text detected (${extractedText.length} chars) — running OCR on ${screenshotPaths.length} pages`);
            const ocrText = await runOcr(screenshotPaths);
            if (ocrText.length > extractedText.length) {
                extractedText    = ocrText;
                processingMethod = 'ocr';
            }
        }

        // ── 5. Save to MongoDB ────────────────────────────────────────────────
        const doc = new PdfDocument({
            originalName,
            extractedText,
            images:           savedImages,
            pageCount:        pageCount || pageScreenshots.length,
            wordCount:        countWords(extractedText),
            processingMethod,
            processedBy:      req.user?._id,
        });

        const savedDoc = await doc.save();

        // ── 6. Delete original PDF (only after successful DB save) ─────────────
        try {
            fs.unlinkSync(pdfPath);
        } catch (e) {
            console.warn('⚠️  Could not delete original PDF:', e.message);
        }

        console.log(`✅ PDF processed: "${originalName}" | ${savedDoc.pageCount} pages | ${savedDoc.wordCount} words | method: ${processingMethod} | images: ${savedImages.length} (${embeddedCount} embedded)`);

        return res.status(201).json({ success: true, document: savedDoc });

    } catch (err) {
        console.error('❌ PDF processing error:', err.message);

        // Clean up any images already written on error
        for (const img of savedImages) {
            const fp = path.join(IMAGES_DIR, img.filename);
            if (fs.existsSync(fp)) try { fs.unlinkSync(fp); } catch { /* ignore */ }
        }

        // Leave the original PDF intact so no data is lost
        return res.status(500).json({ error: err.message || 'PDF processing failed.', pdfKept: true });
    }
};

// ── GET /api/pdf/documents ────────────────────────────────────────────────────
export const listDocuments = async (_req, res) => {
    try {
        const docs = await PdfDocument.find()
            .sort({ createdAt: -1 })
            .select('-extractedText');
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/pdf/documents/:id ────────────────────────────────────────────────
export const getDocument = async (req, res) => {
    try {
        const doc = await PdfDocument.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document not found.' });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── PUT /api/pdf/documents/:id ────────────────────────────────────────────────
export const updateDocument = async (req, res) => {
    try {
        const { extractedText } = req.body;
        const doc = await PdfDocument.findByIdAndUpdate(
            req.params.id,
            { extractedText, wordCount: countWords(extractedText || '') },
            { new: true, runValidators: true }
        );
        if (!doc) return res.status(404).json({ error: 'Document not found.' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// ── DELETE /api/pdf/documents/:id ─────────────────────────────────────────────
export const deleteDocument = async (req, res) => {
    try {
        const doc = await PdfDocument.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document not found.' });

        for (const img of doc.images || []) {
            const imgPath = path.join(IMAGES_DIR, img.filename);
            if (fs.existsSync(imgPath)) try { fs.unlinkSync(imgPath); } catch { /* ignore */ }
        }

        await doc.deleteOne();
        res.json({ message: 'Document deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
