import mongoose from 'mongoose';

// Singleton settings document — always _id: 'main'
const appSettingsSchema = new mongoose.Schema({
    _id:                { type: String, default: 'main' },
    openaiMonthlyBudget: { type: Number, default: 10 }, // USD
}, { _id: false });

export default mongoose.model('AppSettings', appSettingsSchema);
