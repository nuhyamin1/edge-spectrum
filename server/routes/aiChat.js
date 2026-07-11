const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const auth = require('../middleware/auth');
const Assignment = require('../src/models/Assignment');
const Material = require('../models/Material');
const Semester = require('../models/Semester');
const Session = require('../models/Session');

const router = express.Router();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_HISTORY_MESSAGES = 12;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_MATERIALS = 40;
const MAX_SESSIONS_PER_GROUP = 12;
const MAX_ASSIGNMENTS = 12;

const SYSTEM_PROMPT = [
  'You are PFSM Bot, a friendly English tutor for PF Speaking Master.',
  'PF stands for Practice & Fluency. The platform supports interactive virtual classrooms, video conference, pronunciation practice, chat and discussion, social feed posts and comments, materials, sessions, assignments, attendance, video rooms, discussion rooms, and exercise rooms.',
  'Help teachers and students navigate the app and improve English in a cheerful conversational style.',
  'When live platform data is provided, use it for current facts such as materials, sessions, active classes, scheduled classes, assignments, and semesters.',
  'Treat the live data as the source of truth. If the live data does not contain something, say that you do not see it in the current dashboard data.',
  'When a user asks where to find a page, to open a page, or to be directed somewhere, include a concise markdown link using the matching URL from appNavigation or a record link from the live data.',
  'Keep answers clear and practical. When users need official support, share pfspeakingmaster@gmail.com or +62 852 6371 3536.',
  'Do not invent app features. If you are unsure, say so briefly and suggest contacting the PF Speaking Master team.'
].join(' ');

const ai = GOOGLE_API_KEY ? new GoogleGenAI({ apiKey: GOOGLE_API_KEY }) : null;

const sanitizeText = (value, maxLength = 5000) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

