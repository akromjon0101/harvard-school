import React from 'react';

const DEFAULT_OPTIONS = ['TRUE', 'FALSE', 'NOT GIVEN'];

const TrueFalseNotGiven = ({ data = {}, value = {}, onChange, startNumber, qNumber, hideQuestionText }) => {
    const baseNum = startNumber || qNumber || 1;
    const options = data._tfngOptions || DEFAULT_OPTIONS;
    // If questionText is rendered in outer zone (hideQuestionText), still need statements for buttons
    const statements = (data.questionText || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

    if (statements.length === 0) return null;

    const endNum = baseNum + statements.length - 1;
    const rangeHeader = statements.length > 1
        ? `Questions ${baseNum}–${endNum}`
        : `Question ${baseNum}`;

    return (
        <div className="ielts-official-gap-container">
            <div className="ielts-block-header-flex">
                <h4 className="ielts-range-header">{rangeHeader}</h4>
            </div>
            <div className="ip-tfng-list">
                {statements.map((statement, i) => {
                    const qNum = baseNum + i;
                    const selected = value[qNum] || '';
                    return (
                        <div key={i} className={`ip-tfng-row${selected ? ' ip-tfng-answered' : ''}`}>
                            <span className="q-num-square">{qNum}</span>
                            {/* Statement text is always shown here even if also in outer zone;
                                outer zone shows it for highlighting, TFNG shows it with buttons */}
                            <span className="ip-tfng-statement" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
                                {statement}
                            </span>
                            <div className="ip-tfng-options">
                                {options.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        className={`ip-tfng-btn${selected === opt ? ' active' : ''}`}
                                        data-val={opt}
                                        onClick={() => onChange(qNum, opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TrueFalseNotGiven;
