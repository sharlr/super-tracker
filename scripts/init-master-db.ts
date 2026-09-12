import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const masterPool = new Pool({
  user: process.env.DB_USER || 'st_admin',
  host: process.env.DB_HOST || 'localhost',
  database: 'fieldtrack_master',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

const initializeMasterDatabase = async () => {
  try {
    console.log('Initializing master database...');

    // Create tenants table
    await masterPool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        database_name VARCHAR(100) NOT NULL UNIQUE,
        plan VARCHAR(50) DEFAULT 'standard',
        status VARCHAR(50) DEFAULT 'active',
        logo_url TEXT,
        custom_domain VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create super_admins table
    await masterPool.query(`
      CREATE TABLE IF NOT EXISTS super_admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tenant_billing table
    await masterPool.query(`
      CREATE TABLE IF NOT EXISTS tenant_billing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        plan VARCHAR(50),
        monthly_fee DECIMAL(10, 2),
        employees_count INT DEFAULT 0,
        storage_used_gb INT DEFAULT 0,
        billing_date DATE,
        next_billing_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Master database initialized successfully');
    await masterPool.end();
  } catch (error) {
    console.error('Error initializing master database:', error);
    process.exit(1);
  }
};

initializeMasterDatabase();
