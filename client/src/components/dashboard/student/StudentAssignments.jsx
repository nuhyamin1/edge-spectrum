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
import 'react-quill/dist/quill.snow.css';
import './StudentAssignments.css';

// Add these styles at the top of the file
const styles = {
  container: {
    backgroundColor: '#F0F9FF',
    p: 3,
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    mb: 4,
    backgroundColor: '#E0F2FE',
    p: 2,
    borderRadius: 2,
  },
  card: {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: 2,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
  },
  submissionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 1,
    p: 1
  },
  fileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#1F2937',
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
    color: '#1E40AF',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  fileInput: {
    mb: 2,
    p: 2,
    border: '1px dashed #60A5FA',
    borderRadius: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.1)'
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
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  submitted: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  submitted_late: {
    backgroundColor: '#FFF7ED',
    color: '#854D0E',
    fontWeight: 'bold',
  },
  accepted: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  rejected: {
    backgroundColor: '#FEE2E2',
    color: '#9B2C2C',
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
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  countdownDanger: {
    backgroundColor: '#FEE2E2',
    color: '#9B2C2C',
  },
  countdownNormal: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  countdownExpired: {
    backgroundColor: '#FEE2E2',
    color: '#9B2C2C',
    fontWeight: 'bold',
  },
  descriptionSection: {
    my: 2,
    pl: 4,
    '& .ql-editor': {
      padding: 0,
    },
    '& .material-content': {
      color: '#1F2937',
    }
  },
  dialogPaper: {
    backgroundColor: '#F0F9FF',
    border: '1px solid #60A5FA',
  },
  textField: {
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
  },
  button: {
    backgroundColor: '#60A5FA',
    color: '#FFFFFF',
    '&:hover': {
      backgroundColor: '#1E40AF',
    },
  },
  outlinedButton: {
    color: '#1E40AF',
    borderColor: '#60A5FA',
    '&:hover': {
      borderColor: '#1E40AF',
      backgroundColor: 'rgba(96, 165, 250, 0.1)',
    },
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
      <Box sx={styles.container}>
        <Typography sx={{ color: '#4B5563' }}>Loading assignments...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={styles.container}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Typography variant="h4" sx={{ color: '#1F2937' }}>
          Assignments
        </Typography>
      </Box>

      {loading ? (
        <Typography sx={{ color: '#4B5563' }}>Loading assignments...</Typography>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : assignments.length === 0 ? (
        <Typography sx={{ color: '#4B5563' }}>No assignments found.</Typography>
      ) : (
        <Grid container spacing={3}>
          {assignments.map((assignment) => (
            <Grid item xs={12} key={assignment._id}>
              <Card sx={styles.card}>
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ color: '#1F2937' }}>
                    {assignment.title}
                  </Typography>
                  
                  {renderCountdown(assignment.dueDate)}

                  <Box sx={styles.descriptionSection}>
                    <div
                      className="prose max-w-none ql-editor material-content"
                      dangerouslySetInnerHTML={{ __html: assignment.description }}
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ color: '#1F2937' }}>
                      Due Date: {new Date(assignment.dueDate).toLocaleDateString()}
                    </Typography>
                    
                    {getAssignmentDetails(assignment) && (
                      <>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                          <Typography variant="body1" sx={{ color: '#4B5563' }}>
                            Status:
                          </Typography>
                          <Box sx={getStatusStyle(getAssignmentDetails(assignment).status)}>
                            {getStatusDisplay(getAssignmentDetails(assignment).status)}
                          </Box>
                        </Box>
                        
                        {getAssignmentDetails(assignment).mark && (
                          <Typography variant="body1" sx={{ color: '#4B5563', mt: 1 }}>
                            Mark: {getAssignmentDetails(assignment).mark}/100
                          </Typography>
                        )}
                        
                        {getAssignmentDetails(assignment).feedback && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" sx={{ color: '#1F2937' }}>
                              Feedback:
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#4B5563', mt: 1 }}>
                              {getAssignmentDetails(assignment).feedback}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}

                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={() => handleOpenSubmit(assignment)}
                        sx={styles.button}
                        disabled={getAssignmentDetails(assignment)?.status === 'accepted'}
                      >
                        {getAssignmentDetails(assignment) ? 'Update Submission' : 'Submit Assignment'}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={openSubmitDialog}
        onClose={() => setOpenSubmitDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: styles.dialogPaper }}
      >
        <DialogTitle sx={{ color: '#1F2937' }}>
          Submit Assignment
        </DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <>
              <Box sx={styles.fileInput}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <Typography variant="caption" sx={{ color: '#4B5563', display: 'block', mt: 1 }}>
                  Max files: {selectedAssignment.maxFiles || 5}
                </Typography>
              </Box>

              {selectedFiles.map((file, index) => (
                <Box key={index} sx={styles.submissionItem}>
                  <Typography variant="body2" sx={styles.fileName}>
                    {file.name}
                  </Typography>
                </Box>
              ))}

              {links.map((link, index) => (
                <Box key={index} sx={styles.linkItem}>
                  <TextField
                    fullWidth
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    placeholder="Enter URL"
                    size="small"
                    sx={styles.textField}
                  />
                  <IconButton 
                    onClick={() => handleRemoveLink(index)}
                    size="small"
                    sx={{ color: '#4B5563' }}
                  >
                    <ClearIcon />
                  </IconButton>
                </Box>
              ))}

              {links.length < (selectedAssignment.maxLinks || 3) && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddLink}
                  sx={styles.outlinedButton}
                >
                  Add Link
                </Button>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #60A5FA' }}>
          <Button onClick={() => setOpenSubmitDialog(false)} sx={styles.outlinedButton}>
            Cancel
          </Button>
          <Button onClick={handleSubmitClick} variant="contained" sx={styles.button}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmLateSubmit}
        onClose={() => setConfirmLateSubmit(false)}
        PaperProps={{ sx: styles.dialogPaper }}
      >
        <DialogTitle sx={{ color: '#1F2937' }}>
          Late Submission
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4B5563' }}>
            This assignment is past its due date. Are you sure you want to submit late?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLateSubmit(false)} sx={styles.outlinedButton}>
            Cancel
          </Button>
          <Button onClick={handleConfirmLateSubmit} variant="contained" sx={styles.button}>
            Submit Late
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignments;
