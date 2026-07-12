import { FiCode } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="border-t border-white/70 bg-white/70 py-10">
      <div className="container-shell flex flex-col gap-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-white">
            <FiCode aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold text-ink-900">Codenza</p>
            <p>Practice, submit, learn, and improve with confidence.</p>
          </div>
        </div>
        <p>© {new Date().getFullYear()} Codenza. Built for serious coders.</p>
      </div>
    </footer>
  );
};

export default Footer;
