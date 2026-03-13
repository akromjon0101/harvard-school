import React from 'react';

const ChooseFromBox = ({ data = {}, answers = {}, onChange, qNumber }) => {
    const options = data.options || [];
    const items = data.matchingItems || [];
    const baseNum = data.startNumber || data.questionNumber || qNumber || 1;
    const instructionText = data.instructionText;
    const boxTitle = data.boxTitle || 'Word Bank';

    const rangeHeader = items.length > 1
        ? `Questions ${baseNum}–${baseNum + items.length - 1}`
        : `Question ${baseNum}`;

    const usedLetters = new Set(
        items.map((_, i) => answers[baseNum + i]).filter(Boolean)
    );

    return (
        <div className="ielts-official-gap-container">
            <div className="ielts-block-header-flex">
                <h4 className="ielts-range-header">{rangeHeader}</h4>
            </div>

            {/* Word bank */}
            {options.length > 0 && (
                <div className="ip-word-bank">
                    <div className="ip-word-bank-title">{boxTitle}</div>
                    {options.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const isUsed = usedLetters.has(letter);
                        return (
                            <span
                                key={i}
                                className={`ip-word-bank-item${isUsed ? ' used' : ''}`}
                            >
                                <strong>{letter}</strong>&nbsp;{opt}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Items: [num+select grouped] [text] */}
            {items.map((item, i) => {
                const qNum = baseNum + i;
                return (
                    <div key={i} className="ip-cfb-row">
                        {/* num + select tightly grouped */}
                        <div className="ip-cfb-answer">
                            <span className="ip-cfb-num">{qNum}</span>
                            <select
                                className="ip-cfb-select"
                                value={answers[qNum] || ''}
                                onChange={e => onChange(qNum, e.target.value)}
                            >
                                <option value="">—</option>
                                {options.map((_, oi) => {
                                    const letter = String.fromCharCode(65 + oi);
                                    return (
                                        <option key={oi} value={letter}>{letter}</option>
                                    );
                                })}
                            </select>
                        </div>
                        <span className="ip-cfb-text">{item}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default ChooseFromBox;
