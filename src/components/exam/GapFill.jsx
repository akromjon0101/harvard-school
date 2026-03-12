import React from 'react';

const GapFill = ({ data = {}, value = {}, onChange, startNumber, qNumber }) => {
    const { questionText = '', instructionText } = data;
    const parts = questionText ? questionText.split(/\[gap\]/gi) : [''];
    const baseNum = startNumber || qNumber;

    const handleInputChange = (gapIdx, val) => {
        onChange(baseNum + gapIdx, val);
    };

    const gapCount = parts.length - 1;
    const endNumber = baseNum + (gapCount > 0 ? gapCount - 1 : 0);
    const rangeHeader = gapCount > 1
        ? `Questions ${baseNum}–${endNumber}`
        : `Question ${baseNum}`;

    return (
        <div className="ielts-official-gap-container">
            <div className="ielts-block-header-flex">
                <h4 className="ielts-range-header">{rangeHeader}</h4>
                {instructionText && <p className="ielts-instruction-italic-small">{instructionText}</p>}
            </div>

            <div className="ip-gapfill-text">
                {parts.map((part, index) => (
                    <React.Fragment key={index}>
                        <span>{part}</span>
                        {index < parts.length - 1 && (
                            <span className="ip-gap-inline">
                                <span className="ip-gap-num">{baseNum + index}</span>
                                <input
                                    type="text"
                                    className="ip-gap-input-clean"
                                    value={value[baseNum + index] || ''}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
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

export default GapFill;
