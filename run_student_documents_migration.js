const db = require('./config/database');
const fs = require('fs');

async function runMigration() {
  try {
    console.log('Running migration: add_student_documents.sql');

    const sql = fs.readFileSync('./migrations/add_student_documents.sql', 'utf8');

    // Split by semicolon and filter out empty statements and comments
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== 'USE visa_marketplace');

    for (const stmt of statements) {
      try {
        await db.execute(stmt);
        console.log('✓ Executed:', stmt.substring(0, 60) + '...');
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠ Column already exists, skipping');
        } else {
          console.error('✗ Error:', err.message);
          throw err;
        }
      }
    }

    console.log('\n✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
