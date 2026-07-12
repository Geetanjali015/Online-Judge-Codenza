import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <section className="container-shell flex min-h-[calc(100vh-10rem)] items-center justify-center py-20">
      <div className="max-w-xl rounded-[2rem] border border-white/80 bg-white/90 p-10 text-center shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-codenza-700">
          404
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-ink-900">
          Page not found
        </h1>
        <p className="mt-4 text-slate-600">
          This route is not part of the current Codenza frontend phase.
        </p>
        <Link to="/" className="btn-primary mt-8">
          Back to home
        </Link>
      </div>
    </section>
  );
};

export default NotFoundPage;
