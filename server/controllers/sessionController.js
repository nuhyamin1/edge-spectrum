const Session = require('../models/Session');
const { emitSessionUpdate } = require('../services/sessionEvents');

exports.createSession = async (req, res) => {
  try {
    const { title, description, startTime, endTime, maxStudents } = req.body;
    const teacherId = req.user.id;

    const session = new Session({
      title,
      description,
      teacherId,
      startTime,
      endTime,
      maxStudents
    });

    await session.save();
    emitSessionUpdate('session-created', session);
    
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('teacherId', 'name email')
      .populate('students', 'name email');
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('students', 'name email');
      
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.teacherId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('teacherId', 'name email')
     .populate('students', 'name email');

    emitSessionUpdate('session-updated', updatedSession);
    res.json(updatedSession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.teacherId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await session.remove();
    emitSessionUpdate('session-deleted', { id: req.params.id });
    
    res.json({ message: 'Session removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.joinSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.students.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already joined this session' });
    }

    if (session.students.length >= session.maxStudents) {
      return res.status(400).json({ message: 'Session is full' });
    }

    session.students.push(req.user.id);
    await session.save();

    const updatedSession = await Session.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('students', 'name email');

    emitSessionUpdate('session-updated', updatedSession);
    res.json(updatedSession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.leaveSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const studentIndex = session.students.indexOf(req.user.id);
    if (studentIndex === -1) {
      return res.status(400).json({ message: 'Not joined this session' });
    }

    session.students.splice(studentIndex, 1);
    await session.save();

    const updatedSession = await Session.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('students', 'name email');

    emitSessionUpdate('session-updated', updatedSession);
    res.json(updatedSession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
