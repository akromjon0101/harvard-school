import { useRef, useLayoutEffect } from 'react';

const CheckboxGroup = ({ data = {}, value, onChange, qNumber, endNumber, hideQuestionText }) => {
    const { questionText = '', options = [] } = data;
    const currentValues = Array.isArray(value) ? value : [];
    const hasRange = endNumber && endNumber !== qNumber;
    const qLabel = hasRange ? `${qNumber}-${endNumber}` : String(qNumber);
    const qTextRef = useRef(null);
    const optRefsRef = useRef([]);

    useLayoutEffect(() => {
        if (qTextRef.current) qTextRef.current.innerHTML = questionText;
    }, [questionText]);

    useLayoutEffect(() => {
        optRefsRef.current.forEach((el, i) => {
            if (el) el.innerHTML = options[i] ?? '';
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // options are static exam data — set once on mount

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
                    {!hideQuestionText && questionText && (
                        <p ref={qTextRef} className="q-text-bold ip-highlightable" />
                    )}
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

export default CheckboxGroup;
