import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Avatar,
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
import { useAuth, api } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import 'react-quill/dist/quill.snow.css';
import './AssignmentDetails.css';

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 4,
    backgroundColor: '#E0F2FE', // Light blue-100 ish background for header
    p: 2,
    borderRadius: 2,
  },
  studentCard: {
    display: 'flex',
    alignItems: 'center',
    p: 2,
    backgroundColor: 'rgba(96, 165, 250, 0.2)', // Lightened blue-400 variant
    border: '1px solid rgba(96, 165, 250, 0.5)',
    borderRadius: 2,
    transition: 'all 0.3s ease',
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
    color: '#1F2937', // Dark gray-blue for text
    pl: 2, // Kept spacing from previous fix
  },
  status: {
    px: 2,
    py: 0.5,
    borderRadius: 20,
    display: 'inline-block',
    typography: 'body2',
    fontWeight: 'medium',
  },
  pending: {
    backgroundColor: 'rgba(251, 191, 36, 0.3)', // Light amber
    color: '#92400E', // Dark amber
  },
  submitted: {
    backgroundColor: 'rgba(96, 165, 250, 0.3)', // Light blue-400
    color: '#1E40AF', // Dark blue
  },
  accepted: {
    backgroundColor: 'rgba(74, 222, 128, 0.3)', // Light green
    color: '#166534', // Dark green
  },
  rejected: {
    backgroundColor: 'rgba(248, 113, 113, 0.3)', // Light red
    color: '#9B2C2C', // Dark red
  },
  submissionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.15)', // Very light blue-400
    borderRadius: 1,
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
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderRadius: 1,
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
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderRadius: 1,
  },
  descriptionSection: {
    my: 2,
    pl: 4,
    '& .ql-editor': {
      padding: 0,
    },
    '& .material-content': {
      color: '#1F2937', // Dark text for description
    },
  },
};

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
    const statusStyle = {
      p: 1,
      borderRadius: 1,
      display: 'inline-block',
      typography: 'body2',
      mb: 1,
    };

    let style = {
      ...statusStyle,
    };

    switch (student.status) {
      case 'pending':
        style.backgroundColor = '#fff3e0';
        style.color = '#ed6c02';
        return <Box sx={style}>Pending</Box>;
      case 'submitted':
        style.backgroundColor = '#e3f2fd';
        style.color = '#1976d2';
        return <Box sx={style}>Submitted</Box>;
      case 'submitted_late':
        style.backgroundColor = '#fff3cd';
        style.color = '#856404';
        const lateText = getTimeDifference(student.submittedAt, assignment.dueDate);
        return <Box sx={style}>{lateText}</Box>;
      case 'accepted':
        style.backgroundColor = '#e8f5e9';
        style.color = '#2e7d32';
        return <Box sx={style}>Accepted</Box>;
      case 'rejected':
        style.backgroundColor = '#fbe9e7';
        style.color = '#d32f2f';
        return <Box sx={style}>Rejected</Box>;
      default:
        return student.status;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return styles.pending;
      case 'submitted':
        return styles.submitted;
      case 'accepted':
        return styles.accepted;
      case 'rejected':
        return styles.rejected;
      default:
        return {};
    }
  };

  if (!assignment) return null;

  return (
    <Box p={3} sx={{ backgroundColor: '#F0F9FF' }}>
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: '#1F2937' }}>
            {assignment.title}
          </Typography>
          <Typography variant="body1" sx={{ color: '#4B5563' }}>
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </Typography>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#1F2937' }}>
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
        <Button 
          variant="outlined" 
          onClick={() => navigate('/dashboard/assignments')}
          sx={{
            color: '#1E40AF',
            borderColor: '#60A5FA',
            '&:hover': {
              borderColor: '#1E40AF',
              backgroundColor: 'rgba(96, 165, 250, 0.1)',
            },
          }}
        >
          Back to Assignments
        </Button>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 4, color: '#1F2937' }}>
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
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
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
                  ml: 2,
                  backgroundColor: submission.submissions?.length > 0 ? '#60A5FA' : '#D1D5DB',
                  color: submission.submissions?.length > 0 ? '#FFFFFF' : '#6B7280',
                  '&:hover': {
                    backgroundColor: submission.submissions?.length > 0 ? '#1E40AF' : '#B0B7C0',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#E5E7EB',
                    color: '#9CA3AF',
                  },
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
          sx: {
            backgroundColor: '#F0F9FF',
            border: '1px solid #60A5FA',
          },
        }}
      >
        <DialogTitle sx={{ color: '#1F2937' }}>
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
                          sx={{
                            backgroundColor: '#60A5FA',
                            color: '#FFFFFF',
                            '&:hover': {
                              backgroundColor: '#1E40AF',
                            },
                          }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#1F2937',
                    '& fieldset': {
                      borderColor: '#60A5FA',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1E40AF',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1E40AF',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#4B5563',
                  },
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#1F2937',
                    '& fieldset': {
                      borderColor: '#60A5FA',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1E40AF',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1E40AF',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#4B5563',
                  },
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#1F2937',
                    '& fieldset': {
                      borderColor: '#60A5FA',
                    },
                    '&:hover fieldset': {
                      borderColor: '#1E40AF',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1E40AF',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#4B5563',
                  },
                }}
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#1F2937',
                      '& fieldset': {
                        borderColor: '#60A5FA',
                      },
                      '&:hover fieldset': {
                        borderColor: '#1E40AF',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1E40AF',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#4B5563',
                    },
                  }}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #60A5FA' }}>
          <Button 
            onClick={() => setOpenReviewDialog(false)}
            sx={{
              color: '#1E40AF',
              '&:hover': {
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReviewAssignment}
            variant="contained"
            sx={{
              backgroundColor: '#60A5FA',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#1E40AF',
              },
            }}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentDetails;
