import React from 'react';

const MultipleChoice = ({ data = {}, value, onChange, qNumber, hideQuestionText }) => {
    const { questionText = '', options = [] } = data;
    const visibleOptions = options.filter(Boolean);

    return (
        <div className="ielts-official-mcq-block">
            <div className="ielts-question-item">
                <div className="q-num-text-flex">
                    <span className="q-num-square">{qNumber}</span>
                    {!hideQuestionText && questionText && (
                        <p className="q-text-bold ip-highlightable" dangerouslySetInnerHTML={{ __html: questionText }} />
                    )}
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
                                <span className="opt-label-text ip-highlightable" dangerouslySetInnerHTML={{ __html: opt }} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MultipleChoice;
