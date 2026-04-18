const mongoose = require('mongoose');

const quizHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    domain: String,
    subdomain: String,
    score: Number,
    totalQuestions: Number,
    timeTaken: Number,
    completedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('QuizHistory', quizHistorySchema);
