import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, CalendarToday as CalendarIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import { api } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './TeacherAssignments.css';

const styles = {
  page: {
    width: '100%',
    minHeight: '70vh',
    color: '#0F172A',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: { xs: 'stretch', md: 'center' },
    gap: 2,
    mb: 3,
    p: { xs: 2.5, md: 3 },
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #0F3A6B 0%, #1D5C86 58%, #277F8E 100%)',
    color: '#FFFFFF',
    boxShadow: '0 18px 45px rgba(15, 58, 107, 0.18)',
    flexDirection: { xs: 'column', md: 'row' },
  },
  heroEyebrow: {
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#BAE6FD',
    mb: 0.75,
  },
  createButton: {
    alignSelf: { xs: 'flex-start', md: 'center' },
    backgroundColor: '#FFFFFF',
    color: '#0F3A6B',
    borderRadius: '8px',
    px: 2.5,
    py: 1.15,
    fontWeight: 800,
    textTransform: 'none',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
    '&:hover': {
      backgroundColor: '#ECFEFF',
      boxShadow: '0 14px 30px rgba(15, 23, 42, 0.22)',
    },
  },
  listContainer: {
    width: '100%',
    maxWidth: '980px',
    margin: '0 auto',
    display: 'grid',
    gap: 2,
  },
  assignmentCard: {
    width: '100%',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #DDE7F3',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
    '&:hover': {
      transform: 'translateY(-2px)',
      borderColor: '#8CC7E8',
      boxShadow: '0 16px 36px rgba(15, 58, 107, 0.13)',
    },
  },
  cardContent: {
    p: { xs: 2, md: 2.5 },
    cursor: 'pointer',
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 2,
    mb: 2,
  },
  titleSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 1.5,
    '& h6': {
      fontWeight: 800,
      color: '#0F172A',
      lineHeight: 1.25,
    },
  },
  iconBadge: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  descriptionSection: {
    my: 2,
    color: '#334155',
    '& .ql-editor': {
      padding: 0,
    },
    '& .material-content': {
      color: '#334155',
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
    bgcolor: '#EFF6FF',
    color: '#1D4ED8',
    px: 1.5,
    py: 0.75,
    borderRadius: '999px',
    fontSize: '0.875rem',
    border: '1px solid #BFDBFE',
  },
  statsContainer: {
    display: 'flex',
    gap: 1,
    flexWrap: 'wrap',
  },
  statChip: {
    borderRadius: '999px',
    fontWeight: 700,
    border: '1px solid transparent',
    '&:hover': {
      backgroundColor: 'inherit',
    },
  },
  submissionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    p: 1,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: '#F1F5F9',
    },
  },
  fileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    mr: 1,
    color: '#334155',
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    p: 1,
    mb: 1,
  },
  link: {
    color: '#0369A1',
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
  dialogPaper: {
    borderRadius: '8px',
    border: '1px solid #DDE7F3',
    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.2)',
  },
  dialogTitle: {
    color: '#0F172A',
    fontWeight: 800,
    pb: 1,
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: '#FFFFFF',
    },
  },
  primaryButton: {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 800,
    backgroundColor: '#0F5E8C',
    '&:hover': {
      backgroundColor: '#0B4A70',
    },
  },
  ghostButton: {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 700,
    color: '#475569',
  },
  emptyState: {
    minHeight: 260,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: 1,
    border: '1px dashed #B8C7D9',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    color: '#475569',
    p: 4,
  },
};

const TeacherAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    studentId: '',
    maxFiles: 1,
    maxLinks: 1
  });
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

  const handleReviewAssignment = async () => {
    try {
      await api.post(`/assignments/${selectedAssignment._id.toString()}/review`, {
        ...reviewData,
        studentId: selectedStudent.studentId._id
      });
      setOpenReviewDialog(false);
      setSelectedStudent(null);
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

  const handleEditAssignment = (assignment, event) => {
    event.stopPropagation();
    setSelectedAssignment(assignment);
    setEditFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: new Date(assignment.dueDate).toISOString().slice(0, 16),
      studentId: assignment.assignToAll ? 'all' : assignment.assignedStudents[0]?.studentId._id || '',
      maxFiles: assignment.maxFiles,
      maxLinks: assignment.maxLinks
    });
    setAssignToAll(assignment.assignToAll);
    setOpenEditDialog(true);
  };

  const handleUpdateAssignment = async () => {
    try {
      if (!editFormData.title || !editFormData.description || !editFormData.dueDate ||
          (!assignToAll && !editFormData.studentId) || !editFormData.maxFiles || !editFormData.maxLinks) {
        toast.error('Please fill in all required fields');
        return;
      }

      const updatedAssignment = {
        ...editFormData,
        description: editFormData.description,
        dueDate: new Date(editFormData.dueDate).toISOString(),
        maxFiles: parseInt(editFormData.maxFiles),
        maxLinks: parseInt(editFormData.maxLinks),
        assignToAll: assignToAll
      };

      await api.post(`/assignments/${selectedAssignment._id}/update`, updatedAssignment);
      setOpenEditDialog(false);
      setEditFormData({
        title: '',
        description: '',
        dueDate: '',
        studentId: '',
        maxFiles: 1,
        maxLinks: 1
      });
      setAssignToAll(false);
      fetchAssignments();
      toast.success('Assignment updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating assignment');
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
    <Box sx={styles.page}>
      <Box sx={styles.hero}>
        <Box>
          <Typography sx={styles.heroEyebrow}>Teacher workspace</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
            Assignments
          </Typography>
          <Typography sx={{ mt: 1, maxWidth: 620, color: '#DFF7FF' }}>
            Create tasks, track submissions, and review student work from one clean board.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={styles.createButton}
        >
          Create Assignment
        </Button>
      </Box>

      <Box sx={styles.listContainer}>
        {assignments.length === 0 ? (
          <Box sx={styles.emptyState}>
            <Box sx={styles.iconBadge}>
              <AssignmentIcon />
            </Box>
            <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 800 }}>
              No assignments yet
            </Typography>
            <Typography>
              Create the first assignment when you are ready to send work to students.
            </Typography>
          </Box>
        ) : assignments.map((assignment) => {
          const stats = getSubmissionStats(assignment);
          return (
            <Paper 
              key={assignment._id}
              elevation={0}
              sx={styles.assignmentCard}
            >
              <CardContent 
                sx={{
                  ...styles.cardContent,
                  '&:last-child': { pb: 3 }
                }}
                onClick={() => navigate(`/teacher/assignments/${assignment._id}`)}
              >
                <Box sx={styles.headerSection}>
                  <Box sx={styles.titleSection}>
                    <Box sx={styles.iconBadge}>
                      <AssignmentIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="h6">
                        {assignment.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, color: '#64748B' }}>
                        {assignment.assignToAll ? 'Assigned to all students' : 'Individual assignment'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={(e) => handleEditAssignment(assignment, e)}
                      size="small"
                      sx={{
                        ...styles.actionButton,
                        color: '#0369A1',
                        '&:hover': {
                          backgroundColor: '#E0F2FE'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={(e) => handleDeleteAssignment(assignment._id, e)}
                      size="small"
                      sx={{
                        ...styles.actionButton,
                        color: '#DC2626',
                        '&:hover': {
                          backgroundColor: '#FEF2F2'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
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
                    <CalendarIcon fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      Due: {formatDueDate(assignment.dueDate)}
                    </Typography>
                  </Box>
                  
                  <Box sx={styles.statsContainer}>
                    <Chip
                      label={`Total: ${stats.total}`}
                      size="small"
                      sx={{
                        ...styles.statChip,
                        backgroundColor: '#F8FAFC',
                        borderColor: '#E2E8F0',
                        color: '#475569'
                      }}
                    />
                    {stats.submitted > 0 && (
                      <Chip
                        label={`Submitted: ${stats.submitted}`}
                        size="small"
                        sx={{
                          ...styles.statChip,
                          backgroundColor: '#EFF6FF',
                          borderColor: '#BFDBFE',
                          color: '#1D4ED8'
                        }}
                      />
                    )}
                    {stats.accepted > 0 && (
                      <Chip
                        label={`Accepted: ${stats.accepted}`}
                        size="small"
                        sx={{
                          ...styles.statChip,
                          backgroundColor: '#ECFDF5',
                          borderColor: '#BBF7D0',
                          color: '#047857'
                        }}
                      />
                    )}
                    {stats.rejected > 0 && (
                      <Chip
                        label={`Rejected: ${stats.rejected}`}
                        size="small"
                        sx={{
                          ...styles.statChip,
                          backgroundColor: '#FEF2F2',
                          borderColor: '#FECACA',
                          color: '#B91C1C'
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: styles.dialogPaper }}>
        <DialogTitle sx={styles.dialogTitle}>Create New Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={{ ...styles.textField, mb: 2 }}
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
              sx={{ ...styles.textField, mb: 2 }}
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
              sx={{ ...styles.textField, mb: 2 }}
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
              sx={{ ...styles.textField, mb: 2 }}
              InputProps={{ inputProps: { min: 1 } }}
            />

            <TextField
              fullWidth
              label="Maximum Links"
              type="number"
              value={formData.maxLinks}
              onChange={(e) => setFormData({ ...formData, maxLinks: e.target.value })}
              sx={styles.textField}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDialog(false)} sx={styles.ghostButton}>Cancel</Button>
          <Button onClick={handleCreateAssignment} variant="contained" sx={styles.primaryButton}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openReviewDialog}
        onClose={() => {
          setOpenReviewDialog(false);
          setSelectedStudent(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: styles.dialogPaper }}
      >
        <DialogTitle sx={styles.dialogTitle}>Review Assignment</DialogTitle>
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
              sx={{ ...styles.textField, mb: 2 }}
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
              sx={{ ...styles.textField, mb: 2 }}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />

            <TextField
              fullWidth
              label="Feedback"
              multiline
              rows={4}
              value={reviewData.feedback}
              onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
              sx={{ ...styles.textField, mb: 2 }}
            />

            {reviewData.status === 'rejected' && (
              <TextField
                fullWidth
                label="Rejection Reason"
                multiline
                rows={2}
                value={reviewData.rejectionReason}
                onChange={(e) => setReviewData({ ...reviewData, rejectionReason: e.target.value })}
                sx={styles.textField}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setOpenReviewDialog(false);
              setSelectedStudent(null);
            }}
            sx={styles.ghostButton}
          >
            Cancel
          </Button>
          <Button onClick={handleReviewAssignment} variant="contained" sx={styles.primaryButton}>
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: styles.dialogPaper }}>
        <DialogTitle sx={styles.dialogTitle}>Edit Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              sx={{ ...styles.textField, mb: 2 }}
            />

            <Typography variant="subtitle1" sx={{ mb: 1 }}>Description</Typography>
            <ReactQuill
              value={editFormData.description}
              onChange={(value) => setEditFormData({ ...editFormData, description: value })}
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
              value={editFormData.dueDate}
              onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
              sx={{ ...styles.textField, mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              select
              fullWidth
              label="Assign To"
              value={assignToAll ? 'all' : editFormData.studentId}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  setAssignToAll(true);
                  setEditFormData({ ...editFormData, studentId: '' });
                } else {
                  setAssignToAll(false);
                  setEditFormData({ ...editFormData, studentId: e.target.value });
                }
              }}
              sx={{ ...styles.textField, mb: 2 }}
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
              value={editFormData.maxFiles}
              onChange={(e) => setEditFormData({ ...editFormData, maxFiles: e.target.value })}
              sx={{ ...styles.textField, mb: 2 }}
              InputProps={{ inputProps: { min: 1 } }}
            />

            <TextField
              fullWidth
              label="Maximum Links"
              type="number"
              value={editFormData.maxLinks}
              onChange={(e) => setEditFormData({ ...editFormData, maxLinks: e.target.value })}
              sx={styles.textField}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenEditDialog(false)} sx={styles.ghostButton}>Cancel</Button>
          <Button onClick={handleUpdateAssignment} variant="contained" sx={styles.primaryButton}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAssignments;
