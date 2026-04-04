import React from 'react';

const MultipleChoice = ({ data = {}, value, onChange, qNumber }) => {
    const { questionText = '', options = [] } = data;
    const visibleOptions = options.filter(Boolean);

    return (
        <div className="ielts-official-mcq-block">

            <div className="ielts-question-item">
                <div className="q-num-text-flex">
                    <span className="q-num-square">{qNumber}</span>
                    <p className="q-text-bold">{questionText}</p>
                </div>
                <div className="ielts-options-grid">
                    {visibleOptions.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isActive = value === letter || value === opt;
                        return (
                            <div
                                key={idx}
                                className={`ielts-option-row-official${isActive ? ' selected' : ''}`}
                                onClick={() => onChange(letter)}
                            >
                                <span className="opt-circle">{letter}</span>
                                <span className="opt-label-text">{opt}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MultipleChoice;
