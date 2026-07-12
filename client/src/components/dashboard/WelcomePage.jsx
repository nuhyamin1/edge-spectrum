import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaBookOpen,
  FaChalkboardTeacher,
  FaCheck,
  FaClipboardCheck,
  FaComments,
  FaMicrophone,
  FaPlay,
  FaRegClock,
  FaUsers,
  FaVideo
} from 'react-icons/fa';

const featureCards = [
  {
    title: 'Live Speaking Rooms',
    description: 'Run guided speaking sessions with attendance, hand raising, video, and real-time teacher feedback.',
    icon: FaVideo,
    iconColor: 'text-cyan-700',
    iconBackground: 'bg-cyan-50',
    hoverBorder: 'hover:border-cyan-200'
  },
  {
    title: 'Pronunciation Practice',
    description: 'Help learners repeat, compare, and improve their pronunciation through focused speaking activities.',
    icon: FaMicrophone,
    iconColor: 'text-emerald-700',
    iconBackground: 'bg-emerald-50',
    hoverBorder: 'hover:border-emerald-200'
  },
  {
    title: 'Interactive Classroom',
    description: 'Keep discussions, whiteboards, exercises, and learning materials together in one organized space.',
    icon: FaChalkboardTeacher,
    iconColor: 'text-indigo-700',
    iconBackground: 'bg-indigo-50',
    hoverBorder: 'hover:border-indigo-200'
  },
  {
    title: 'Assignment Tracking',
    description: 'Collect student work, review progress, and make every upcoming task clear for the whole class.',
    icon: FaClipboardCheck,
    iconColor: 'text-amber-700',
    iconBackground: 'bg-amber-50',
    hoverBorder: 'hover:border-amber-200'
  }
];

const learningSteps = [
  {
    number: '01',
    title: 'Join a session',
    description: 'Enter your scheduled speaking room.'
  },
  {
    number: '02',
    title: 'Practice together',
    description: 'Speak, respond, and collaborate live.'
  },
  {
    number: '03',
    title: 'Improve with feedback',
    description: 'Use teacher guidance for the next attempt.'
  }
];

const platformHighlights = [
  { value: '4', label: 'live room types' },
  { value: '24/7', label: 'learning access' },
  { value: 'Live', label: 'teacher feedback' }
];

