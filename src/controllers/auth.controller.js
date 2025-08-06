const { register, login } = require('../services/auth.service');

const registerUser = async (req, res) => {
  try {
    const user_id = await register(req.body);
    res.status(201).json({ message: 'User registered', user_id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const token = await login(req.body);
    res.status(200).json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { registerUser, loginUser };
