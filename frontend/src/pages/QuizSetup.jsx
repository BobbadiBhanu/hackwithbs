import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const DOMAINS = {
    "DBMS": ["SQL Queries", "Normalization (1NF-3NF)", "Transactions & ACID", "Indexing", "NoSQL Concepts"],
    "DSA": ["Arrays & Strings", "Linked Lists", "Trees & Graphs", "Dynamic Programming", "Sorting Algorithms"],
    "Java": ["OOP Basics", "Multithreading", "Collections Framework", "JVM Architecture", "Exception Handling"],
    "General Tech": ["Git & GitHub", "REST APIs", "Cloud Computing", "Cybersecurity Basics"]
};

// Tooltips for context
const MODE_DESCRIPTIONS = {
    "Classic": "⏱️ Standard quiz format against the clock. Ghost Racing is activated so you can race historical players.",
    "Boss": "🐉 Survival Mode: You get 3 Health Hearts. If you answer wrong, you lose a heart. The AI generates brutal questions. Survive till the end to win huge Global XP multipliers.",
    "Syllabus": "📚 RAG Mode: Upload a PDF of your lecture notes or paste text. The AI will strictly map the quiz to your direct classroom context."
};

const QuizSetup = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState({
        mode: 'Classic', 
        domain: 'DBMS',
        subdomain: DOMAINS["DBMS"][0],
        difficulty: 'Medium',
        length: 5,
        syllabus: ""
    });
    
    const [isParsingPdf, setIsParsingPdf] = useState(false);

    const handleDomainChange = (e) => {
        const newDomain = e.target.value;
        setConfig({
            ...config,
            domain: newDomain,
            subdomain: DOMAINS[newDomain][0]
        });
    };

    const handleChange = (e) => setConfig({ ...config, [e.target.name]: e.target.value });

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') return;
        
        setIsParsingPdf(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let extractedText = "";
            const maxPagesToRead = Math.min(10, pdf.numPages); // Limit to 10 pages for speed/tokens
            
            for (let i = 1; i <= maxPagesToRead; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(" ");
                extractedText += pageText + "\n";
            }
            
            setConfig(prev => ({ ...prev, syllabus: prev.syllabus + "\n" + extractedText }));
        } catch (err) {
            alert("Could not process PDF. Please try pasting the text manually.");
            console.error(err);
        }
        setIsParsingPdf(false);
    };

    const startQuiz = () => {
        navigate('/quiz', { state: { config } });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '4rem 2rem' }}>
            <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Configure Your Challenge</h2>
            
            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Mode Selector */}
                <div>
                    <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Select Game Mode 🎮</label>
                    <select name="mode" value={config.mode} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--accent-primary)', background: '#1e293b', color: 'white', fontWeight: 'bold' }}>
                        <option value="Classic">⚔️ Classic</option>
                        <option value="Boss">🐉 Boss Fight</option>
                        <option value="Syllabus">📚 Custom Syllabus</option>
                    </select>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '6px' }}>
                        {MODE_DESCRIPTIONS[config.mode]}
                    </p>
                </div>

                {config.mode === 'Syllabus' ? (
                    <div>
                        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1rem 0' }} />
                        <label style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '0.5rem' }}>Inject Context via Upload (PDF)</label>
                        <div style={{ marginBottom: '1rem' }}>
                            <input type="file" accept=".pdf" onChange={handlePdfUpload} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--accent-primary)', borderRadius: '8px', color: 'white' }} />
                            {isParsingPdf && <span style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>⏳ Extracting exact syllabus text via React PDF.js...</span>}
                        </div>

                        <label style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '0.5rem' }}>Or Paste Manually</label>
                        <textarea 
                            name="syllabus" 
                            value={config.syllabus} 
                            onChange={handleChange} 
                            rows="6"
                            placeholder="Data extracted from your PDF will appear here, or you can type/paste notes..."
                            style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#1e293b', color: 'white' }}
                        ></textarea>
                    </div>
                ) : (
                    <>
                        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '0' }} />
                        <div>
                            <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Core Domain</label>
                            <select name="domain" value={config.domain} onChange={handleDomainChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#1e293b', color: 'white' }}>
                                {Object.keys(DOMAINS).map(dom => (
                                    <option key={dom} value={dom}>{dom}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Specific Subtopic</label>
                            <select name="subdomain" value={config.subdomain} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#1e293b', color: 'white' }}>
                                {DOMAINS[config.domain].map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                
                {config.mode === 'Classic' && (
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Difficulty</label>
                            <select name="difficulty" value={config.difficulty} onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: '#1e293b', color: 'white' }}>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Number of Questions</label>
                            <input type="number" name="length" value={config.length} min="3" max="15" onChange={handleChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                        </div>
                    </div>
                )}

                <button className="btn-primary" onClick={startQuiz} style={{ marginTop: '1rem', fontSize: '1.2rem', background: config.mode === 'Boss' ? 'var(--danger)' : 'var(--accent-primary)' }}>
                    {config.mode === 'Boss' ? 'Enter the Boss Fight' : 'Generate Arena'}
                </button>
            </div>
        </div>
    );
};

export default QuizSetup;
