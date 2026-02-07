// Script to run database migrations
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration(migrationFile) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'visa_marketplace',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true // Allow running multiple SQL statements
  });

  try {
    console.log(`Running migration: ${migrationFile}`);

    const sql = fs.readFileSync(migrationFile, 'utf8');
    const [results] = await connection.query(sql);

    console.log('✓ Migration completed successfully!');

    // Show table structure
    const [columns] = await connection.query('DESCRIBE university_forms');
    console.log('\nTable structure:');
    console.table(columns);

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration
const migrationPath = path.join(__dirname, 'migrations', 'create_university_forms_table.sql');
runMigration(migrationPath)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
