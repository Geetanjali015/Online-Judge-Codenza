const mongoose = require('mongoose');

const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');

const ACCEPTED_VERDICT = 'Accepted';
const FINAL_STATUSES = new Set([
  'Accepted',
  'Wrong Answer',
  'Runtime Error',
  'Compilation Error',
  'Time Limit Exceeded',
  'Memory Limit Exceeded',
]);

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const DIFFICULTY_WEIGHTS = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

const AI_CODE_REVIEW_FALLBACK_SCORE = 50;

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const clampScore = (score) => Math.max(0, Math.min(100, score));

const roundScore = (score) => Math.round(clampScore(Number.isFinite(score) ? score : 0));

const getIdString = (value) => {
  if (!value) return null;
  return value._id ? value._id.toString() : value.toString();
};

const isJudgedSubmission = (submission) =>
  FINAL_STATUSES.has(submission.verdict) || FINAL_STATUSES.has(submission.status);

const isAcceptedSubmission = (submission) =>
  submission.verdict === ACCEPTED_VERDICT || submission.status === ACCEPTED_VERDICT;

const getSubmissionVerdict = (submission) => submission.verdict || submission.status;

const getUtcDateKey = (date) => {
  const value = new Date(date);
  return value.toISOString().slice(0, 10);
};

const countLongestConsecutiveDateStreak = (dateKeys) => {
  if (dateKeys.length === 0) return 0;

  const sortedDays = [...dateKeys].sort();
  let longestStreak = 1;
  let currentStreak = 1;

  for (let index = 1; index < sortedDays.length; index += 1) {
    const previousDate = new Date(`${sortedDays[index - 1]}T00:00:00.000Z`);
    const currentDate = new Date(`${sortedDays[index]}T00:00:00.000Z`);
    const differenceInDays = Math.round(
      (currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (differenceInDays === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return longestStreak;
};

const calculateTopicCoverage = (problems, solvedProblemIds) => {
  const topicStats = new Map();

  problems.forEach((problem) => {
    const tags = Array.isArray(problem.tags) ? [...new Set(problem.tags)] : [];

    tags.forEach((tag) => {
      if (!topicStats.has(tag)) {
        topicStats.set(tag, {
          availableProblems: 0,
          solvedProblems: new Set(),
        });
      }

      const stats = topicStats.get(tag);
      stats.availableProblems += 1;

      if (solvedProblemIds.has(problem._id.toString())) {
        stats.solvedProblems.add(problem._id.toString());
      }
    });
  });

  const topicScores = {};

  topicStats.forEach((stats, tag) => {
    topicScores[tag] = roundScore(
      (stats.solvedProblems.size / Math.max(stats.availableProblems, 1)) * 100
    );
  });

  const topicScoreValues = Object.values(topicScores);

  // Topic coverage rewards breadth. Each tag contributes equally, so repeatedly
  // solving one high-volume topic cannot hide untouched topics.
  const topicCoverageScore =
    topicScoreValues.length === 0
      ? 0
      : roundScore(
          topicScoreValues.reduce((total, score) => total + score, 0) /
            topicScoreValues.length
        );

  return {
    topicCoverageScore,
    topicScores,
  };
};

const calculateFirstAttemptAcceptance = (submissions) => {
  const submissionsByProblem = new Map();

  submissions
    .filter(isJudgedSubmission)
    .forEach((submission) => {
      const problemId = getIdString(submission.problem);
      if (!problemId) return;

      if (!submissionsByProblem.has(problemId)) {
        submissionsByProblem.set(problemId, []);
      }

      submissionsByProblem.get(problemId).push(submission);
    });

  let firstAttemptAcceptedProblems = 0;

  submissionsByProblem.forEach((problemSubmissions) => {
    const [firstJudgedAttempt] = problemSubmissions.sort(
      (left, right) => new Date(left.createdAt) - new Date(right.createdAt)
    );

    if (firstJudgedAttempt && getSubmissionVerdict(firstJudgedAttempt) === ACCEPTED_VERDICT) {
      firstAttemptAcceptedProblems += 1;
    }
  });

  const totalAttemptedProblems = submissionsByProblem.size;

  return totalAttemptedProblems === 0
    ? 0
    : roundScore((firstAttemptAcceptedProblems / totalAttemptedProblems) * 100);
};

const calculateExecutionEfficiency = (submissions, problemById) => {
  const bestAcceptedScoreByProblem = new Map();

  submissions.filter(isAcceptedSubmission).forEach((submission) => {
    const problemId = getIdString(submission.problem);
    const problem = problemById.get(problemId);
    if (!problem) return;

    const componentScores = [];

    /*
     * Resource normalization:
     *   usageScore = 100 - (actualUsage / configuredLimit) * 100
     *
     * A solution using 10% of the limit scores 90 for that resource, a solution
     * at the limit scores 0, and values outside the range are clamped to 0..100.
     * Runtime and memory are averaged when both are available. If Docker memory
     * stats were unavailable, runtime alone is used instead of penalizing the user.
     */
    if (submission.runtimeMs !== null && problem.timeLimitMs > 0) {
      componentScores.push(
        clampScore(100 - (submission.runtimeMs / problem.timeLimitMs) * 100)
      );
    }

    if (submission.memoryKb !== null && problem.memoryLimitMb > 0) {
      const memoryLimitKb = problem.memoryLimitMb * 1024;
      componentScores.push(
        clampScore(100 - (submission.memoryKb / memoryLimitKb) * 100)
      );
    }

    const submissionScore =
      componentScores.length === 0
        ? AI_CODE_REVIEW_FALLBACK_SCORE
        : componentScores.reduce((total, score) => total + score, 0) /
          componentScores.length;

    const previousBestScore = bestAcceptedScoreByProblem.get(problemId);

    if (previousBestScore === undefined || submissionScore > previousBestScore) {
      bestAcceptedScoreByProblem.set(problemId, submissionScore);
    }
  });

  const scores = [...bestAcceptedScoreByProblem.values()];

  return scores.length === 0
    ? 0
    : roundScore(scores.reduce((total, score) => total + score, 0) / scores.length);
};

const calculateDifficultyPerformance = (problems, solvedProblemIds) => {
  const difficultyScores = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
  };

  const difficultyStats = DIFFICULTIES.reduce((stats, difficulty) => {
    stats[difficulty] = {
      available: 0,
      solved: 0,
    };
    return stats;
  }, {});

  problems.forEach((problem) => {
    if (!difficultyStats[problem.difficulty]) return;

    difficultyStats[problem.difficulty].available += 1;

    if (solvedProblemIds.has(problem._id.toString())) {
      difficultyStats[problem.difficulty].solved += 1;
    }
  });

  let weightedSolved = 0;
  let weightedAvailable = 0;

  DIFFICULTIES.forEach((difficulty) => {
    const stats = difficultyStats[difficulty];
    const weight = DIFFICULTY_WEIGHTS[difficulty];

    difficultyScores[difficulty] =
      stats.available === 0 ? 0 : roundScore((stats.solved / stats.available) * 100);

    /*
     * Difficulty performance rewards harder solves deterministically by applying
     * fixed credits: Easy=1, Medium=2, Hard=3. The denominator uses all available
     * problems, keeping the score normalized between 0 and 100.
     */
    weightedSolved += stats.solved * weight;
    weightedAvailable += stats.available * weight;
  });

  const difficultyPerformanceScore =
    weightedAvailable === 0 ? 0 : roundScore((weightedSolved / weightedAvailable) * 100);

  return {
    difficultyPerformanceScore,
    difficultyScores,
  };
};

const calculateCodingConsistency = (submissions) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const activeDateKeys = new Set();

  submissions.forEach((submission) => {
    const createdAt = new Date(submission.createdAt);

    if (createdAt >= thirtyDaysAgo && createdAt <= now) {
      activeDateKeys.add(getUtcDateKey(createdAt));
    }
  });

  const activeDays = activeDateKeys.size;
  const longestStreak = countLongestConsecutiveDateStreak([...activeDateKeys]);

  /*
   * Consistency is based on unique active days, not submission volume:
   *   - 70% comes from reaching 15 active days in the last 30 days.
   *   - 30% comes from reaching a 10-day streak.
   *
   * This keeps one-day submission bursts from scoring highly while still
   * rewarding steady practice.
   */
  const activeDayScore = (Math.min(activeDays, 15) / 15) * 70;
  const streakScore = (Math.min(longestStreak, 10) / 10) * 30;

  return {
    activeDays,
    longestStreak,
    score: roundScore(activeDayScore + streakScore),
  };
};

const getAICodeReviewScore = () => {
  /*
   * AI Part 2 currently generates code-review text on demand and does not persist
   * structured review scores in MongoDB. Readiness Part 1 must not call the AI
   * provider per request or invent historical scores, so it uses a neutral 50.
   * This function is intentionally isolated so persisted review scoring can
   * replace it later without changing the rest of the deterministic engine.
   */
  return AI_CODE_REVIEW_FALLBACK_SCORE;
};

const getReadinessReport = async (targetUserId, authenticatedUser) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw createHttpError(400, 'Invalid user ID');
  }

  const targetUser = await User.findById(targetUserId).select('_id').lean();
  if (!targetUser) {
    throw createHttpError(404, 'User not found');
  }

  if (
    authenticatedUser.role !== 'admin' &&
    authenticatedUser.userId !== targetUser._id.toString()
  ) {
    throw createHttpError(403, 'Forbidden');
  }

  const [problems, submissions] = await Promise.all([
    Problem.find({})
      .select('tags difficulty timeLimitMs memoryLimitMb')
      .lean(),
    Submission.find({ user: targetUser._id })
      .select('problem status verdict runtimeMs memoryKb createdAt')
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  const problemById = new Map(
    problems.map((problem) => [problem._id.toString(), problem])
  );

  const solvedProblemIds = new Set(
    submissions
      .filter(isAcceptedSubmission)
      .map((submission) => getIdString(submission.problem))
      .filter(Boolean)
  );

  const { topicCoverageScore, topicScores } = calculateTopicCoverage(
    problems,
    solvedProblemIds
  );
  const firstAttemptAcceptanceScore = calculateFirstAttemptAcceptance(submissions);
  const executionEfficiencyScore = calculateExecutionEfficiency(
    submissions,
    problemById
  );
  const { difficultyPerformanceScore, difficultyScores } =
    calculateDifficultyPerformance(problems, solvedProblemIds);
  const consistency = calculateCodingConsistency(submissions);
  const aiCodeReviewScore = getAICodeReviewScore(targetUser._id);

  const factorScores = {
    topicCoverage: topicCoverageScore,
    firstAttemptAcceptance: firstAttemptAcceptanceScore,
    executionEfficiency: executionEfficiencyScore,
    difficultyPerformance: difficultyPerformanceScore,
    codingConsistency: consistency.score,
    aiCodeReview: aiCodeReviewScore,
  };

  const overallScore = roundScore(
    factorScores.topicCoverage * 0.25 +
      factorScores.firstAttemptAcceptance * 0.2 +
      factorScores.executionEfficiency * 0.15 +
      factorScores.difficultyPerformance * 0.2 +
      factorScores.codingConsistency * 0.1 +
      factorScores.aiCodeReview * 0.1
  );

  return {
    overallScore,
    factorScores,
    topicScores,
    difficultyScores,
    consistency,
    generatedAt: new Date().toISOString(),
  };
};

module.exports = {
  getReadinessReport,
};
