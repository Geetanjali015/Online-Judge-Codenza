import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiFilter, FiSearch } from 'react-icons/fi';

import DifficultyBadge from '../components/DifficultyBadge.jsx';
import ProblemSkeleton from '../components/ProblemSkeleton.jsx';
import useProblems from '../hooks/useProblems.js';

const difficultyOrder = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

const getProblemId = (problem) => problem.id || problem._id;

const ProblemsPage = () => {
  const { error, isLoading, problems } = useProblems();
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const availableTags = useMemo(() => {
    const tags = new Set();

    problems.forEach((problem) => {
      (problem.tags || []).forEach((tag) => tags.add(tag));
    });

    return [...tags].sort((left, right) => left.localeCompare(right));
  }, [problems]);

  const visibleProblems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...problems]
      .filter((problem) => {
        const matchesSearch = problem.title
          ?.toLowerCase()
          .includes(normalizedSearch);
        const matchesDifficulty =
          difficultyFilter === 'All' || problem.difficulty === difficultyFilter;
        const matchesTag =
          tagFilter === 'All' || (problem.tags || []).includes(tagFilter);

        return matchesSearch && matchesDifficulty && matchesTag;
      })
      .sort((left, right) => {
        if (sortBy === 'title-asc') {
          return left.title.localeCompare(right.title);
        }

        if (sortBy === 'title-desc') {
          return right.title.localeCompare(left.title);
        }

        if (sortBy === 'difficulty') {
          return (
            (difficultyOrder[left.difficulty] || 99) -
            (difficultyOrder[right.difficulty] || 99)
          );
        }

        // The backend already returns newest first. Keeping the current order
        // preserves that server-side sorting even though createdAt is not exposed.
        return 0;
      });
  }, [difficultyFilter, problems, searchTerm, sortBy, tagFilter]);

  const hasFilters =
    searchTerm.trim() || difficultyFilter !== 'All' || tagFilter !== 'All';

  return (
    <section className="container-shell py-10 lg:py-14">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-codenza-700">
            Problems
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-ink-900">
            Practice library
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Browse curated problems, filter by difficulty or topic, and open a challenge when you are ready to solve.
          </p>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
          {problems.length} total {problems.length === 1 ? 'problem' : 'problems'}
        </div>
      </div>

      <div className="mb-6 rounded-[2rem] border border-white/80 bg-white/85 p-4 shadow-soft">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <label className="relative block">
            <FiSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="auth-input pl-11"
              placeholder="Search by title"
            />
          </label>

          <label className="relative block">
            <FiFilter
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
              className="auth-input appearance-none pl-11"
            >
              <option value="All">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </label>

          <select
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            className="auth-input appearance-none"
          >
            <option value="All">All tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="auth-input appearance-none"
          >
            <option value="newest">Newest</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </div>
      </div>

      {isLoading && <ProblemSkeleton />}

      {!isLoading && error && (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6 text-red-700">
          <div className="flex gap-3">
            <FiAlertCircle className="mt-1 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-bold">Could not load problems</h2>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && visibleProblems.length === 0 && (
        <div className="rounded-[2rem] border border-white/80 bg-white/85 p-10 text-center shadow-soft">
          <h2 className="text-2xl font-black text-ink-900">
            {hasFilters ? 'No matching problems found' : 'No problems found'}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            {hasFilters
              ? 'Try changing the search text, difficulty, or tag filter.'
              : 'Problems created by admins will appear here once they are available.'}
          </p>
        </div>
      )}

      {!isLoading && !error && visibleProblems.length > 0 && (
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-soft">
          <div className="hidden grid-cols-[1.5fr_0.7fr_1.1fr_0.5fr_0.5fr] gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500 lg:grid">
            <span>Title</span>
            <span>Difficulty</span>
            <span>Tags</span>
            <span>Acceptance</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-slate-100">
            {visibleProblems.map((problem) => (
              <article
                key={getProblemId(problem)}
                className="grid gap-4 px-5 py-5 transition hover:bg-codenza-50/40 lg:grid-cols-[1.5fr_0.7fr_1.1fr_0.5fr_0.5fr] lg:items-center lg:px-6"
              >
                <div>
                  <Link
                    to={`/problems/${getProblemId(problem)}`}
                    className="text-lg font-black text-ink-900 hover:text-codenza-700"
                  >
                    {problem.title}
                  </Link>
                  {problem.solved !== undefined && (
                    <p className="mt-1 text-xs font-semibold text-emerald-600">
                      {problem.solved ? 'Solved' : 'Not solved'}
                    </p>
                  )}
                </div>

                <div>
                  <DifficultyBadge difficulty={problem.difficulty} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {(problem.tags || []).length > 0 ? (
                    problem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">No tags</span>
                  )}
                </div>

                <div className="text-sm font-semibold text-slate-500">
                  {problem.acceptance !== undefined ? `${problem.acceptance}%` : '—'}
                </div>

                <div className="lg:text-right">
                  <Link
                    to={`/problems/${getProblemId(problem)}`}
                    className="btn-primary px-4 py-2"
                  >
                    Solve
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProblemsPage;
