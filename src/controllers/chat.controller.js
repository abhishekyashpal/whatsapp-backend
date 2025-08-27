const db  = require('../config/db')


async function createChatHandler(req, res) {
  const db = pool;
  const userId = req.user?.id || req.body.userId; // adapt based on your auth
  const { is_group = false, name = null, member_ids } = req.body;

  if (!userId) return res.status(401).send({ error: 'unauthenticated' });
  if (!Array.isArray(member_ids) || member_ids.length === 0)
    return res.status(400).send({ error: 'member_ids required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1-on-1 duplicate prevention
    if (!is_group && member_ids.length === 1) {
      const other = member_ids[0];

      // find existing chat that is not group and has exactly these two members
      const [rows] = await conn.query(
        `SELECT c.id
         FROM chats c
         JOIN chat_members cm ON cm.chat_id = c.id
         WHERE c.is_group = FALSE
           AND c.id IN (
             SELECT chat_id FROM chat_members WHERE user_id IN (?, ?)
             GROUP BY chat_id HAVING COUNT(DISTINCT user_id) = 2
           )
         GROUP BY c.id
         HAVING SUM(cm.user_id IN (?, ?)) = 2
         LIMIT 1`,
        [userId, other, userId, other]
      );

      if (rows.length) {
        await conn.rollback();
        return res.json({ chat_id: rows[0].id, existing: true });
      }
    }

    // Create chat
    const [r] = await conn.query(
      `INSERT INTO chats (is_group, name, created_by) VALUES (?, ?, ?)`,
      [is_group ? 1 : 0, name, userId]
    );
    const chatId = r.insertId;

    // Insert members (include the creator)
    const members = new Set(member_ids.map(x => Number(x)));
    members.add(Number(userId));
    const values = Array.from(members).map(u => [chatId, u]);
    await conn.query(
      `INSERT INTO chat_members (chat_id, user_id) VALUES ?`,
      [values]
    );

    await conn.commit();
    return res.json({ chat_id: chatId, existing: false });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ error: 'failed to create chat' });
  } finally {
    conn.release();
  }
}


