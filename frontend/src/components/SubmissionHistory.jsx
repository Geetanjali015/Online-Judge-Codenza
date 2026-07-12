import {
  formatMemory,
  formatRuntime,
  formatSubmittedAt,
  getSubmissionId,
  getSubmissionVerdict,
  getVerdictStyle,
} from "../utils/submissionUtils.js";

const SubmissionHistory = ({
  error,
  isLoading,
  onSelectSubmission,
  submissions,
}) => {
  return (
    <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-white">
          Recent Submissions
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Click a row to inspect submitted code.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-2xl bg-slate-800"
            />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-2xl border border-red-500 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {!isLoading && !error && submissions.length === 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 text-slate-300">
          No submissions for this problem yet.
        </div>
      )}

      {!isLoading && !error && submissions.length > 0 && (
        <div className="space-y-3">
          {submissions.slice(0, 8).map((submission) => {
            const verdict = getSubmissionVerdict(submission);
            const styles = getVerdictStyle(verdict);

            return (
              <button
                key={getSubmissionId(submission)}
                onClick={() => onSelectSubmission(submission)}
                className="grid w-full gap-4 rounded-2xl border border-slate-700 bg-slate-800 p-5 text-left transition-all duration-200 hover:border-cyan-400 hover:bg-slate-700 md:grid-cols-[1fr_0.7fr_0.7fr]"
              >
                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${styles.badge}`}
                  >
                    {verdict}
                  </span>

                  <p className="mt-3 text-xs text-slate-400">
                    {formatSubmittedAt(submission.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-white">
                    {submission.language?.toUpperCase()}
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    Runtime: {formatRuntime(submission.runtimeMs)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-300">
                    Memory: {formatMemory(submission.memoryKb)}
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    Tests: {submission.passedTestCases ?? 0}/
                    {submission.totalTestCases ?? 0}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SubmissionHistory;