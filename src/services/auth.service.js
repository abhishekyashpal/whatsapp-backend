const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByMobile } = require('../models/user.model');

const register = async ({ name, phone, password }) => {
  const existingUser = await findUserByMobile(phone);
  if (existingUser) throw new Error('User already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user_id = await createUser({ name, phone, passwordHash });
  return user_id;
};

const login = async ({ phone, password }) => {
  const user = await findUserByMobile(phone);
  if (!user) throw new Error('User not found');

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { id: user.id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return token;
};

module.exports = { register, login };
