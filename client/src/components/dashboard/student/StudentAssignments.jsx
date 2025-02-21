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
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 1,
    p: 1
  },
  fileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#E5E7EB',
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 1,
    p: 1
  },
  link: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#60A5FA',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  fileInput: {
    mb: 2,
    p: 2,
    border: '1px dashed rgba(75, 85, 99, 0.5)',
    borderRadius: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.3)'
  },
  status: {
    px: 2,
    py: 0.5,
    borderRadius: 1,
    display: 'inline-block',
    typography: 'body2',
  },
  pending: {
    backgroundColor: 'rgba(237, 108, 2, 0.1)',
    color: '#ED6C02',
  },
  submitted: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    color: '#1976D2',
  },
  submitted_late: {
    backgroundColor: 'rgba(133, 100, 4, 0.1)',
    color: '#856404',
    fontWeight: 'bold',
    border: '2px solid rgba(255, 238, 186, 0.2)',
  },
  accepted: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    color: '#2E7D32',
  },
  rejected: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    color: '#D32F2F',
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
    backgroundColor: 'rgba(133, 100, 4, 0.1)',
    color: '#856404',
  },
  countdownDanger: {
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    color: '#C62828',
  },
  countdownNormal: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    color: '#2E7D32',
  },
  countdownExpired: {
    backgroundColor: 'rgba(198, 40, 40, 0.1)',
    color: '#C62828',
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
    <Box p={3} sx={{ backgroundColor: 'transparent' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#F3F4F6' }}>
        My Assignments
      </Typography>

      <Grid container spacing={3}>
        {assignments.map((assignment) => {
          const studentDetails = getAssignmentDetails(assignment);
          return (
            <Grid item xs={12} key={assignment._id}>
              <Card 
                sx={{
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(75, 85, 99, 0.5)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    border: '1px solid rgba(96, 165, 250, 0.5)',
                    boxShadow: '0 4px 20px rgba(96, 165, 250, 0.2)',
                  },
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
                    '.MuiCard-root:hover &': {
                      opacity: 1
                    }
                  }}
                />

                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ color: '#F3F4F6' }}>
                        {assignment.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 1 }}>
                        {assignment.description}
                      </Typography>
                    </Box>
                    {renderCountdown(assignment.dueDate)}
                  </Box>

                  {studentDetails && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={getStatusStyle(studentDetails.status)}>
                          {getStatusDisplay(studentDetails.status)}
                        </Box>
                        {studentDetails.mark && (
                          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                            Mark: {studentDetails.mark}/100
                          </Typography>
                        )}
                      </Box>

                      {studentDetails.feedback && (
                        <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(25, 118, 210, 0.1)', color: '#1976D2' }}>
                          {studentDetails.feedback}
                        </Alert>
                      )}

                      {studentDetails.rejectionReason && (
                        <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#D32F2F' }}>
                          {studentDetails.rejectionReason}
                        </Alert>
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      onClick={() => handleOpenSubmit(assignment)}
                      disabled={studentDetails?.status === 'accepted'}
                      sx={{
                        backgroundColor: 'rgba(96, 165, 250, 0.1)',
                        color: '#60A5FA',
                        '&:hover': {
                          backgroundColor: 'rgba(96, 165, 250, 0.2)',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(31, 41, 55, 0.3)',
                          color: '#6B7280',
                        },
                      }}
                    >
                      {studentDetails?.status === 'accepted' ? 'Accepted' : 'Submit'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog 
        open={openSubmitDialog} 
        onClose={() => setOpenSubmitDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(75, 85, 99, 0.5)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#F3F4F6' }}>
          Submit Assignment
        </DialogTitle>
        <DialogContent>
          <Box sx={styles.fileInput}>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
              style={{ color: '#9CA3AF' }}
            />
          </Box>

          {links.map((link, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                value={link}
                onChange={(e) => handleLinkChange(index, e.target.value)}
                placeholder="Add link (optional)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#F3F4F6',
                    '& fieldset': {
                      borderColor: 'rgba(75, 85, 99, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(96, 165, 250, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#60A5FA',
                    },
                  },
                }}
              />
              <IconButton 
                onClick={() => handleRemoveLink(index)}
                sx={{ 
                  color: '#EF4444',
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  }
                }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          ))}

          {links.length < selectedAssignment?.maxLinks && (
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddLink}
              sx={{
                color: '#60A5FA',
                '&:hover': {
                  backgroundColor: 'rgba(96, 165, 250, 0.1)',
                },
              }}
            >
              Add Link
            </Button>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(75, 85, 99, 0.5)' }}>
          <Button 
            onClick={() => setOpenSubmitDialog(false)}
            sx={{
              color: '#9CA3AF',
              '&:hover': {
                backgroundColor: 'rgba(75, 85, 99, 0.2)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: 'rgba(96, 165, 250, 0.1)',
              color: '#60A5FA',
              '&:hover': {
                backgroundColor: 'rgba(96, 165, 250, 0.2)',
              },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmLateSubmit}
        onClose={() => setConfirmLateSubmit(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(75, 85, 99, 0.5)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#F3F4F6' }}>
          Late Submission
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#9CA3AF' }}>
            This assignment is past due. Your submission will be marked as late. Do you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(75, 85, 99, 0.5)' }}>
          <Button 
            onClick={() => setConfirmLateSubmit(false)}
            sx={{
              color: '#9CA3AF',
              '&:hover': {
                backgroundColor: 'rgba(75, 85, 99, 0.2)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmLateSubmit}
            variant="contained"
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
              },
            }}
          >
            Submit Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignments;
