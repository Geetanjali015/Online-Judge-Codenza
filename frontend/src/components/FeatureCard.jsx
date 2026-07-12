const FeatureCard = ({ description, icon: Icon, title }) => {
  return (
    <article className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-codenza-50 text-codenza-700">
        <Icon className="text-2xl" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
};

export default FeatureCard;
