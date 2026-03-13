import React from 'react';

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];

const MatchingHeadings = ({ data = {}, answers = {}, onChange, qNumber }) => {
    const headings = data.options || [];
    const paragraphs = data.matchingItems || [];
    const baseNum = data.startNumber || data.questionNumber || qNumber || 1;
    const instructionText = data.instructionText;

    const rangeHeader = paragraphs.length > 1
        ? `Questions ${baseNum}–${baseNum + paragraphs.length - 1}`
        : `Question ${baseNum}`;

    return (
        <div className="ielts-official-gap-container">
            <div className="ielts-block-header-flex">
                <h4 className="ielts-range-header">{rangeHeader}</h4>
            </div>

            {headings.length > 0 && (
                <div className="ip-headings-bank">
                    <div className="ip-headings-bank-title">List of Headings</div>
                    {headings.map((h, i) => (
                        <div key={i} className="ip-heading-item">
                            <span className="ip-heading-roman">{ROMAN[i] || String(i + 1)}</span>
                            {h}
                        </div>
                    ))}
                </div>
            )}

            {paragraphs.map((para, i) => {
                const qNum = baseNum + i;
                return (
                    <div key={i} className="ip-match-row">
                        <span className="q-num-square">{qNum}</span>
                        <span className="ip-match-label">{para}</span>
                        <select
                            className="ip-select"
                            value={answers[qNum] || ''}
                            onChange={e => onChange(qNum, e.target.value)}
                        >
                            <option value="">— select —</option>
                            {headings.map((_, hi) => (
                                <option key={hi} value={ROMAN[hi] || String(hi + 1)}>
                                    {ROMAN[hi] || String(hi + 1)}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            })}
        </div>
    );
};

export default MatchingHeadings;
