const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

async function seedAdmin() {
  const username = process.env.DEFAULT_ADMIN_USER || 'admin';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin1123';

  console.log('--- Initializing Admin User ---');
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Check if admin already exists
    const [rows] = await pool.query('SELECT admin_id, username FROM admins WHERE username = ?', [username]);

    if (rows.length > 0) {
      // Update password hash to ensure credentials are fully synchronized
      await pool.query('UPDATE admins SET password_hash = ? WHERE username = ?', [passwordHash, username]);
      console.log(`[Success] Updated admin "${username}" password hash to bcrypt(${password}).`);
      process.exit(0);
    }

    // Insert admin record
    const [result] = await pool.query(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );

    console.log(`[Success] Created default administrator account!`);
    console.log(`  Admin ID: ${result.insertId}`);
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log(`-----------------------------------------------`);
    process.exit(0);
  } catch (error) {
    console.error('[Error] Failed to seed admin user:', error.message);
    process.exit(1);
  }
}

seedAdmin();
