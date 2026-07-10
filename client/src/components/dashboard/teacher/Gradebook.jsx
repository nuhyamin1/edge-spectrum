import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  TableCellsIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckIcon,
  ArrowPathIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../context/AuthContext';
import { MATERIAL_SUBJECTS } from '../../../constants/materialSubjects';

const Gradebook = () => {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sheetData, setSheetData] = useState({ subject: null, students: [], grades: [] });
  const [loading, setLoading] = useState(true);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [savingCells, setSavingCells] = useState({}); // studentId-columnId -> boolean/success

  // Modal / Inline forms states
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnMaxScore, setNewColumnMaxScore] = useState(100);

  // Feedback Modal states
  const [feedbackModal, setFeedbackModal] = useState(null); // { studentId, studentName, columnId, columnName, score, feedback }

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      fetchSubjects(selectedSemester);
    } else {
      setSubjects([]);
      setSelectedSubject('');
      setSheetData({ subject: null, students: [], grades: [] });
    }
  }, [selectedSemester]);

  useEffect(() => {
    if (selectedSubject) {
      fetchSheetData(selectedSubject);
    } else {
      setSheetData({ subject: null, students: [], grades: [] });
    }
  }, [selectedSubject]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/semesters');
      setSemesters(response.data);
      
      // Try to fetch current semester and set it as default
      try {
        const currentRes = await api.get('/semesters/current');
        if (currentRes.data && currentRes.data._id) {
          setSelectedSemester(currentRes.data._id);
        } else if (response.data.length > 0) {
          setSelectedSemester(response.data[0]._id);
        }
      } catch (err) {
        if (response.data.length > 0) {
          setSelectedSemester(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Failed to load semesters');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (semesterId) => {
    try {
      const response = await api.get(`/grades/subjects?semesterId=${semesterId}`);
      setSubjects(response.data);
      if (response.data.length > 0) {
        setSelectedSubject(response.data[0]._id);
      } else {
        setSelectedSubject('');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const fetchSheetData = async (subjectId) => {
    try {
      setSheetLoading(true);
      const response = await api.get(`/grades/subjects/${subjectId}/sheet`);
      setSheetData(response.data);
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      toast.error('Failed to load grading sheet');
    } finally {
      setSheetLoading(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !selectedSemester) return;
    try {
      const response = await api.post('/grades/subjects', {
        name: newSubjectName.trim(),
        semesterId: selectedSemester
      });
      toast.success('Subject created successfully');
      setNewSubjectName('');
      setShowSubjectModal(false);
      
      // Refresh subjects list and auto-select the newly created subject
      const subsRes = await api.get(`/grades/subjects?semesterId=${selectedSemester}`);
      setSubjects(subsRes.data);
      setSelectedSubject(response.data._id);
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error(error.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnName.trim() || !selectedSubject) return;
    try {
      await api.post(`/grades/subjects/${selectedSubject}/columns`, {
        name: newColumnName.trim(),
        maxScore: newColumnMaxScore
      });
      toast.success('Column added successfully');
      setNewColumnName('');
      setNewColumnMaxScore(100);
      setShowColumnModal(false);
      fetchSheetData(selectedSubject);
    } catch (error) {
      console.error('Error adding column:', error);
      toast.error(error.response?.data?.message || 'Failed to add column');
    }
  };

  const handleDeleteColumn = async (columnId, columnName) => {
    if (!window.confirm(`Are you sure you want to delete column "${columnName}"? All grades in this column will be permanently removed.`)) {
      return;
    }
    try {
      await api.delete(`/grades/subjects/${selectedSubject}/columns/${columnId}`);
      toast.success('Column deleted successfully');
      fetchSheetData(selectedSubject);
    } catch (error) {
      console.error('Error deleting column:', error);
      toast.error(error.response?.data?.message || 'Failed to delete column');
    }
  };

  // Helper to find a specific grade in our client state
  const getGradeValue = (studentId, columnId) => {
    const studentGrades = sheetData.grades.find(g => g.student === studentId);
    if (!studentGrades) return '';
    const colGrade = studentGrades.grades.find(g => g.columnId === columnId);
    return colGrade && colGrade.score !== undefined ? colGrade.score : '';
  };

  const getGradeFeedback = (studentId, columnId) => {
    const studentGrades = sheetData.grades.find(g => g.student === studentId);
    if (!studentGrades) return '';
    const colGrade = studentGrades.grades.find(g => g.columnId === columnId);
    return colGrade ? colGrade.feedback : '';
  };

  // Save score on blur / enter key
  const handleScoreChange = async (studentId, columnId, value, maxScore) => {
    const cellKey = `${studentId}-${columnId}`;
    
    // Parse value
    let parsedVal = value === '' ? '' : Number(value);
    if (parsedVal !== '' && (isNaN(parsedVal) || parsedVal < 0 || parsedVal > maxScore)) {
      toast.error(`Please enter a valid score between 0 and ${maxScore}`);
      return;
    }

    // Get current feedback to preserve it
    const currentFeedback = getGradeFeedback(studentId, columnId);

    // Skip if it hasn't changed
    const currentVal = getGradeValue(studentId, columnId);
    if (currentVal === parsedVal) return;

    try {
      setSavingCells(prev => ({ ...prev, [cellKey]: 'saving' }));
      
      const response = await api.post(`/grades/subjects/${selectedSubject}/scores`, {
        studentId,
        columnId,
        score: parsedVal,
        feedback: currentFeedback
      });

      // Update local state gradebook
      setSheetData(prev => {
        const updatedGrades = [...prev.grades];
        const gradeIndex = updatedGrades.findIndex(g => g.student === studentId);
        
        if (gradeIndex > -1) {
          updatedGrades[gradeIndex] = response.data;
        } else {
          updatedGrades.push(response.data);
        }

        return { ...prev, grades: updatedGrades };
      });

      setSavingCells(prev => ({ ...prev, [cellKey]: 'saved' }));
      setTimeout(() => {
        setSavingCells(prev => {
          const next = { ...prev };
          delete next[cellKey];
          return next;
        });
      }, 1500);
    } catch (error) {
      console.error('Error saving score:', error);
      toast.error('Failed to save grade');
      setSavingCells(prev => ({ ...prev, [cellKey]: 'error' }));
    }
  };

  // Open Feedback Modal
  const openFeedbackModal = (studentId, studentName, columnId, columnName, maxScore) => {
    const score = getGradeValue(studentId, columnId);
    const feedback = getGradeFeedback(studentId, columnId);
    setFeedbackModal({ studentId, studentName, columnId, columnName, score, feedback, maxScore });
  };

  // Save Feedback
  const handleSaveFeedback = async () => {
    if (!feedbackModal) return;
    const { studentId, columnId, feedback, score } = feedbackModal;
    try {
      const response = await api.post(`/grades/subjects/${selectedSubject}/scores`, {
        studentId,
        columnId,
        score: score === '' ? null : Number(score),
        feedback: feedback
      });

      setSheetData(prev => {
        const updatedGrades = [...prev.grades];
        const gradeIndex = updatedGrades.findIndex(g => g.student === studentId);
        if (gradeIndex > -1) {
          updatedGrades[gradeIndex] = response.data;
        } else {
          updatedGrades.push(response.data);
        }
        return { ...prev, grades: updatedGrades };
      });

      toast.success('Feedback saved successfully');
      setFeedbackModal(null);
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback comment');
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (!sheetData.subject || sheetData.students.length === 0) return;
    
    const subject = sheetData.subject;
    const headers = ['Student Name', 'Student Email', ...subject.columns.map(c => `${c.name} (Max: ${c.maxScore})`)];
    
    const rows = sheetData.students.map(student => {
      const row = [student.name, student.email];
      subject.columns.forEach(col => {
        const score = getGradeValue(student._id, col._id);
        row.push(score === '' ? '--' : score);
      });
      return row;
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${subject.name}_grades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 font-medium">Loading gradebook settings...</p>
      </div>
    );
  }

  const subject = sheetData.subject;
  const columns = subject ? subject.columns : [];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TableCellsIcon className="w-8 h-8 text-blue-600 animate-pulse" />
            <h1 className="text-2xl font-bold text-gray-900">Consolidated Gradebook</h1>
          </div>
          <p className="text-gray-600">Manage assessments, grades, and descriptive student feedback in real-time.</p>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
            >
              <option value="">Select Semester</option>
              {semesters.map((sem) => (
                <option key={sem._id} value={sem._id}>
                  {sem.year} - {sem.term}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Subject</label>
            <div className="flex gap-2">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedSemester}
                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Subject</option>
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              {selectedSemester && (
                <button
                  onClick={() => setShowSubjectModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition active:scale-95 flex items-center justify-center"
                  title="Add Subject"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {selectedSubject ? (
        sheetLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col justify-center items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium">Fetching gradebook grid...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 uppercase tracking-wide">{subject?.name}</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {columns.length} Assessments
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowColumnModal(true)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 text-sm font-semibold rounded-lg transition active:scale-95 flex items-center gap-1.5"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Column
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={sheetData.students.length === 0}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-sm font-semibold rounded-lg transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {sheetData.students.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 font-medium">No students registered in this school/classroom yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-50/75">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 min-w-[240px]">
                        Student
                      </th>
                      {columns.map((col) => (
                        <th key={col._id} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 relative group min-w-[150px]">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span>{col.name}</span>
                              <span className="text-[10px] text-gray-400 normal-case font-normal mt-0.5">
                                Max Score: {col.maxScore}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteColumn(col._id, col.name)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition absolute right-2 top-1/2 -translate-y-1/2"
                              title="Delete column"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {sheetData.students.map((student) => (
                      <tr key={student._id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {student.profilePicture?.data ? (
                              <img
                                src={student.profilePicture.data}
                                alt=""
                                className="h-9 w-9 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <UserCircleIcon className="h-9 w-9 text-gray-400" />
                            )}
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 text-sm">{student.name}</span>
                              <span className="text-xs text-gray-500">{student.email}</span>
                            </div>
                          </div>
                        </td>

                        {columns.map((col) => {
                          const cellKey = `${student._id}-${col._id}`;
                          const saveState = savingCells[cellKey];
                          
                          return (
                            <td key={col._id} className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max={col.maxScore}
                                    defaultValue={getGradeValue(student._id, col._id)}
                                    placeholder="--"
                                    onBlur={(e) => handleScoreChange(student._id, col._id, e.target.value, col.maxScore)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.target.blur();
                                      }
                                    }}
                                    className={`w-20 px-3 py-1.5 text-center bg-gray-50 border rounded-lg text-sm font-semibold outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-100 ${
                                      saveState === 'saved'
                                        ? 'border-green-500 bg-green-50 text-green-800 focus:border-green-500'
                                        : saveState === 'error'
                                        ? 'border-red-500 bg-red-50 text-red-800'
                                        : 'border-gray-300 text-gray-800 focus:border-blue-500'
                                    }`}
                                  />
                                  
                                  {/* Autosave inline status indicator */}
                                  {saveState === 'saving' && (
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center pr-1.5 pointer-events-none">
                                      <ArrowPathIcon className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                                    </div>
                                  )}
                                  {saveState === 'saved' && (
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center pr-1.5 pointer-events-none">
                                      <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                                    </div>
                                  )}
                                </div>

                                {/* Comments / Feedback Trigger */}
                                <button
                                  onClick={() => openFeedbackModal(student._id, student.name, col._id, col.name, col.maxScore)}
                                  className={`p-1.5 rounded-lg transition active:scale-95 ${
                                    getGradeFeedback(student._id, col._id)
                                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                  }`}
                                  title={getGradeFeedback(student._id, col._id) ? "View/Edit Feedback (Has content)" : "Add feedback comment"}
                                >
                                  <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <TableCellsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Subject Selected</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-4">
            {selectedSemester 
              ? "Please select or create a subject in this semester to start recording scores."
              : "Please select a semester first to display the corresponding subjects."}
          </p>
        </div>
      )}

      {/* Subject Creator Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Create New Subject</h3>
              <button onClick={() => setShowSubjectModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleCreateSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject Name</label>
                <select
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition text-sm"
                >
                  <option value="" disabled>Select subject</option>
                  {MATERIAL_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Column Creator Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Add Grading Column</h3>
              <button onClick={() => setShowColumnModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleAddColumn} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Column / Assessment Name</label>
                <select
                  required
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition text-sm"
                >
                  <option value="" disabled>Select subject</option>
                  {MATERIAL_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Maximum Score</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={newColumnMaxScore}
                  onChange={(e) => setNewColumnMaxScore(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition text-sm font-semibold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowColumnModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
                >
                  Add Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Popover Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-gray-100 overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-gray-900">Grading Feedback</h3>
                <span className="text-xs text-gray-500">Student: {feedbackModal.studentName}</span>
              </div>
              <button onClick={() => setFeedbackModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-blue-700 font-semibold uppercase">Assessment</p>
                  <p className="font-bold text-gray-800 text-sm">{feedbackModal.columnName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-700 font-semibold uppercase">Score</p>
                  <p className="font-bold text-gray-800 text-sm">
                    {feedbackModal.score === '' ? '--' : feedbackModal.score} / {feedbackModal.maxScore}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Teacher Feedback Comment</label>
                <textarea
                  rows="4"
                  placeholder="Provide specific feedback, strengths, and areas of improvement..."
                  value={feedbackModal.feedback}
                  onChange={(e) => setFeedbackModal(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setFeedbackModal(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFeedback}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
                >
                  Save Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gradebook;
