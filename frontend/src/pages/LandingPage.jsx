import { Link } from 'react-router-dom';
import {
  FiCpu,
  FiDatabase,
  FiLayers,
  FiMonitor,
  FiShield,
  FiZap,
} from 'react-icons/fi';

import FeatureCard from '../components/FeatureCard.jsx';

const features = [
  {
    title: 'Docker Sandbox',
    description:
      'Run submissions inside isolated Docker containers designed for safer code execution.',
    icon: FiShield,
  },
  {
    title: 'AI Assistant',
    description:
      'Get conceptual hints, error explanations, code review, optimization ideas, and complexity guidance.',
    icon: FiCpu,
  },
  {
    title: 'Hidden Test Cases',
    description:
      'Validate solutions against private tests so accepted code has to handle more than the sample cases.',
    icon: FiDatabase,
  },
  {
    title: 'Fast Judge',
    description:
      'Queue submissions, process verdicts asynchronously, and keep the practice loop moving.',
    icon: FiZap,
  },
  {
    title: 'Interview Preparation',
    description:
      'Practice with structured problems and build the discipline needed for technical interviews.',
    icon: FiLayers,
  },
  {
    title: 'Responsive UI',
    description:
      'A clean interface that feels comfortable on laptops, tablets, and smaller screens.',
    icon: FiMonitor,
  },
];

const workflowSteps = [
  {
    label: 'Choose',
    text: 'Pick a challenge by topic and difficulty when the problem module is added to the frontend.',
  },
  {
    label: 'Submit',
    text: 'Send your solution to Codenza and let the backend queue it for judging.',
  },
  {
    label: 'Improve',
    text: 'Use verdicts and AI assistance to understand mistakes and sharpen your approach.',
  },
];

const LandingPage = () => {
  return (
    <>
      <section className="container-shell grid gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-codenza-100 bg-white/80 px-4 py-2 text-sm font-semibold text-codenza-700 shadow-sm">
            Modern online judge for focused coding practice
          </p>

          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
            Build interview-ready problem solving with Codenza.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Codenza combines secure judging, hidden test validation, and AI-powered learning tools so every submission teaches you something useful.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary">
              Start practicing
            </Link>
            <Link to="/login" className="btn-secondary">
              Login to continue
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-codenza-500/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-ink-900 p-6 text-white shadow-soft">
            <div className="mb-6 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
            </div>

            <div className="rounded-2xl bg-slate-950/80 p-5 font-mono text-sm leading-7 text-slate-200">
              <p>
                <span className="text-codenza-500">codenza</span> judge --submit solution.cpp
              </p>
              <p className="mt-4 text-slate-400">Compiling with gcc:latest...</p>
              <p className="text-slate-400">Running hidden tests in Docker...</p>
              <p className="mt-4 text-emerald-300">Verdict: Accepted</p>
              <p className="text-slate-400">Runtime: 42 ms · Memory: 2048 KB</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {['Sandboxed', 'Asynchronous', 'AI-assisted'].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-codenza-700">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
            Everything needed for a strong judge foundation.
          </h2>
          <p className="mt-4 text-slate-600">
            The frontend starts with a polished public experience and authentication. Practice workflows will arrive in later phases.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-soft md:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-codenza-700">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-ink-900">
                Practice turns into progress through a tight feedback loop.
              </h2>
            </div>

            <div className="grid gap-4">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.label}
                  className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink-900 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-ink-900">{step.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell pb-20 pt-12">
        <div className="rounded-[2rem] bg-ink-900 px-6 py-12 text-center text-white shadow-soft md:px-12">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Ready to make every submission count?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Create your Codenza account and prepare for the next phase of structured coding practice.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-ink-900 transition hover:-translate-y-0.5 hover:bg-codenza-50"
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default LandingPage;
