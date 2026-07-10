const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const { spawn } = require('child_process');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testGrades = async () => {
  let serverProcess = null;
  let testTeacherId = null;
  let testStudentId = null;
  let testSemesterId = null;
  let testSubjectId = null;
  let testColumnId = null;

  try {
    console.log('Connecting to MongoDB directly for setup...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // 1. Create mock objects in database
    const User = require('../models/User');
    const Semester = require('../models/Semester');
    const GradeSubject = require('../models/GradeSubject');
    const StudentGrade = require('../models/StudentGrade');

    // Clean up any old test leftovers
    await User.deleteMany({ email: { $in: ['test-teacher@gradebook.com', 'test-student@gradebook.com'] } });
    await Semester.deleteMany({ year: 3026 });

    console.log('Creating mock teacher and student accounts...');
    
    // Create Teacher
    const teacher = new User({
      name: 'Test Teacher',
      email: 'test-teacher@gradebook.com',
      password: 'Password@123',
      role: 'teacher',
      isEmailVerified: true
    });
    await teacher.save();
    testTeacherId = teacher._id.toString();

    // Create Student
    const student = new User({
      name: 'Test Student',
      email: 'test-student@gradebook.com',
      password: 'Password@123',
      role: 'student',
      isEmailVerified: true
    });
    await student.save();
    testStudentId = student._id.toString();

    // Create Semester
    const semester = new Semester({
      year: 3026,
      term: 'July-December',
      startDate: new Date('3026-07-01'),
      endDate: new Date('3026-12-31')
    });
    await semester.save();
    testSemesterId = semester._id.toString();

    console.log('Mock records prepared:');
    console.log(`- Teacher ID: ${testTeacherId}`);
    console.log(`- Student ID: ${testStudentId}`);
    console.log(`- Semester ID: ${testSemesterId}`);

    // Generate JWT tokens for Axios headers
    const teacherToken = jwt.sign({ userId: testTeacherId }, JWT_SECRET, { expiresIn: '1h' });
    const studentToken = jwt.sign({ userId: testStudentId }, JWT_SECRET, { expiresIn: '1h' });

    // Close direct mongoose connection so server can open it cleanly
    await mongoose.disconnect();
    console.log('Direct Mongoose connection closed.');

    // 2. Start Express Server as a child process
    console.log('Starting Express server on test port 5050...');
    serverProcess = spawn('node', [path.join(__dirname, '../server.js')], {
      env: {
        ...process.env,
        PORT: '5050',
        NODE_ENV: 'development',
        MONGODB_URI // pass down MONGODB_URI
      }
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[Server]: ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Error]: ${data.toString().trim()}`);
    });

    // Wait for server to boot (give it 5 seconds)
    console.log('Waiting for server initialization...');
    await sleep(5000);

    const client = axios.create({
      baseURL: 'http://localhost:5050/api',
      timeout: 5000
    });

    console.log('\n--- STARTING API ENDPOINT TESTS ---');

    // 3. Create Subject (Teacher)
    console.log('\nTesting: POST /api/grades/subjects (Teacher)');
    const createSubRes = await client.post('/grades/subjects', {
      name: 'English Speaking Class',
      semesterId: testSemesterId
    }, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    
    if (createSubRes.status === 201 && createSubRes.data._id) {
      console.log('✅ Subject created successfully:', createSubRes.data.name);
      testSubjectId = createSubRes.data._id;
    } else {
      throw new Error(`Failed to create subject. Status: ${createSubRes.status}`);
    }

    // 4. Create Subject (Student) - Should be forbidden (403)
    console.log('\nTesting: POST /api/grades/subjects (Student - Authorization Check)');
    try {
      await client.post('/grades/subjects', {
        name: 'Illegal Student Class',
        semesterId: testSemesterId
      }, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      throw new Error('❌ Forbidden: Student was able to create a subject.');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✅ Student subject creation blocked correctly (403 Forbidden).');
      } else {
        throw err;
      }
    }

    // 5. Add Assessment Column (Teacher)
    console.log('\nTesting: POST /api/grades/subjects/:subjectId/columns (Teacher)');
    const addColRes = await client.post(`/grades/subjects/${testSubjectId}/columns`, {
      name: 'Speaking Midterm',
      maxScore: 100
    }, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });

    if (addColRes.status === 200 && addColRes.data.columns.length > 0) {
      const col = addColRes.data.columns.find(c => c.name === 'Speaking Midterm');
      testColumnId = col._id;
      console.log('✅ Column added successfully:', col.name, 'with ID:', testColumnId);
    } else {
      throw new Error(`Failed to add column. Status: ${addColRes.status}`);
    }

    // 6. Update Student Score and Feedback (Teacher)
    console.log('\nTesting: POST /api/grades/subjects/:subjectId/scores (Teacher)');
    const updateScoreRes = await client.post(`/grades/subjects/${testSubjectId}/scores`, {
      studentId: testStudentId,
      columnId: testColumnId,
      score: 92,
      feedback: 'Excellent pronunciation and fluency.'
    }, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });

    if (updateScoreRes.status === 200 && updateScoreRes.data.grades.length > 0) {
      const g = updateScoreRes.data.grades[0];
      console.log('✅ Score updated successfully:');
      console.log(`   - Score: ${g.score}`);
      console.log(`   - Feedback: "${g.feedback}"`);
    } else {
      throw new Error(`Failed to update score. Status: ${updateScoreRes.status}`);
    }

    // 7. Update Student Score (Student) - Should be forbidden (403)
    console.log('\nTesting: POST /api/grades/subjects/:subjectId/scores (Student - Authorization Check)');
    try {
      await client.post(`/grades/subjects/${testSubjectId}/scores`, {
        studentId: testStudentId,
        columnId: testColumnId,
        score: 100,
        feedback: 'Self-grading'
      }, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      throw new Error('❌ Forbidden: Student was able to edit scores.');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✅ Student score update blocked correctly (403 Forbidden).');
      } else {
        throw err;
      }
    }

    // 8. Fetch Gradebook Sheet (Teacher)
    console.log('\nTesting: GET /api/grades/subjects/:subjectId/sheet (Teacher)');
    const sheetRes = await client.get(`/grades/subjects/${testSubjectId}/sheet`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });

    if (sheetRes.status === 200 && sheetRes.data.students && sheetRes.data.grades) {
      console.log('✅ Gradebook sheet fetched successfully.');
      console.log(`   - Student count: ${sheetRes.data.students.length}`);
      console.log(`   - Grades records count: ${sheetRes.data.grades.length}`);
    } else {
      throw new Error(`Failed to fetch sheet data. Status: ${sheetRes.status}`);
    }

    // 9. Fetch Student Report Card (Student)
    console.log('\nTesting: GET /api/grades/student/report (Student)');
    const reportRes = await client.get(`/grades/student/report?semesterId=${testSemesterId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    if (reportRes.status === 200 && reportRes.data.length > 0) {
      const r = reportRes.data[0];
      console.log('✅ Report card fetched successfully.');
      console.log(`   - Subject: ${r.name}`);
      console.log(`   - Grades returned:`, r.grades);
    } else {
      throw new Error(`Failed to fetch report card. Status: ${reportRes.status}`);
    }

    console.log('\n=======================================');
    console.log('🎉 ALL GRADEBOOK BACKEND TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('=======================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  } finally {
    // Kill the server child process
    if (serverProcess) {
      console.log('Stopping test server...');
      serverProcess.kill('SIGINT');
    }

    // Connect again to clean up mock data
    try {
      console.log('Reconnecting direct Mongoose for cleanup...');
      await mongoose.connect(MONGODB_URI);
      const User = require('../models/User');
      const Semester = require('../models/Semester');
      const GradeSubject = require('../models/GradeSubject');
      const StudentGrade = require('../models/StudentGrade');

      await User.deleteMany({ email: { $in: ['test-teacher@gradebook.com', 'test-student@gradebook.com'] } });
      await Semester.deleteMany({ year: 3026 });
      if (testSubjectId) {
        await GradeSubject.deleteOne({ _id: testSubjectId });
        await StudentGrade.deleteMany({ subject: testSubjectId });
      }
      console.log('Cleanup finished successfully.');
      await mongoose.disconnect();
    } catch (cleanError) {
      console.error('Error during cleanup:', cleanError);
    }

    process.exit(0);
  }
};

testGrades();
