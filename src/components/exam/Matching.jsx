import React from 'react';
import { stripHtml } from '../../utils/highlightUtils';

const Matching = ({ data = {}, value = {}, onChange, qNumber }) => {
    const { questionText = '', options = [], matchingItems = [], instructionText } = data;
    const baseNum = data.startNumber || qNumber;

    const rangeHeader = matchingItems.length > 1
        ? `Questions ${baseNum}–${baseNum + matchingItems.length - 1}`
        : `Question ${baseNum}`;

    return (
        <div className="ielts-official-matching-block">
            <div className="ielts-block-header-flex">
                <h4 className="ielts-range-header">{rangeHeader}</h4>
            </div>

            {questionText && (
                <p className="match-question-stem">{stripHtml(questionText)}</p>
            )}

            {options.length > 0 && (
                <div className="matching-options-box-official">
                    {options.map((opt, idx) => (
                        <div key={idx} className="match-opt-item-official">
                            <span className="match-opt-letter">{String.fromCharCode(65 + idx)}</span>
                            <span className="match-opt-text">{stripHtml(opt)}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="matching-questions-list-official">
                {matchingItems.map((item, i) => {
                    const itemNum = baseNum + i;
                    return (
                        <div key={i} className="match-row-official">
                            <span className="q-num-square">{itemNum}</span>
                            <span className="match-item-text">{stripHtml(item)}</span>
                            <input
                                type="text"
                                className="match-answer-input"
                                maxLength="2"
                                placeholder="—"
                                value={value[itemNum] || ''}
                                onChange={e => onChange(itemNum, e.target.value.toUpperCase())}
                                autoComplete="off"
                                spellCheck="false"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Matching;