const stripHtml = (value = '') => (
  sanitizeText(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '), 280)
);

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const summarizeMaterial = (material) => ({
  id: material._id.toString(),
  title: material.title,
  subject: material.subject,
  description: stripHtml(material.description),
  link: `/dashboard/material/${material._id.toString()}`,
  createdBy: material.createdBy?.name || 'Unknown teacher',
  createdAt: formatDate(material.createdAt),
  updatedAt: formatDate(material.updatedAt)
});

const summarizeSession = (session, user) => ({
  id: session._id.toString(),
  title: session.title,
  subject: session.subject,
  description: stripHtml(session.description),
  status: session.status || 'scheduled',
  dateTime: formatDate(session.dateTime),
  startedAt: formatDate(session.startedAt),
  endedAt: formatDate(session.endedAt),
  durationMinutes: session.duration,
  gracePeriodMinutes: session.gracePeriod,
  material: session.materials || '',
  link: `/dashboard/session/${session._id.toString()}`,
  teacher: session.teacher?.name || 'Unknown teacher',
  enrolledCount: session.enrolledStudents?.length || 0,
  isCurrentUserEnrolled: user.role === 'student'
    ? session.enrolledStudents?.some((student) => (
        student._id?.toString?.() === user._id.toString()
        || student.toString?.() === user._id.toString()
      ))
    : undefined
});

const summarizeAssignment = (assignment, user) => {
  const base = {
    id: assignment._id.toString(),
    title: assignment.title,
    description: stripHtml(assignment.description),
    dueDate: formatDate(assignment.dueDate),
    link: user.role === 'teacher'
      ? `/teacher/assignments/${assignment._id.toString()}`
      : '/dashboard/assignments',
    teacher: assignment.teacherId?.name || 'Unknown teacher',
    assignedStudentCount: assignment.assignedStudents?.length || 0,
    maxFiles: assignment.maxFiles,
    maxLinks: assignment.maxLinks
  };

  if (user.role === 'student') {
    const studentRecord = assignment.assignedStudents?.find((student) => (
      student.studentId?._id?.toString?.() === user._id.toString()
      || student.studentId?.toString?.() === user._id.toString()
    ));

    return {
      ...base,
      status: studentRecord?.status || 'unknown',
      submittedAt: formatDate(studentRecord?.submittedAt),
      mark: studentRecord?.mark ?? null,
      feedback: sanitizeText(studentRecord?.feedback || '', 280),
      rejectionReason: sanitizeText(studentRecord?.rejectionReason || '', 280)
    };
  }

  return {
    ...base,
    submissionSummary: {
      pending: assignment.assignedStudents?.filter((student) => student.status === 'pending').length || 0,
      submitted: assignment.assignedStudents?.filter((student) => student.status === 'submitted').length || 0,
      submittedLate: assignment.assignedStudents?.filter((student) => student.status === 'submitted_late').length || 0,
      accepted: assignment.assignedStudents?.filter((student) => student.status === 'accepted').length || 0,
      rejected: assignment.assignedStudents?.filter((student) => student.status === 'rejected').length || 0
    }
  };
};

const getNavigationLinks = (user) => {
  const sharedLinks = [
    { label: 'Profile', url: '/dashboard/profile', aliases: ['profile', 'account'] },
    { label: 'Assignments', url: '/dashboard/assignments', aliases: ['assignment', 'assignments', 'homework', 'tasks'] },
    { label: 'Help', url: '/dashboard/help', aliases: ['help', 'support'] },
    { label: 'Contact', url: '/dashboard/contact', aliases: ['contact', 'support contact'] }
  ];

  if (user.role === 'teacher') {
    return [
      { label: 'Overview', url: '/dashboard', aliases: ['overview', 'dashboard', 'home'] },
      { label: 'Students', url: '/dashboard/students', aliases: ['students', 'student accounts', 'registered students'] },
      { label: 'Material List', url: '/dashboard/materials', aliases: ['materials', 'material page', 'material list'] },
      { label: 'Session List', url: '/dashboard/sessions', aliases: ['sessions', 'session page', 'session list', 'classes'] },
      { label: 'Gradebook', url: '/dashboard/gradebook', aliases: ['gradebook', 'grades', 'marks'] },
      { label: 'Create Material', url: '/dashboard/create-material', aliases: ['create material', 'new material', 'add material'] },
      { label: 'Create Session', url: '/dashboard/create-session', aliases: ['create session', 'new session', 'add session'] },
      { label: 'Semester Management', url: '/dashboard/semester-management', aliases: ['semester', 'semester management'] },
      ...sharedLinks
    ];
  }

  return [
    { label: 'Overview', url: '/dashboard/student', aliases: ['overview', 'dashboard', 'home'] },
    { label: 'Materials', url: '/dashboard/student/materials', aliases: ['materials', 'material page', 'material list'] },
    { label: 'Sessions', url: '/dashboard/available-sessions', aliases: ['sessions', 'session page', 'available sessions', 'classes'] },
    { label: 'Active Sessions', url: '/dashboard/active-sessions', aliases: ['active sessions', 'active classes', 'live classes'] },
    { label: 'Report Card', url: '/dashboard/report-card', aliases: ['report card', 'report', 'grades', 'marks'] },
    ...sharedLinks
  ];
};

const getLiveDashboardContext = async (user) => {
  const now = new Date();
  const sessionQuery = user.role === 'teacher' ? { teacher: user._id } : {};
  const assignmentQuery = user.role === 'teacher'
    ? { teacherId: user._id }
    : { 'assignedStudents.studentId': user._id };

  const [
    materials,
    activeSessions,
    scheduledSessions,
    completedSessions,
    assignments,
    currentSemester
  ] = await Promise.all([
    Material.find()
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(MAX_MATERIALS)
      .lean(),
    Session.find({ ...sessionQuery, status: 'active' })
      .populate('teacher', 'name email')
      .populate('enrolledStudents', '_id')
      .sort({ startedAt: -1, dateTime: 1 })
      .limit(MAX_SESSIONS_PER_GROUP)
      .lean(),
    Session.find({ ...sessionQuery, status: 'scheduled' })
      .populate('teacher', 'name email')
      .populate('enrolledStudents', '_id')
      .sort({ dateTime: 1 })
      .limit(MAX_SESSIONS_PER_GROUP)
      .lean(),
    Session.find({ ...sessionQuery, status: 'completed' })
      .populate('teacher', 'name email')
      .populate('enrolledStudents', '_id')
      .sort({ endedAt: -1, dateTime: -1 })
      .limit(MAX_SESSIONS_PER_GROUP)
      .lean(),
    Assignment.find(assignmentQuery)
      .populate('teacherId', 'name email')
      .populate('assignedStudents.studentId', 'name email')
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(MAX_ASSIGNMENTS)
      .lean(),
    Semester.findOne({
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).lean()
  ]);

  return {
    generatedAt: now.toISOString(),
    user: {
      id: user._id.toString(),
      name: user.name,
      role: user.role
    },
    appNavigation: getNavigationLinks(user),
    currentSemester: currentSemester
      ? {
          id: currentSemester._id.toString(),
          year: currentSemester.year,
          term: currentSemester.term,
          startDate: formatDate(currentSemester.startDate),
          endDate: formatDate(currentSemester.endDate)
        }
      : null,
    materials: {
      totalShown: materials.length,
      items: materials.map(summarizeMaterial)
    },
    sessions: {
      active: activeSessions.map((session) => summarizeSession(session, user)),
      scheduled: scheduledSessions.map((session) => summarizeSession(session, user)),
      completedRecent: completedSessions.map((session) => summarizeSession(session, user))
    },
    assignments: {
      totalShown: assignments.length,
      items: assignments.map((assignment) => summarizeAssignment(assignment, user))
    }
  };
};

const normalizeHistory = (conversation = []) => (
  Array.isArray(conversation)
    ? conversation
        .filter((message) => message && typeof message.content === 'string')
        .slice(-MAX_HISTORY_MESSAGES)
        .map((message) => ({
          role: message.role === 'user' ? 'user' : 'model',
          parts: [{ text: sanitizeText(message.content, 3000) }]
        }))
        .filter((message) => message.parts[0].text)
    : []
);

const buildUserParts = (message, image) => {
  const parts = [{ text: message || 'Please describe this image.' }];

  if (image?.data && image?.mimeType) {
    const estimatedBytes = Math.ceil((image.data.length * 3) / 4);
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      const error = new Error('Image must be smaller than 8 MB.');
      error.statusCode = 400;
      throw error;
    }

    parts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType
      }
    });
  }

  return parts;
};

