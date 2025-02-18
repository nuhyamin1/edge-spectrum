const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Create a post
router.post('/', auth, async (req, res) => {
  try {
    const { content, sessionId } = req.body;
    
    const post = new Post({
      content: content.trim(),
      author: req.user.id,
      sessionId
    });

    await post.save();
    
    // Populate author details
    await post.populate('author', 'name email profilePicture');

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error creating post' });
  }
});

// Get posts for a session
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ sessionId: req.params.sessionId })
      .populate('author', 'name email profilePicture')
      .populate('comments.author', 'name email profilePicture')
      .populate('comments.replies.author', 'name email profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

// Add comment to post
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments.push({
      content: req.body.content.trim(),
      author: req.user.id
    });

    await post.save();
    await post.populate('comments.author', 'name email profilePicture');

    res.json(post.comments[post.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Error adding comment' });
  }
});

// Toggle like on post
router.patch('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user.id);
    
    if (likeIndex === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    
    res.json({ likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: 'Error updating like status' });
  }
});

// Add reply to comment
router.post('/:postId/comments/:commentId/replies', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.replies.push({
      content: req.body.content.trim(),
      author: req.user.id
    });

    await post.save();
    await post.populate([
      {
        path: 'comments.replies.author',
        select: 'name email profilePicture'
      }
    ]);

    const updatedComment = post.comments.id(req.params.commentId);
    res.json(updatedComment.replies[updatedComment.replies.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Error adding reply' });
  }
});

// Toggle like on comment
router.patch('/:postId/comments/:commentId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const likeIndex = comment.likes.indexOf(req.user.id);
    
    if (likeIndex === -1) {
      comment.likes.push(req.user.id);
    } else {
      comment.likes.splice(likeIndex, 1);
    }

    await post.save();
    
    res.json({ likes: comment.likes });
  } catch (error) {
    res.status(500).json({ error: 'Error updating comment like status' });
  }
});

// Delete a post
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author of the post
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting post' });
  }
});

// Delete a comment
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the author of the comment
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    comment.deleteOne();
    await post.save();
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting comment' });
  }
});

module.exports = router; 