import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  MicrophoneIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import Layout from '../Layout';
import SessionsSection from '../SessionsSection';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import {
  DashboardStat,
  MaterialOverviewCard,
  OverviewEmptyState,
  OverviewLoadingCards,
  OverviewSectionHeading,
} from '../shared/OverviewComponents';
import '../Dashboard.css';

const StudentMainPage = () => {
  const [materials, setMaterials] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, sessionsRes] = await Promise.all([
          axios.get('/api/materials'),
          axios.get('/api/sessions?include=enrolledStudents'),
        ]);

        const sessions = sessionsRes.data || [];
        setMaterials(materialsRes.data || []);
        setActiveSessions(
          sessions
            .filter((session) => session.status === 'active')
            .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
        );
        setUpcomingSessions(
          sessions
            .filter((session) => session.status === 'scheduled')
            .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
        );
        setCompletedSessions(
          sessions
            .filter((session) => session.status === 'completed')
            .sort((a, b) => new Date(b.endedAt || b.endTime) - new Date(a.endedAt || a.endTime))
        );
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const firstName = user?.name?.trim().split(' ')[0] || 'Student';
  const liveSession = activeSessions[0];
  const nextSession = liveSession || upcomingSessions[0];

  const quickActions = [
    {
      title: 'Study materials',
      description: 'Review lessons and practice at your own pace.',
      icon: BookOpenIcon,
      color: 'overview-quick-action-blue',
      path: '/dashboard/student/materials',
    },
    {
      title: 'Join a session',
      description: 'Find live and upcoming speaking classes.',
      icon: MicrophoneIcon,
      color: 'overview-quick-action-emerald',
      path: '/dashboard/available-sessions',
    },
    {
      title: 'Check your progress',
      description: 'See feedback and your latest learning results.',
      icon: ChartBarIcon,
      color: 'overview-quick-action-violet',
      path: '/dashboard/report-card',
    },
  ];

  return (
    <Layout userType="student">
      <main className="overview-page">
        <section className="overview-hero overview-student-hero">
          <div className="overview-hero-glow overview-hero-glow-one" />
          <div className="overview-hero-glow overview-hero-glow-two" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.4fr_0.85fr] lg:items-end">
            <div>
              <span className="overview-role-badge">Student dashboard</span>
              <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to speak, {firstName}?
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
                Pick up where you left off, join your next class, and keep building confidence one conversation at a time.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => navigate(liveSession ? `/dashboard/session/${liveSession._id}` : '/dashboard/available-sessions')} className="overview-primary-button">
                  <PlayIcon className="h-5 w-5" aria-hidden="true" />
                  {liveSession ? 'Join live session' : 'Find a session'}
                </button>
                <button type="button" onClick={() => navigate('/dashboard/student/materials')} className="overview-ghost-button">
                  <BookOpenIcon className="h-5 w-5" aria-hidden="true" />
                  Browse materials
                </button>
              </div>
            </div>

            <div className="overview-next-card">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                  {liveSession ? 'Happening now' : 'Your next session'}
                </p>
                <CalendarDaysIcon className="h-5 w-5 text-blue-200" aria-hidden="true" />
              </div>
              {nextSession ? (
                <>
                  <p className="mt-5 text-xl font-bold text-white">{nextSession.title}</p>
                  <p className="mt-2 text-sm text-blue-100">
                    {liveSession
                      ? 'Your class is ready to join'
                      : new Date(nextSession.dateTime).toLocaleString('en-US', {
                          weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                  </p>
                  <button type="button" onClick={() => navigate(`/dashboard/session/${nextSession._id}`)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-100">
                    View session
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-5 text-lg font-bold text-white">Nothing scheduled yet</p>
                  <p className="mt-2 text-sm leading-6 text-blue-100">Explore available sessions and choose a class that works for you.</p>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="overview-stats-grid" aria-label="Learning overview">
          <DashboardStat label="Materials available" value={materials.length} helper="Ready to explore" icon={BookOpenIcon} />
          <DashboardStat label="Live sessions" value={activeSessions.length} helper="Ready to join" icon={MicrophoneIcon} tone="emerald" />
          <DashboardStat label="Upcoming sessions" value={upcomingSessions.length} helper="Coming soon" icon={CalendarDaysIcon} tone="amber" />
          <DashboardStat label="Completed sessions" value={completedSessions.length} helper="Learning milestones" icon={CheckCircleIcon} tone="violet" />
        </section>

        <section>
          <OverviewSectionHeading
            eyebrow="Quick start"
            title="What would you like to do?"
            description="Jump straight into the part of your learning journey that matters now."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map(({ title, description, icon: Icon, color, path }) => (
              <button key={title} type="button" onClick={() => navigate(path)} className={`overview-quick-action group ${color}`}>
                <span className="overview-quick-action-icon"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <span className="min-w-0 text-left">
                  <span className="block font-bold text-slate-900">{title}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>
                </span>
                <ArrowRightIcon className="ml-auto h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section>
          <OverviewSectionHeading
            eyebrow="Keep learning"
            title="Latest materials"
            description="Fresh lessons and practice resources selected for your speaking journey."
            actionLabel="Browse all materials"
            onAction={() => navigate('/dashboard/student/materials')}
          />
          {isLoading ? (
            <OverviewLoadingCards />
          ) : materials.length === 0 ? (
            <OverviewEmptyState
              title="No materials available yet"
              description="New learning materials from your teacher will appear here."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materials.slice(0, 3).map((material, index) => (
                <MaterialOverviewCard
                  key={material._id}
                  material={material}
                  index={index}
                  onOpen={() => navigate(`/dashboard/material/${material._id}`)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <OverviewSectionHeading
            eyebrow="Your schedule"
            title="Upcoming sessions"
            description="Stay ready for your next chance to practice live."
            actionLabel="View all sessions"
            onAction={() => navigate('/dashboard/available-sessions')}
          />
          <div className="overview-session-panel">
            <SessionsSection sessions={upcomingSessions} type="upcoming" />
          </div>
        </section>

        <section className="overview-bottom-banner">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <AcademicCapIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Small practice adds up</h2>
            <p className="mt-1 text-sm text-slate-600">Review one material or join one session today to keep your speaking momentum going.</p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default StudentMainPage;
