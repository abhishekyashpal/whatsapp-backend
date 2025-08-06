export const createUserSql =  'INSERT INTO Users (user_name, mobile, email, password_hash) VALUES (?, ?, ?, ?)'

export const getUserByMobileSql = 'SELECT * FROM Users WHERE mobile = ?';

export const getContactRegisteredUserSql = 'SELECT id FROM users WHERE mobile = ?';

export const addContactSql = `INSERT INTO Contacts (owner_user_id, contact_user_id, contact_name, contact_mobile, is_registered)
       VALUES (?, ?, ?, ?, ?)`;

export const getContactsSql = `SELECT contact_id, contact_name, contact_mobile, is_registered, created_at, updated_at
       FROM Contacts WHERE owner_user_id = ?`;

export const checkExistingOwnerContactSql = `SELECT * FROM Contacts WHERE contact_id = ? AND owner_user_id = ?`;       

export const updateContactSql = `UPDATE Contacts SET contact_name = ?, contact_mobile = ?, contact_user_id = ?, is_registered = ?
       WHERE contact_id = ? AND owner_user_id = ?`;

export const deleteContactSql = `DELETE FROM Contacts WHERE contact_id = ? AND owner_user_id = ?`;

export const sendMessageSql = `INSERT INTO Messages (sender_id, receiver_id, content, content_type)
       VALUES (?, ?, ?, ?)`;

export const getMessagesUserSql = `SELECT * FROM Messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`;


