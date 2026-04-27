import React from 'react';
import { stripHtml } from '../../utils/highlightUtils';

/**
 * Summary with phrase bank A–J: passage has [gap] blanks, user selects one letter per blank.
 * data: { questionText, options (A–J phrases), startNumber, instructionText }
 * answers: { [qNum]: letter }
 */
const SummaryPhraseBank = ({ data = {}, answers = {}, onChange, startNumber }) => {
    const questionText = data.questionText || '';
    const options = data.options || [];
    const baseNum = startNumber || data.startNumber || data.questionNumber || 1;
    const instructionText = data.instructionText;

    const parts = questionText.split(/\[gap\]/gi);
    const gapCount = Math.max(0, parts.length - 1);
    const rangeHeader = gapCount > 1
        ? `Questions ${baseNum}–${baseNum + gapCount - 1}`
        : `Question ${baseNum}`;

    return (
        <div className="ielts-official-gap-container">
            <div className="ielts-block-header-flex">
                <h4 className="ielts-range-header">{rangeHeader}</h4>
            </div>
            {options.length > 0 && (
                <div className="ip-word-bank" style={{ marginBottom: '16px' }}>
                    <div className="ip-word-bank-title">Phrases</div>
                    {options.slice(0, 10).map((opt, i) => (
                        <span key={i} className="ip-word-bank-item">
                            <strong>{String.fromCharCode(65 + i)}</strong>&nbsp;{stripHtml(opt)}
                        </span>
                    ))}
                </div>
            )}
            <div className="ip-summary-box">
                {parts.map((part, index) => (
                    <React.Fragment key={index}>
                        <span>{stripHtml(part)}</span>
                        {index < parts.length - 1 && (
                            <span className="ip-gap-inline">
                                <span className="ip-gap-num">{baseNum + index}</span>
                                <select
                                    className="ip-gap-select-clean"
                                    value={answers[baseNum + index] || ''}
                                    onChange={e => onChange(baseNum + index, e.target.value)}
                                >
                                    <option value="">—</option>
                                    {options.slice(0, 10).map((_, oi) => (
                                        <option key={oi} value={String.fromCharCode(65 + oi)}>
                                            {String.fromCharCode(65 + oi)}
                                        </option>
                                    ))}
                                </select>
                            </span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default SummaryPhraseBank;
