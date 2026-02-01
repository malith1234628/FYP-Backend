const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'visa_marketplace',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Connected to MySQL database:', process.env.DB_NAME);
    connection.release();
  } catch (error) {
    console.error('✗ MySQL connection error:', error.message);
    console.error('Please check your database credentials in .env file');
  }
};

testConnection();

module.exports = pool;
