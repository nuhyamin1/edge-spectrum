import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaBookOpen,
  FaChalkboardTeacher,
  FaClipboardCheck,
  FaComments,
  FaMicrophone,
  FaPlay,
  FaVideo
} from 'react-icons/fa';

const featureCards = [
  {
    title: 'Live Speaking Rooms',
    description: 'Practice fluency in guided sessions with video, attendance, hand raising, and teacher feedback.',
    icon: FaVideo,
    color: 'text-sky-600',
    accent: 'bg-sky-50'
  },
  {
    title: 'Pronunciation Practice',
    description: 'Build confidence with focused pronunciation checks and repeatable speaking activities.',
    icon: FaMicrophone,
    color: 'text-emerald-600',
    accent: 'bg-emerald-50'
  },
  {
    title: 'Interactive Classroom',
    description: 'Use discussion posts, exercises, whiteboards, and learning materials in one organized space.',
    icon: FaChalkboardTeacher,
    color: 'text-indigo-600',
    accent: 'bg-indigo-50'
  },
  {
    title: 'Assignment Tracking',
    description: 'Students submit work, teachers review progress, and everyone can follow what comes next.',
    icon: FaClipboardCheck,
    color: 'text-amber-600',
    accent: 'bg-amber-50'
  }
];

const learningSteps = [
  'Join a speaking session',
  'Practice with classmates',
  'Get feedback from your teacher'
];

const WelcomePage = () => {
  const navigate = useNavigate();

  const goToLogin = () => navigate('/login');
  const goToRegister = () => navigate('/register');

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <header className="absolute left-0 right-0 top-0 z-30">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-sky-600"
            aria-label="Back to PF Speaking Master home"
          >
            <img
              src={`${process.env.PUBLIC_URL}/pfsm_logo.png`}
              alt=""
              className="h-11 w-14 object-contain"
            />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-bold leading-tight text-slate-950">PF Speaking Master</span>
              <span className="block text-xs font-medium text-slate-500">Practice & Fluency</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToLogin}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white/70 focus-visible:outline-slate-950"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={goToRegister}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-slate-950"
            >
              Join class
            </button>
          </div>
        </nav>
      </header>

      <section
        className="relative min-h-[82vh] overflow-hidden bg-slate-100"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(248, 250, 252, 0.96) 0%, rgba(248, 250, 252, 0.84) 46%, rgba(14, 116, 144, 0.08) 100%), url(${process.env.PUBLIC_URL}/pfsm_class.jpg)`,
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />

        <div className="relative z-10 mx-auto grid min-h-[82vh] max-w-7xl items-center gap-10 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl text-slate-950">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
              <FaBookOpen className="h-4 w-4" />
              English speaking practice for modern classrooms
            </div>

            <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-normal sm:text-5xl lg:text-7xl">
              <span className="block">PF Speaking</span>
              <span className="block">Master</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              A learning platform for building confident English speakers through live practice,
              teacher feedback, classroom discussion, pronunciation work, and organized assignments.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={goToLogin}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-cyan-400 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-300 focus-visible:outline-cyan-100"
              >
                Start learning
                <FaArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('platform-overview')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-slate-300 bg-white/75 px-6 py-3 text-sm font-bold text-slate-900 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-slate-950"
              >
                <FaPlay className="h-3 w-3" />
                Explore platform
              </button>
            </div>
          </div>

          <div className="hidden justify-end lg:flex">
            <div className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white/10 p-5 text-white shadow-2xl shadow-slate-950/35 backdrop-blur-md">
              <div className="rounded-[1.5rem] bg-white p-5 text-slate-950 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">Today</p>
                    <h2 className="mt-1 text-xl font-extrabold">Speaking Lab</h2>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    Live
                  </span>
                </div>

                <div className="space-y-4 py-5">
                  {learningSteps.map((step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-extrabold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3 text-center">
                  <div>
                    <p className="text-xl font-extrabold text-slate-950">4</p>
                    <p className="text-[11px] font-semibold text-slate-500">rooms</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-slate-950">Live</p>
                    <p className="text-[11px] font-semibold text-slate-500">feedback</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-slate-950">24/7</p>
                    <p className="text-[11px] font-semibold text-slate-500">access</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform-overview" className="relative z-20 -mt-10 px-5 pb-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/80 md:grid-cols-3">
          <div className="min-w-0 rounded-2xl bg-slate-950 p-6 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">What is PFSM</p>
            <h2 className="mt-3 break-words text-2xl font-extrabold">A complete speaking classroom online.</h2>
          </div>
          <div className="min-w-0 rounded-2xl bg-cyan-50 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">Vision</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Make confident English speaking practice accessible, structured, and engaging for every learner.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl bg-rose-50 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-700">Mission</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Give teachers practical tools for live guidance, personalized materials, and measurable student progress.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-cyan-700">Features</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-normal text-slate-950 sm:text-4xl">
                Built for active speaking practice, not passive browsing.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              PFSM brings the tools learners actually use in class into a single, focused workflow.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map(({ title, description, icon: Icon, color, accent }) => (
              <article key={title} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="overflow-hidden rounded-3xl bg-slate-100 shadow-lg">
            <img
              src={`${process.env.PUBLIC_URL}/pfsm-welcome.png`}
              alt="Graduate looking upward"
              className="h-full min-h-[320px] w-full object-cover object-center"
            />
          </div>

          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-emerald-700">Learning journey</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-normal text-slate-950 sm:text-4xl">
              From first practice to confident performance.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Students can find materials, join scheduled sessions, submit assignments, and keep practicing
              with classroom support. Teachers can guide sessions, share resources, and keep progress visible.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <FaComments className="mb-4 h-6 w-6 text-sky-600" />
                <h3 className="font-extrabold text-slate-950">Discussion feed</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Keep questions, comments, and peer learning active after class.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <FaBookOpen className="mb-4 h-6 w-6 text-rose-600" />
                <h3 className="font-extrabold text-slate-950">Material library</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Organize lessons, links, uploads, and rich learning content.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={goToLogin}
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-slate-950 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 focus-visible:outline-slate-950"
            >
              Enter platform
              <FaArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default WelcomePage;
