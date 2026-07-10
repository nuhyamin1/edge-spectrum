import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  AcademicCapIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatBubbleLeftEllipsisIcon,
  BookOpenIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../context/AuthContext';

const StudentReport = () => {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState({});

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      fetchReport(selectedSemester);
    } else {
      setReportData([]);
    }
  }, [selectedSemester]);

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

  const fetchReport = async (semesterId) => {
    try {
      setReportLoading(true);
      const response = await api.get(`/grades/student/report?semesterId=${semesterId}`);
      setReportData(response.data);
      
      // Expand the first subject by default
      if (response.data.length > 0) {
        setExpandedSubjects({ [response.data[0].subjectId]: true });
      }
    } catch (error) {
      console.error('Error fetching report card:', error);
      toast.error('Failed to load report card');
    } finally {
      setReportLoading(false);
    }
  };

  const toggleSubject = (subjectId) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  // Calculations
  const calculateSubjectStats = (subject) => {
    const gradedGrades = subject.grades.filter(g => g.score !== null);
    if (gradedGrades.length === 0) return { avg: null, count: 0 };
    
    const totalPercentage = gradedGrades.reduce((sum, g) => {
      return sum + (g.score / g.maxScore) * 100;
    }, 0);
    
    return {
      avg: Math.round(totalPercentage / gradedGrades.length),
      count: gradedGrades.length
    };
  };

  // Overall GPA Calculation (across all subjects in this semester)
  const calculateOverallStats = () => {
    let totalScorePercent = 0;
    let totalGradesCount = 0;
    let gradedSubjectsCount = 0;

    reportData.forEach(sub => {
      const stats = calculateSubjectStats(sub);
      if (stats.avg !== null) {
        totalScorePercent += stats.avg;
        gradedSubjectsCount += 1;
        totalGradesCount += stats.count;
      }
    });

    return {
      average: gradedSubjectsCount > 0 ? Math.round(totalScorePercent / gradedSubjectsCount) : null,
      gradedSubjects: gradedSubjectsCount,
      totalAssessments: totalGradesCount
    };
  };

  const overallStats = calculateOverallStats();

  const getProgressColor = (percent) => {
    if (percent >= 80) return 'bg-green-500 text-green-700 border-green-200';
    if (percent >= 60) return 'bg-amber-500 text-amber-700 border-amber-200';
    return 'bg-red-500 text-red-700 border-red-200';
  };

  const getProgressColorText = (percent) => {
    if (percent >= 80) return 'text-green-600';
    if (percent >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 font-medium">Loading report card settings...</p>
      </div>
    );
  }

  // Draw custom SVG chart showing subject averages
  const renderGradeChart = () => {
    // Filter subjects that have at least one grade
    const chartData = reportData
      .map(sub => {
        const stats = calculateSubjectStats(sub);
        return { name: sub.name, avg: stats.avg };
      })
      .filter(d => d.avg !== null);

    if (chartData.length === 0) return null;

    const width = 600;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate dynamic coordinates
    const points = chartData.map((d, index) => {
      const x = padding + (index / (chartData.length === 1 ? 1 : chartData.length - 1)) * chartWidth;
      const y = padding + chartHeight - (d.avg / 100) * chartHeight;
      return { x, y, name: d.name, avg: d.avg };
    });

    // Create SVG Path line
    let linePath = "";
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        linePath += ` L ${points[i].x} ${points[i].y}`;
      }
    }

    return (
      <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-gray-850">Performance Overview Card</h3>
        </div>
        <div className="relative overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto">
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map((level) => {
              const y = padding + chartHeight - (level / 100) * chartHeight;
              return (
                <g key={level}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-400 font-semibold">
                    {level}%
                  </text>
                </g>
              );
            })}

            {/* Path Connection */}
            {points.length > 1 && (
              <path
                d={linePath}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-dash"
              />
            )}

            {/* Data Nodes */}
            {points.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill="#FFFFFF"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  className="hover:r-8 transition-all"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="12"
                  fill="#3B82F6"
                  fillOpacity="0.1"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
                {/* Score Text above circle */}
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  className="text-xs font-bold fill-blue-700"
                >
                  {p.avg}%
                </text>
                {/* Subject Label below axis */}
                <text
                  x={p.x}
                  y={height - padding + 20}
                  textAnchor="middle"
                  className="text-[9px] fill-gray-500 font-semibold"
                >
                  {p.name.length > 15 ? `${p.name.slice(0, 12)}...` : p.name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AcademicCapIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Academic Report Card</h1>
          </div>
          <p className="text-gray-600">Track your performance averages, assessment history, and teacher recommendations.</p>
        </div>

        {/* Semester Selector */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Active Semester</label>
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
      </div>

      {selectedSemester ? (
        reportLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col justify-center items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 font-medium">Assembling report data...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Graded Subjects</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              You do not have any grades registered for this semester. Subjects will show here once teachers add assessments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Summary Metrics and SVG Chart */}
            <div className="lg:col-span-1 space-y-6">
              {/* Overall Circular Score Card */}
              <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center text-center space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Overall Academic average</h3>
                
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Gauge Background Circle */}
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="60" className="stroke-gray-100" strokeWidth="10" fill="transparent" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="60" 
                      className={`transition-all duration-1000 ${
                        overallStats.average === null 
                          ? 'stroke-gray-300' 
                          : overallStats.average >= 80 
                          ? 'stroke-green-500' 
                          : overallStats.average >= 60 
                          ? 'stroke-amber-500' 
                          : 'stroke-red-500'
                      }`}
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray={376.8}
                      strokeDashoffset={overallStats.average === null ? 376.8 : 376.8 - (overallStats.average / 100) * 376.8}
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  {/* Text Center */}
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {overallStats.average !== null ? `${overallStats.average}%` : '--'}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold mt-1">GPA Equivalent</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-gray-150">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <span className="block text-xs text-gray-400 font-semibold uppercase">Subjects Graded</span>
                    <span className="text-lg font-bold text-gray-800">{overallStats.gradedSubjects}</span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <span className="block text-xs text-gray-400 font-semibold uppercase">Assessments</span>
                    <span className="text-lg font-bold text-gray-800">{overallStats.totalAssessments}</span>
                  </div>
                </div>
              </div>

              {/* Performance SVG Line Chart */}
              {renderGradeChart()}
            </div>

            {/* Right: Accordion Subjects Panels */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-850 flex items-center gap-1.5 px-1">
                <SparklesIcon className="w-5 h-5 text-blue-600" />
                Detailed Grades by Subject
              </h2>

              {reportData.map((sub) => {
                const stats = calculateSubjectStats(sub);
                const isExpanded = expandedSubjects[sub.subjectId];
                
                return (
                  <div 
                    key={sub.subjectId} 
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:border-blue-200 transition"
                  >
                    {/* Accordion Trigger Header */}
                    <button
                      onClick={() => toggleSubject(sub.subjectId)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{sub.name}</h3>
                          <span className="text-xs text-gray-500">Teacher: {sub.teacher?.name} ({sub.teacher?.email})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {stats.avg !== null ? (
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getProgressColor(stats.avg)}`}>
                            Average: {stats.avg}%
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 rounded-full">
                            Ungraded
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-150 bg-gray-50/20 px-6 py-4 space-y-4">
                        {sub.grades.length === 0 ? (
                          <p className="text-sm text-gray-500 italic py-2">No grading columns defined for this subject yet.</p>
                        ) : (
                          <div className="space-y-4">
                            {sub.grades.map((grade) => {
                              const percentage = grade.score !== null ? Math.round((grade.score / grade.maxScore) * 100) : null;
                              
                              return (
                                <div key={grade.columnId} className="bg-white p-4 rounded-xl border border-gray-150 space-y-3 shadow-xs">
                                  
                                  {/* Title & Score Indicator */}
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-800 text-sm">{grade.name}</span>
                                    <div className="text-right">
                                      <span className="text-sm font-bold text-gray-900">
                                        {grade.score !== null ? `${grade.score} / ${grade.maxScore}` : '--'}
                                      </span>
                                      {percentage !== null && (
                                        <span className={`text-xs font-semibold ml-2 ${getProgressColorText(percentage)}`}>
                                          ({percentage}%)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-1000 ${
                                        percentage === null 
                                          ? 'bg-transparent' 
                                          : percentage >= 80 
                                          ? 'bg-green-500' 
                                          : percentage >= 60 
                                          ? 'bg-amber-500' 
                                          : 'bg-red-500'
                                      }`}
                                      style={{ width: percentage !== null ? `${percentage}%` : '0%' }}
                                    />
                                  </div>

                                  {/* Teacher Comment block */}
                                  {grade.feedback ? (
                                    <div className="flex gap-2 bg-blue-50/40 p-3 rounded-lg border border-blue-100/50 mt-2">
                                      <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Teacher Feedback</span>
                                        <span className="text-xs text-gray-700 leading-relaxed mt-0.5">{grade.feedback}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    grade.score !== null && (
                                      <span className="text-[10px] text-gray-400 italic block mt-1">No comments provided.</span>
                                    )
                                  )}

                                  {grade.score === null && (
                                    <span className="text-[10px] text-gray-400 italic block">Not graded yet.</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Semester Selected</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Please select a semester at the top right to display your student grades.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentReport;
