import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  MenuItem,
  Chip,
  IconButton,
  Link,
  Divider,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, CalendarToday as CalendarIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import { useAuth, api } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './TeacherAssignments.css';

const styles = {
  listContainer: {
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  assignmentCard: {
    width: '100%',
    mb: 2,
    transition: 'all 0.3s ease-in-out',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '15px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
  cardContent: {
    padding: 3,
    cursor: 'pointer',
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    mb: 2,
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    '& h6': {
      fontWeight: 600,
      color: '#059',
    },
  },
  descriptionSection: {
    my: 2,
    pl: 4,
    '& .ql-editor': {
      padding: 0,
    },
    '& .material-content': {
      color: 'black',
      '& p': { marginBottom: '0.5em' },
      '& ul, & ol': { paddingLeft: '1.5em' },
      '& strong': { fontWeight: 'bold' },
      '& em': { fontStyle: 'italic' },
    }
  },
  metaSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mt: 2,
    flexWrap: 'wrap',
    gap: 1,
  },
  dateChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    bgcolor: 'rgba(96, 165, 250, 0.1)',
    color: 'red',
    px: 1.5,
    py: 0.75,
    borderRadius: '16px',
    fontSize: '0.875rem',
  },
  statsContainer: {
    display: 'flex',
    gap: 1,
    flexWrap: 'wrap',
  },
  statChip: {
    borderRadius: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
  },
  submissionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: '8px',
    p: 1,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: 'rgba(31, 41, 55, 0.7)',
    },
  },
  fileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    mr: 1,
    color: '#E5E7EB',
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    color: '#60A5FA',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  quillEditor: {
    marginTop: 2,
    marginBottom: 2,
    '& .ql-container': {
      minHeight: '200px',
      fontSize: '1rem',
    },
    '& .ql-editor': {
      minHeight: '200px',
    },
  },
};

