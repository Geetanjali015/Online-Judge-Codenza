import Editor from '@monaco-editor/react';
import { FiAlertCircle, FiPlay, FiSend } from 'react-icons/fi';

import SubmissionHistory from './SubmissionHistory.jsx';
import VerdictCard from './VerdictCard.jsx';
import { formatMemory, formatRuntime } from '../utils/submissionUtils.js';

const CodeEditorPanel = ({
  activeSubmission,
  code,
  historyError,
  isHistoryLoading,
  isPolling,
  isRunning,
  isSubmitting,
  language,
  onCodeChange,
  onCustomInputChange,
  onLanguageChange,
  onRunCode,
  onRetryPolling,
  onSelectSubmission,
  onTabChange,
  onSubmit,
  pollingError,
  problemHistory,
  runError,
  runResult,
  selectedTab,
  submitError,
  customInput,
}) => {
  const runHasOutput =
    Boolean(runResult?.stdout) ||
    Boolean(runResult?.stderr) ||
    runResult?.exitCode !== undefined;

  return (
    <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
      <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-ink-900 p-5 text-white shadow-soft">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Solution</h2>
            <p className="text-sm text-slate-300">C++ support only in this phase.</p>
          </div>

          <select
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-4 focus:ring-codenza-500/20"
          >
            <option className="text-ink-900" value="cpp">
              C++
            </option>
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10">
          <Editor
            height="520px"
            language="cpp"
            theme="vs-dark"
            value={code}
            onChange={(value) => onCodeChange(value || '')}
            options={{
              automaticLayout: true,
              fontSize: 14,
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: 4,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>

        {submitError && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{submitError}</p>
          </div>
        )}

        {pollingError && (
          <div className="mt-4 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4 text-sm text-orange-100">
            <div className="flex gap-3">
              <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{pollingError}</p>
            </div>
            <button
              type="button"
              onClick={onRetryPolling}
              className="mt-3 rounded-xl bg-white/10 px-4 py-2 text-xs font-black transition hover:bg-white/20"
            >
              Retry status refresh
            </button>
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
          <div className="flex border-b border-white/10">
            {['Input', 'Output'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`px-5 py-3 text-sm font-black transition ${
                  selectedTab === tab
                    ? 'bg-white text-ink-900'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4">
            {selectedTab === 'Input' ? (
              <textarea
                value={customInput}
                onChange={(event) => onCustomInputChange(event.target.value)}
                placeholder="Enter custom input..."
                className="min-h-36 w-full resize-y rounded-2xl border border-white/10 bg-slate-900 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-codenza-500 focus:ring-4 focus:ring-codenza-500/10"
              />
            ) : (
              <div className="min-h-36 rounded-2xl border border-white/10 bg-slate-900 p-4">
                {isRunning && (
                  <div className="flex items-center gap-3 text-sm font-bold text-codenza-100">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-codenza-100 border-t-transparent" />
                    Running code in Docker...
                  </div>
                )}

                {!isRunning && runError && (
                  <div className="flex gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                    <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
                    <p>{runError}</p>
                  </div>
                )}

                {!isRunning && !runError && !runHasOutput && (
                  <p className="text-sm text-slate-400">No output yet</p>
                )}

                {!isRunning && !runError && runHasOutput && (
                  <div className="space-y-4">
                    <div className="grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
                      <span className="rounded-xl bg-white/5 px-3 py-2">
                        Exit Code: <strong>{runResult.exitCode ?? '—'}</strong>
                      </span>
                      <span className="rounded-xl bg-white/5 px-3 py-2">
                        Runtime: <strong>{formatRuntime(runResult.runtimeMs)}</strong>
                      </span>
                      <span className="rounded-xl bg-white/5 px-3 py-2">
                        Memory: <strong>{formatMemory(runResult.memoryKb)}</strong>
                      </span>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        Stdout
                      </p>
                      <pre className="max-h-56 overflow-auto rounded-2xl bg-black/40 p-4 font-mono text-sm leading-6 text-slate-100">
                        <code>{runResult.stdout || 'Empty output'}</code>
                      </pre>
                    </div>

                    {runResult.stderr && (
                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
                          Stderr
                        </p>
                        <pre className="max-h-56 overflow-auto rounded-2xl bg-orange-950/40 p-4 font-mono text-sm leading-6 text-orange-100">
                          <code>{runResult.stderr}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-300">
            {isPolling ? 'Queued or running. Polling every 2 seconds...' : 'Ready to submit.'}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRunCode}
              disabled={isRunning}
              className="btn-secondary gap-2 border-white/20 bg-white/10 px-5 py-3 text-white hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunning ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Running...
                </>
              ) : (
                <>
                  <FiPlay aria-hidden="true" />
                  Run Code
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="btn-primary gap-2 bg-white text-ink-900 hover:bg-codenza-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-900 border-t-transparent" />
                  Queued...
                </>
              ) : (
                <>
                  <FiSend aria-hidden="true" />
                  Submit
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <VerdictCard isPolling={isPolling} submission={activeSubmission} />

      <SubmissionHistory
        error={historyError}
        isLoading={isHistoryLoading}
        onSelectSubmission={onSelectSubmission}
        submissions={problemHistory}
      />
    </aside>
  );
};

export default CodeEditorPanel;
