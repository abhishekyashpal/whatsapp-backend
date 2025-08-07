const db = require('../config/db');
const kafkaProducer = require('../kafka/producer'); // We'll define this below
const { sendMessageSql, getMessagesUserSql } = require('../databaseQuery/databaseQuery');

exports.sendMessage = async (req, res) => {
  const senderId = req.user.id;
  const { receiver_id, content, content_type = 'text' } = req.body;

  try {
    // Save message in DB
    const [result] = await db.execute(
      sendMessageSql,
      [senderId, receiver_id, content, content_type]
    );

    const message = {
      message_id: result.insertId,
      sender_id: senderId,
      receiver_id,
      content,
      content_type,
      status: 'sent',
      created_at: new Date()
    };

    // Publish to Kafka topic
    await kafkaProducer.publishMessage('messages', JSON.stringify(message));

    res.status(201).json({ message });
  } catch (err) {
    console.error('Send Message Error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.getMessagesWithUser = async (req, res) => {
  const userId = req.user.id;
  const targetUserId = req.params.userId;

  try {
    const [rows] = await db.execute(
      getMessagesUserSql,
      [userId, targetUserId, targetUserId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get Messages Error:', err);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};
