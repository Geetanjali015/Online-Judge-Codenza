import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiAlertCircle } from 'react-icons/fi';

import CodeEditorPanel from '../components/CodeEditorPanel.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import SubmissionModal from '../components/SubmissionModal.jsx';
import useProblem from '../hooks/useProblem.js';
import useRunCode from '../hooks/useRunCode.js';
import useSubmission from '../hooks/useSubmission.js';
import { DEFAULT_CPP_TEMPLATE } from '../utils/submissionUtils.js';

const renderMultilineText = (text) => {
  if (!text) return null;

  return String(text)
    .split('\n')
    .map((line, index) => (
      <p key={`${line}-${index}`} className="mb-3 leading-8 text-slate-700">
        {line || '\u00A0'}
      </p>
    ));
};

const CodeBlock = ({ children }) => {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-ink-900 p-4 text-sm leading-6 text-slate-100 shadow-inner">
      <code>{children || 'Not provided'}</code>
    </pre>
  );
};

const DetailSkeleton = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="animate-pulse rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-soft">
        <div className="h-8 w-2/3 rounded-full bg-slate-200" />
        <div className="mt-5 h-5 w-40 rounded-full bg-slate-100" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="h-4 rounded-full bg-slate-100"
            />
          ))}
        </div>
      </div>
      <div className="hidden animate-pulse rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-soft lg:block">
        <div className="h-64 rounded-3xl bg-slate-100" />
      </div>
    </div>
  );
};

const ProblemDetailsPage = () => {
  const { id } = useParams();
  const { error, isLoading, problem } = useProblem(id);
  const {
    clearResult,
    error: runError,
    execute: executeRunCode,
    isRunning,
    result: runResult,
  } = useRunCode();
  const {
    activeSubmission,
    createSubmission,
    historyError,
    isHistoryLoading,
    isPolling,
    isSubmitting,
    pollingError,
    problemHistory,
    retryPolling,
    submitError,
  } = useSubmission(id);
  const [code, setCode] = useState(() => {
    const savedCode = localStorage.getItem(`codenza_editor_${id}`);
    return savedCode || DEFAULT_CPP_TEMPLATE;
  });
  const [language, setLanguage] = useState('cpp');
  const [customInput, setCustomInput] = useState(() => {
    return localStorage.getItem(`codenza_custom_input_${id}`) || '';
  });
  const [selectedTab, setSelectedTab] = useState('Input');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [lastSubmittedCode, setLastSubmittedCode] = useState('');
  const sampleTests = problem?.sampleTests || [];

  useEffect(() => {
    const savedCode = localStorage.getItem(`codenza_editor_${id}`);
    setCode(savedCode || DEFAULT_CPP_TEMPLATE);
    setCustomInput(localStorage.getItem(`codenza_custom_input_${id}`) || '');
    setSelectedTab('Input');
    clearResult();
    setLastSubmittedCode('');
  }, [clearResult, id]);

  useEffect(() => {
    localStorage.setItem(`codenza_editor_${id}`, code);
  }, [code, id]);

  useEffect(() => {
    localStorage.setItem(`codenza_custom_input_${id}`, customInput);
  }, [customInput, id]);

  useEffect(() => {
    const warnBeforeUnload = (event) => {
      const hasUnsavedCode =
        code.trim().length > 0 &&
        code !== DEFAULT_CPP_TEMPLATE &&
        code !== lastSubmittedCode;

      if (!hasUnsavedCode) return undefined;

      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', warnBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
    };
  }, [code, lastSubmittedCode]);

  const handleSubmit = async () => {
    const submission = await createSubmission({
      code,
      language,
    });

    if (submission) {
      setLastSubmittedCode(code);
    }
  };

  const handleCodeChange = (nextCode) => {
    setCode(nextCode);
    clearResult();
  };

  const handleRunCode = async () => {
    setSelectedTab('Output');
    await executeRunCode({
      code,
      input: customInput,
      language,
    });
  };

  return (
    <section className="container-shell py-10 lg:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/problems"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-codenza-700"
        >
          ← Back to problems
        </Link>
      </div>

      {isLoading && <DetailSkeleton />}

      {!isLoading && error && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-red-700">
          <div className="flex gap-3">
            <FiAlertCircle className="mt-1 shrink-0" aria-hidden="true" />
            <div>
              <h1 className="text-xl font-black">Could not load problem</h1>
              <p className="mt-2">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && problem && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]">
          <article className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft md:p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-ink-900 md:text-4xl">
                  {problem.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  {(problem.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <section className="border-t border-slate-100 pt-6">
              <h2 className="mb-4 text-xl font-black text-ink-900">Problem Statement</h2>
              <div className="text-base">{renderMultilineText(problem.statement)}</div>
            </section>

            <section className="mt-8">
              <h2 className="mb-4 text-xl font-black text-ink-900">Constraints</h2>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                {problem.constraints ? (
                  renderMultilineText(problem.constraints)
                ) : (
                  <p className="text-slate-500">No constraints provided.</p>
                )}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-4 text-xl font-black text-ink-900">Sample Tests</h2>
              {sampleTests.length > 0 ? (
                <div className="space-y-5">
                  {sampleTests.map((sample, index) => (
                    <div
                      key={`${sample.input}-${index}`}
                      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
                    >
                      <h3 className="mb-3 font-black text-ink-900">
                        Sample {index + 1}
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <p className="mb-2 text-sm font-bold text-slate-600">
                            Sample Input
                          </p>
                          <CodeBlock>{sample.input}</CodeBlock>
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-bold text-slate-600">
                            Sample Output
                          </p>
                          <CodeBlock>{sample.output}</CodeBlock>
                        </div>

                        {sample.explanation && (
                          <div>
                            <p className="mb-2 text-sm font-bold text-slate-600">
                              Explanation
                            </p>
                            <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                              {renderMultilineText(sample.explanation)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-slate-500">
                  No sample tests provided.
                </div>
              )}
            </section>

            <section className="mt-8">
              <h2 className="mb-4 text-xl font-black text-ink-900">Explanation</h2>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-slate-600">
                {problem.explanation
                  ? renderMultilineText(problem.explanation)
                  : 'No explanation provided for this problem yet.'}
              </div>
            </section>
          </article>

          <CodeEditorPanel
            activeSubmission={activeSubmission}
            code={code}
            historyError={historyError}
            customInput={customInput}
            isHistoryLoading={isHistoryLoading}
            isPolling={isPolling}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            language={language}
            onCodeChange={handleCodeChange}
            onCustomInputChange={setCustomInput}
            onLanguageChange={setLanguage}
            onRunCode={handleRunCode}
            onRetryPolling={retryPolling}
            onSelectSubmission={setSelectedSubmission}
            onTabChange={setSelectedTab}
            onSubmit={handleSubmit}
            pollingError={pollingError}
            problemHistory={problemHistory}
            runError={runError}
            runResult={runResult}
            selectedTab={selectedTab}
            submitError={submitError}
          />
        </div>
      )}

      <SubmissionModal
        onClose={() => setSelectedSubmission(null)}
        submission={selectedSubmission}
      />
    </section>
  );
};

export default ProblemDetailsPage;
