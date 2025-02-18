import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const DiscussionRoom = ({ sessionId }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`/api/posts/session/${sessionId}`);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [sessionId]);

  // Create post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPost.trim()) return;

    try {
      const response = await axios.post('/api/posts', {
        content: newPost,
        sessionId
      });

      setPosts(prevPosts => [response.data, ...prevPosts]);
      setNewPost('');
      toast.success('Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  // Add comment
  const handleAddComment = async (postId, comment) => {
    try {
      const response = await axios.post(`/api/posts/${postId}/comments`, {
        content: comment
      });

      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { ...post, comments: [...post.comments, response.data] }
            : post
        )
      );
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Toggle like
  const handleToggleLike = async (postId) => {
    try {
      const response = await axios.patch(`/api/posts/${postId}/like`);
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { ...post, likes: response.data.likes }
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  // Add reply to comment
  const handleAddReply = async (postId, commentId, content) => {
    try {
      const response = await axios.post(`/api/posts/${postId}/comments/${commentId}/replies`, {
        content
      });

      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const updatedComments = post.comments.map(comment => {
              if (comment._id === commentId) {
                return {
                  ...comment,
                  replies: [...comment.replies, response.data]
                };
              }
              return comment;
            });
            return { ...post, comments: updatedComments };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    }
  };

  // Toggle like on comment
  const handleToggleCommentLike = async (postId, commentId) => {
    try {
      const response = await axios.patch(`/api/posts/${postId}/comments/${commentId}/like`);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const updatedComments = post.comments.map(comment => {
              if (comment._id === commentId) {
                return { ...comment, likes: response.data.likes };
              }
              return comment;
            });
            return { ...post, comments: updatedComments };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error toggling comment like:', error);
      toast.error('Failed to update comment like');
    }
  };

  if (loading) {
    return <div>Loading discussion...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Create Post Form */}
      <form onSubmit={handleCreatePost} className="bg-white rounded-lg shadow p-4">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Start a discussion..."
          className="w-full p-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
          rows="3"
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={!newPost.trim()}
        >
          Post
        </button>
      </form>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.map(post => (
          <Post
            key={post._id}
            post={post}
            currentUser={user}
            onAddComment={handleAddComment}
            onToggleLike={handleToggleLike}
            onAddReply={handleAddReply}
            onToggleCommentLike={handleToggleCommentLike}
          />
        ))}
      </div>
    </div>
  );
};

// Post Component
const Post = ({ post, currentUser, onAddComment, onToggleLike, onAddReply, onToggleCommentLike }) => {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    onAddComment(post._id, comment);
    setComment('');
  };

  const isLiked = post.likes.includes(currentUser.id);

  // Helper function to render profile picture
  const renderProfilePicture = (user) => {
    return user.profilePicture?.data ? (
      <img
        src={user.profilePicture.data}
        alt={`${user.name}'s profile`}
        className="w-10 h-10 rounded-full object-cover"
      />
    ) : (
      <UserCircleIcon className="w-10 h-10 text-gray-400" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {/* Post Header */}
      <div className="flex items-center space-x-3">
        {renderProfilePicture(post.author)}
        <div>
          <p className="font-medium">{post.author.name}</p>
          <p className="text-sm text-gray-500">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <p className="text-gray-800">{post.content}</p>

      {/* Post Actions */}
      <div className="flex items-center space-x-4 text-sm">
        <button
          onClick={() => onToggleLike(post._id)}
          className="flex items-center space-x-1 text-gray-500 hover:text-red-500"
        >
          {isLiked ? (
            <HeartIconSolid className="w-5 h-5 text-red-500" />
          ) : (
            <HeartIcon className="w-5 h-5" />
          )}
          <span>{post.likes.length}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-gray-500 hover:text-gray-700"
        >
          {post.comments.length} comments
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4">
          {post.comments.map(comment => (
            <Comment
              key={comment._id}
              comment={comment}
              postId={post._id}
              currentUser={currentUser}
              onAddReply={onAddReply}
              onToggleLike={onToggleCommentLike}
              renderProfilePicture={renderProfilePicture}
            />
          ))}

          {/* Add Comment Form */}
          <form onSubmit={handleSubmitComment} className="pl-10">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>
      )}
    </div>
  );
};

const Comment = ({ comment, postId, currentUser, onAddReply, onToggleLike, renderProfilePicture }) => {
  const [reply, setReply] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  
  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    
    onAddReply(postId, comment._id, reply);
    setReply('');
    setShowReplyForm(false);
  };

  const isLiked = comment.likes?.includes(currentUser.id);

  return (
    <div className="space-y-2">
      <div className="flex space-x-3">
        {renderProfilePicture(comment.author)}
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="font-medium text-sm">{comment.author.name}</p>
            <p className="text-sm text-gray-800">{comment.content}</p>
          </div>
          <div className="flex items-center space-x-4 mt-1 text-xs">
            <button
              onClick={() => onToggleLike(postId, comment._id)}
              className={`text-gray-500 hover:text-red-500 ${isLiked ? 'text-red-500' : ''}`}
            >
              {comment.likes?.length || 0} likes
            </button>
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-gray-500 hover:text-gray-700"
            >
              Reply
            </button>
            {comment.replies?.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-gray-500 hover:text-gray-700"
              >
                {comment.replies.length} replies
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <form onSubmit={handleSubmitReply} className="pl-10">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply..."
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </form>
      )}

      {/* Replies */}
      {showReplies && comment.replies?.length > 0 && (
        <div className="pl-10 space-y-2">
          {comment.replies.map((reply, index) => (
            <div key={index} className="flex space-x-3">
              {renderProfilePicture(reply.author)}
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-sm">{reply.author.name}</p>
                <p className="text-sm text-gray-800">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscussionRoom; 