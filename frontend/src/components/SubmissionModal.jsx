import Editor from '@monaco-editor/react';
import { FiX } from 'react-icons/fi';

import {
  formatMemory,
  formatRuntime,
  formatSubmittedAt,
  getSubmissionVerdict,
  getVerdictStyle,
} from '../utils/submissionUtils.js';

const SubmissionModal = ({ onClose, submission }) => {
  if (!submission) return null;

  const verdict = getSubmissionVerdict(submission);
  const styles = getVerdictStyle(verdict);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-ink-900 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${styles.badge}`}
            >
              {verdict}
            </span>
            <h2 className="mt-3 text-2xl font-black">Submission details</h2>
            <p className="mt-1 text-sm text-slate-300">
              {formatSubmittedAt(submission.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-slate-200 transition hover:bg-white/20"
            aria-label="Close submission modal"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-slate-400">Language</p>
              <p className="mt-1 font-black">{submission.language?.toUpperCase()}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-slate-400">Runtime</p>
              <p className="mt-1 font-black">{formatRuntime(submission.runtimeMs)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-slate-400">Memory</p>
              <p className="mt-1 font-black">{formatMemory(submission.memoryKb)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-slate-400">Test Cases</p>
              <p className="mt-1 font-black">
                {submission.passedTestCases ?? 0}/{submission.totalTestCases ?? 0}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10">
            <Editor
              height="520px"
              language="cpp"
              theme="vs-dark"
              value={submission.code || ''}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;
