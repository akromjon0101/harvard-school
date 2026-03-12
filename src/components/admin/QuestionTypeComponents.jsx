import { useState } from 'react'
import ImageUploader from './ImageUploader'

// 1. Multiple Choice - Single Answer
export function MultipleChoiceSingle({ question, onChange }) {
    const [options, setOptions] = useState(question?.options || ['', '', '', ''])
    const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer || '')

    const updateOption = (index, value) => {
        const newOptions = [...options]
        newOptions[index] = value
        setOptions(newOptions)
        onChange({ ...question, options: newOptions, correctAnswer })
    }

    const addOption = () => {
        setOptions([...options, ''])
    }

    const removeOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index)
        setOptions(newOptions)
        onChange({ ...question, options: newOptions, correctAnswer })
    }

    return (
        <div className="question-form">
            <h4>Multiple Choice - Single Answer</h4>

            <div className="form-group">
                <label>Options:</label>
                {options.map((opt, idx) => (
                    <div key={idx} className="option-row">
                        <input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            onChange={(e) => updateOption(idx, e.target.value)}
                        />
                        {options.length > 2 && (
                            <button onClick={() => removeOption(idx)} className="btn-remove">✕</button>
                        )}
                    </div>
                ))}
                <button onClick={addOption} className="btn-add">+ Add Option</button>
            </div>

            <div className="form-group">
                <label>Correct Answer:</label>
                <select value={correctAnswer} onChange={(e) => {
                    setCorrectAnswer(e.target.value)
                    onChange({ ...question, options, correctAnswer: e.target.value })
                }}>
                    <option value="">Select correct answer</option>
                    {options.map((opt, idx) => (
                        <option key={idx} value={opt}>{String.fromCharCode(65 + idx)}. {opt}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

// 2. Multiple Choice - Multiple Answers
export function MultipleChoiceMultiple({ question, onChange }) {
    const [options, setOptions] = useState(question?.options || ['', '', '', ''])
    const [correctAnswers, setCorrectAnswers] = useState(question?.correctAnswer || [])
    const [numberOfAnswers, setNumberOfAnswers] = useState(question?.numberOfAnswers || 2)

    const updateOption = (index, value) => {
        const newOptions = [...options]
        newOptions[index] = value
        setOptions(newOptions)
        onChange({ ...question, options: newOptions, correctAnswer: correctAnswers, numberOfAnswers })
    }

    const toggleAnswer = (option) => {
        let newAnswers
        if (correctAnswers.includes(option)) {
            newAnswers = correctAnswers.filter(a => a !== option)
        } else {
            if (correctAnswers.length < numberOfAnswers) {
                newAnswers = [...correctAnswers, option]
            } else {
                alert(`You can only select ${numberOfAnswers} correct answers`)
                return
            }
        }
        setCorrectAnswers(newAnswers)
        onChange({ ...question, options, correctAnswer: newAnswers, numberOfAnswers })
    }

    return (
        <div className="question-form">
            <h4>Multiple Choice - Multiple Answers</h4>

            <div className="form-group">
                <label>Number of Correct Answers:</label>
                <select value={numberOfAnswers} onChange={(e) => {
                    const num = parseInt(e.target.value)
                    setNumberOfAnswers(num)
                    setCorrectAnswers([])
                    onChange({ ...question, numberOfAnswers: num, correctAnswer: [] })
                }}>
                    <option value={2}>2 answers</option>
                    <option value={3}>3 answers</option>
                </select>
            </div>

            <div className="form-group">
                <label>Options:</label>
                {options.map((opt, idx) => (
                    <div key={idx} className="option-row">
                        <input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            onChange={(e) => updateOption(idx, e.target.value)}
                        />
                    </div>
                ))}
            </div>

            <div className="form-group">
                <label>Select {numberOfAnswers} Correct Answers:</label>
                {options.filter(o => o).map((opt, idx) => (
                    <label key={idx} className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={correctAnswers.includes(opt)}
                            onChange={() => toggleAnswer(opt)}
                        />
                        {String.fromCharCode(65 + idx)}. {opt}
                    </label>
                ))}
            </div>
        </div>
    )
}

// 3. Matching
export function MatchingForm({ question, onChange }) {
    const [items, setItems] = useState(question?.items || ['', '', '', '', ''])
    const [matchOptions, setMatchOptions] = useState(question?.matchOptions || ['', '', '', '', ''])
    const [correctMatches, setCorrectMatches] = useState(question?.correctMatches || {})

    const updateItem = (index, value) => {
        const newItems = [...items]
        newItems[index] = value
        setItems(newItems)
        onChange({ ...question, items: newItems, matchOptions, correctMatches })
    }

    const updateMatchOption = (index, value) => {
        const newOptions = [...matchOptions]
        newOptions[index] = value
        setMatchOptions(newOptions)
        onChange({ ...question, items, matchOptions: newOptions, correctMatches })
    }

    const updateMatch = (item, option) => {
        const newMatches = { ...correctMatches, [item]: option }
        setCorrectMatches(newMatches)
        onChange({ ...question, items, matchOptions, correctMatches: newMatches })
    }

    return (
        <div className="question-form">
            <h4>Matching</h4>

            <div className="form-group">
                <label>Items to Match:</label>
                {items.map((item, idx) => (
                    <input
                        key={idx}
                        type="text"
                        placeholder={`Item ${idx + 1}`}
                        value={item}
                        onChange={(e) => updateItem(idx, e.target.value)}
                    />
                ))}
            </div>

            <div className="form-group">
                <label>Match Options:</label>
                {matchOptions.map((opt, idx) => (
                    <input
                        key={idx}
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={(e) => updateMatchOption(idx, e.target.value)}
                    />
                ))}
            </div>

            <div className="form-group">
                <label>Correct Matches:</label>
                {items.filter(i => i).map((item, idx) => (
                    <div key={idx} className="match-row">
                        <span>{item} →</span>
                        <select
                            value={correctMatches[item] || ''}
                            onChange={(e) => updateMatch(item, e.target.value)}
                        >
                            <option value="">Select match</option>
                            {matchOptions.filter(o => o).map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    )
}

// 4. Map/Plan/Diagram Labelling
export function LabellingForm({ question, onChange, type = 'map' }) {
    const [imageUrl, setImageUrl] = useState(question?.imageUrl || null)
    const [labels, setLabels] = useState(question?.labels || [])
    const [correctAnswers, setCorrectAnswers] = useState(question?.correctAnswer || [])

    const handleImageUpload = (base64) => {
        setImageUrl(base64)
        onChange({ ...question, imageUrl: base64, labels, correctAnswer: correctAnswers })
    }

    const addLabel = () => {
        const newLabel = { position: { x: 50, y: 50 }, labelNumber: labels.length + 1 }
        const newLabels = [...labels, newLabel]
        setLabels(newLabels)
        setCorrectAnswers([...correctAnswers, ''])
        onChange({ ...question, imageUrl, labels: newLabels, correctAnswer: [...correctAnswers, ''] })
    }

    const updateAnswer = (index, value) => {
        const newAnswers = [...correctAnswers]
        newAnswers[index] = value
        setCorrectAnswers(newAnswers)
        onChange({ ...question, imageUrl, labels, correctAnswer: newAnswers })
    }

    return (
        <div className="question-form">
            <h4>{type.charAt(0).toUpperCase() + type.slice(1)} Labelling</h4>

            <div className="form-group">
                <label>Upload {type}:</label>
                <ImageUploader onImageUpload={handleImageUpload} currentImage={imageUrl} />
            </div>

            {imageUrl && (
                <>
                    <div className="form-group">
                        <label>Number of Labels:</label>
                        <button onClick={addLabel} className="btn-add">+ Add Label</button>
                        <p className="hint">Labels will be numbered automatically</p>
                    </div>

                    <div className="form-group">
                        <label>Correct Answers (in order):</label>
                        {correctAnswers.map((ans, idx) => (
                            <input
                                key={idx}
                                type="text"
                                placeholder={`Answer for label ${idx + 1}`}
                                value={ans}
                                onChange={(e) => updateAnswer(idx, e.target.value)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

// 5. Form/Note/Table/Flow-chart Completion
export function CompletionForm({ question, onChange, templateType = 'form' }) {
    const [template, setTemplate] = useState(question?.template || '')
    const [blanks, setBlanks] = useState(question?.blanks || [{ blankNumber: 1, position: '' }])
    const [correctAnswers, setCorrectAnswers] = useState(question?.correctAnswer || [''])
    const [maxWords, setMaxWords] = useState(question?.maxWords || 3)
    const [diagramImage, setDiagramImage] = useState(question?.imageUrl || '')

    const updateTemplate = (value) => {
        setTemplate(value)
        onChange({ ...question, templateType, template: value, blanks, correctAnswer: correctAnswers, maxWords, imageUrl: diagramImage })
    }

    const addBlank = () => {
        const newBlanks = [...blanks, { blankNumber: blanks.length + 1, position: '' }]
        setBlanks(newBlanks)
        setCorrectAnswers([...correctAnswers, ''])
        onChange({ ...question, templateType, template, blanks: newBlanks, correctAnswer: [...correctAnswers, ''], maxWords, imageUrl: diagramImage })
    }

    const updateAnswer = (index, value) => {
        const newAnswers = [...correctAnswers]
        newAnswers[index] = value
        setCorrectAnswers(newAnswers)
        onChange({ ...question, templateType, template, blanks, correctAnswer: newAnswers, maxWords, imageUrl: diagramImage })
    }

    const handleDiagramUpload = (base64) => {
        setDiagramImage(base64)
        onChange({ ...question, templateType, template, blanks, correctAnswer: correctAnswers, maxWords, imageUrl: base64 })
    }

    return (
        <div className="question-form">
            <h4>{templateType.charAt(0).toUpperCase() + templateType.slice(1)} Completion</h4>

            {(templateType === 'diagram' || templateType === 'table') && (
                <div className="form-group">
                    <label>Diagram/Table Image (Optional):</label>
                    <ImageUploader onImageUpload={handleDiagramUpload} currentImage={diagramImage} />
                </div>
            )}

            <div className="form-group">
                <label>Max Words:</label>
                <select value={maxWords} onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setMaxWords(val)
                    onChange({ ...question, maxWords: val, imageUrl: diagramImage })
                }}>
                    <option value={1}>1 word</option>
                    <option value={2}>2 words</option>
                    <option value={3}>3 words</option>
                </select>
                <p className="hint">NO MORE THAN {maxWords} WORD{maxWords > 1 ? 'S' : ''} AND/OR A NUMBER</p>
            </div>

            <div className="form-group">
                <label>{templateType} Template (use ___ for blanks):</label>
                <textarea
                    rows={8}
                    placeholder={`Enter your ${templateType} template here. Use ___ to mark blanks.`}
                    value={template}
                    onChange={(e) => updateTemplate(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Blanks:</label>
                <button onClick={addBlank} className="btn-add">+ Add Blank</button>
                {blanks.map((blank, idx) => (
                    <div key={idx} className="blank-row">
                        <span>Blank {idx + 1}:</span>
                        <input
                            type="text"
                            placeholder="Correct answer"
                            value={correctAnswers[idx] || ''}
                            onChange={(e) => updateAnswer(idx, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

// 6. Sentence Completion
export function SentenceCompletionForm({ question, onChange }) {
    const [sentences, setSentences] = useState(question?.sentences || [''])
    const [correctAnswers, setCorrectAnswers] = useState(question?.correctAnswer || [''])
    const [maxWords, setMaxWords] = useState(question?.maxWords || 3)

    const updateSentence = (index, value) => {
        const newSentences = [...sentences]
        newSentences[index] = value
        setSentences(newSentences)
        onChange({ ...question, sentences: newSentences, correctAnswer: correctAnswers, maxWords })
    }

    const addSentence = () => {
        setSentences([...sentences, ''])
        setCorrectAnswers([...correctAnswers, ''])
    }

    const updateAnswer = (index, value) => {
        const newAnswers = [...correctAnswers]
        newAnswers[index] = value
        setCorrectAnswers(newAnswers)
        onChange({ ...question, sentences, correctAnswer: newAnswers, maxWords })
    }

    return (
        <div className="question-form">
            <h4>Sentence Completion</h4>

            <div className="form-group">
                <label>Max Words:</label>
                <select value={maxWords} onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setMaxWords(val)
                    onChange({ ...question, maxWords: val })
                }}>
                    <option value={1}>1 word</option>
                    <option value={2}>2 words</option>
                    <option value={3}>3 words</option>
                </select>
            </div>

            <div className="form-group">
                <label>Sentences (use ___ for blanks):</label>
                <button onClick={addSentence} className="btn-add">+ Add Sentence</button>
                {sentences.map((sent, idx) => (
                    <div key={idx} className="sentence-row">
                        <input
                            type="text"
                            placeholder={`Sentence ${idx + 1} (use ___ for blank)`}
                            value={sent}
                            onChange={(e) => updateSentence(idx, e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Correct answer"
                            value={correctAnswers[idx] || ''}
                            onChange={(e) => updateAnswer(idx, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

// 7. Short Answer
export function ShortAnswerForm({ question, onChange }) {
    const [answer, setAnswer] = useState(question?.correctAnswer || '')
    const [maxWords, setMaxWords] = useState(question?.maxWords || 3)

    const updateAnswer = (value) => {
        setAnswer(value)
        onChange({ ...question, correctAnswer: value, maxWords })
    }

    return (
        <div className="question-form">
            <h4>Short Answer</h4>

            <div className="form-group">
                <label>Max Words:</label>
                <select value={maxWords} onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setMaxWords(val)
                    onChange({ ...question, maxWords: val })
                }}>
                    <option value={1}>1 word</option>
                    <option value={2}>2 words</option>
                    <option value={3}>3 words</option>
                </select>
            </div>

            <div className="form-group">
                <label>Correct Answer:</label>
                <input
                    type="text"
                    placeholder="Enter the correct answer"
                    value={answer}
                    onChange={(e) => updateAnswer(e.target.value)}
                />
                <p className="hint">Students can answer with NO MORE THAN {maxWords} WORD{maxWords > 1 ? 'S' : ''} AND/OR A NUMBER</p>
            </div>
        </div>
    )
}

// 8. Picture Choice (Visual MCQ)
export function PictureChoiceForm({ question, onChange }) {
    const [pictureOptions, setPictureOptions] = useState(question?.pictureOptions || [null, null, null])
    const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer || 0)

    const handleImageUpload = (index, base64) => {
        const newPictures = [...pictureOptions]
        newPictures[index] = base64
        setPictureOptions(newPictures)
        onChange({ ...question, pictureOptions: newPictures, correctAnswer })
    }

    const addPicture = () => {
        setPictureOptions([...pictureOptions, null])
    }

    return (
        <div className="question-form">
            <h4>Picture Choice</h4>

            <div className="form-group">
                <label>Picture Options:</label>
                <button onClick={addPicture} className="btn-add">+ Add Picture</button>
                <div className="picture-grid">
                    {pictureOptions.map((pic, idx) => (
                        <div key={idx} className="picture-option">
                            <p>Option {String.fromCharCode(65 + idx)}</p>
                            <ImageUploader
                                onImageUpload={(base64) => handleImageUpload(idx, base64)}
                                currentImage={pic}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label>Correct Answer:</label>
                <select value={correctAnswer} onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setCorrectAnswer(val)
                    onChange({ ...question, pictureOptions, correctAnswer: val })
                }}>
                    <option value="">Select correct picture</option>
                    {pictureOptions.map((_, idx) => (
                        <option key={idx} value={idx}>Picture {String.fromCharCode(65 + idx)}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

// 9. Classification
export function ClassificationForm({ question, onChange }) {
    const [items, setItems] = useState(question?.items || ['', '', '', ''])
    const [categories, setCategories] = useState(question?.categories || ['', '', ''])
    const [correctClassification, setCorrectClassification] = useState(question?.correctClassification || {})

    const updateItem = (index, value) => {
        const newItems = [...items]
        newItems[index] = value
        setItems(newItems)
        onChange({ ...question, items: newItems, categories, correctClassification })
    }

    const updateCategory = (index, value) => {
        const newCategories = [...categories]
        newCategories[index] = value
        setCategories(newCategories)
        onChange({ ...question, items, categories: newCategories, correctClassification })
    }

    const updateClassification = (item, category) => {
        const newClassification = { ...correctClassification, [item]: category }
        setCorrectClassification(newClassification)
        onChange({ ...question, items, categories, correctClassification: newClassification })
    }

    return (
        <div className="question-form">
            <h4>Classification</h4>

            <div className="form-group">
                <label>Items to Classify:</label>
                {items.map((item, idx) => (
                    <input
                        key={idx}
                        type="text"
                        placeholder={`Item ${idx + 1}`}
                        value={item}
                        onChange={(e) => updateItem(idx, e.target.value)}
                    />
                ))}
            </div>

            <div className="form-group">
                <label>Categories:</label>
                {categories.map((cat, idx) => (
                    <input
                        key={idx}
                        type="text"
                        placeholder={`Category ${String.fromCharCode(65 + idx)}`}
                        value={cat}
                        onChange={(e) => updateCategory(idx, e.target.value)}
                    />
                ))}
            </div>

            <div className="form-group">
                <label>Correct Classification:</label>
                {items.filter(i => i).map((item, idx) => (
                    <div key={idx} className="classification-row">
                        <span>{item} →</span>
                        <select
                            value={correctClassification[item] || ''}
                            onChange={(e) => updateClassification(item, e.target.value)}
                        >
                            <option value="">Select category</option>
                            {categories.filter(c => c).map((cat, i) => (
                                <option key={i} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    )
}

// 10. Number Completion
export function NumberCompletionForm({ question, onChange }) {
    const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer || '')
    const [acceptedFormats, setAcceptedFormats] = useState(question?.acceptedFormats || [''])

    const updateFormat = (index, value) => {
        const newFormats = [...acceptedFormats]
        newFormats[index] = value
        setAcceptedFormats(newFormats)
        onChange({ ...question, correctAnswer, acceptedFormats: newFormats })
    }

    const addFormat = () => {
        setAcceptedFormats([...acceptedFormats, ''])
    }

    return (
        <div className="question-form">
            <h4>Number Completion</h4>

            <div className="form-group">
                <label>Correct Answer:</label>
                <input
                    type="text"
                    placeholder="e.g., £50, 50, 3 weeks"
                    value={correctAnswer}
                    onChange={(e) => {
                        setCorrectAnswer(e.target.value)
                        onChange({ ...question, correctAnswer: e.target.value, acceptedFormats })
                    }}
                />
            </div>

            <div className="form-group">
                <label>Accepted Formats (alternative answers):</label>
                <button onClick={addFormat} className="btn-add">+ Add Format</button>
                {acceptedFormats.map((format, idx) => (
                    <input
                        key={idx}
                        type="text"
                        placeholder={`Alternative format ${idx + 1}`}
                        value={format}
                        onChange={(e) => updateFormat(idx, e.target.value)}
                    />
                ))}
                <p className="hint">e.g., "£50", "50", "fifty pounds"</p>
            </div>
        </div>
    )
}
