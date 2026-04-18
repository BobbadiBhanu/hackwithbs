const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const QuizHistory = require('../models/QuizHistory');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const fallbackQuizzes = {
    "DBMS": [
        { question: "What does SQL stand for?", options: ["Structured Query Language", "Strong Question Language", "Structured Question Language", "System Query Language"], correctOptionIndex: 0, isScenarioBased: false },
        { question: "A primary key must be...", options: ["Nullable", "Unique and Not Null", "An Integer", "Shared across tables"], correctOptionIndex: 1, isScenarioBased: false },
        { question: "Which normal form deals with removing transitive dependencies?", options: ["1NF", "2NF", "3NF", "BCNF"], correctOptionIndex: 2, isScenarioBased: false },
        { question: "[SCENARIO] You need to store user session data temporarily and fast. Should you use a relational DB?", options: ["Yes", "No, use NoSQL like Redis", "Yes, with indexing", "Doesn't matter"], correctOptionIndex: 1, isScenarioBased: true },
        { question: "What is an ACID property?", options: ["Atomicity", "Accuracy", "Action", "Attribute"], correctOptionIndex: 0, isScenarioBased: false }
    ],
    "DSA": [
        { question: "What is the time complexity of binary search?", options: ["O(n)", "O(1)", "O(n log n)", "O(log n)"], correctOptionIndex: 3, isScenarioBased: false },
        { question: "Which data structure uses LIFO?", options: ["Queue", "Stack", "Tree", "Graph"], correctOptionIndex: 1, isScenarioBased: false },
        { question: "A graph with no cycles is called a...", options: ["Tree", "Clique", "Complete Graph", "Bipartite Graph"], correctOptionIndex: 0, isScenarioBased: false },
        { question: "[SCENARIO] Best structure for a priority queue?", options: ["Array", "Linked List", "Heap", "Hash Map"], correctOptionIndex: 2, isScenarioBased: true },
        { question: "Time complexity of quicksort average?", options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"], correctOptionIndex: 1, isScenarioBased: false }
    ]
};

router.post('/generate', async (req, res) => {
    try {
        const { domain, subdomain, difficulty, length, mode, syllabus } = req.body;
        
        let numQuestions = mode === 'Boss' ? 10 : Math.min(length || 4, 15);
        let dynamicInstruction = "";

        if (mode === 'Syllabus' && syllabus) {
            dynamicInstruction = `
            CRITICAL INSTRUCTION: Ignore all generic knowledge. You MUST generate exactly ${numQuestions} questions STRICTLY based on the following text/syllabus provided:
            "${syllabus.substring(0, 4000)}"
            Do not ask about topics not present in this text.
            `;
        } else if (mode === 'Boss') {
            dynamicInstruction = `Generate exactly ${numQuestions} extremely difficult, tricky questions. This is a survival boss fight. Include trap options.`;
        } else {
            dynamicInstruction = `Domain: ${domain}\nSubdomain: ${subdomain}\nDifficulty: ${difficulty}`;
        }

        const prompt = `
        You are an expert quiz generator. Generate a quiz with exactly ${numQuestions} questions.
        
        ${dynamicInstruction}
        
        Requirements:
        1. All questions MUST have exactly 4 options.
        2. Provide the index of the correct option (0-3).
        3. At least 1 question must be a SCENARIO-BASED practical question.
        4. Do NOT repeat questions.
        
        You must return ONLY a JSON array in the exact format:
        [
            {
                "question": "The question text",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "correctOptionIndex": 0,
                "isScenarioBased": false
            }
        ]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const quizData = JSON.parse(response.text);
        
        // Ensure the AI gave us the exact number we needed (pad with fallback if it failed)
        let finalQuestions = quizData;
        const requestedLength = mode === 'Boss' ? 10 : (length || 5);
        if (finalQuestions.length < requestedLength) {
            const domainFallback = fallbackQuizzes[domain] || fallbackQuizzes["DBMS"];
            while(finalQuestions.length < requestedLength) {
                // Loop through fallbacks
                finalQuestions.push(domainFallback[finalQuestions.length % domainFallback.length]);
            }
        }

        res.json({ questions: finalQuestions });

    } catch (error) {
        console.error("AI Generation Error / 503 Timeout. Using Fallback.");
        let requestedLength = req.body.mode === 'Boss' ? 10 : (req.body.length || 5);
        const domainFallback = fallbackQuizzes[req.body.domain] || fallbackQuizzes["DBMS"];
        
        let finalQuestions = [];
        for(let i=0; i < requestedLength; i++) {
            // Loop the fallback array infinitely until we hit the requested length
            finalQuestions.push(domainFallback[i % domainFallback.length]);
        }
        res.json({ questions: finalQuestions });
    }
});

router.post('/history', async (req, res) => {
    try {
        const { userId, domain, subdomain, score, totalQuestions, timeTaken } = req.body;
        if(!userId) return res.status(400).json({ message: "No userId" });

        const newHistory = new QuizHistory({
            userId, domain, subdomain, score, totalQuestions, timeTaken
        });
        await newHistory.save();
        res.status(201).json(newHistory);
    } catch(err) {
        res.status(500).json({ message: "Failed to save history" });
    }
});

router.get('/history/:userId', async (req, res) => {
    try {
        const history = await QuizHistory.find({ userId: req.params.userId }).sort({ completedAt: -1 }).limit(10);
        res.json(history);
    } catch(err) {
        res.status(500).json({ message: "Failed to fetch history" });
    }
});

router.get('/ghost/:domain', async (req, res) => {
    try {
        const ghosts = await QuizHistory.find({ domain: req.params.domain, totalQuestions: { $gte: 3 } }).limit(10);
        if (ghosts.length > 0) {
            const ghost = ghosts[Math.floor(Math.random() * ghosts.length)];
            res.json({ timeTaken: ghost.timeTaken, score: ghost.score });
        } else {
            res.json({ timeTaken: 25, score: 3 }); 
        }
    } catch(err) {
        res.json({ timeTaken: 25, score: 3 }); 
    }
})

module.exports = router;
