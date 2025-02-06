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
} from '@mui/material';
import { useAuth, api } from '../../../context/AuthContext';
import { toast } from 'react-toastify';

const StudentAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionType, setSubmissionType] = useState('file');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');

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

  const handleSubmitAssignment = async () => {
    try {
      const formData = new FormData();
      if (submissionType === 'file') {
        formData.append('file', submissionFile);
      } else {
        formData.append('link', submissionLink);
      }

      await api.post(
        `/assignments/${selectedAssignment._id}/submit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setOpenSubmitDialog(false);
      fetchAssignments();
      toast.success('Assignment submitted successfully');
    } catch (error) {
      toast.error('Error submitting assignment');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['.pdf', '.docx', '.ppt', '.pptx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (allowedTypes.includes(fileExtension)) {
        if (file.size <= 10 * 1024 * 1024) { // 10MB limit
          setSubmissionFile(file);
        } else {
          toast.error('File size must be less than 10MB');
        }
      } else {
        toast.error('Invalid file type. Only PDF, DOCX, and PPT files are allowed.');
      }
    }
  };

  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionType('file');
    setSubmissionFile(null);
    setSubmissionLink('');
    setOpenSubmitDialog(true);
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
            <Button
              variant={submissionType === 'file' ? 'contained' : 'outlined'}
              onClick={() => setSubmissionType('file')}
              sx={{ mr: 1 }}
            >
              Upload File
            </Button>
            <Button
              variant={submissionType === 'link' ? 'contained' : 'outlined'}
              onClick={() => setSubmissionType('link')}
            >
              Submit Link
            </Button>
          </Box>

          {submissionType === 'file' ? (
            <TextField
              type="file"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              onChange={handleFileChange}
              inputProps={{
                accept: '.pdf,.docx,.ppt,.pptx'
              }}
            />
          ) : (
            <TextField
              fullWidth
              label="Submission Link"
              margin="normal"
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              placeholder="https://..."
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubmitDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitAssignment}
            color="primary"
            disabled={
              (submissionType === 'file' && !submissionFile) ||
              (submissionType === 'link' && !submissionLink)
            }
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignments;
