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


async function getChatMessages(req, res) {
  const { chatId } = req.params;
  const page = parseInt(req.query.page) || 1; // default page 1
  const limit = parseInt(req.query.limit) || 20; // default limit
  const offset = (page - 1) * limit;

  try {
    // Fetch messages ordered by created_at DESC (latest first)
    const [rows] = await db.query(
      `
      SELECT 
        m.message_id,
        m.chat_id,
        m.sender_id,
        u.user_name AS sender_name,
        m.message_text,
        m.message_type,
        m.sent_at
      FROM Messages m
      JOIN Users u ON m.sender_id = u.user_id
      WHERE m.chat_id = ?
      ORDER BY m.sent_at DESC
      LIMIT ? OFFSET ?
      `,
      [chatId, limit, offset]
    );

    // Reverse for frontend (oldest at top for upscroll behavior)
    const messages = rows.reverse();

    res.json({
      page,
      limit,
      messages,
      hasMore: rows.length === limit, // if we got full set, there may be more
    });
  } catch (err) {
    console.error("Error fetching chat messages:", err);
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
}

module.exports = { getChatMessages };

