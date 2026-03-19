const db = require('./db');

async function getProducts(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const result = await db.query(
    'SELECT * FROM products LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
}

async function getProductById(id) {
  const result = await db.query(
    'SELECT * FROM products WHERE id = $1', [id]
  );
  return result.rows[0] || null;
}

module.exports = { getProducts, getProductById };