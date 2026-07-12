const ProblemSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="animate-pulse rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="h-5 w-56 rounded-full bg-slate-200" />
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-slate-100" />
                <div className="h-6 w-20 rounded-full bg-slate-100" />
                <div className="h-6 w-14 rounded-full bg-slate-100" />
              </div>
            </div>
            <div className="h-10 w-24 rounded-2xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProblemSkeleton;
