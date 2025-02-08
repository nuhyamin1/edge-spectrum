import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
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
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, api } from '../../../context/AuthContext';
import { toast } from 'react-toastify';

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 4,
  },
  studentCard: {
    display: 'flex',
    alignItems: 'center',
    p: 2,
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  avatar: {
    width: 50,
    height: 50,
    mr: 2,
  },
  studentInfo: {
    flex: 1,
  },
  status: {
    px: 2,
    py: 0.5,
    borderRadius: 1,
    display: 'inline-block',
    typography: 'body2',
  },
  pending: {
    backgroundColor: '#fff3e0',
    color: '#ed6c02',
  },
  submitted: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  accepted: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  rejected: {
    backgroundColor: '#fbe9e7',
    color: '#d32f2f',
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
      navigate('/teacher/assignments');
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
      await api.post(`/assignments/${selectedSubmission._id}/review`, reviewData);
      setOpenReviewDialog(false);
      fetchAssignmentDetails();
      toast.success('Assignment reviewed successfully');
    } catch (error) {
      toast.error('Error reviewing assignment');
    }
  };

  const handleDownloadSubmission = async (submission, submissionIndex) => {
    try {
      const response = await api.get(
        `/assignments/${submission._id}/download/${submissionIndex}`,
        { responseType: 'blob' }
      );
      
      const file = submission.submissions[submissionIndex];
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
    <Box p={3}>
      <Box sx={styles.header}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {assignment.title}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/teacher/assignments')}>
          Back to Assignments
        </Button>
      </Box>

      <Typography variant="h6" gutterBottom>
        Student Submissions
      </Typography>

      <Grid container spacing={2}>
        {assignment.submissions.map((submission) => (
          <Grid item xs={12} key={submission._id}>
            <Card>
              <Box sx={styles.studentCard}>
                <Avatar
                  src={submission.student.profilePicture}
                  sx={styles.avatar}
                />
                <Box sx={styles.studentInfo}>
                  <Typography variant="h6">
                    {submission.student.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography
                      sx={{
                        ...styles.status,
                        ...getStatusStyle(submission.status),
                      }}
                    >
                      {submission.status || 'pending'}
                    </Typography>
                    {submission.mark && (
                      <Typography variant="body2">
                        Mark: {submission.mark}/100
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  onClick={() => handleOpenReview(submission)}
                  sx={{ ml: 2 }}
                >
                  Review
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openReviewDialog}
        onClose={() => setOpenReviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Assignment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Status"
              value={reviewData.status}
              onChange={(e) =>
                setReviewData({ ...reviewData, status: e.target.value })
              }
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
              onChange={(e) =>
                setReviewData({ ...reviewData, mark: e.target.value })
              }
              sx={{ mb: 2 }}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />

            <TextField
              fullWidth
              label="Feedback"
              multiline
              rows={4}
              value={reviewData.feedback}
              onChange={(e) =>
                setReviewData({ ...reviewData, feedback: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            {reviewData.status === 'rejected' && (
              <TextField
                fullWidth
                label="Rejection Reason"
                multiline
                rows={2}
                value={reviewData.rejectionReason}
                onChange={(e) =>
                  setReviewData({
                    ...reviewData,
                    rejectionReason: e.target.value,
                  })
                }
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>Cancel</Button>
          <Button
            onClick={handleReviewAssignment}
            variant="contained"
            color="primary"
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentDetails;
