import React, { useEffect, useState } from 'react';

const QuestionForm = ({ question, onChange, activeModule }) => {
    const [uploading, setUploading] = useState(false);

    const updateField = (field, value) => {
        onChange({ ...question, [field]: value });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
                body: formData
            });
            const data = await response.json();
            if (data.url) {
                updateField('image', data.url);
            }
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...(question.options || [])];
        newOptions[index] = value;
        updateField('options', newOptions);
    };

    const addOption = () => {
        updateField('options', [...(question.options || []), '']);
    };

    const removeOption = (index) => {
        const newOptions = (question.options || []).filter((_, i) => i !== index);
        updateField('options', newOptions);
    };

    const gapCount = (question.questionText?.match(/\[gap\]/gi) || []).length;
    const itemsCount = question.matchingItems?.length || 0;

    let totalCount = 0;
    if (question.type === 'gap-fill') totalCount = gapCount;
    else if (question.type === 'matching' || question.type === 'map-labeling') totalCount = itemsCount;
    else totalCount = 1;

    const endNumber = (question.startNumber || question.questionNumber) + (totalCount > 0 ? totalCount - 1 : 0);
    const rangeDisplay = totalCount > 1
        ? `Questions ${question.startNumber || question.questionNumber}–${endNumber}`
        : `Question ${question.startNumber || question.questionNumber}`;

    const handleGapAnswerChange = (index, val) => {
        const currentAnswers = Array.isArray(question.correctAnswers) ? [...question.correctAnswers] : [];
        currentAnswers[index] = val;
        updateField('correctAnswers', currentAnswers);
    };

    const insertGap = () => {
        const textarea = document.getElementById(`q-text-${question.questionNumber}`);
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const newText = before + '[gap]' + after;
        updateField('questionText', newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 5, start + 5);
        }, 0);
    };

    // Auto-init defaults based on activeModule
    useEffect(() => {
        if ((question.type === 'mcq' || question.type === 'mcq-multi') && (!question.options || question.options.length === 0)) {
            updateField('options', ['', '', '', '']);
        }

        if (!question.instructionText) {
            if (question.type === 'gap-fill') {
                const defaultGapIns = activeModule === 'reading' ? 'Choose NO MORE THAN TWO WORDS from the passage' : 'ONE WORD ONLY';
                updateField('instructionText', defaultGapIns);
            }
            if (question.type === 'mcq') updateField('instructionText', 'Choose the correct letter, A, B or C');
            if (question.type === 'tfng') updateField('instructionText', 'TRUE / FALSE / NOT GIVEN');
            if (question.type === 'matching') updateField('instructionText', 'Match the following items (A-G) with the questions');
            if (question.type === 'mcq-multi') updateField('instructionText', 'Choose TWO letters, A-E');
            if (question.type === 'map-labeling') updateField('instructionText', 'Label the map below. Write the correct letter, A-H, next to Questions X-Y.');
        }
    }, [question.type, activeModule]);

    
    const setCommonInstruction = (text) => updateField('instructionText', text);

    return (
        <div className="modern-q-form">
            <div className="range-badge">
                {rangeDisplay}
            </div>

            <div className="q-grid-header">
                <div className="unit-col">
                    <label className="input-label-premium">Starting Q#</label>
                    <input
                        type="number"
                        className="small-input"
                        value={question.startNumber || question.questionNumber}
                        onChange={(e) => updateField('startNumber', parseInt(e.target.value))}
                    />
                </div>
                <div className="unit-col" style={{ flex: 1 }}>
                    <label className="input-label-premium">Question Type</label>
                    <select className="type-pill" value={question.type} onChange={(e) => updateField('type', e.target.value)}>
                        <option value="gap-fill">Gap Fill / Completion</option>
                        <option value="mcq">MCQ (Single Choice)</option>
                        <option value="tfng">True / False / Not Given</option>
                        <option value="mcq-multi">MCQ (Multiple Choice)</option>
                        <option value="matching">Matching (List to ABCD)</option>
                        <option value="map-labeling">Map / Diagram Labeling</option>
                    </select>
                </div>
            </div>

            {/* Instruction Area with Helpers */}
            <div className="q-content-area-modern">
                <div className="label-with-helper">
                    <label className="input-label-premium">Task Instruction</label>
                    <div className="instruction-helpers">
                        <button onClick={() => setCommonInstruction('ONE WORD ONLY')}>ONE</button>
                        <button onClick={() => setCommonInstruction('NO MORE THAN TWO WORDS')}>TWO</button>
                        <button onClick={() => setCommonInstruction('NO MORE THAN THREE WORDS')}>THREE</button>
                        <button onClick={() => setCommonInstruction('ONE WORD AND/OR A NUMBER')}>WORD/NUM</button>
                    </div>
                </div>
                <input
                    type="text"
                    className="instruction-input"
                    value={question.instructionText || ''}
                    onChange={(e) => updateField('instructionText', e.target.value)}
                    placeholder="e.g. ONE WORD ONLY"
                />

                {/* Optional Per-Question Image */}
                <div className="per-question-image-upload" style={{ margin: '15px 0' }}>
                    <label className="input-label-premium">Diagram / Image for this block (Optional)</label>
                    <div className={`upload-zone-mini ${question.image ? 'active' : ''}`}>
                        <input type="file" onChange={handleFileUpload} />
                        <span>{question.image ? '🖼️ Image Attached' : '➕ Add Block Image'}</span>
                    </div>
                    {question.image && (
                        <div className="img-preview-mini">
                            <img src={question.image} alt="Preview" style={{ height: '60px', marginTop: '10px', borderRadius: '4px' }} />
                            <button className="btn-clear-img" onClick={() => updateField('image', null)}>✕ Remove</button>
                        </div>
                    )}
                </div>

                <div className="label-with-helper" style={{ marginTop: '20px' }}>
                    <label className="input-label-premium">Heading / Main Question Text</label>
                    {question.type === 'gap-fill' && (
                        <button onClick={insertGap} className="btn-gap-helper-alt">+ Insert [gap]</button>
                    )}
                </div>
                <textarea
                    id={`q-text-${question.questionNumber}`}
                    className="modern-textarea-q"
                    value={question.questionText || ''}
                    onChange={(e) => updateField('questionText', e.target.value)}
                    placeholder="Enter text here. For Gap Fill, use [gap] tags."
                />
            </div>

            {/* Matching / Map Items Builder */}
            {(question.type === 'matching' || question.type === 'map-labeling') && (
                <div className="q-options-container-modern" style={{ marginTop: '25px', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px' }}>
                    <div className="options-header-row">
                        <label className="input-label-premium">List of Items (e.g. 16. Farm shop)</label>
                        <button className="btn-add-choice-mini" onClick={() => updateField('matchingItems', [...(question.matchingItems || []), ''])}>+ Add Item</button>
                    </div>
                    {question.matchingItems?.map((item, i) => (
                        <div key={i} className="variant-row-modern">
                            <span className="variant-letter">{(question.startNumber || question.questionNumber) + i}</span>
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                    const newItems = [...question.matchingItems];
                                    newItems[i] = e.target.value;
                                    updateField('matchingItems', newItems);
                                }}
                                placeholder="Enter item name..."
                            />
                            <button className="btn-remove-choice" onClick={() => {
                                const newItems = question.matchingItems.filter((_, idx) => idx !== i);
                                updateField('matchingItems', newItems);
                            }}>✕</button>
                        </div>
                    ))}
                </div>
            )}

            {/* ABC Choices */}
            {((question.type === 'mcq' || question.type === 'mcq-multi' || question.type === 'matching' || question.type === 'map-labeling')) && (
                <div className="q-options-container-modern" style={{ marginTop: '20px' }}>
                    <div className="options-header-row">
                        <label className="input-label-premium">Choices (A, B, C...)</label>
                        <button className="btn-add-choice-mini" onClick={addOption}>+ Add Choice</button>
                    </div>
                    {question.options?.map((opt, i) => (
                        <div key={i} className="variant-row-modern">
                            <span className="variant-letter">{String.fromCharCode(65 + i)}</span>
                            <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleOptionChange(i, e.target.value)}
                                placeholder="Choice text..."
                            />
                            <button className="btn-remove-choice" onClick={() => removeOption(i)}>✕</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Multi-gap Answers */}
            {question.type === 'gap-fill' && gapCount > 0 && (
                <div className="gap-answers-container-modern">
                    <label className="input-label-premium">Correct Answers for Gaps</label>
                    <div className="gap-grid-modern">
                        {[...Array(gapCount)].map((_, i) => (
                            <div key={i} className="gap-ans-item">
                                <span className="ans-num">{(question.startNumber || question.questionNumber) + i}</span>
                                <input
                                    type="text"
                                    value={(question.correctAnswers || [])[i] || ''}
                                    onChange={(e) => handleGapAnswerChange(i, e.target.value)}
                                    placeholder="Answer..."
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Single Answer or Matching KEY */}
            {question.type !== 'gap-fill' && (
                <div className="single-ans-row-modern" style={{ marginTop: '20px' }}>
                    <label className="input-label-premium">Correct Answer(s) / KEY</label>
                    <input
                        type="text"
                        className="ans-field-premium"
                        value={question.correctAnswer || ''}
                        onChange={(e) => updateField('correctAnswer', e.target.value)}
                        placeholder="e.g. A, B, C or TRUE"
                    />
                </div>
            )}
        </div>
    );
};

export default QuestionForm;
