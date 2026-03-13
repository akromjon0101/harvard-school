import React from 'react';

const GapFill = ({ data = {}, value = {}, onChange, startNumber, qNumber }) => {
    const { questionText = '' } = data;
    const baseNum = startNumber || qNumber;

    // Split into lines first, then each line into parts by [gap]
    const rawLines = questionText.split(/\n/);
    let gapCounter = 0;
    const lines = rawLines
        .map(line => {
            const parts = line.split(/\[gap\]/gi);
            const gapNums = parts.slice(0, -1).map(() => baseNum + gapCounter++);
            return { parts, gapNums };
        })
        .filter(({ parts }) => parts.some(p => p.trim()) || /* has gap */ true);

    const totalGaps = gapCounter;
    const endNum = baseNum + (totalGaps > 0 ? totalGaps - 1 : 0);
    const rangeHeader = totalGaps > 1
        ? `Questions ${baseNum}–${endNum}`
        : `Question ${baseNum}`;

    return (
        <div className="ielts-official-gap-container">
            <div className="ielts-block-header-flex">
                <h4 className="ielts-range-header">{rangeHeader}</h4>
            </div>

            <div className="ip-gapfill-lines">
                {lines.map(({ parts, gapNums }, lineIdx) => {
                    const isEmpty = parts.every(p => !p.trim()) && gapNums.length === 0;
                    if (isEmpty) return null;
                    return (
                        <p key={lineIdx} className="ip-gapfill-line">
                            {parts.map((part, pIdx) => (
                                <React.Fragment key={pIdx}>
                                    {part}
                                    {pIdx < gapNums.length && (
                                        <span className="ip-gap-inline">
                                            <span className="ip-gap-num">{gapNums[pIdx]}</span>
                                            <input
                                                type="text"
                                                className="ip-gap-input-clean"
                                                value={value[gapNums[pIdx]] || ''}
                                                onChange={e => onChange(gapNums[pIdx], e.target.value)}
                                                autoComplete="off"
                                                spellCheck="false"
                                            />
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}
                        </p>
                    );
                })}
            </div>
        </div>
    );
};

export default GapFill;
