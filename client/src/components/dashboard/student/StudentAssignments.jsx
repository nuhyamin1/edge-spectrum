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

const StudentAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [links, setLinks] = useState(['']); // Start with one empty link field

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments/student');
      setAssignments(response.data);
    } catch (error) {
      toast.error('Error fetching assignments');
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

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        My Assignments
      </Typography>

      <Grid container spacing={3}>
        {assignments.map((assignment) => (
          <Grid item xs={12} md={6} lg={4} key={assignment._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{assignment.title}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  Teacher: {assignment.teacherId.name}
                </Typography>
                <Typography variant="body2" paragraph>
                  {assignment.description}
                </Typography>
                <Typography variant="body2">
                  Status: {assignment.status}
                </Typography>
                <Typography variant="body2">
                  Due Date: {new Date(assignment.dueDate).toLocaleDateString()}
                </Typography>
                
                {assignment.status !== 'accepted' && (
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleOpenSubmit(assignment)}
                      disabled={assignment.status === 'submitted'}
                    >
                      {assignment.status === 'rejected' ? 'Resubmit Assignment' : 'Submit Assignment'}
                    </Button>
                    {assignment.status === 'submitted' && (
                      <Typography variant="body2" color="textSecondary" mt={1}>
                        Submission received - waiting for teacher review
                      </Typography>
                    )}
                  </Box>
                )}

                {assignment.status !== 'accepted' && (
                  <Box mt={2}>
                    {assignment.mark && (
                      <Typography variant="body2">
                        Mark: {assignment.mark}/100
                      </Typography>
                    )}
                    {assignment.feedback && (
                      <Typography variant="body2">
                        Feedback: {assignment.feedback}
                      </Typography>
                    )}
                    {assignment.rejectionReason && (
                      <Typography variant="body2" color="error">
                        Rejection Reason: {assignment.rejectionReason}
                      </Typography>
                    )}
                    {assignment.submissionContent && (
                      <Typography variant="body2">
                        Submission: {' '}
                        {assignment.submissionType === 'file' ? (
                          <Link href={assignment.submissionContent} target="_blank">
                            {assignment.fileOriginalName}
                          </Link>
                        ) : (
                          <Link href={assignment.submissionContent} target="_blank">
                            View Link
                          </Link>
                        )}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
            <Typography variant="body2" color="textSecondary">
              Maximum files allowed: {selectedAssignment?.maxFiles}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Maximum links allowed: {selectedAssignment?.maxLinks}
            </Typography>
          </Box>
          
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.docx,.ppt,.pptx"
            style={{ marginBottom: '1rem' }}
          />
          
          {selectedFiles.map((file, index) => (
            <Typography key={index} variant="body2">
              Selected file {index + 1}: {file.name}
            </Typography>
          ))}

          <Box mt={2}>
            <Typography variant="subtitle1">Links:</Typography>
            {links.map((link, index) => (
              <Box key={index} display="flex" alignItems="center" mt={1}>
                <TextField
                  fullWidth
                  label={`Link ${index + 1}`}
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                />
                <IconButton 
                  onClick={() => handleRemoveLink(index)}
                  disabled={links.length === 1}
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
            disabled={selectedFiles.length === 0 && links.length === 1}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignments;
