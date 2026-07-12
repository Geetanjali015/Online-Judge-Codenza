export const COMPLETED_SUBMISSION_STATUSES = [
  'Accepted',
  'Wrong Answer',
  'Compilation Error',
  'Runtime Error',
  'Time Limit Exceeded',
  'Memory Limit Exceeded',
];

export const DEFAULT_CPP_TEMPLATE = `#include<bits/stdc++.h>
using namespace std;

int main(){

    return 0;
}
`;

export const isCompletedSubmission = (submission) =>
  COMPLETED_SUBMISSION_STATUSES.includes(submission?.status) ||
  COMPLETED_SUBMISSION_STATUSES.includes(submission?.verdict);

export const getSubmissionVerdict = (submission) =>
  submission?.verdict || submission?.status || 'Queued';

export const getSubmissionId = (submission) => submission?.id || submission?._id;

export const formatMemory = (memoryKb) => {
  if (memoryKb === null || memoryKb === undefined) return '—';

  if (memoryKb >= 1024) {
    return `${(memoryKb / 1024).toFixed(2)} MB`;
  }

  return `${memoryKb} KB`;
};

export const formatRuntime = (runtimeMs) =>
  runtimeMs === null || runtimeMs === undefined ? '—' : `${runtimeMs} ms`;

export const formatSubmittedAt = (date) => {
  if (!date) return '—';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
};

export const verdictStyles = {
  Accepted: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    panel: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  },
  'Wrong Answer': {
    badge: 'bg-red-50 text-red-700 ring-red-100',
    panel: 'border-red-100 bg-red-50 text-red-800',
  },
  'Compilation Error': {
    badge: 'bg-orange-50 text-orange-700 ring-orange-100',
    panel: 'border-orange-100 bg-orange-50 text-orange-800',
  },
  'Runtime Error': {
    badge: 'bg-orange-50 text-orange-700 ring-orange-100',
    panel: 'border-orange-100 bg-orange-50 text-orange-800',
  },
  'Time Limit Exceeded': {
    badge: 'bg-purple-50 text-purple-700 ring-purple-100',
    panel: 'border-purple-100 bg-purple-50 text-purple-800',
  },
  'Memory Limit Exceeded': {
    badge: 'bg-purple-50 text-purple-700 ring-purple-100',
    panel: 'border-purple-100 bg-purple-50 text-purple-800',
  },
  Queued: {
    badge: 'bg-sky-50 text-sky-700 ring-sky-100',
    panel: 'border-sky-100 bg-sky-50 text-sky-800',
  },
  Running: {
    badge: 'bg-codenza-50 text-codenza-700 ring-codenza-100',
    panel: 'border-codenza-100 bg-codenza-50 text-codenza-800',
  },
};

export const getVerdictStyle = (verdict) =>
  verdictStyles[verdict] || {
    badge: 'bg-slate-50 text-slate-700 ring-slate-100',
    panel: 'border-slate-100 bg-slate-50 text-slate-800',
  };