const TeacherAssignments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    studentId: '',
    maxFiles: 1,
    maxLinks: 1
  });
  const [reviewData, setReviewData] = useState({
    status: '',
    mark: '',
    feedback: '',
    rejectionReason: '',
  });
  const [assignToAll, setAssignToAll] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchStudents();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments/teacher');
      setAssignments(response.data);
    } catch (error) {
      toast.error('Error fetching assignments');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/users', { params: { role: 'student' } });
      setStudents(response.data);
    } catch (error) {
      toast.error('Error fetching students list');
    }
  };

  const handleCreateAssignment = async () => {
    try {
      if (!formData.title || !formData.description || !formData.dueDate || 
          (!assignToAll && !formData.studentId) || !formData.maxFiles || !formData.maxLinks) {
        toast.error('Please fill in all required fields');
        return;
      }

      const newAssignment = {
        ...formData,
        description: formData.description, // This contains the HTML content from Quill
        dueDate: new Date(formData.dueDate).toISOString(),
        maxFiles: parseInt(formData.maxFiles),
        maxLinks: parseInt(formData.maxLinks),
        assignToAll: assignToAll
      };

      await api.post('/assignments', newAssignment);
      setOpenDialog(false);
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        studentId: '',
        maxFiles: 1,
        maxLinks: 1
      });
      setAssignToAll(false);
      fetchAssignments();
      toast.success('Assignment created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating assignment');
    }
  };

  const handleOpenReview = (assignment, student, event) => {
    event.stopPropagation();
    setSelectedAssignment(assignment);
    setSelectedStudent(student);
    setReviewData({
      status: student.status || '',
      mark: student.mark || '',
      feedback: student.feedback || '',
      rejectionReason: student.rejectionReason || '',
    });
    setOpenReviewDialog(true);
  };

  const handleReviewAssignment = async () => {
    try {
      await api.post(`/assignments/${selectedAssignment._id.toString()}/review`, {
        ...reviewData,
        studentId: selectedStudent.studentId._id
      });
      setOpenReviewDialog(false);
      fetchAssignments();
      toast.success('Assignment reviewed successfully');
    } catch (error) {
      toast.error('Error reviewing assignment');
    }
  };

  const handleDownloadSubmission = async (assignment, student, submissionIndex, event) => {
    event.stopPropagation();
    try {
      const response = await api.get(
        `/assignments/${assignment._id}/download/${submissionIndex}`,
        { responseType: 'blob' }
      );
      
      const submission = student.submissions[submissionIndex];
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', submission.originalName || 'submission');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Error downloading submission');
    }
  };

  const handleDeleteAssignment = async (assignmentId, event) => {
    event.stopPropagation();
    try {
      if (window.confirm('Are you sure you want to delete this assignment?')) {
        await api.delete(`/assignments/${assignmentId}`);
        fetchAssignments();
        toast.success('Assignment deleted successfully');
      }
    } catch (error) {
      toast.error('Error deleting assignment');
    }
  };

  const getSubmissionStats = (assignment) => {
    const students = assignment.assignedStudents || [];
    const total = students.length;
    const pending = students.filter(s => !s.submissions || s.submissions.length === 0 || s.status === 'pending').length;
    const submitted = students.filter(s => s.status === 'submitted').length;
    const accepted = students.filter(s => s.status === 'accepted').length;
    const rejected = students.filter(s => s.status === 'rejected').length;

    return { total, pending, submitted, accepted, rejected };
  };

  const formatDueDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Box p={3} sx={{ backgroundColor: 'transparent' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#F3F4F6' }}>
          Assignments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{
            backgroundColor: 'rgba(31, 41, 55, 0.5)',
            borderColor: 'rgba(75, 85, 99, 0.5)',
            color: '#60A5FA',
            '&:hover': {
              backgroundColor: 'rgba(31, 41, 55, 0.8)',
            }
          }}
        >
          Create Assignment
        </Button>
      </Box>

      <Box sx={styles.listContainer}>
        {assignments.map((assignment) => {
          const stats = getSubmissionStats(assignment);
          return (
            <Paper 
              key={assignment._id}
              elevation={0}
              sx={{
                ...styles.assignmentCard,
                '&:hover': {
                  border: '1px solid rgba(96, 165, 250, 0.5)',
                  boxShadow: '0 4px 20px rgba(96, 165, 250, 0.2)',
                },
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Glossy overlay effect */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.1), transparent)',
                  opacity: 0,
                  transition: 'opacity 0.3s',
                  pointerEvents: 'none',
                  '.MuiPaper-root:hover &': {
                    opacity: 1
                  }
                }}
              />

              <CardContent 
                sx={{
                  ...styles.cardContent,
                  '&:last-child': { pb: 3 }
                }}
                onClick={() => navigate(`/teacher/assignments/${assignment._id}`)}
              >
                <Box sx={styles.headerSection}>
                  <Box sx={styles.titleSection}>
                    <AssignmentIcon sx={{ color: '#60A5FA' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#F3F4F6' }}>
                      {assignment.title}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={(e) => handleDeleteAssignment(assignment._id, e)}
                    size="small"
                    sx={{
                      color: '#EF4444',
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)'
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                
                <Box sx={styles.descriptionSection}>
                  <div 
                    className="prose prose-invert max-w-none ql-editor material-content"
                    dangerouslySetInnerHTML={{ __html: assignment.description }} 
                  />
                </Box>
                
                <Divider sx={{ my: 2, borderColor: 'rgba(75, 85, 99, 0.5)' }} />
                
                <Box sx={styles.metaSection}>
                  <Box sx={styles.dateChip}>
                    <CalendarIcon fontSize="small" sx={{ color: '#60A5FA' }} />
                    <Typography variant="body2" sx={{ fontWeight: 'medium', color: '#60A5FA' }}>
                      Due: {formatDueDate(assignment.dueDate)}
                    </Typography>
                  </Box>
                  
                  <Box sx={styles.statsContainer}>
                    <Chip
                      label={`Total: ${stats.total}`}
                      size="small"
                      sx={{
                        ...styles.statChip,
                        backgroundColor: 'rgba(31, 41, 55, 0.5)',
                        color: '#E5E7EB'
                      }}
                    />
                    {stats.submitted > 0 && (
                      <Chip
                        label={`Submitted: ${stats.submitted}`}
                        size="small"
                        sx={{
                          ...styles.statChip,
                          backgroundColor: 'rgba(96, 165, 250, 0.1)',
                          color: '#60A5FA'
                        }}
                      />
                    )}
                    {stats.accepted > 0 && (
                      <Chip
                        label={`Accepted: ${stats.accepted}`}
                        size="small"
                        sx={{
                          ...styles.statChip,
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          color: '#22C55E'
                        }}
                      />
                    )}
                    {stats.rejected > 0 && (
                      <Chip
                        label={`Rejected: ${stats.rejected}`}
                        size="small"
                        sx={{
                          ...styles.statChip,
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444'
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Paper>
          );
        })}
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle1" sx={{ mb: 1 }}>Description</Typography>
            <ReactQuill
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              style={{ height: '250px', marginBottom: '50px' }}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  [{ 'color': [] }, { 'background': [] }],
                  ['link'],
                  ['clean']
                ],
              }}
              theme="snow"
            />

            <TextField
              fullWidth
              label="Due Date"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              fullWidth
              label="Assign To"
              value={assignToAll ? 'all' : formData.studentId}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  setAssignToAll(true);
                  setFormData({ ...formData, studentId: '' });
                } else {
                  setAssignToAll(false);
                  setFormData({ ...formData, studentId: e.target.value });
                }
              }}
              sx={{ mb: 2 }}
            >
              <MenuItem value="all">All Students</MenuItem>
              {students.map((student) => (
                <MenuItem key={student._id} value={student._id}>
                  {student.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Maximum Files"
              type="number"
              value={formData.maxFiles}
              onChange={(e) => setFormData({ ...formData, maxFiles: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{ inputProps: { min: 1 } }}
            />

            <TextField
              fullWidth
              label="Maximum Links"
              type="number"
              value={formData.maxLinks}
              onChange={(e) => setFormData({ ...formData, maxLinks: e.target.value })}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateAssignment} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openReviewDialog}
        onClose={() => setOpenReviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Student: {selectedStudent?.studentId.name}
            </Typography>
            
            {selectedStudent?.submissions?.map((submission, index) => (
              <Box key={index} mb={2}>
                {submission.type === 'file' ? (
                  <Box sx={styles.submissionItem}>
                    <Typography variant="body2" sx={styles.fileName}>
                      {submission.originalName}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={(e) => handleDownloadSubmission(selectedAssignment, selectedStudent, index, e)}
                    >
                      Download
                    </Button>
                  </Box>
                ) : (
                  <Box sx={styles.linkItem}>
                    <Typography variant="body2" sx={styles.fileName}>
                      Link {index + 1}
                    </Typography>
                    <Link
                      href={submission.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={styles.link}
                    >
                      {submission.content}
                    </Link>
                  </Box>
                )}
              </Box>
            ))}

            <TextField
              select
              fullWidth
              label="Status"
              value={reviewData.status}
              onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
              sx={{ mb: 2 }}
            >
              <MenuItem value="accepted">Accept</MenuItem>
              <MenuItem value="rejected">Reject</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Mark (0-100)"
              type="number"
              value={reviewData.mark}
              onChange={(e) => setReviewData({ ...reviewData, mark: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />

            <TextField
              fullWidth
              label="Feedback"
              multiline
              rows={4}
              value={reviewData.feedback}
              onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
              sx={{ mb: 2 }}
            />

            {reviewData.status === 'rejected' && (
              <TextField
                fullWidth
                label="Rejection Reason"
                multiline
                rows={2}
                value={reviewData.rejectionReason}
                onChange={(e) => setReviewData({ ...reviewData, rejectionReason: e.target.value })}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>Cancel</Button>
          <Button onClick={handleReviewAssignment} variant="contained" color="primary">
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAssignments;