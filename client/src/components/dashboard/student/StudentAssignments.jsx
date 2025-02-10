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
} from '@mui/material';
import { Add as AddIcon, Clear as ClearIcon } from '@mui/icons-material';
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
  accepted: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  rejected: {
    backgroundColor: '#fbe9e7',
    color: '#d32f2f',
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

      await api.post(`/assignments/${selectedAssignment._id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setOpenSubmitDialog(false);
      fetchAssignments();
      toast.success('Assignment submitted successfully');
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
      case 'accepted':
        return styles.accepted;
      case 'rejected':
        return styles.rejected;
      default:
        return {};
    }
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
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        My Assignments
      </Typography>

      {!assignments || assignments.length === 0 ? (
        <Typography variant="body1" color="textSecondary">
          No assignments found.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {assignments.map((assignment) => {
            if (!assignment) return null;
            const assignmentDetails = getAssignmentDetails(assignment);
            const status = assignmentDetails?.status || 'pending';

            return (
              <Grid item xs={12} md={6} lg={4} key={assignment._id || 'unknown'}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {assignment.title || 'Untitled Assignment'}
                    </Typography>
                    
                    {assignment.teacherId && (
                      <Typography variant="body2" color="textSecondary">
                        Teacher: {assignment.teacherId.name || 'Unknown Teacher'}
                      </Typography>
                    )}
                    
                    <Typography variant="body2">
                      {assignment.description || 'No description provided'}
                    </Typography>
                    
                    {assignment.dueDate && (
                      <Typography variant="body2" color="textSecondary">
                        Due Date: {new Date(assignment.dueDate).toLocaleDateString()}
                      </Typography>
                    )}
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        sx={{
                          ...styles.status,
                          ...getStatusStyle(status),
                        }}
                      >
                        Status: {status}
                      </Typography>
                    </Box>

                    {/* Display mark if available */}
                    {assignmentDetails?.mark !== undefined && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body1" color="primary">
                          Mark: {assignmentDetails.mark}/100
                        </Typography>
                      </Box>
                    )}

                    {/* Display feedback if available */}
                    {assignmentDetails?.feedback && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Feedback:
                        </Typography>
                        <Typography variant="body2" sx={{ pl: 1 }}>
                          {assignmentDetails.feedback}
                        </Typography>
                      </Box>
                    )}

                    {/* Display rejection reason if status is rejected */}
                    {status === 'rejected' && assignmentDetails?.rejectionReason && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="error">
                          Reason for Rejection:
                        </Typography>
                        <Typography variant="body2" sx={{ pl: 1 }}>
                          {assignmentDetails.rejectionReason}
                        </Typography>
                      </Box>
                    )}

                    {status !== 'accepted' && (
                      <Box mt={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleOpenSubmit(assignment)}
                          disabled={status === 'submitted'}
                        >
                          {status === 'rejected' ? 'Resubmit Assignment' : 'Submit Assignment'}
                        </Button>
                        {status === 'submitted' && (
                          <Typography variant="body2" color="textSecondary" mt={1}>
                            Submission received - waiting for teacher review
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

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
            onClick={handleSubmit} 
            color="primary"
            disabled={selectedFiles.length === 0 && links.every(link => !link.trim())}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignments;
