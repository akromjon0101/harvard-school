import React from 'react';
import { stripHtml } from '../../utils/highlightUtils';

/**
 * SummaryCompletion — renders a paragraph in a shaded box with inline gap inputs.
 * Similar to GapFill but visually styled as a "summary box".
 * Props:
 *   data       { questionText: string (with [gap] markers), startNumber, instructionText }
 *   answers    { [qNum]: string }
 *   onChange   (qNum, value) => void
 *   startNumber  override
 */
const SummaryCompletion = ({ data = {}, answers = {}, onChange, startNumber }) => {
    const { questionText = '', instructionText } = data;
    const baseNum = startNumber || data.startNumber || data.questionNumber || 1;

    const parts = questionText ? questionText.split(/\[gap\]/gi) : [''];
    const gapCount = parts.length - 1;
    const rangeHeader = gapCount > 1
        ? `Questions ${baseNum}–${baseNum + gapCount - 1}`
        : `Question ${baseNum}`;

    return (
        <div className="ielts-official-gap-container">
            <div className="ielts-block-header-flex">
                <h4 className="ielts-range-header">{rangeHeader}</h4>
            </div>

            <div className="ip-summary-box">
                {parts.map((part, index) => (
                    <React.Fragment key={index}>
                        <span>{stripHtml(part)}</span>
                        {index < parts.length - 1 && (
                            <span className="ip-gap-inline">
                                <span className="ip-gap-num">{baseNum + index}</span>
                                <input
                                    type="text"
                                    className="ip-gap-input-clean"
                                    value={answers[baseNum + index] || ''}
                                    onChange={e => onChange(baseNum + index, e.target.value)}
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                            </span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default SummaryCompletion;
