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

const QuestionRenderer = ({ type, data, value, onChange, qNumber }) => {

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
                    <GapFill
                        data={{ ...data, questionText: data.questionText + " [gap]" }}
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
                        data={data}
                        matchOptions={getOptions()}
                        items={data.matchingItems || []}
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

    return (
        <div className="ielts-question-block-container" style={{ marginBottom: '40px' }}>
            {data.instructionText && (
                <div className="ip-content-instructions">{data.instructionText}</div>
            )}
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