const WelcomePage = () => {
  const navigate = useNavigate();

  const goToLogin = () => navigate('/login');
  const goToRegister = () => navigate('/register');
  const scrollToOverview = () => {
    document.getElementById('platform-overview')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950 antialiased">
      <header className="absolute inset-x-0 top-0 z-40">
        <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-3 py-2 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
            aria-label="Back to PF Speaking Master home"
          >
            <span className="flex h-11 w-14 items-center justify-center rounded-xl bg-slate-50 transition group-hover:bg-cyan-50">
              <img
                src={`${process.env.PUBLIC_URL}/pfsm_logo.png`}
                alt=""
                className="h-9 w-12 object-contain"
              />
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-extrabold leading-tight tracking-tight text-slate-950">
                PF Speaking Master
              </span>
              <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Practice &amp; Fluency
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/80 p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <button
              type="button"
              onClick={goToLogin}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={goToRegister}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
            >
              Join class
              <FaArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-[#f7fbff]">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 18%, rgba(34,211,238,0.18), transparent 26%), radial-gradient(circle at 86% 10%, rgba(99,102,241,0.16), transparent 29%), radial-gradient(circle at 65% 82%, rgba(14,165,233,0.14), transparent 31%)'
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'linear-gradient(to bottom, black, transparent 78%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 78%)'
          }}
        />

        <div className="relative mx-auto grid min-h-[760px] max-w-[1400px] items-center gap-14 px-5 pb-24 pt-32 sm:px-8 sm:pt-36 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-28 lg:pt-40">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/80 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-800 shadow-sm backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              Live classroom speaking platform
            </div>

            <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              Practice English.
              <span className="mt-2 block bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Speak with confidence.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              PF Speaking Master gives students a structured place to speak, receive feedback, collaborate with classmates, and build real communication skills.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={goToLogin}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_16px_35px_rgba(14,165,233,0.28)] transition hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(14,165,233,0.36)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
              >
                Start learning
                <FaArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={scrollToOverview}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-extrabold text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-white">
                  <FaPlay className="ml-0.5 h-2.5 w-2.5" />
                </span>
                Explore platform
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
              {['Live speaking practice', 'Teacher-guided feedback', 'Organized class workflow'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <FaCheck className="h-2.5 w-2.5" />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[700px] lg:ml-auto">
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-cyan-300/40 via-sky-300/20 to-indigo-300/40 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.25rem] border border-white/80 bg-slate-900 p-2.5 shadow-[0_35px_90px_rgba(15,23,42,0.28)]">
              <div className="relative overflow-hidden rounded-[1.75rem]">
                <img
                  src={`${process.env.PUBLIC_URL}/pfsm_class.jpg`}
                  alt="Student participating in an online English speaking class"
                  className="h-[520px] w-full object-cover object-[68%_center] sm:h-[610px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-slate-950/5" />
                <div className="absolute inset-y-0 left-0 w-[52%] bg-gradient-to-r from-slate-950/50 to-transparent" />

                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/55 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md sm:left-7 sm:top-7">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.18)]" />
                  Speaking room is live
                </div>

                <div className="absolute bottom-5 left-5 right-5 rounded-[1.6rem] border border-white/70 bg-white/95 p-5 shadow-2xl backdrop-blur-xl sm:bottom-7 sm:left-7 sm:right-7 sm:p-6">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-cyan-700">Today</p>
                      <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Speaking Lab</h2>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
                      <FaRegClock className="h-3 w-3" />
                      10:30
                    </div>
                  </div>

                  <div className="grid gap-3 pt-4 sm:grid-cols-3">
                    {learningSteps.map((step) => (
                      <div key={step.number} className="rounded-2xl bg-slate-50 p-3.5">
                        <p className="text-[11px] font-black tracking-[0.16em] text-cyan-700">{step.number}</p>
                        <p className="mt-1.5 text-sm font-extrabold leading-5 text-slate-900">{step.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-5 top-24 hidden w-48 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur-xl xl:block">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <FaUsers className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-lg font-black text-slate-950">18</p>
                  <p className="text-xs font-semibold text-slate-500">students online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform-overview" className="relative z-20 -mt-12 px-5 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1280px] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.10)] lg:grid-cols-[1.35fr_1fr]">
          <div className="flex flex-col justify-center bg-slate-950 px-7 py-7 text-white sm:px-9 lg:py-9">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">A complete speaking classroom online</p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              One focused platform for live instruction, speaking practice, classroom content, and visible progress.
            </p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100 px-3 py-5 sm:px-5">
            {platformHighlights.map((item) => (
              <div key={item.label} className="flex flex-col items-center justify-center px-2 text-center">
                <p className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{item.value}</p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500 sm:text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 pt-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-cyan-700">Built for real participation</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl">
                Everything learners need to keep speaking.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-slate-600 lg:justify-self-end">
              PFSM replaces scattered classroom tools with a clear workflow designed around active speaking, responsive guidance, and measurable learning progress.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map(({ title, description, icon: Icon, iconColor, iconBackground, hoverBorder }) => (
              <article
                key={title}
                className={`group min-w-0 rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_45px_rgba(15,23,42,0.10)] ${hoverBorder}`}
              >
                <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl ${iconBackground}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <h3 className="mt-6 text-lg font-black tracking-tight text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                <div className="mt-6 h-px w-full bg-gradient-to-r from-slate-200 to-transparent" />
                <p className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 transition group-hover:text-slate-950">
                  Learn more
                  <FaArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[2.25rem] bg-slate-950 text-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative min-h-[390px] overflow-hidden">
              <img
                src={`${process.env.PUBLIC_URL}/pfsm-welcome.png`}
                alt="Learner preparing for confident English communication"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/15 via-slate-950/20 to-slate-950" />
              <div className="absolute bottom-7 left-7 rounded-2xl border border-white/15 bg-slate-950/55 px-4 py-3 backdrop-blur-lg">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-300">Learning journey</p>
                <p className="mt-1 text-sm font-bold text-white">Practice. Reflect. Improve.</p>
              </div>
            </div>

            <div className="flex flex-col justify-center px-7 py-12 sm:px-10 lg:px-12 lg:py-16">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-cyan-300">From first attempt to confident performance</p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl">
                A clearer learning path for students and teachers.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                Students can join sessions, find materials, submit assignments, and continue classroom discussion. Teachers can guide practice, share resources, and keep progress visible without switching between disconnected tools.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <FaComments className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-4 font-extrabold text-white">Discussion feed</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Keep questions and peer learning active after class.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <FaBookOpen className="h-5 w-5 text-indigo-300" />
                  <h3 className="mt-4 font-extrabold text-white">Material library</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Organize lessons, links, uploads, and class resources.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={goToLogin}
                className="group mt-8 inline-flex w-fit items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Enter platform
                <FaArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-12 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 rounded-[2rem] border border-cyan-100 bg-gradient-to-r from-cyan-50 via-sky-50 to-indigo-50 px-7 py-8 sm:px-10 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-700">Ready for your next speaking session?</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Join your class and start speaking.</h2>
          </div>
          <button
            type="button"
            onClick={goToRegister}
            className="group inline-flex shrink-0 items-center gap-3 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
          >
            Join class
            <FaArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </main>
  );
};

export default WelcomePage;