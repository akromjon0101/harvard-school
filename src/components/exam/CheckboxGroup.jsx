import React from 'react';

const CheckboxGroup = ({ data = {}, value, onChange, qNumber, endNumber }) => {
    const { questionText = '', options = [] } = data;
    const currentValues = Array.isArray(value) ? value : [];
    const hasRange = endNumber && endNumber !== qNumber;
    const qLabel = hasRange ? `${qNumber}-${endNumber}` : String(qNumber);

    const toggleOption = (letter) => {
        if (currentValues.includes(letter)) {
            onChange(currentValues.filter(v => v !== letter));
        } else {
            onChange([...currentValues, letter]);
        }
    };

    return (
        <div className="ielts-official-mcq-block">
            <div className="ielts-question-item">
                <div className="q-num-text-flex">
                    <span className="q-num-square q-num-wide">{qLabel}</span>
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
