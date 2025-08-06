const db = require('../config/db');
const { createUserSql, getUserByMobileSql } = require('../databaseQuery/databaseQuery');

const createUser = async ({ user_name, mobile, passwordHash }) => {
  const [result] = await db.query(
    createUserSql,
    [user_name, mobile, passwordHash]
  );
  return result.insertId;
};

const findUserByMobile = async (mobile) => {
  const [rows] = await db.query(getUserByMobileSql, [mobile]);
  return rows[0];
};

module.exports = { createUser, findUserByMobile };
