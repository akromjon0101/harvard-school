import React from 'react';
import GapFill from './GapFill';
import MultipleChoice from './MultipleChoice';
import CheckboxGroup from './CheckboxGroup';
import Matching from './Matching';
import TableCompletion from './TableCompletion';
import SummaryCompletion from './SummaryCompletion';
import SummaryPhraseBank from './SummaryPhraseBank';
import MatchingHeadings from './MatchingHeadings';
import ChooseFromBox from './ChooseFromBox';
import TrueFalseNotGiven from './TrueFalseNotGiven';
import { renderHighlightedText, stripHtml } from '../../utils/highlightUtils';

const QuestionRenderer = ({
    type, data, value, onChange, qNumber, hideInstruction,
    // Highlight props for instruction text
    instrHighlights, instrRef, onInstrMouseUp, onInstrClick,
}) => {

    // Shared formatting for MCQ/Matching
    const getOptions = () => {
        if (data.options && data.options.length > 0) return data.options;
        return [data.optionA, data.optionB, data.optionC, data.optionD, data.optionE].filter(Boolean);
    };

    const renderComponent = (hideQText = false) => {
        switch (type) {
            case 'gap-fill':
            case 'completion':
                return (
                    <GapFill
                        data={data}
                        value={value}
                        onChange={onChange}
                        startNumber={data.startNumber || qNumber}
                        qNumber={qNumber}
                    />
                );

            case 'mcq':
            case 'mcq-single':
                return (
                    <MultipleChoice
                        data={data}
                        value={value[qNumber]}
                        onChange={(val) => onChange(qNumber, val)}
                        qNumber={qNumber}
                        hideQuestionText={hideQText}
                    />
                );

            case 'tfng':
            case 'true-false-notgiven':
                return (
                    <TrueFalseNotGiven
                        data={data}
                        value={value}
                        onChange={onChange}
                        startNumber={data.startNumber || qNumber}
                        qNumber={qNumber}
                        hideQuestionText={hideQText}
                    />
                );

            case 'mcq-multi':
            case 'mcq-multiple':
            case 'checkbox':
                return (
                    <CheckboxGroup
                        data={data}
                        options={getOptions()}
                        value={value[qNumber]}
                        onChange={(val) => onChange(qNumber, val)}
                        qNumber={qNumber}
                        endNumber={qNumber + 1}
                        hideQuestionText={hideQText}
                    />
                );

            case 'matching':
            case 'map-labeling':
                return (
                    <Matching
                        data={{ ...data, options: getOptions() }}
                        value={value}
                        onChange={onChange}
                        qNumber={qNumber}
                    />
                );

            case 'table-completion':
                return (
                    <TableCompletion
                        data={data}
                        answers={value}
                        onChange={onChange}
                    />
                );

            case 'summary-completion':
                return (
                    <SummaryCompletion
                        data={data}
                        answers={value}
                        onChange={onChange}
                        startNumber={data.startNumber || qNumber}
                    />
                );

            case 'summary-phrase-bank':
                return (
                    <SummaryPhraseBank
                        data={data}
                        answers={value}
                        onChange={onChange}
                        startNumber={data.startNumber || qNumber}
                    />
                );

            case 'matching-headings':
                return (
                    <MatchingHeadings
                        data={data}
                        answers={value}
                        onChange={onChange}
                        qNumber={qNumber}
                    />
                );

            case 'choose-from-box':
                return (
                    <ChooseFromBox
                        data={data}
                        answers={value}
                        onChange={onChange}
                        qNumber={qNumber}
                    />
                );

            default:
                return <div className="unknown-type">Unknown Type: {type}</div>;
        }
    };

    // Types whose questionText should be included in the highlightable text zone
    // (avoids double-rendering: shown here + hidden inside the component)
    const QTEXT_IN_ZONE = ['mcq', 'mcq-single', 'mcq-multi', 'mcq-multiple', 'checkbox', 'tfng', 'true-false-notgiven']
    const showQTextInZone = QTEXT_IN_ZONE.includes(type) && !!data.questionText

    // Render combined instruction + question text as ONE highlightable zone
    const renderTextZone = () => {
        const showInstr = !hideInstruction && !!data.instructionText
        if (!showInstr && !showQTextInZone) return null

        const hasHighlights = instrHighlights?.length > 0

        if (hasHighlights) {
            // Render plain text with highlight marks; HTML formatting temporarily lost (trade-off)
            const instrPlain = showInstr ? stripHtml(data.instructionText) : ''
            const qPlain     = showQTextInZone ? stripHtml(data.questionText) : ''
            const combined   = instrPlain + qPlain  // no separator — matches DOM textContent
            return (
                <div className="ip-text-zone ip-highlightable" onMouseUp={onInstrMouseUp} onClick={onInstrClick}>
                    {renderHighlightedText(combined, instrHighlights)}
                </div>
            )
        }

        // No highlights: render HTML-aware content
        const instrHtml = showInstr && /<[^>]+>/.test(data.instructionText)
        const qHtml     = showQTextInZone && /<[^>]+>/.test(data.questionText)
        return (
            <div className="ip-text-zone ip-highlightable" onMouseUp={onInstrMouseUp} onClick={onInstrClick}>
                {showInstr && (
                    instrHtml
                        ? <div className="ip-content-instructions" dangerouslySetInnerHTML={{ __html: data.instructionText }} />
                        : <div className="ip-content-instructions">{data.instructionText}</div>
                )}
                {showQTextInZone && (
                    qHtml
                        ? <p className="q-text-bold" dangerouslySetInnerHTML={{ __html: data.questionText }} />
                        : <p className="q-text-bold">{data.questionText}</p>
                )}
            </div>
        )
    }

    return (
        <div className="ielts-question-block-container">
            {renderTextZone()}
            {data.image && (
                <div className="q-block-image-holder" style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <img src={data.image} alt="Task Diagram" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </div>
            )}
            {renderComponent(showQTextInZone)}
        </div>
    );
};

export default QuestionRenderer;
