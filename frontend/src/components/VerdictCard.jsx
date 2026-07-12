import { FiClock, FiCpu, FiDatabase, FiTarget } from 'react-icons/fi';

import {
  formatMemory,
  formatRuntime,
  formatSubmittedAt,
  getSubmissionVerdict,
  getVerdictStyle,
} from '../utils/submissionUtils.js';

const VerdictCard = ({ isPolling, submission }) => {
  if (!submission) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
        Submit your code to see queue status and verdict here.
      </div>
    );
  }

  const verdict = getSubmissionVerdict(submission);
  const styles = getVerdictStyle(verdict);

  return (
    <div className={`rounded-3xl border p-5 ${styles.panel}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">
            Submission Status
          </p>
          <h3 className="mt-2 text-2xl font-black">{isPolling ? 'Judging...' : verdict}</h3>
        </div>

        {isPolling && (
          <span className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent opacity-70" />
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/60 p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <FiCpu aria-hidden="true" />
            Runtime
          </div>
          <p className="mt-2 font-black">{formatRuntime(submission.runtimeMs)}</p>
        </div>

        <div className="rounded-2xl bg-white/60 p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <FiDatabase aria-hidden="true" />
            Memory
          </div>
          <p className="mt-2 font-black">{formatMemory(submission.memoryKb)}</p>
        </div>

        <div className="rounded-2xl bg-white/60 p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <FiTarget aria-hidden="true" />
            Test Cases
          </div>
          <p className="mt-2 font-black">
            {submission.passedTestCases ?? 0}/{submission.totalTestCases ?? 0}
          </p>
        </div>

        <div className="rounded-2xl bg-white/60 p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <FiClock aria-hidden="true" />
            Submitted
          </div>
          <p className="mt-2 font-black">{formatSubmittedAt(submission.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default VerdictCard;
