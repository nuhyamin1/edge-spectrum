import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './DiscussionRoom.css';
import { io } from 'socket.io-client';

const DiscussionRoom = ({ sessionId }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'blockquote', 'code-block',
    'color', 'background'
  ];

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join-discussion', sessionId);

    // Socket event listeners
    newSocket.on('new-post', (post) => {
      setPosts(prevPosts => {
        // Check if post already exists
        if (prevPosts.some(p => p._id === post._id)) {
          return prevPosts;
        }
        return [post, ...prevPosts];
      });
    });

    newSocket.on('delete-post', (postId) => {
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    });

    newSocket.on('update-post', (updatedPost) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === updatedPost._id ? updatedPost : post
        )
      );
    });

    newSocket.on('new-comment', ({ postId, comment }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            // Check if comment already exists
            if (post.comments.some(c => c._id === comment._id)) {
              return post;
            }
            return {
              ...post,
              comments: [...post.comments, comment]
            };
          }
          return post;
        })
      );
    });

    newSocket.on('delete-comment', ({ postId, commentId }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: post.comments.filter(comment => comment._id !== commentId)
            };
          }
          return post;
        })
      );
    });

    newSocket.on('update-comment', ({ postId, comment }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: post.comments.map(c => 
                c._id === comment._id ? comment : c
              )
            };
          }
          return post;
        })
      );
    });

    newSocket.on('new-reply', ({ postId, commentId, reply }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => {
                if (comment._id === commentId) {
                  // Check if reply already exists
                  if (comment.replies.some(r => r._id === reply._id)) {
                    return comment;
                  }
                  return {
                    ...comment,
                    replies: [...comment.replies, reply]
                  };
                }
                return comment;
              })
            };
          }
          return post;
        })
      );
    });

    newSocket.on('toggle-like', ({ postId, likes }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId ? { ...post, likes } : post
        )
      );
    });

    newSocket.on('toggle-comment-like', ({ postId, commentId, likes }) => {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => 
                comment._id === commentId 
                  ? { ...comment, likes }
                  : comment
              )
            };
          }
          return post;
        })
      );
    });

    // Cleanup on unmount
    return () => {
      newSocket.emit('leave-discussion', sessionId);
      newSocket.disconnect();
    };
  }, [sessionId]);

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
  const handleSubmitPost = async (e) => {
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

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await axios.delete(`/api/posts/${postId}`);
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  // Delete comment
  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await axios.delete(`/api/posts/${postId}/comments/${commentId}`);
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: post.comments.filter(comment => comment._id !== commentId)
            };
          }
          return post;
        })
      );
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Edit post
  const handleEditPost = async (postId, content) => {
    try {
      const response = await axios.patch(`/api/posts/${postId}`, { content });
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId ? { ...post, content: response.data.content } : post
        )
      );
      toast.success('Post updated successfully');
    } catch (error) {
      console.error('Error editing post:', error);
      toast.error('Failed to update post');
    }
  };

  // Edit comment
  const handleEditComment = async (postId, commentId, content) => {
    try {
      const response = await axios.patch(`/api/posts/${postId}/comments/${commentId}`, { content });
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment =>
                comment._id === commentId 
                  ? { ...comment, content: response.data.content }
                  : comment
              )
            };
          }
          return post;
        })
      );
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('Failed to update comment');
    }
  };

  // Edit reply
  const handleEditReply = async (postId, commentId, replyId, content) => {
    try {
      const response = await axios.patch(
        `/api/posts/${postId}/comments/${commentId}/replies/${replyId}`,
        { content }
      );
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => {
                if (comment._id === commentId) {
                  return {
                    ...comment,
                    replies: comment.replies.map(reply =>
                      reply._id === replyId
                        ? { ...reply, content: response.data.content }
                        : reply
                    )
                  };
                }
                return comment;
              })
            };
          }
          return post;
        })
      );
      toast.success('Reply updated successfully');
    } catch (error) {
      console.error('Error editing reply:', error);
      toast.error('Failed to update reply');
    }
  };

  if (loading) {
    return <div>Loading discussion...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Create Post Form */}
      <form onSubmit={handleSubmitPost} className="bg-white rounded-lg shadow p-4">
        <ReactQuill
          theme="snow"
          value={newPost}
          onChange={setNewPost}
          modules={modules}
          formats={formats}
          placeholder="Write something..."
          className="bg-white mb-4"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={!newPost.trim()}
          >
            Post
          </button>
        </div>
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
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
            onEditPost={handleEditPost}
            onEditComment={handleEditComment}
            onEditReply={handleEditReply}
          />
        ))}
      </div>
    </div>
  );
};

