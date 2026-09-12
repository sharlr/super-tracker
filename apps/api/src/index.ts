import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multi-tenant database pool
const tenantPools: Map<string, Pool> = new Map();

interface AuthRequest extends Request {
  tenantId?: string;
  userId?: string;
  user?: any;
  pool?: Pool;
}

// Auth middleware
const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.tenantId = decoded.tenantId;
    req.userId = decoded.userId;
    req.user = decoded;
    
    // Get or create tenant pool
    if (!tenantPools.has(req.tenantId)) {
      const pool = new Pool({
        user: process.env.DB_USER || 'st_admin',
        host: process.env.DB_HOST || 'localhost',
        database: `fieldtrack_t_${decoded.tenantSlug}`,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
      });
      tenantPools.set(req.tenantId, pool);
    }
    
    req.pool = tenantPools.get(req.tenantId)!;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/api/v1/health', (req: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Auth endpoint
app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, tenantSlug } = req.body;
    
    const masterPool = new Pool({
      user: process.env.DB_USER || 'st_admin',
      host: process.env.DB_HOST || 'localhost',
      database: 'fieldtrack_master',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    });

    const tenantResult = await masterPool.query(
      'SELECT id FROM tenants WHERE slug = $1',
      [tenantSlug]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(401).json({ error: 'Tenant not found' });
    }

    const tenantId = tenantResult.rows[0].id;
    const tenantPool = new Pool({
      user: process.env.DB_USER || 'st_admin',
      host: process.env.DB_HOST || 'localhost',
      database: `fieldtrack_t_${tenantSlug}`,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    });

    const userResult = await tenantPool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId,
        tenantSlug,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GPS Check-in endpoint
