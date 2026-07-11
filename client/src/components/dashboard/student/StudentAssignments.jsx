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
  IconButton,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Clear as ClearIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-quill/dist/quill.snow.css';
import './StudentAssignments.css';

// Add these styles at the top of the file
const styles = {
  container: {
    color: '#0F172A',
    minHeight: '70vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: { xs: 'flex-start', md: 'center' },
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
  grid: {
    maxWidth: '980px',
    mx: 'auto',
  },
  card: {
    backgroundColor: 'white',
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
  cardContent: {
    p: { xs: 2, md: 2.5 },
    '&:last-child': { pb: { xs: 2, md: 2.5 } },
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 2,
    alignItems: { xs: 'flex-start', sm: 'center' },
    flexDirection: { xs: 'column', sm: 'row' },
    mb: 2,
  },
  submissionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 1,
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
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
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
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
    border: '1px dashed #8CC7E8',
    borderRadius: '8px',
    backgroundColor: '#F0F9FF'
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
  },
  submitted: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    borderColor: '#BFDBFE',
  },
  submitted_late: {
    backgroundColor: '#FFF7ED',
    color: '#854D0E',
    fontWeight: 'bold',
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
  countdown: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
    px: 1.25,
    py: 0.75,
    borderRadius: '999px',
    width: 'fit-content',
    fontWeight: 800,
    border: '1px solid transparent',
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
    p: 2,
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    '& .ql-editor': {
      padding: 0,
    },
    '& .material-content': {
      color: '#1F2937',
    }
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
  button: {
    backgroundColor: '#0F5E8C',
    color: '#FFFFFF',
    borderRadius: '8px',
    px: 2.5,
    textTransform: 'none',
    fontWeight: 800,
    '&:hover': {
      backgroundColor: '#0B4A70',
    },
    '&.Mui-disabled': {
      backgroundColor: '#E2E8F0',
      color: '#94A3B8',
    },
  },
  outlinedButton: {
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
  feedbackBox: {
    mt: 2,
    p: 2,
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
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
        <Box>
          <Typography sx={styles.heroEyebrow}>Student workspace</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
            Assignments
          </Typography>
          <Typography sx={{ mt: 1, maxWidth: 620, color: '#DFF7FF' }}>
            Check deadlines, submit files or links, and review teacher feedback in one place.
          </Typography>
        </Box>
        <Box sx={{
          px: 2,
          py: 1,
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.14)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          fontWeight: 800,
        }}>
          {assignments.length} assigned
        </Box>
      </Box>

      {loading ? (
        <Typography sx={{ color: '#4B5563' }}>Loading assignments...</Typography>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : assignments.length === 0 ? (
        <Box sx={styles.emptyState}>
          <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 800 }}>
            No assignments found
          </Typography>
          <Typography>
            New assignments from your teacher will appear here.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2} sx={styles.grid}>
          {assignments.map((assignment) => {
            const details = getAssignmentDetails(assignment);
            return (
            <Grid item xs={12} key={assignment._id}>
              <Card sx={styles.card}>
                <CardContent sx={styles.cardContent}>
                  <Box sx={styles.cardHeader}>
                    <Box>
                      <Typography variant="h5" sx={{ color: '#0F172A', fontWeight: 900, lineHeight: 1.2 }}>
                        {assignment.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.75, color: '#64748B' }}>
                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    {renderCountdown(assignment.dueDate)}
                  </Box>

                  <Box sx={styles.descriptionSection}>
                    <div
                      className="prose max-w-none ql-editor material-content"
                      dangerouslySetInnerHTML={{ __html: assignment.description }}
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    {details && (
                      <>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body1" sx={{ color: '#4B5563' }}>
                            Status:
                          </Typography>
                          <Box sx={{ ...styles.status, ...getStatusStyle(details.status) }}>
                            {getStatusDisplay(details.status)}
                          </Box>
                        </Box>
                        
                        {details.mark && (
                          <Typography variant="body1" sx={{ color: '#4B5563', mt: 1 }}>
                            Mark: {details.mark}/100
                          </Typography>
                        )}
                        
                        {details.feedback && (
                          <Box sx={styles.feedbackBox}>
                            <Typography variant="subtitle1" sx={{ color: '#0F172A', fontWeight: 800 }}>
                              Feedback
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#4B5563', mt: 1 }}>
                              {details.feedback}
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
                        disabled={details?.status === 'accepted'}
                      >
                        {details?.status === 'rejected' ? 'Update Submission' : 'Submit'}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )})}
        </Grid>
      )}

      <Dialog
        open={openSubmitDialog}
        onClose={() => setOpenSubmitDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: styles.dialogPaper }}
      >
        <DialogTitle sx={styles.dialogTitle}>
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
        <DialogActions sx={{ px: 3, pb: 3 }}>
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
        <DialogTitle sx={styles.dialogTitle}>
          Late Submission
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4B5563' }}>
            This assignment is past its due date. Are you sure you want to submit late?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
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
