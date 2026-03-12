import mongoose from 'mongoose';

const pdfDocumentSchema = new mongoose.Schema({
    originalName:      { type: String, required: true },
    extractedText:     { type: String, default: '' },
    images:            [{ url: String, filename: String, page: Number }],
    pageCount:         { type: Number, default: 0 },
    wordCount:         { type: Number, default: 0 },
    processingMethod:  { type: String, enum: ['text', 'ocr', 'text+ocr'], default: 'text' },
    createdAt:         { type: Date, default: Date.now },
    processedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.model('PdfDocument', pdfDocumentSchema);
