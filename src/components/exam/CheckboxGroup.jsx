import React from 'react';

const CheckboxGroup = ({ data = {}, value, onChange, qNumber, endNumber }) => {
    const { questionText = '', options = [], instructionText } = data;
    const currentValues = Array.isArray(value) ? value : [];

    const toggleOption = (letter) => {
        if (currentValues.includes(letter)) {
            onChange(currentValues.filter(v => v !== letter));
        } else {
            onChange([...currentValues, letter]);
        }
    };

    const qLabel = endNumber && endNumber !== qNumber ? `${qNumber}–${endNumber}` : qNumber;

    return (
        <div className="ielts-official-mcq-block">
            {instructionText && <p className="ielts-instruction-italic">{instructionText}</p>}
            <div className="ielts-question-item">
                <div className="q-num-text-flex">
                    <span className="q-num-square">{qLabel}</span>
                    <p className="q-text-bold">{questionText}</p>
                </div>
                <div className="ielts-options-grid">
                    {options.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isActive = currentValues.includes(letter) || currentValues.includes(opt);
                        return (
                            <div
                                key={idx}
                                className={`ielts-option-row-official${isActive ? ' selected' : ''}`}
                                onClick={() => toggleOption(letter)}
                            >
                                <span className="opt-circle opt-square">{letter}</span>
                                <span className="opt-label-text">{opt}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CheckboxGroup;
