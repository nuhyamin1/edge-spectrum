import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
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

const TeacherMainPage = () => {
  const [materials, setMaterials] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [visibleMaterials, setVisibleMaterials] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;

    try {
      await axios.delete(`/api/materials/${id}`);
      toast.success('Material deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete material');
    }
  };

  const copyMaterialLink = (id) => {
    const materialUrl = `${window.location.origin}/dashboard/material/${id}`;
    navigator.clipboard.writeText(materialUrl)
      .then(() => toast.success('Material link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const firstName = user?.name?.trim().split(' ')[0] || 'Teacher';
  const nextSession = activeSessions[0] || upcomingSessions[0];
  const totalStudents = new Set(
    [...activeSessions, ...upcomingSessions].flatMap((session) =>
      (session.enrolledStudents || []).map((student) => student._id || student)
    )
  ).size;

  return (
    <Layout userType="teacher">
      <main className="overview-page">
        <section className="overview-hero">
          <div className="overview-hero-glow overview-hero-glow-one" />
          <div className="overview-hero-glow overview-hero-glow-two" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.45fr_0.8fr] lg:items-end">
            <div>
              <span className="overview-role-badge">Teacher workspace</span>
              <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Welcome back, {firstName}.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
                Everything you need to prepare lessons, guide students, and keep today&apos;s classes moving.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => navigate('/dashboard/create-session')} className="overview-primary-button">
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                  Create session
                </button>
                <button type="button" onClick={() => navigate('/dashboard/create-material')} className="overview-ghost-button">
                  <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
                  Add material
                </button>
              </div>
            </div>

            <div className="overview-next-card">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Next on your schedule</p>
                <ClockIcon className="h-5 w-5 text-blue-200" aria-hidden="true" />
              </div>
              {nextSession ? (
                <>
                  <p className="mt-5 text-xl font-bold text-white">{nextSession.title}</p>
                  <p className="mt-2 text-sm text-blue-100">
                    {nextSession.status === 'active'
                      ? 'Live now'
                      : new Date(nextSession.dateTime).toLocaleString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                  </p>
                  <button type="button" onClick={() => navigate(`/dashboard/session/${nextSession._id}`)} className="mt-5 text-sm font-semibold text-white underline decoration-blue-300 underline-offset-4 hover:text-blue-100">
                    Open session
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-5 text-lg font-bold text-white">Your schedule is clear</p>
                  <p className="mt-2 text-sm leading-6 text-blue-100">Create a session when you are ready to meet your students.</p>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="overview-stats-grid" aria-label="Teaching overview">
          <DashboardStat label="Learning materials" value={materials.length} helper="Ready to share" icon={DocumentTextIcon} />
          <DashboardStat label="Live sessions" value={activeSessions.length} helper="Happening now" icon={AcademicCapIcon} tone="emerald" />
          <DashboardStat label="Upcoming sessions" value={upcomingSessions.length} helper="On your schedule" icon={CalendarDaysIcon} tone="amber" />
          <DashboardStat label="Active students" value={totalStudents} helper="Across current sessions" icon={UserGroupIcon} tone="violet" />
        </section>

        <section>
          <OverviewSectionHeading
            eyebrow="Lesson library"
            title="Your teaching materials"
            description="Open a lesson, share it with students, or make a quick edit."
            actionLabel="View all materials"
            onAction={() => navigate('/dashboard/materials')}
          />
          {isLoading ? (
            <OverviewLoadingCards />
          ) : materials.length === 0 ? (
            <OverviewEmptyState
              title="Create your first material"
              description="Build a reusable lesson and it will appear here for quick access."
              actionLabel="Create material"
              onAction={() => navigate('/dashboard/create-material')}
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {materials.slice(0, visibleMaterials).map((material, index) => (
                  <MaterialOverviewCard
                    key={material._id}
                    material={material}
                    index={index}
                    onOpen={() => navigate(`/dashboard/material/${material._id}`)}
                    actions={
                      <>
                        <button type="button" onClick={() => copyMaterialLink(material._id)} className="overview-icon-button" title="Copy material link" aria-label={`Copy link for ${material.title}`}>
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => navigate(`/dashboard/edit-material/${material._id}`)} className="overview-icon-button" title="Edit material" aria-label={`Edit ${material.title}`}>
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(material._id)} className="overview-icon-button overview-icon-button-danger" title="Delete material" aria-label={`Delete ${material.title}`}>
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
              {materials.length > visibleMaterials && (
                <div className="mt-6 text-center">
                  <button type="button" onClick={() => setVisibleMaterials((count) => count + 6)} className="overview-secondary-button">
                    Show more materials
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section>
          <OverviewSectionHeading
            eyebrow="Class activity"
            title="Teaching sessions"
            description="See what is live, what is coming next, and recently completed classes."
            actionLabel="Manage sessions"
            onAction={() => navigate('/dashboard/sessions')}
          />
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="overview-session-panel overview-session-panel-live">
              <SessionsSection title="Live now" sessions={activeSessions} type="active" />
            </div>
            <div className="overview-session-panel">
              <SessionsSection title="Coming up" sessions={upcomingSessions} type="upcoming" />
            </div>
            <div className="overview-session-panel">
              <SessionsSection title="Recently completed" sessions={completedSessions} type="completed" />
            </div>
          </div>
        </section>

        <section className="overview-bottom-banner">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Your workspace is ready</h2>
            <p className="mt-1 text-sm text-slate-600">Use the shortcuts above to prepare your next class, or review student progress from the Gradebook.</p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default TeacherMainPage;