app.post('/api/v1/checkin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, accuracy, battery, gpsStatus, networkType, phoneModel } = req.body;
    
    if (!req.pool) return res.status(500).json({ error: 'Database connection failed' });

    const result = await req.pool.query(
      `INSERT INTO location_pings 
       (employee_id, latitude, longitude, accuracy, battery, gps_status, network_type, phone_model, recorded_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
       RETURNING *`,
      [req.userId, latitude, longitude, accuracy, battery, gpsStatus, networkType, phoneModel]
    );

    // Emit to live map subscribers
    io.emit(`location:${req.tenantId}`, {
      employeeId: req.userId,
      location: { latitude, longitude },
      battery,
      timestamp: new Date()
    });

    res.json({ success: true, ping: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// Get live employees
app.get('/api/v1/employees/live', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.pool) return res.status(500).json({ error: 'Database connection failed' });

    const result = await req.pool.query(`
      SELECT e.id, e.name, e.branch, e.department,
             (SELECT json_build_object(
                'latitude', latitude,
                'longitude', longitude,
                'battery', battery,
                'gps_status', gps_status,
                'recorded_at', recorded_at
              ) FROM location_pings 
              WHERE employee_id = e.id 
              ORDER BY recorded_at DESC LIMIT 1) as last_location
      FROM employees e
      WHERE branch = COALESCE($1, branch)
        AND department = COALESCE($2, department)
      ORDER BY e.name
    `, [req.query.branch || null, req.query.department || null]);

    res.json({ employees: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get route replay for employee
app.get('/api/v1/routes/:employeeId/:date', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.pool) return res.status(500).json({ error: 'Database connection failed' });

    const { employeeId, date } = req.params;

    const result = await req.pool.query(`
      SELECT 
        lp.latitude, lp.longitude, lp.recorded_at, lp.battery, lp.gps_status,
        cv.client_id, c.name as client_name
      FROM location_pings lp
      LEFT JOIN client_visits cv ON 
        cv.employee_id = lp.employee_id AND 
        DATE(cv.visit_date) = DATE(lp.recorded_at)
      LEFT JOIN clients c ON cv.client_id = c.id
      WHERE lp.employee_id = $1 
        AND DATE(lp.recorded_at) = $2
      ORDER BY lp.recorded_at ASC
    `, [employeeId, date]);

    const stats = await req.pool.query(`
      SELECT 
        DATE(recorded_at) as date,
        COUNT(*) as total_pings,
        (SELECT COUNT(*) FROM client_visits WHERE employee_id = $1 AND DATE(visit_date) = $2) as visits
      FROM location_pings
      WHERE employee_id = $1 AND DATE(recorded_at) = $2
      GROUP BY DATE(recorded_at)
    `, [employeeId, date]);

    res.json({ 
      route: result.rows,
      stats: stats.rows[0] || { date, total_pings: 0, visits: 0 }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

// Create task
app.post('/api/v1/tasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.pool) return res.status(500).json({ error: 'Database connection failed' });

    const { title, description, assignees, customerId, priority, dueDate, recurrence } = req.body;

    const result = await req.pool.query(
      `INSERT INTO tasks 
       (title, description, customer_id, priority, due_date, recurrence_type, created_by, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open') 
       RETURNING *`,
      [title, description, customerId, priority, dueDate, recurrence, req.userId]
    );

    const taskId = result.rows[0].id;

    // Assign to employees
    for (const assigneeId of assignees) {
      await req.pool.query(
        'INSERT INTO task_assignees (task_id, employee_id) VALUES ($1, $2)',
        [taskId, assigneeId]
      );
    }

    res.json({ success: true, task: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get tasks for employee
app.get('/api/v1/tasks', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.pool) return res.status(500).json({ error: 'Database connection failed' });

    const result = await req.pool.query(`
      SELECT t.* FROM tasks t
      INNER JOIN task_assignees ta ON t.id = ta.task_id
      WHERE ta.employee_id = $1 AND t.status != 'completed'
      ORDER BY t.due_date ASC
    `, [req.userId]);

    res.json({ tasks: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Complete task
app.post('/api/v1/tasks/:taskId/complete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.pool) return res.status(500).json({ error: 'Database connection failed' });

    const { taskId } = req.params;

    await req.pool.query(
      'UPDATE tasks SET status = $1, completed_at = NOW() WHERE id = $2',
      ['completed', taskId]
    );

    io.emit(`task:completed:${req.tenantId}`, { taskId });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Log client visit
app.post('/api/v1/visits', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.pool) return res.status(500).json({ error: 'Database connection failed' });

    const { clientId, rating, notes, materialsDelivered, photoPaths, signature } = req.body;

    const result = await req.pool.query(
      `INSERT INTO client_visits 
       (employee_id, client_id, rating, notes, signature, visit_date) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING *`,
      [req.userId, clientId, rating, notes, signature]
    );

    const visitId = result.rows[0].id;

    // Log materials
    for (const material of materialsDelivered) {
      await req.pool.query(
        'INSERT INTO visit_materials (visit_id, item_name, quantity, unit) VALUES ($1, $2, $3, $4)',
        [visitId, material.name, material.quantity, material.unit]
      );
    }

    res.json({ success: true, visit: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log visit' });
  }
});

// Get daily report
app.get('/api/v1/reports/daily', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.pool) return res.status(500).json({ error: 'Database connection failed' });

    const { date, branch, department } = req.query;

    const result = await req.pool.query(`
      SELECT 
        e.id, e.name, e.branch, e.department,
        s.shift_start, s.shift_end,
        COUNT(DISTINCT lp.id) as check_ins,
        COUNT(DISTINCT cv.id) as visits,
        ROUND(ST_Length(ST_MakeLine(
          ARRAY_AGG(ST_MakePoint(lp.longitude, lp.latitude) ORDER BY lp.recorded_at)
        ))::geography / 1000, 2) as km_travelled,
        EXTRACT(EPOCH FROM (MAX(lp.recorded_at) - MIN(lp.recorded_at))) / 3600 as hours_worked
      FROM employees e
      LEFT JOIN shifts s ON e.id = s.employee_id AND DATE(s.shift_start) = $1
      LEFT JOIN location_pings lp ON e.id = lp.employee_id AND DATE(lp.recorded_at) = $1
      LEFT JOIN client_visits cv ON e.id = cv.employee_id AND DATE(cv.visit_date) = $1
      WHERE (s.shift_start IS NOT NULL OR lp.id IS NOT NULL)
        AND e.branch = COALESCE($2, e.branch)
        AND e.department = COALESCE($3, e.department)
      GROUP BY e.id, e.name, e.branch, e.department, s.shift_start, s.shift_end
      ORDER BY e.name
    `, [date || new Date().toISOString().split('T')[0], branch || null, department || null]);

    res.json({ report: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// WebSocket for live map
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-map', (tenantId: string) => {
    socket.join(`map:${tenantId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 4010;
httpServer.listen(PORT, () => {
  console.log(`Super Tracker API running on port ${PORT}`);
});

export { app, io };
