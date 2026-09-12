import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const masterPool = new Pool({
  user: process.env.DB_USER || 'st_admin',
  host: process.env.DB_HOST || 'localhost',
  database: 'fieldtrack_master',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

const adminPool = new Pool({
  user: process.env.DB_USER || 'st_admin',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

const createTenantDatabase = async (name: string, slug: string, adminEmail: string) => {
  try {
    const dbName = `fieldtrack_t_${slug}`;
    console.log(`Creating tenant: ${name} (${slug})...`);

    // Register tenant in master database
    const tenantId = uuidv4();
    await masterPool.query(
      `INSERT INTO tenants (id, name, slug, database_name, status) VALUES ($1, $2, $3, $4, 'active')`,
      [tenantId, name, slug, dbName]
    );

    // Create tenant database
    await adminPool.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database created: ${dbName}`);

    // Connect to new tenant database
    const tenantPool = new Pool({
      user: process.env.DB_USER || 'st_admin',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    });

    // Create tenant schema
    const tenantSchema = `
      -- Users table
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'employee',
        phone VARCHAR(20),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Employees table
      CREATE TABLE employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        erp_employee_id VARCHAR(100),
        name VARCHAR(255),
        branch VARCHAR(100),
        department VARCHAR(100),
        territory VARCHAR(100),
        supervisor_id UUID REFERENCES employees(id),
        manager_id UUID REFERENCES employees(id),
        phone_model VARCHAR(100),
        device_id VARCHAR(255),
        tracking_enabled BOOLEAN DEFAULT true,
        visit_logging_enabled BOOLEAN DEFAULT true,
        task_access_enabled BOOLEAN DEFAULT true,
        geofence_alerts_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Shifts table
      CREATE TABLE shifts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        shift_start TIMESTAMP,
        shift_end TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active'
      );

      -- Location pings table
      CREATE TABLE location_pings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        accuracy INT,
        battery INT,
        gps_status VARCHAR(50),
        network_type VARCHAR(50),
        phone_model VARCHAR(100),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_location_pings_employee_date ON location_pings(employee_id, recorded_at);

      -- Clients table
      CREATE TABLE clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        contact_person VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        geofence_radius INT DEFAULT 100,
        last_visit TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Client visits table
      CREATE TABLE client_visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        notes TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        signature TEXT,
        visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'completed'
      );

      -- Visit materials table
      CREATE TABLE visit_materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visit_id UUID NOT NULL REFERENCES client_visits(id) ON DELETE CASCADE,
        item_name VARCHAR(255),
        quantity DECIMAL(10, 2),
        unit VARCHAR(50),
        status VARCHAR(50) DEFAULT 'delivered'
      );

      -- Tasks table
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        customer_id UUID REFERENCES clients(id),
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'open',
        recurrence_type VARCHAR(50),
        due_date DATE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );

      -- Task assignees
      CREATE TABLE task_assignees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
      );

      -- Task checklist
      CREATE TABLE task_checklist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        item VARCHAR(255),
        completed BOOLEAN DEFAULT false
      );

      -- Task comments
      CREATE TABLE task_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Alerts table
      CREATE TABLE alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        alert_type VARCHAR(50),
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_alerts_employee_date ON alerts(employee_id, created_at);

      -- Notifications table
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notification_type VARCHAR(50),
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Geofences table
      CREATE TABLE geofences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        radius_meters INT DEFAULT 100,
        status VARCHAR(50) DEFAULT 'active'
      );

      -- Reports table
      CREATE TABLE reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        hours_worked DECIMAL(10, 2),
        km_travelled DECIMAL(10, 2),
        visits_count INT,
        tasks_completed INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await tenantPool.query(tenantSchema);
    console.log(`Schema created for ${dbName}`);

    // Create admin user
    const passwordHash = await bcrypt.hash('Admin@123456', 10);
    const userId = uuidv4();

    await tenantPool.query(
      `INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'manager')`,
      [userId, adminEmail, passwordHash, 'Admin']
    );

    await tenantPool.query(
      `INSERT INTO employees (id, user_id, name) VALUES ($1, $2, $3)`,
      [uuidv4(), userId, 'Admin']
    );

    console.log(`Admin user created: ${adminEmail}`);
    console.log(`Tenant provisioning complete!`);

    await tenantPool.end();
  } catch (error) {
    console.error('Error provisioning tenant:', error);
    process.exit(1);
  } finally {
    await masterPool.end();
    await adminPool.end();
  }
};

// Get arguments from command line
const args = process.argv.slice(2);
let name = 'Default Company';
let slug = 'default';
let adminEmail = 'admin@example.com';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--name') name = args[i + 1];
  if (args[i] === '--slug') slug = args[i + 1];
  if (args[i] === '--admin') adminEmail = args[i + 1];
}

createTenantDatabase(name, slug, adminEmail);
