import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function testDatabase() {
  // Connection details from docker-compose.yml
  const client = new Client({
    host: 'localhost',
    port: 5433, // Updated port to match docker-compose
    user: 'feathersjs',
    password: 'feathersjs',
    database: 'feathersjs_db',
  });

  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Successfully connected to database!');

    // Test 1: Check database version
    console.log('\n📊 Test 1: Checking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    console.log('PostgreSQL version:', versionResult.rows[0].version.split(',')[0]);

    // Test 2: List all databases
    console.log('\n📊 Test 2: Listing databases...');
    const dbResult = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false"
    );
    console.log('Databases:', dbResult.rows.map(row => row.datname));

    // Test 3: Check current database
    console.log('\n📊 Test 3: Checking current database...');
    const currentDbResult = await client.query('SELECT current_database()');
    console.log('Current database:', currentDbResult.rows[0].current_database);

    // Test 4: Create a test table
    console.log('\n📊 Test 4: Creating test table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Test table created successfully!');

    // Test 5: Insert test data
    console.log('\n📊 Test 5: Inserting test data...');
    const insertResult = await client.query(
      'INSERT INTO test_table (name) VALUES ($1) RETURNING *',
      ['Test Record']
    );
    console.log('✅ Inserted record:', insertResult.rows[0]);

    // Test 6: Query test data
    console.log('\n📊 Test 6: Querying test data...');
    const selectResult = await client.query('SELECT * FROM test_table');
    console.log('✅ Retrieved records:', selectResult.rows);

    // Test 7: Clean up test table
    console.log('\n📊 Test 7: Cleaning up test table...');
    await client.query('DROP TABLE IF EXISTS test_table');
    console.log('✅ Test table dropped successfully!');

    console.log('\n🎉 All database tests passed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

testDatabase();
