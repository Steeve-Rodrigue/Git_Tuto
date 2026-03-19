const db = require('./db');

async function getOrders(userId) {
  const result = await db.query(
    'SELECT * FROM orders WHERE user_id = $1', [userId]
  );
  return result.rows;
}

module.exports = { getOrders };