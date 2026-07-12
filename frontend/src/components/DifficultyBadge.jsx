const difficultyClasses = {
  Easy: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-100',
  Hard: 'bg-red-50 text-red-700 ring-red-100',
};

const DifficultyBadge = ({ difficulty }) => {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${
        difficultyClasses[difficulty] || 'bg-slate-50 text-slate-600 ring-slate-100'
      }`}
    >
      {difficulty || 'Unknown'}
    </span>
  );
};

export default DifficultyBadge;