// query params: ?limit=50&offset=0
async function getChatsHandler(req, res) {
  const db = pool;
  const userId = req.user?.id || req.query.userId;
  if (!userId) return res.status(401).send({ error:'unauthenticated' });

  const limit = parseInt(req.query.limit,10) || 50;
  const offset = parseInt(req.query.offset,10) || 0;

  // Return: chat_id, is_group, name, last_message, last_message_at, unread_count
  const sql = `
    SELECT c.id AS chat_id, c.is_group, c.name,
           m.content AS last_message, m.message_type, m.created_at AS last_message_at,
           COALESCE(unread.unread_count, 0) AS unread_count
    FROM chats c
    JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = ?
    LEFT JOIN messages m ON m.chat_id = c.id
    LEFT JOIN (
      SELECT chat_id, COUNT(*) AS unread_count
      FROM messages
      WHERE status = 'sent' AND sender_id != ? AND id > COALESCE((
        SELECT last_read_message_id FROM chat_reads WHERE chat_id = messages.chat_id AND user_id = ?
      ), 0)
      GROUP BY chat_id
    ) unread ON unread.chat_id = c.id
    WHERE 1=1
    GROUP BY c.id
    ORDER BY last_message_at DESC
    LIMIT ? OFFSET ?;
  `;
  try {
    const [rows] = await db.query(sql, [userId, userId, userId, limit, offset]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch chats' });
  }
}


// query: ?limit=50&before=<ISO date or message_id>
async function getMessagesHandler(req, res) {
  const db = pool;
  const userId = req.user?.id || req.query.userId;
  const chatId = Number(req.params.chatId);
  const limit = parseInt(req.query.limit, 10) || 50;
  const beforeId = req.query.before_id ? Number(req.query.before_id) : null;

  // authorization: ensure user is member of chat
  const [mbr] = await db.query('SELECT 1 FROM chat_members WHERE chat_id=? AND user_id=?', [chatId, userId]);
  if (!mbr.length) return res.status(403).json({ error: 'not a member' });

  let sql = `SELECT id, chat_id, sender_id, message_type, content, media_url, status, created_at
             FROM messages
             WHERE chat_id = ?`;
  const params = [chatId];

  if (beforeId) {
    sql += ' AND id < ?';
    params.push(beforeId);
  }

  sql += ' ORDER BY id DESC LIMIT ?';
  params.push(limit);

  try {
    const [rows] = await db.query(sql, params);
    // return reversed so earliest-to-latest
    res.json(rows.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch messages' });
  }
}

// request: { chat_id, message_type, content, media_url }
async function sendMessageHandler(req, res) {
  const db = pool;
  const producer = require('../kafka'); // kafkajs producer
  const io = req.app.get('io');
  const userSockets = req.app.get('userSockets');
  const userId = req.user?.id || req.body.userId;
  const { chat_id, message_type = 'text', content = null, media_url = null } = req.body;

  if (!userId) return res.status(401).json({ error: 'unauthenticated' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Ensure sender is member of chat
    const [isMember] = await conn.query('SELECT 1 FROM chat_members WHERE chat_id=? AND user_id=?', [chat_id, userId]);
    if (!isMember.length) {
      await conn.rollback();
      return res.status(403).json({ error: 'not a chat member' });
    }

    // Insert message
    const [r] = await conn.query(
      `INSERT INTO messages (chat_id, sender_id, message_type, content, media_url, status)
       VALUES (?, ?, ?, ?, ?, 'sent')`,
      [chat_id, userId, message_type, content, media_url]
    );

    const messageId = r.insertId;
    const [msgRows] = await conn.query('SELECT * FROM messages WHERE id = ?', [messageId]);
    const message = msgRows[0];

    await conn.commit();

    // Publish to Kafka (topic: chat-messages)
    try {
      await producer.send({
        topic: 'chat-messages',
        messages: [
          { key: String(chat_id), value: JSON.stringify(message) }
        ]
      });
    } catch (kerr) {
      console.error('kafka publish failed', kerr);
      // don't fail the whole request; consider retrying in prod
    }

    // Emit to socket.io to all members who are connected
    const [members] = await db.query('SELECT user_id FROM chat_members WHERE chat_id = ?', [chat_id]);
    for (const m of members) {
      const sockets = userSockets.get(String(m.user_id)) || userSockets.get(m.user_id);
      if (sockets) {
        for (const sid of sockets) {
          io.to(sid).emit('new_message', { chat_id, message });
        }
      }
    }

    return res.json({ message });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ error: 'failed to send message' });
  } finally {
    conn.release();
  }
}

async function getRecentChatList(req, res) {

  console.log('chat controller called.')
  const { mobile } = req.query;
  console.log('mobile', mobile)
  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  try {
    // 1️⃣ Get user_id from mobile
    const [userRows] = await db.query(
      "SELECT user_id FROM Users WHERE mobile = ?",
      [mobile]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userRows[0].user_id;
    console.log('user_id', userId)

    // 2️⃣ Get all chat_ids the user is part of
    const [chatRows] = await db.query(
      "SELECT chat_id FROM Chat_Members WHERE user_id = ?",
      [userId]
    );
    if (chatRows.length === 0) {
      return res.json([]);
    }
    const chatIds = chatRows.map(row => row.chat_id);
    console.log('chatIds', chatIds)

    // 3️⃣ Fetch last message for each chat
    const [recentChats] = await db.query(
      `
      SELECT 
        c.chat_id,
        c.is_group,
        c.chat_group_name,
        c.created_at AS chat_created_at,
        m.message_id,
        m.message_text,
        m.message_type,
        m.message_status,
        m.sent_at,
        u.user_id AS sender_id,
        u.user_name AS sender_name,
        u.mobile AS sender_mobile
      FROM Chats c
      LEFT JOIN Messages m ON m.chat_id = c.chat_id
      LEFT JOIN Users u ON m.sender_id = u.user_id
      WHERE c.chat_id IN (?)
      AND m.sent_at = (
        SELECT MAX(sent_at) FROM Messages WHERE chat_id = c.chat_id
      )
      ORDER BY m.sent_at DESC
      `,
      [chatIds]
    );

    console.log('recentChats', recentChats);
    // 4️⃣ For 1-to-1 chats, get other participant's details
    for (let chat of recentChats) {
      if (!chat.is_group) {
        const [members] = await db.query(
          `
          SELECT u.user_id, u.user_name, u.mobile 
          FROM Chat_Members cm
          JOIN Users u ON cm.user_id = u.user_id
          WHERE cm.chat_id = ? AND u.user_id != ?
          `,
          [chat.chat_id, userId]
        );
        if (members.length > 0) {
          chat.other_user = members[0];
        }
      }
    }

    res.json(recentChats);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getRecentChatList
}


