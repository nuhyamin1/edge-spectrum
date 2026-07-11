import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Link,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import 'react-quill/dist/quill.snow.css';
import './AssignmentDetails.css';

const styles = {
  page: {
    color: '#0F172A',
    minHeight: '70vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: { xs: 'stretch', md: 'flex-start' },
    gap: 3,
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
  descriptionPanel: {
    mt: 2,
    p: 2,
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
  },
  studentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    p: 2,
    backgroundColor: '#FFFFFF',
    border: '1px solid #DDE7F3',
    borderRadius: '8px',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
    '&:hover': {
      borderColor: '#8CC7E8',
      boxShadow: '0 16px 36px rgba(15, 58, 107, 0.13)',
      transform: 'translateY(-2px)',
    },
  },
  avatar: {
    width: 50,
    height: 50,
    mr: 4, // Kept spacing from previous fix
    bgcolor: 'rgba(96, 165, 250, 0.5)', // Slightly darker blue-400 for contrast
    color: '#1F2937', // Dark text
  },
  studentInfo: {
    flex: 1,
    color: '#1F2937',
  },
  status: {
    px: 2,
    py: 0.5,
    borderRadius: '999px',
    display: 'inline-block',
    typography: 'body2',
    fontWeight: 800,
    border: '1px solid transparent',
  },
  pending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    borderColor: '#FDE68A',
  },
  submitted: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    borderColor: '#BFDBFE',
  },
  accepted: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    borderColor: '#BBF7D0',
  },
  rejected: {
    backgroundColor: '#FEE2E2',
    color: '#9B2C2C',
    borderColor: '#FECACA',
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
  },
  fileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#1F2937', // Dark text
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    p: 1,
  },
  link: {
    color: '#1E40AF', // Darker blue for contrast
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  submissionsSection: {
    mt: 3,
    mb: 3,
    p: 2,
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
  },
  descriptionSection: {
    my: 2,
    '& .ql-editor': {
      padding: 0,
    },
    '& .material-content': {
      color: '#FFFFFF',
    },
  },
  backButton: {
    color: '#0F5E8C',
    borderColor: '#8CC7E8',
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 800,
    '&:hover': {
      borderColor: '#0F5E8C',
      backgroundColor: '#F0F9FF',
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
    '&.Mui-disabled': {
      backgroundColor: '#E2E8F0',
      color: '#94A3B8',
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
      color: '#1F2937',
      borderRadius: '8px',
      backgroundColor: '#FFFFFF',
      '& fieldset': {
        borderColor: '#CBD5E1',
      },
      '&:hover fieldset': {
        borderColor: '#0F5E8C',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#0F5E8C',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#4B5563',
    },
  },
};

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewData, setReviewData] = useState({
    status: '',
    mark: '',
    feedback: '',
    rejectionReason: '',
  });

  useEffect(() => {
    fetchAssignmentDetails();
  }, [id]);

  const fetchAssignmentDetails = async () => {
    try {
      const response = await api.get(`/assignments/${id}/details`);
      setAssignment(response.data);
    } catch (error) {
      toast.error('Error fetching assignment details');
      navigate('/dashboard/assignments');
    }
  };

  const handleOpenReview = (submission) => {
    setSelectedSubmission(submission);
    setReviewData({
      status: submission.status || '',
      mark: submission.mark || '',
      feedback: submission.feedback || '',
      rejectionReason: submission.rejectionReason || '',
    });
    setOpenReviewDialog(true);
  };

  const handleReviewAssignment = async () => {
    try {
      console.log('Submitting review:', {
        ...reviewData,
        studentId: selectedSubmission.student._id
      });
      
      const response = await api.post(`/assignments/${id}/review`, {
        ...reviewData,
        studentId: selectedSubmission.student._id
      });
      
      console.log('Review response:', response.data);
      setOpenReviewDialog(false);
      fetchAssignmentDetails();
      toast.success('Assignment reviewed successfully');
    } catch (error) {
      console.error('Review error:', error);
      toast.error('Error reviewing assignment');
    }
  };

  const handleDownloadSubmission = async (submissionIndex) => {
    try {
      const response = await api.get(
        `/assignments/${id}/download/${submissionIndex}`,
        { responseType: 'blob' }
      );
      
      const file = selectedSubmission.submissions[submissionIndex];
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName || 'submission');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Error downloading submission');
    }
  };

  const getTimeDifference = (submittedAt, dueDate) => {
    const submitted = new Date(submittedAt);
    const due = new Date(dueDate);
    const diff = submitted - due;

    if (diff <= 0) return null; // Not late

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    // More concise format
    if (days > 0) return `Late (${days}d ${hours}h)`;
    if (hours > 0) return `Late (${hours}h ${minutes}m)`;
    return `Late (${minutes}m)`;
  };

  const getStatusDisplay = (student) => {
    const statusStyle = styles.status;

    let style = {
      ...statusStyle,
    };

    switch (student.status) {
      case 'pending':
        style = { ...style, ...styles.pending };
        return <Box sx={style}>Pending</Box>;
      case 'submitted':
        style = { ...style, ...styles.submitted };
        return <Box sx={style}>Submitted</Box>;
      case 'submitted_late':
        style = { ...style, ...styles.pending };
        const lateText = getTimeDifference(student.submittedAt, assignment.dueDate);
        return <Box sx={style}>{lateText}</Box>;
      case 'accepted':
        style = { ...style, ...styles.accepted };
        return <Box sx={style}>Accepted</Box>;
      case 'rejected':
        style = { ...style, ...styles.rejected };
        return <Box sx={style}>Rejected</Box>;
      default:
        return student.status;
    }
  };

  if (!assignment) return null;

  return (
    <Box sx={styles.page}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard/assignments')}
          sx={styles.backButton}
        >
          Back to Assignments
        </Button>
      </Box>
      <Box sx={styles.header}>
        <Box>
          <Typography sx={styles.heroEyebrow}>Assignment review</Typography>
          <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 900, lineHeight: 1.15 }}>
            {assignment.title}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, color: '#DFF7FF', fontWeight: 700 }}>
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </Typography>
          <Box sx={styles.descriptionPanel}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, color: '#FFFFFF', fontWeight: 800 }}>
              Assignment Description
            </Typography>
            <Box sx={styles.descriptionSection}>
              <div
                className="prose max-w-none ql-editor material-content"
                dangerouslySetInnerHTML={{ __html: assignment.description }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, color: '#0F172A', fontWeight: 900 }}>
        Student Submissions
      </Typography>

      <Grid container spacing={2}>
        {assignment.submissions.map((submission) => (
          <Grid item xs={12} key={submission._id}>
            <Box sx={styles.studentCard}>
              {submission.student.profilePicture?.data ? (
                <img
                  src={submission.student.profilePicture.data}
                  alt={`${submission.student.name}'s profile`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="w-10 h-10 text-gray-600" />
              )}
              <Box sx={styles.studentInfo}>
                <Typography variant="h6" sx={{ color: '#1F2937' }}>
                  {submission.student.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
                  {getStatusDisplay(submission)}
                  {submission.mark && (
                    <Typography variant="body2" sx={{ color: '#4B5563' }}>
                      Mark: {submission.mark}/100
                    </Typography>
                  )}
                </Box>
              </Box>
              <Button
                variant="contained"
                onClick={() => handleOpenReview(submission)}
                sx={{
                  ...styles.primaryButton,
                  ml: 2,
                  flexShrink: 0,
                }}
                disabled={!submission.submissions || submission.submissions.length === 0}
              >
                {submission.submissions && submission.submissions.length > 0 ? 'Review' : 'No Submission'}
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openReviewDialog}
        onClose={() => setOpenReviewDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: styles.dialogPaper,
        }}
      >
        <DialogTitle sx={styles.dialogTitle}>
          Review {selectedSubmission?.student.name}'s Submission
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <>
              <Box sx={styles.submissionsSection}>
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#1F2937' }}>
                  Submitted Files and Links:
                </Typography>
                {selectedSubmission.submissions?.map((submission, index) => (
                  <Box key={index}>
                    {submission.type === 'file' ? (
                      <Box sx={styles.submissionItem}>
                        <Typography variant="body2" sx={styles.fileName}>
                          {submission.originalName}
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleDownloadSubmission(index)}
                          sx={styles.primaryButton}
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
                          href={submission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={styles.link}
                        >
                          Open Link
                        </Link>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>

              <TextField
                select
                fullWidth
                label="Status"
                value={reviewData.status}
                onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                margin="normal"
                required
                sx={styles.textField}
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
                margin="normal"
                required
                InputProps={{
                  inputProps: { min: 0, max: 100 }
                }}
                sx={styles.textField}
              />

              <TextField
                fullWidth
                label="Feedback"
                multiline
                rows={4}
                value={reviewData.feedback}
                onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                margin="normal"
                required
                sx={styles.textField}
              />

              {reviewData.status === 'rejected' && (
                <TextField
                  fullWidth
                  label="Rejection Reason"
                  multiline
                  rows={2}
                  value={reviewData.rejectionReason}
                  onChange={(e) => setReviewData({ ...reviewData, rejectionReason: e.target.value })}
                  margin="normal"
                  required
                  sx={styles.textField}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenReviewDialog(false)}
            sx={{
              color: '#475569',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 800,
              '&:hover': {
                backgroundColor: '#F1F5F9',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReviewAssignment}
            variant="contained"
            sx={styles.primaryButton}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentDetails;
