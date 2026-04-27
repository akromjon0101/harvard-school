import React from 'react';
import { stripHtml } from '../../utils/highlightUtils';

/**
 * TableCompletion — renders a table where cells may contain inline [gap] blanks.
 *
 * Cell string format (admin): any text with [gap] markers anywhere inside:
 *   - "Kale"                              → plain text cell
 *   - "[gap]"                             → whole cell is a blank
 *   - "a handful of 7 [gap] (type of seaweed)" → inline blank after text, with note
 *   - "beans and a [gap] for dessert"     → inline blank mid-sentence
 *
 * Each [gap] in reading order gets the next sequential question number.
 *
 * Props:
 *   data     { tableData: { headers: string[], rows: string[][] }, startNumber, instructionText }
 *   answers  { [qNum]: string }
 *   onChange (qNum, value) => void
 */
const TableCompletion = ({ data = {}, answers = {}, onChange }) => {
    const { tableData, startNumber, instructionText } = data;
    const headers = tableData?.headers || [];
    const rows = tableData?.rows || [];

    // Pre-pass: assign question numbers to every [gap] occurrence, in row-major order.
    // cellMap[ri][ci] = number[]  — one entry per [gap] in that cell
    let qCounter = startNumber || data.questionNumber || 1;
    const cellMap = [];
    rows.forEach((row, ri) => {
        cellMap[ri] = [];
        row.forEach((cell, ci) => {
            const occurrences = (cell || '').match(/\[gap\]/gi) || [];
            cellMap[ri][ci] = occurrences.map(() => qCounter++);
        });
    });

    const totalGaps = qCounter - (startNumber || data.questionNumber || 1);
    const baseNum = startNumber || data.questionNumber || 1;
    const rangeHeader = totalGaps > 1
        ? `Questions ${baseNum}–${baseNum + totalGaps - 1}`
        : `Question ${baseNum}`;

    /**
     * Render a cell that has one or more inline gaps.
     * Split by [gap] → alternate text segments and input fields.
     */
    const renderGapCell = (cell, qNums, ci) => {
        const segments = cell.split(/\[gap\]/i);
        return (
            <td key={ci}>
                <div className="ip-table-cell-inner">
                    {segments.map((seg, si) => (
                        <React.Fragment key={si}>
                            {seg && (
                                <span className="ip-table-cell-text">{stripHtml(seg)}</span>
                            )}
                            {si < qNums.length && (
                                <span className="ip-gap-inline">
                                    <span className="ip-gap-num">{qNums[si]}</span>
                                    <input
                                        type="text"
                                        className="ip-gap-input-clean"
                                        style={{ width: '110px', maxWidth: '110px' }}
                                        value={answers[qNums[si]] || ''}
                                        onChange={e => onChange(qNums[si], e.target.value)}
                                        autoComplete="off"
                                        spellCheck="false"
                                    />
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </td>
        );
    };

    return (
        <div className="ielts-official-gap-container">
            <div className="ielts-block-header-flex">
                <h4 className="ielts-range-header">{rangeHeader}</h4>
            </div>

            <table className="ip-ielts-table">
                {headers.length > 0 && (
                    <thead>
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i}>{stripHtml(h)}</th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {rows.map((row, ri) => (
                        <tr key={ri}>
                            {row.map((cell, ci) => {
                                const qNums = cellMap[ri]?.[ci] || [];
                                if (qNums.length > 0) {
                                    return renderGapCell(cell, qNums, ci);
                                }
                                return <td key={ci}>{stripHtml(cell)}</td>;
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableCompletion;
