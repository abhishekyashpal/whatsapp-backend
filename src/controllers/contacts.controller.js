const db = require('../config/db'); // your MySQL connection
const { getContactRegisteredUserSql, addContactSql, getContactsSql, checkExistingOwnerContactSql, updateContactSql, deleteContactSql } = require('../databaseQuery/databaseQuery');

exports.addContact = async (req, res) => {
  const { contact_name, contact_mobile } = req.body;
  const ownerId = req.user.id;

  try {
    // Check if the contact is a registered user
    const [users] = await db.execute(getContactRegisteredUserSql, [contact_mobile]);
    const contactUserId = users.length > 0 ? users[0].id : null;
    const isRegistered = contactUserId !== null;

    await db.execute(
      addContactSql,
      [ownerId, contactUserId, contact_name, contact_mobile, isRegistered]
    );

    res.status(201).json({ message: 'Contact added successfully' });
  } catch (err) {
    console.error('Error adding contact:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getContacts = async (req, res) => {
  const ownerId = req.user.id;

  try {
    const [rows] = await db.execute(
      getContactsSql,
      [ownerId]
    );

    res.json({ contacts: rows });
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateContact = async (req, res) => {
  const ownerId = req.user.id;
  const { contact_id } = req.params;
  const { contact_name, contact_mobile } = req.body;

  try {
    const [existing] = await db.execute(
      checkExistingOwnerContactSql,
      [contact_id, ownerId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Recheck if mobile number now belongs to a registered user
    const [users] = await db.execute('SELECT id FROM users WHERE mobile = ?', [contact_mobile]);
    const contactUserId = users.length > 0 ? users[0].id : null;
    const isRegistered = contactUserId !== null;

    await db.execute(
      updateContactSql,
      [contact_name, contact_mobile, contactUserId, isRegistered, contact_id, ownerId]
    );

    res.json({ message: 'Contact updated successfully' });
  } catch (err) {
    console.error('Error updating contact:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteContact = async (req, res) => {
  const ownerId = req.user.id;
  const { contact_id } = req.params;

  try {
    const [result] = await db.execute(
      deleteContactSql,
      [contact_id, ownerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
