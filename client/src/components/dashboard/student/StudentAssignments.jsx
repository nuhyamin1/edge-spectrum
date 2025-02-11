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
  Grid,
  TextField,
  Typography,
  Link,
  IconButton,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Clear as ClearIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { useAuth, api } from '../../../context/AuthContext';
import { toast } from 'react-toastify';

// Add these styles at the top of the file
const styles = {
  submissionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 1,
    p: 1
  },
  fileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    mr: 1
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
    backgroundColor: '#f0f7ff',
    borderRadius: 1,
    p: 1
  },
  link: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#1976d2',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  fileInput: {
    mb: 2,
    p: 2,
    border: '1px dashed #ccc',
    borderRadius: 1,
    backgroundColor: '#fafafa'
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
  submitted_late: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    fontWeight: 'bold',
    border: '2px solid #ffeeba',
  },
  accepted: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  rejected: {
    backgroundColor: '#fbe9e7',
    color: '#d32f2f',
  },
  countdown: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1,
    mb: 2,
    p: 1,
    borderRadius: 1,
    width: 'fit-content',
  },
  countdownWarning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  countdownDanger: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  countdownNormal: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  countdownExpired: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    fontWeight: 'bold',
  },
};

const StudentAssignments = () => {
  const { user, api } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [links, setLinks] = useState(['']); // Start with one empty link field
  const [confirmLateSubmit, setConfirmLateSubmit] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/assignments/student');
      
      console.log('Response from server:', response);
      console.log('Assignments data:', response.data);
      
      if (Array.isArray(response.data)) {
        setAssignments(response.data);
      } else {
        console.error('Invalid assignments data:', response.data);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedFiles([]);
    setLinks(['']);
    setOpenSubmitDialog(true);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > selectedAssignment.maxFiles) {
      toast.error(`Maximum ${selectedAssignment.maxFiles} files allowed`);
      return;
    }
    setSelectedFiles(files);
  };

  const handleAddLink = () => {
    if (links.length < selectedAssignment.maxLinks) {
      setLinks([...links, '']);
    }
  };

  const handleRemoveLink = (index) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Filter out empty links
      const validLinks = links.filter(link => link.trim() !== '');
      if (validLinks.length > selectedAssignment.maxLinks) {
        toast.error(`Maximum ${selectedAssignment.maxLinks} links allowed`);
        return;
      }
      
      formData.append('links', JSON.stringify(validLinks));

      const response = await api.post(`/assignments/${selectedAssignment._id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.isLate) {
        toast.warning('Assignment submitted successfully, but marked as late');
      } else {
        toast.success('Assignment submitted successfully');
      }

      setOpenSubmitDialog(false);
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting assignment');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return styles.pending;
      case 'submitted':
        return styles.submitted;
      case 'submitted_late':
        return styles.submitted_late;
      case 'accepted':
        return styles.accepted;
      case 'rejected':
        return styles.rejected;
      default:
        return {};
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      pending: 'Pending',
      submitted: 'Submitted',
      submitted_late: 'Submitted (Late)',
      accepted: 'Accepted',
      rejected: 'Rejected'
    };
    return statusMap[status] || status;
  };

  const getAssignmentDetails = (assignment) => {
    if (!assignment || !assignment.assignedStudents) {
      return null;
    }
    
    const studentSubmission = assignment.assignedStudents.find(
      student => student?.studentId === user?.id || 
                student?.studentId?._id === user?.id ||
                student?.studentId?.toString() === user?.id?.toString()
    );
    
    return studentSubmission;
  };

  const getTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    if (diff <= 0) {
      return { expired: true, text: 'Overdue' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let text = '';
    if (days > 0) text += `${days}d `;
    if (hours > 0) text += `${hours}h `;
    text += `${minutes}m remaining`;

    const warning = diff < (24 * 60 * 60 * 1000); // less than 24 hours
    const danger = diff < (6 * 60 * 60 * 1000);   // less than 6 hours

    return { expired: false, text, warning, danger };
  };

  const renderCountdown = (dueDate) => {
    const timeRemaining = getTimeRemaining(dueDate);
    const style = {
      ...styles.countdown,
      ...(timeRemaining.expired ? styles.countdownExpired : 
          timeRemaining.danger ? styles.countdownDanger :
          timeRemaining.warning ? styles.countdownWarning :
          styles.countdownNormal)
    };

    return (
      <Box sx={style}>
        <AccessTimeIcon />
        <Typography variant="body2">
          {timeRemaining.text}
        </Typography>
      </Box>
    );
  };

  const handleSubmitClick = async () => {
    const isLate = new Date() > new Date(selectedAssignment.dueDate);
    if (isLate) {
      setConfirmLateSubmit(true);
    } else {
      await handleSubmit();
    }
  };

  const handleConfirmLateSubmit = async () => {
    setConfirmLateSubmit(false);
    await handleSubmit();
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading assignments...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>My Assignments</Typography>
      
      {assignments.map((assignment) => (
        <Card key={assignment._id} sx={{ mb: 3, width: '100%' }}>
          <CardContent>
            {/* Header Section */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6">{assignment.title}</Typography>
                {renderCountdown(assignment.dueDate)}
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Teacher: {assignment.teacherId?.name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Due Date: {new Date(assignment.dueDate).toLocaleDateString()}
              </Typography>
            </Box>

            {/* Status Section */}
            <Box sx={{ mb: 2 }}>
              <Typography
                sx={{
                  ...getStatusStyle(getAssignmentDetails(assignment)?.status),
                  display: 'inline-block'
                }}
              >
                Status: {getStatusDisplay(getAssignmentDetails(assignment)?.status)}
              </Typography>
            </Box>

            {/* Mark and Feedback Section - Only show if they exist */}
            {getAssignmentDetails(assignment)?.mark && (
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  Mark: {getAssignmentDetails(assignment)?.mark}/100
                </Typography>
              </Box>
            )}

            {getAssignmentDetails(assignment)?.feedback && (
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Feedback:
                </Typography>
                <Typography variant="body1">
                  {getAssignmentDetails(assignment)?.feedback}
                </Typography>
              </Box>
            )}

            {getAssignmentDetails(assignment)?.rejectionReason && (
              <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3cd', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Rejection Reason:
                </Typography>
                <Typography variant="body1" color="error">
                  {getAssignmentDetails(assignment)?.rejectionReason}
                </Typography>
              </Box>
            )}

            {/* Action Section */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenSubmit(assignment)}
                disabled={getAssignmentDetails(assignment)?.status === 'accepted'}
              >
                {getAssignmentDetails(assignment)?.status === 'accepted' 
                  ? 'Submitted & Accepted' 
                  : 'Submit Assignment'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Submit Assignment Dialog */}
      <Dialog
        open={openSubmitDialog}
        onClose={() => setOpenSubmitDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Assignment</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Maximum files allowed: {selectedAssignment?.maxFiles}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Maximum links allowed: {selectedAssignment?.maxLinks}
            </Typography>
          </Box>
          
          <Box sx={styles.fileInput}>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.docx,.ppt,.pptx"
            />
          </Box>
          
          {selectedFiles.map((file, index) => (
            <Box key={index} sx={styles.submissionItem}>
              <Typography variant="body2" sx={styles.fileName}>
                {file.name}
              </Typography>
              <IconButton 
                size="small"
                onClick={() => {
                  const newFiles = selectedFiles.filter((_, i) => i !== index);
                  setSelectedFiles(newFiles);
                }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          ))}

          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>Links:</Typography>
            {links.map((link, index) => (
              <Box key={index} sx={styles.linkItem}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Link ${index + 1}`}
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                />
                <IconButton 
                  onClick={() => handleRemoveLink(index)}
                  disabled={links.length === 1}
                  size="small"
                >
                  <ClearIcon />
                </IconButton>
              </Box>
            ))}
            {links.length < selectedAssignment?.maxLinks && (
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddLink}
                sx={{ mt: 1 }}
              >
                Add Link
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubmitDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitClick} 
            color="primary"
            disabled={selectedFiles.length === 0 && links.every(link => !link.trim())}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Late Submission Confirmation Dialog */}
      <Dialog open={confirmLateSubmit} onClose={() => setConfirmLateSubmit(false)}>
        <DialogTitle>Overdue Assignment Submission</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This assignment is overdue. Your submission will be marked as late.
          </Alert>
          <Typography>
            Are you sure you want to proceed with the submission?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLateSubmit(false)}>Cancel</Button>
          <Button onClick={handleConfirmLateSubmit} variant="contained" color="warning">
            Submit Overdue Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignments;
