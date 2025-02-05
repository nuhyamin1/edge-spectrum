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
  MenuItem,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAuth, api } from '../../../context/AuthContext';
import { toast } from 'react-toastify';

const TeacherAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    studentId: '',
  });
  const [reviewData, setReviewData] = useState({
    status: '',
    mark: '',
    feedback: '',
    rejectionReason: '',
  });

  useEffect(() => {
    fetchAssignments();
    fetchStudents();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments/teacher');
      setAssignments(response.data);
    } catch (error) {
      toast.error('Error fetching assignments');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/users', { params: { role: 'student' } });
      setStudents(response.data);
    } catch (error) {
      toast.error('Error fetching students list');
    }
  };

  const handleCreateAssignment = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.dueDate || !formData.studentId) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Format the date to ISO string
      const assignment = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
        status: 'pending' // Explicitly set status to pending
      };

      console.log('Sending assignment data:', assignment);
      const response = await api.post('/assignments', assignment);
      console.log('Assignment created:', response.data);

      setOpenDialog(false);
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        studentId: ''
      });
      fetchAssignments();
      toast.success('Assignment created successfully');
    } catch (error) {
      console.error('Create assignment error:', error.response?.data || error);
      
      let errorMessage = 'Error creating assignment';
      if (error.response?.data) {
        if (error.response.data.errors) {
          // Handle validation errors
          const errors = error.response.data.errors;
          errorMessage = Object.entries(errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast.error(errorMessage, {
        autoClose: 5000, // Give more time to read the error
        style: { whiteSpace: 'pre-line' } // Preserve line breaks in the error message
      });
    }
  };

  const handleReviewAssignment = async () => {
    try {
      await api.post(`/assignments/${selectedAssignment._id}/review`, reviewData);
      setOpenReviewDialog(false);
      fetchAssignments();
      toast.success('Assignment reviewed successfully');
    } catch (error) {
      toast.error('Error reviewing assignment');
    }
  };

  const handleOpenReview = (assignment) => {
    setSelectedAssignment(assignment);
    setReviewData({
      status: assignment.status,
      mark: assignment.mark || '',
      feedback: assignment.feedback || '',
      rejectionReason: assignment.rejectionReason || '',
    });
    setOpenReviewDialog(true);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Assignments</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Assignment
        </Button>
      </Box>

      <Grid container spacing={3}>
        {assignments.map((assignment) => (
          <Grid item xs={12} md={6} lg={4} key={assignment._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{assignment.title}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  Student: {assignment.studentId.name}
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
                {assignment.status === 'submitted' && (
                  <Box mt={2}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleOpenReview(assignment)}
                    >
                      Review Submission
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Assignment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Assignment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            margin="normal"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <TextField
            fullWidth
            label="Description"
            margin="normal"
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            fullWidth
            label="Due Date"
            type="datetime-local"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <TextField
            select
            fullWidth
            label="Select Student"
            margin="normal"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
          >
            {students.map((student) => (
              <MenuItem key={student._id} value={student._id}>
                {student.name} ({student.email})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateAssignment} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Assignment Dialog */}
      <Dialog
        open={openReviewDialog}
        onClose={() => setOpenReviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Assignment</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Status"
            margin="normal"
            value={reviewData.status}
            onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
          >
            <MenuItem value="accepted">Accept</MenuItem>
            <MenuItem value="rejected">Reject</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Mark (0-100)"
            type="number"
            margin="normal"
            value={reviewData.mark}
            onChange={(e) => setReviewData({ ...reviewData, mark: e.target.value })}
            inputProps={{ min: 0, max: 100 }}
          />
          <TextField
            fullWidth
            label="Feedback"
            margin="normal"
            multiline
            rows={4}
            value={reviewData.feedback}
            onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
          />
          {reviewData.status === 'rejected' && (
            <TextField
              fullWidth
              label="Rejection Reason"
              margin="normal"
              multiline
              rows={4}
              value={reviewData.rejectionReason}
              onChange={(e) =>
                setReviewData({ ...reviewData, rejectionReason: e.target.value })
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>Cancel</Button>
          <Button onClick={handleReviewAssignment} color="primary">
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAssignments;
