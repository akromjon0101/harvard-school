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

    const renderComponent = () => {
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

    // Render instruction text: supports HTML markup (from rich text editor) and highlights
    const renderInstruction = () => {
        if (!data.instructionText || hideInstruction) return null

        const hasHighlights = instrHighlights?.length > 0
        // When highlights exist, render plain text + marks; otherwise render HTML (supports bold/size)
        const plainText = stripHtml(data.instructionText)

        if (hasHighlights) {
            return (
                <div
                    ref={instrRef}
                    className="ip-content-instructions ip-highlightable"
                    onMouseUp={onInstrMouseUp}
                    onClick={onInstrClick}
                >
                    {renderHighlightedText(plainText, instrHighlights)}
                </div>
            )
        }

        // Check if content has HTML tags (rich text from admin)
        const hasHtml = /<[^>]+>/.test(data.instructionText)
        if (hasHtml) {
            return (
                <div
                    ref={instrRef}
                    className="ip-content-instructions ip-highlightable"
                    onMouseUp={onInstrMouseUp}
                    onClick={onInstrClick}
                    dangerouslySetInnerHTML={{ __html: data.instructionText }}
                />
            )
        }

        return (
            <div
                ref={instrRef}
                className="ip-content-instructions ip-highlightable"
                onMouseUp={onInstrMouseUp}
                onClick={onInstrClick}
            >
                {data.instructionText}
            </div>
        )
    }

    return (
        <div className="ielts-question-block-container">
            {renderInstruction()}
            {data.image && (
                <div className="q-block-image-holder" style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <img src={data.image} alt="Task Diagram" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </div>
            )}
            {renderComponent()}
        </div>
    );
};

export default QuestionRenderer;