// Post Component
const Post = ({ 
  post, 
  currentUser, 
  onAddComment, 
  onToggleLike, 
  onAddReply, 
  onToggleCommentLike,
  onDeletePost,
  onDeleteComment,
  onEditPost,
  onEditComment,
  onEditReply
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'blockquote', 'code-block',
    'color', 'background'
  ];

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    onAddComment(post._id, comment);
    setComment('');
  };

  const handleSubmitEdit = () => {
    if (editContent.trim() === post.content) {
      setIsEditing(false);
      return;
    }
    onEditPost(post._id, editContent);
    setIsEditing(false);
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
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          {renderProfilePicture(post.author)}
          <div>
            <p className="font-medium">{post.author.name}</p>
            <p className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {post.author._id === currentUser.id && (
          <div className="flex space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-blue-500"
                title="Edit post"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onDeletePost(post._id)}
              className="text-gray-400 hover:text-red-500"
              title="Delete post"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <ReactQuill
            theme="snow"
            value={editContent}
            onChange={setEditContent}
            modules={modules}
            formats={formats}
            className="bg-white"
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={handleSubmitEdit}
              className="text-green-500 hover:text-green-600"
              title="Save changes"
            >
              <CheckIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              className="text-red-500 hover:text-red-600"
              title="Cancel"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div 
            className="text-gray-800 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {post.linkPreview && <LinkPreview preview={post.linkPreview} />}
        </div>
      )}

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
              onDelete={onDeleteComment}
              onEdit={onEditComment}
              onEditReply={onEditReply}
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

const Comment = ({ 
  comment, 
  postId, 
  currentUser, 
  onAddReply, 
  onToggleLike, 
  onDelete,
  onEdit,
  onEditReply,
  renderProfilePicture 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [reply, setReply] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  
  const handleSubmitEdit = () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }
    onEdit(postId, comment._id, editContent);
    setIsEditing(false);
  };

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
            <div className="flex justify-between items-start">
              <p className="font-medium text-sm">{comment.author.name}</p>
              {comment.author._id === currentUser.id && (
                <div className="flex space-x-2">
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-gray-400 hover:text-blue-500"
                      title="Edit comment"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(postId, comment._id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Delete comment"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={handleSubmitEdit}
                    className="text-green-500 hover:text-green-600"
                    title="Save changes"
                  >
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    className="text-red-500 hover:text-red-600"
                    title="Cancel"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-800">{comment.content}</p>
            )}
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
            <Reply
              key={index}
              reply={reply}
              postId={postId}
              commentId={comment._id}
              currentUser={currentUser}
              onEdit={onEditReply}
              renderProfilePicture={renderProfilePicture}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Reply = ({ 
  reply, 
  postId, 
  commentId, 
  currentUser, 
  onEdit, 
  renderProfilePicture 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);

  const handleSubmitEdit = () => {
    if (editContent.trim() === reply.content) {
      setIsEditing(false);
      return;
    }
    onEdit(postId, commentId, reply._id, editContent);
    setIsEditing(false);
  };

  return (
    <div className="flex space-x-3">
      {renderProfilePicture(reply.author)}
      <div className="flex-1">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-start">
            <p className="font-medium text-sm">{reply.author.name}</p>
            {reply.author._id === currentUser.id && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-blue-500"
                title="Edit reply"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                rows="2"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={handleSubmitEdit}
                  className="text-green-500 hover:text-green-600"
                  title="Save changes"
                >
                  <CheckIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(reply.content);
                  }}
                  className="text-red-500 hover:text-red-600"
                  title="Cancel"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-800">{reply.content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const LinkPreview = ({ preview }) => {
  if (!preview) return null;

  return (
    <a 
      href={preview.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block mt-3 border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex">
        {preview.image && (
          <div className="w-1/3 max-w-[200px]">
            <img 
              src={preview.image} 
              alt={preview.title || 'Link preview'} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4 flex-1">
          {preview.siteName && (
            <p className="text-sm text-gray-500 mb-1">{preview.siteName}</p>
          )}
          {preview.title && (
            <h3 className="font-medium text-gray-900 mb-1">{preview.title}</h3>
          )}
          {preview.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{preview.description}</p>
          )}
        </div>
      </div>
    </a>
  );
};

export default DiscussionRoom; 