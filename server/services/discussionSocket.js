const socketIO = require('socket.io');

let io;

const init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected to discussion socket');

    // Join a discussion room based on session ID
    socket.on('join-discussion', (sessionId) => {
      socket.join(`discussion-${sessionId}`);
      console.log(`Client joined discussion-${sessionId}`);
    });

    // Leave discussion room
    socket.on('leave-discussion', (sessionId) => {
      socket.leave(`discussion-${sessionId}`);
      console.log(`Client left discussion-${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected from discussion socket');
    });
  });

  return io;
};

const emitNewPost = (sessionId, post) => {
  if (io) {
    io.to(`discussion-${sessionId}`).emit('new-post', post);
  }
};

const emitDeletePost = (sessionId, postId) => {
  if (io) {
    io.to(`discussion-${sessionId}`).emit('delete-post', postId);
  }
};

const emitUpdatePost = (sessionId, post) => {
  if (io) {
    io.to(`discussion-${sessionId}`).emit('update-post', post);
  }
};

const emitNewComment = (sessionId, postId, comment) => {
  if (io) {
    io.to(`discussion-${sessionId}`).emit('new-comment', { postId, comment });
  }
};

const emitDeleteComment = (sessionId, postId, commentId) => {
  if (io) {
    io.to(`discussion-${sessionId}`).emit('delete-comment', { postId, commentId });
  }
};

const emitUpdateComment = (sessionId, postId, comment) => {
  if (io) {
    io.to(`discussion-${sessionId}`).emit('update-comment', { postId, comment });
  }
};

const emitNewReply = (sessionId, postId, commentId, reply) => {
  if (io) {
    io.to(`discussion-${sessionId}`).emit('new-reply', { postId, commentId, reply });
  }
};

const emitUpdateReply = (sessionId, postId, commentId, reply) => {
  if (io) {
    io.to(`discussion-${sessionId}`).emit('update-reply', { postId, commentId, reply });
  }
};

const emitToggleLike = (sessionId, postId, likes) => {
  if (io) {
    io.to(`discussion-${sessionId}`).emit('toggle-like', { postId, likes });
  }
};

const emitToggleCommentLike = (sessionId, postId, commentId, likes) => {
  if (io) {
    io.to(`discussion-${sessionId}`).emit('toggle-comment-like', { postId, commentId, likes });
  }
};

module.exports = {
  init,
  emitNewPost,
  emitDeletePost,
  emitUpdatePost,
  emitNewComment,
  emitDeleteComment,
  emitUpdateComment,
  emitNewReply,
  emitUpdateReply,
  emitToggleLike,
  emitToggleCommentLike
}; 