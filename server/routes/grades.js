const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const GradeSubject = require('../models/GradeSubject');
const StudentGrade = require('../models/StudentGrade');

// 1. Get subjects for a given semester
router.get('/subjects', auth, async (req, res) => {
  try {
    const { semesterId } = req.query;
    if (!semesterId) {
      return res.status(400).json({ message: 'Semester ID is required' });
    }

    let query = { semester: semesterId };
    
    // If teacher, show only their subjects. If student, show all subjects in that semester.
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }

    const subjects = await GradeSubject.find(query).sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
});

// 2. Create a new subject (Teacher only)
router.post('/subjects', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Only teachers can create subjects.' });
    }

    const { name, semesterId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Subject name is required' });
    }
    if (!semesterId) {
      return res.status(400).json({ message: 'Semester ID is required' });
    }

    const subject = new GradeSubject({
      name: name.trim(),
      semester: semesterId,
      teacher: req.user._id,
      columns: []
    });

    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ message: 'Error creating subject', error: error.message });
  }
});

// 3. Add a grading column to a subject (Teacher only)
router.post('/subjects/:subjectId/columns', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Only teachers can add columns.' });
    }

    const { name, maxScore } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Column name is required' });
    }

    const subject = await GradeSubject.findOne({ _id: req.params.subjectId, teacher: req.user._id });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found or unauthorized' });
    }

    // Check if column name already exists
    const exists = subject.columns.some(col => col.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ message: 'A column with this name already exists' });
    }

    subject.columns.push({
      name: name.trim(),
      maxScore: maxScore || 100
    });

    await subject.save();
    res.json(subject);
  } catch (error) {
    console.error('Error adding column:', error);
    res.status(500).json({ message: 'Error adding column', error: error.message });
  }
});

// 4. Delete a grading column from a subject (Teacher only)
router.delete('/subjects/:subjectId/columns/:columnId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Only teachers can delete columns.' });
    }

    const subject = await GradeSubject.findOne({ _id: req.params.subjectId, teacher: req.user._id });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found or unauthorized' });
    }

    // Pull the column
    subject.columns = subject.columns.filter(col => col._id.toString() !== req.params.columnId);
    await subject.save();

    // Clean up grades associated with this column
    await StudentGrade.updateMany(
      { subject: req.params.subjectId },
      { $pull: { grades: { columnId: req.params.columnId } } }
    );

    res.json(subject);
  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ message: 'Error deleting column', error: error.message });
  }
});

// 5. Fetch grading sheet data: students and their scores for a subject (Teacher only)
router.get('/subjects/:subjectId/sheet', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Only teachers can view grading sheets.' });
    }

    const subject = await GradeSubject.findOne({ _id: req.params.subjectId, teacher: req.user._id });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found or unauthorized' });
    }

    // Get all students
    const students = await User.find({ role: 'student' })
      .select('name email profilePicture')
      .sort({ name: 1 });

    // Get all grades for this subject
    const studentGrades = await StudentGrade.find({ subject: req.params.subjectId });

    res.json({
      subject,
      students,
      grades: studentGrades
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    res.status(500).json({ message: 'Error fetching sheet data', error: error.message });
  }
});

// 6. Update student score for a column (Teacher only)
router.post('/subjects/:subjectId/scores', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Only teachers can update scores.' });
    }

    const { studentId, columnId, score, feedback } = req.body;
    if (!studentId || !columnId) {
      return res.status(400).json({ message: 'studentId and columnId are required' });
    }

    const subject = await GradeSubject.findOne({ _id: req.params.subjectId, teacher: req.user._id });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found or unauthorized' });
    }

    // Verify column exists
    const column = subject.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ message: 'Grading column not found in this subject' });
    }

    // Find or create StudentGrade doc
    let studentGrade = await StudentGrade.findOne({
      student: studentId,
      subject: req.params.subjectId
    });

    if (!studentGrade) {
      studentGrade = new StudentGrade({
        student: studentId,
        subject: req.params.subjectId,
        grades: []
      });
    }

    // Update or insert score
    const gradeIndex = studentGrade.grades.findIndex(g => g.columnId === columnId);
    const parsedScore = score === '' || score === null || score === undefined ? undefined : Number(score);

    if (gradeIndex > -1) {
      if (parsedScore === undefined) {
        // Remove grade entry if score is empty
        studentGrade.grades.splice(gradeIndex, 1);
      } else {
        studentGrade.grades[gradeIndex].score = parsedScore;
        studentGrade.grades[gradeIndex].feedback = feedback || '';
      }
    } else if (parsedScore !== undefined) {
      studentGrade.grades.push({
        columnId,
        score: parsedScore,
        feedback: feedback || ''
      });
    }

    await studentGrade.save();
    res.json(studentGrade);
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ message: 'Error updating score', error: error.message });
  }
});

// 7. Student fetches their report card for a given semester
router.get('/student/report', auth, async (req, res) => {
  try {
    const { semesterId } = req.query;
    if (!semesterId) {
      return res.status(400).json({ message: 'Semester ID is required' });
    }

    // 1. Find all subjects in this semester
    const subjects = await GradeSubject.find({ semester: semesterId })
      .populate('teacher', 'name email');

    // 2. Find grades for the logged-in student in these subjects
    const subjectIds = subjects.map(s => s._id);
    const studentGrades = await StudentGrade.find({
      student: req.user._id,
      subject: { $in: subjectIds }
    });

    // 3. Map subjects with grades for structured report card response
    const reportCard = subjects.map(subject => {
      const studentGrade = studentGrades.find(g => g.subject.toString() === subject._id.toString());
      
      const gradesMap = (studentGrade ? studentGrade.grades : []).reduce((acc, g) => {
        acc[g.columnId] = {
          score: g.score,
          feedback: g.feedback
        };
        return acc;
      }, {});

      const detailedGrades = subject.columns.map(col => {
        const gradeInfo = gradesMap[col._id.toString()] || null;
        return {
          columnId: col._id,
          name: col.name,
          maxScore: col.maxScore,
          score: gradeInfo ? gradeInfo.score : null,
          feedback: gradeInfo ? gradeInfo.feedback : ''
        };
      });

      return {
        subjectId: subject._id,
        name: subject.name,
        teacher: subject.teacher,
        grades: detailedGrades
      };
    });

    res.json(reportCard);
  } catch (error) {
    console.error('Error fetching report card:', error);
    res.status(500).json({ message: 'Error fetching report card', error: error.message });
  }
});

module.exports = router;
