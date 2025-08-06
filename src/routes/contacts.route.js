const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const contactController = require('../controllers/contacts.controller');

router.use(authMiddleware);

router.post('/', contactController.addContact);
router.get('/', contactController.getContacts);
router.put('/:contact_id', contactController.updateContact);
router.delete('/:contact_id', contactController.deleteContact);

module.exports = router;
