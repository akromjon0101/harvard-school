import { useRef, useLayoutEffect } from 'react';

const MultipleChoice = ({ data = {}, value, onChange, qNumber, hideQuestionText }) => {
    const { questionText = '', options = [] } = data;
    const visibleOptions = options.filter(Boolean);
    const qTextRef = useRef(null);
    const optRefsRef = useRef([]);

    // Set innerHTML directly — React never owns these nodes, so mark.js marks survive re-renders
    useLayoutEffect(() => {
        if (qTextRef.current) qTextRef.current.innerHTML = questionText;
    }, [questionText]);

    useLayoutEffect(() => {
        optRefsRef.current.forEach((el, i) => {
            if (el) el.innerHTML = visibleOptions[i] ?? '';
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // options are static exam data — set once on mount

    return (
        <div className="ielts-official-mcq-block">
            <div className="ielts-question-item">
                <div className="q-num-text-flex">
                    <span className="q-num-square">{qNumber}</span>
                    {!hideQuestionText && questionText && (
                        <p ref={qTextRef} className="q-text-bold ip-highlightable" />
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
                                <span
                                    ref={el => { optRefsRef.current[idx] = el; }}
                                    className="opt-label-text ip-highlightable"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MultipleChoice;
