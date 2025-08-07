const { Server } = require('socket.io');
const pool = require('../config/db'); // Adjust if pool is elsewhere

let io;

const initWebSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('User connected');

    // Register user to a room
    socket.on('register', (userId) => {
      socket.join(`user:${userId}`);
    });

    /**
     * When receiver confirms that message is delivered
     */
    socket.on('message_delivered', async ({ messageId, receiverId }) => {
      try {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Update delivered_at timestamp
        await pool.query(
          `UPDATE Messages SET delivered_at = ? WHERE id = ? AND receiver_id = ?`,
          [now, messageId, receiverId]
        );

        // Optional: Notify sender about delivery (you can enable this later)
        // const [rows] = await pool.query('SELECT sender_id FROM Messages WHERE id = ?', [messageId]);
        // const senderId = rows[0]?.sender_id;
        // if (senderId) {
        //   io.to(`user:${senderId}`).emit('message_delivered_ack', { messageId, delivered_at: now });
        // }

        console.log(`Message ${messageId} marked delivered by user ${receiverId}`);
      } catch (err) {
        console.error('Error marking message as delivered:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};

module.exports = {
  initWebSocket,
  io,
};