router.post('/', auth, async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: 'AI chat is not configured. Set GOOGLE_API_KEY in the server .env file.'
      });
    }

    const message = sanitizeText(req.body.message);
    const hasImage = Boolean(req.body.image?.data && req.body.image?.mimeType);

    if (!message && !hasImage) {
      return res.status(400).json({ error: 'Message or image is required.' });
    }

    const liveContext = await getLiveDashboardContext(req.user);

    const contents = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Understood. I will help as PFSM Bot.' }] },
      {
        role: 'user',
        parts: [{
          text: `Live dashboard data for the current request:\n${JSON.stringify(liveContext, null, 2)}`
        }]
      },
      {
        role: 'model',
        parts: [{
          text: 'I will use this live dashboard data for current platform facts and avoid inventing records that are not shown.'
        }]
      },
      ...normalizeHistory(req.body.conversation),
      { role: 'user', parts: buildUserParts(message, req.body.image) }
    ];

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1000
      }
    });

    const text = response.text?.trim();

    if (!text) {
      return res.status(502).json({
        error: 'Gemini returned an empty response. Please try again.'
      });
    }

    return res.json({
      reply: text,
      model: GEMINI_MODEL
    });
  } catch (error) {
    console.error('AI chat error:', error.response?.data || error.message);
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : 'Failed to get an AI response.'
    });
  }
});

module.exports = router;
