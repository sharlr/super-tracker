# Super Tracker SaaS - Complete Development Documentation

## Project Overview

Super Tracker is a complete standalone multi-tenant SaaS platform for GPS-based field employee tracking, task management, and visit logging. The platform provides real-time employee location tracking, route history visualization, task management with recurring support, and comprehensive reporting capabilities.

### Key Metrics
- **Multi-Tenant**: Separate PostgreSQL database per tenant
- **Scalable**: Horizontal scaling with Docker
- **Real-Time**: Socket.io for live updates
- **Mobile-First**: React Native Android APK
- **Enterprise-Ready**: 3-tier access control, complete audit trail

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet / VPN                           │
└────────────────┬──────────────────────────────────────────────┘
                 │
┌─────────────────▼──────────────────────────────────────────┐
│                    Nginx Reverse Proxy                       │
│        (SSL/TLS, Domain Routing, WebSocket Upgrade)         │
└──┬──────────────────────────────┬──────────────┬────────────┘
   │                              │              │
   │ /api/*                       │ /socket.io   │ /admin/*
   │ /health                      │              │
   │                              │              │
┌──▼──────────┐  ┌──────────────▼┐  ┌────────────▼───┐
│  st-api     │  │ st-api Socket │  │  st-admin      │
│ (Express)   │  │   .io Server  │  │ (React/Nginx)  │
│ Port 4010   │  │  (same proc)  │  │   Port 4011    │
└─────┬───────┘  └───────────────┘  └────────────────┘
      │
      │ JDBC
      │ Pool
      │
┌─────▼─────────────────────────────────────────────────────┐
│               PostgreSQL Multi-Tenant                      │
│  Master DB: fieldtrack_master                             │
│  Tenant DBs: fieldtrack_t_acme, fieldtrack_t_beta, etc   │
│  Port 5433 (host mapped)                                  │
└─────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Model

**Separate Database per Tenant (SDB)**
- Each customer gets isolated PostgreSQL database
- Complete data isolation
- Independent scaling
- Flexible backup per tenant

**Shared Codebase**
- Single API binary serves all tenants
- JWT token contains tenant_id
- Middleware routes to correct database
- Reduces operational overhead

**Master Database**
- Tenant registry and metadata
- Billing information
- Super-admin accounts
- Never contains customer data

---

## File Structure

```
super-tracker/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   └── index.ts                 # Express server, routes, Socket.io
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── admin/
│   │   ├── src/
│   │   │   ├── App.tsx                  # Router setup
│   │   │   ├── main.tsx                 # Entry point
│   │   │   ├── index.css                # Global styles
│   │   │   ├── stores/
│   │   │   │   └── authStore.ts         # Zustand auth state + axios setup
│   │   │   ├── components/
│   │   │   │   └── Sidebar.tsx          # Navigation sidebar
│   │   │   └── pages/
│   │   │       ├── LoginPage.tsx        # Email/password/tenant login
│   │   │       ├── Dashboard.tsx        # Stats overview
│   │   │       ├── LiveMap.tsx          # Real-time tracking
│   │   │       ├── RouteReplay.tsx      # Daily route visualization
│   │   │       ├── EmployeeManagement.tsx
│   │   │       ├── TaskManagement.tsx   # Kanban board
│   │   │       ├── Alerts.tsx           # Color-coded alerts
│   │   │       ├── Reports.tsx          # Daily summaries
│   │   │       ├── ClientManagement.tsx
│   │   │       └── UserAccess.tsx       # Role & permissions
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── nginx.conf                   # Static file serving
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── mobile/                          # React Native (future)
│       └── (structure TBD)
│
├── scripts/
│   ├── init-master-db.ts               # Create master database schema
│   └── provision-tenant.ts              # Create new tenant + database
│
├── config/
│   └── nginx-super-tracker.conf         # Production Nginx config
│
├── docker-compose.yml
├── .env.example
├── README.md
├── DEPLOYMENT.md
└── COMPLETE-DOCUMENTATION.md
```

---

## Database Schema

### Master Database (fieldtrack_master)

```sql
-- Tenant registry
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  slug VARCHAR(100) UNIQUE,
  database_name VARCHAR(100) UNIQUE,
  plan VARCHAR(50),
  status VARCHAR(50),
  created_at TIMESTAMP
);

-- Super admin accounts
CREATE TABLE super_admins (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(255)
);

-- Billing tracking
CREATE TABLE tenant_billing (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  plan VARCHAR(50),
  monthly_fee DECIMAL(10,2),
  employees_count INT,
  storage_used_gb INT,
  billing_date DATE,
  next_billing_date DATE
);
```

### Tenant Database (fieldtrack_t_{slug})

#### Users & Access Control
```sql
-- User accounts
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  role VARCHAR(50), -- 'manager', 'supervisor', 'employee'
  status VARCHAR(50)
);

-- Employee records (linked to HR)
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  erp_employee_id VARCHAR(100),
  name VARCHAR(255),
  branch VARCHAR(100),
  department VARCHAR(100),
  territory VARCHAR(100),
  supervisor_id UUID REFERENCES employees(id),
  manager_id UUID REFERENCES employees(id),
  phone_model VARCHAR(100),
  device_id VARCHAR(255),
  tracking_enabled BOOLEAN,
  visit_logging_enabled BOOLEAN,
  task_access_enabled BOOLEAN,
  geofence_alerts_enabled BOOLEAN
);
```

#### GPS & Location
```sql
-- Location pings
CREATE TABLE location_pings (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  accuracy INT,
  battery INT,
  gps_status VARCHAR(50),
  network_type VARCHAR(50),
  phone_model VARCHAR(100),
  recorded_at TIMESTAMP
);
CREATE INDEX idx_location_pings_employee_date 
  ON location_pings(employee_id, recorded_at);

-- Geofences
CREATE TABLE geofences (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  radius_meters INT
);
```

#### Clients & Visits
```sql
-- Client master
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  customer_id VARCHAR(100),
  name VARCHAR(255),
  address TEXT,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  geofence_radius INT,
  last_visit TIMESTAMP,
  status VARCHAR(50)
);

-- Client visits with materials
CREATE TABLE client_visits (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  client_id UUID REFERENCES clients(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  signature TEXT,
  visit_date TIMESTAMP
);

CREATE TABLE visit_materials (
  id UUID PRIMARY KEY,
  visit_id UUID REFERENCES client_visits(id),
  item_name VARCHAR(255),
  quantity DECIMAL(10,2),
  unit VARCHAR(50)
);
```

#### Tasks & Work Items
```sql
-- Task records
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  customer_id UUID REFERENCES clients(id),
  priority VARCHAR(50), -- 'high', 'medium', 'low'
  status VARCHAR(50), -- 'open', 'in_progress', 'completed'
  recurrence_type VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  due_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Task assignments
CREATE TABLE task_assignees (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  employee_id UUID REFERENCES employees(id)
);

-- Task checklist items
CREATE TABLE task_checklist (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  item VARCHAR(255),
  completed BOOLEAN
);

-- Task discussion
CREATE TABLE task_comments (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  user_id UUID REFERENCES users(id),
  comment_text TEXT,
  created_at TIMESTAMP
);
```

#### Alerts & Notifications
```sql
-- System alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  alert_type VARCHAR(50), -- 'GPS off', 'Low battery', 'Geofence', 'No activity'
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
CREATE INDEX idx_alerts_employee_date ON alerts(employee_id, created_at);

-- User notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  notification_type VARCHAR(50),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

#### Shifts & Reporting
```sql
-- Shift schedules
CREATE TABLE shifts (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  shift_start TIMESTAMP,
  shift_end TIMESTAMP,
  status VARCHAR(50)
);

-- Pre-calculated daily reports
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  date DATE,
  employee_id UUID REFERENCES employees(id),
  hours_worked DECIMAL(10,2),
  km_travelled DECIMAL(10,2),
  visits_count INT,
  tasks_completed INT,
  created_at TIMESTAMP
);
```

---

## API Endpoints (60+)

### Authentication (4 endpoints)
```
POST   /api/v1/auth/login                 Login with credentials
POST   /api/v1/auth/logout                Logout current user
POST   /api/v1/auth/refresh               Refresh JWT token
GET    /api/v1/auth/me                    Get current user profile
```

### GPS & Location Tracking (12 endpoints)
```
POST   /api/v1/checkin                    Record GPS location
GET    /api/v1/employees/live             Get all live employee locations
GET    /api/v1/routes/:employeeId/:date   Get route replay for day
GET    /api/v1/routes/:employeeId/stats   Route statistics
POST   /api/v1/geofences                  Create geofence
DELETE /api/v1/geofences/:id              Delete geofence
GET    /api/v1/geofences/:clientId        Get client geofences
POST   /api/v1/location/search            Search location history
GET    /api/v1/location/:employeeId       Get employee location timeline
POST   /api/v1/location/export            Export location data
GET    /api/v1/dashboard/stats            Dashboard statistics
GET    /api/v1/health                     Health check endpoint
```

### Client Visits (6 endpoints)
```
POST   /api/v1/visits                     Log client visit
GET    /api/v1/visits/:employeeId/:date   Get visit history
GET    /api/v1/visits/:id                 Get visit details
PATCH  /api/v1/visits/:id                 Update visit
DELETE /api/v1/visits/:id                 Delete visit
GET    /api/v1/visits/client/:clientId    Get client visit history
```

### Task Management (10 endpoints)
```
POST   /api/v1/tasks                      Create task
GET    /api/v1/tasks                      Get employee tasks
GET    /api/v1/tasks/all                  Get all tasks (admin)
GET    /api/v1/tasks/:id                  Get task details
PATCH  /api/v1/tasks/:id                  Update task
DELETE /api/v1/tasks/:id                  Delete task
POST   /api/v1/tasks/:id/complete         Mark task complete
GET    /api/v1/tasks/:id/comments         Get task comments
POST   /api/v1/tasks/:id/comments         Add comment
POST   /api/v1/tasks/recurring/generate   Generate recurring instances
```

### Alerts & Monitoring (8 endpoints)
```
GET    /api/v1/alerts                     Get all alerts
GET    /api/v1/alerts/unread              Get unread alerts
PATCH  /api/v1/alerts/:id                 Mark alert read
POST   /api/v1/alerts/mark-all-read       Mark all as read
DELETE /api/v1/alerts/:id                 Delete alert
GET    /api/v1/alerts/stats               Alert statistics
POST   /api/v1/alerts/subscribe           WebSocket subscribe
GET    /api/v1/notifications              Get user notifications
```

### Employee Management (8 endpoints)
```
GET    /api/v1/employees                  Get all employees
POST   /api/v1/employees                  Create employee
GET    /api/v1/employees/:id              Get employee details
PATCH  /api/v1/employees/:id              Update employee
DELETE /api/v1/employees/:id              Delete employee
GET    /api/v1/employees/:id/activity     Get employee activity stats
PATCH  /api/v1/employees/:id/features     Toggle employee features
GET    /api/v1/employees/hierarchy        Get org hierarchy
```

### Reports & Analytics (6 endpoints)
```
GET    /api/v1/reports/daily              Get daily report
GET    /api/v1/reports/weekly             Get weekly report
GET    /api/v1/reports/monthly            Get monthly report
POST   /api/v1/reports/export-pdf         Export report as PDF
POST   /api/v1/reports/export-csv         Export report as CSV
GET    /api/v1/reports/analytics          Advanced analytics
```

### Client Management (6 endpoints)
```
GET    /api/v1/clients                    Get all clients
POST   /api/v1/clients                    Create client
GET    /api/v1/clients/:id                Get client details
PATCH  /api/v1/clients/:id                Update client
DELETE /api/v1/clients/:id                Delete client
POST   /api/v1/clients/import-crm         Bulk import from CRM
```

### User Access Control (6 endpoints)
```
GET    /api/v1/users                      Get all users
POST   /api/v1/users                      Create user
GET    /api/v1/users/:id                  Get user details
PATCH  /api/v1/users/:id                  Update user
DELETE /api/v1/users/:id                  Delete user
PATCH  /api/v1/users/:id/role             Change user role
```

---

## Frontend Components

### Admin Portal Pages

#### 1. LoginPage.tsx
- Email/password authentication
- Tenant slug selection
- Error handling
- Demo credentials display

#### 2. Dashboard.tsx
- 4 stat cards: active employees, tracking, alerts, completed tasks
- Recent alerts section
- Active employees list
- Real-time updates every 30 seconds

#### 3. LiveMap.tsx
- OpenStreetMap integration (Leaflet)
- Employee list with avatar badges
- Filters: branch, department, territory
- Selected employee details panel
- Action buttons: assign task, message
- Real-time location updates via Socket.io

#### 4. RouteReplay.tsx
- Employee and date selector
- Map showing polyline route
- Stop list with telemetry
- Statistics: distance, hours, visits
- PDF/CSV export buttons

#### 5. EmployeeManagement.tsx
- Employee list with search/filter
- Detail panel with profile and HR link
- Feature toggles: tracking, visits, tasks, geofence
- Edit/delete actions
- Add employee button

#### 6. TaskManagement.tsx
- 3-column Kanban: Open, In Progress, Completed
- Task cards with priority tags
- Recurring indicator
- Assignee avatars
- Checklist progress bars
- New task button

#### 7. Alerts.tsx
- Color-coded by type: red/amber/blue/orange
- Alert type column
- Employee name and message
- Battery percentage
- Mark as read/unread
- Mark all as read option
- Tab filter: unread/read

#### 8. Reports.tsx
- Date picker
- Branch/department filters
- Summary cards: employees, KM, hours, visits
- Detailed table with all metrics
- Export to PDF/CSV

#### 9. ClientManagement.tsx
- Client list with search
- Customer ID, address, contact
- Geofence radius with checkmark
- Last visit date
- Status badge
- Import from CRM button

#### 10. UserAccess.tsx
- Role cards showing permissions matrix
- User table with role, supervisor, feature toggles
- Add user button
- Toggle switches for GPS, tasks, visits

#### 11. Sidebar.tsx
- Logo and branding
- Two-section navigation
- Badge counts on alerts, tasks
- Sign out button
- Active state highlighting

---

## State Management

### Zustand Auth Store (authStore.ts)
```typescript
interface AuthState {
  token: string | null;
  user: any | null;
  loading: boolean;
  login: (email, password, tenantSlug) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}
```

Features:
- localStorage persistence
- Automatic axios interceptor setup
- Login/logout flow
- JWT token management

---

## Real-Time Features (Socket.io)

### WebSocket Events

**Client Events** (Frontend → Backend)
```typescript
socket.emit('join-map', tenantId)           // Subscribe to live updates
socket.on('location:update', data)          // Receive location updates
socket.on('task:completed', data)           // Task completion notification
socket.on('alert:new', data)                // New alert notification
socket.on('visit:logged', data)             // Visit logged notification
```

**Server Events** (Backend → Frontend)
```typescript
io.emit(`location:${tenantId}`, data)       // Broadcast location
io.emit(`task:completed:${tenantId}`, data) // Task complete event
io.emit(`alert:${tenantId}`, data)          // New alert
```

---

## Mobile App Architecture (React Native)

### Screens
1. **LoginPage**: Biometric + username/password
2. **HomeDashboard**: Stats, quick actions, tasks, visits
3. **CheckIn**: Large check-in button, telemetry display
4. **VisitForm**: Rating, notes, materials, photos, signature
5. **TasksList**: Filterable task list, recurring indicators
6. **Profile**: Employee info, shift schedule, sign out

### Key Features
- Biometric fingerprint login
- Persistent background GPS service
- Offline location buffering
- Photo capture and compression
- Digital signature canvas
- Material list with add-more capability

---

## Deployment Architecture

### Docker Containers
```yaml
st-postgres:
  Image: postgres:16-alpine
  Ports: 5433:5432
  Resources: 1 CPU, 1 GB RAM
  Volumes: PostgreSQL data persistence

st-api:
  Image: super-tracker-api
  Ports: 4010:4010
  Resources: 1 CPU, 512 MB RAM
  Services: Express, Socket.io, JWT auth

st-admin:
  Image: super-tracker-admin
  Ports: 4011:80
  Resources: 0.25 CPU, 64 MB RAM
  Services: React SPA, static files
```

### Nginx Configuration
```nginx
# Routes by domain:
app.supertracker.io   → st-api:4010 (API + Socket.io)
admin.supertracker.io → st-admin:4011 (React SPA)

# Features:
- SSL/TLS termination
- WebSocket upgrade for Socket.io
- Gzip compression
- Static file caching
- Rate limiting (optional)
```

---

## Security Implementation

### Authentication & Authorization
- JWT with 7-day expiration
- bcrypt password hashing (10 rounds)
- Biometric fingerprint (mobile)
- Role-based access control (RBAC)
- Per-user feature toggles

### Data Protection
- HTTPS/TLS encryption in transit
- Database encryption at rest (optional)
- Per-tenant data isolation
- SQL injection prevention (parameterized queries)
- XSS protection (React escapes by default)

### API Security
- CORS configuration
- Helmet.js security headers
- Rate limiting on auth endpoints
- Input validation & sanitization
- Audit logging (prepared for)

---

## Performance Optimization

### Database
- Indexed queries on frequently searched columns
- Location pings indexed by employee + timestamp
- Alerts indexed for fast unread queries
- Batch inserts for bulk operations

### Frontend
- Code splitting with React Router
- Lazy loading of pages
- Socket.io namespacing per tenant
- Memoization of expensive components
- CSS minification with Tailwind

### Backend
- Connection pooling (pg library)
- Prepared statements
- Response compression (gzip)
- Caching headers on static assets
- Async/await for non-blocking operations

---

## Scaling Strategy

### Horizontal Scaling
1. **Multiple API Instances**: Load balancer (Nginx/HAProxy) distributes requests
2. **PostgreSQL Replication**: Streaming replication for HA
3. **Redis Cache Layer**: Cache frequently accessed data
4. **CDN**: Serve admin static files from CDN

### Vertical Scaling
- Increase Docker container resource limits
- PostgreSQL: Increase buffer pool, effective_cache_size
- Node.js: Cluster mode with multiple workers

---

## Development Workflow

### Local Setup
```bash
git clone <repo>
cp .env.example .env
docker compose up
npm run dev  # API
npm run dev  # Admin (in another terminal)
```

### Code Structure
- **TypeScript**: Full type safety
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Git hooks**: Pre-commit linting

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows
- Load testing with k6

---

## Monitoring & Maintenance

### Health Checks
- `/api/v1/health` endpoint
- Docker health checks
- Database connection monitoring
- API response time tracking

### Logging
- Structured logging (JSON)
- Log rotation
- Log aggregation (ELK stack ready)
- Error tracking (Sentry integration ready)

### Backups
- Daily PostgreSQL dumps
- Upload files to S3
- 30-day retention policy
- Point-in-time recovery capability

---

## Future Roadmap

### Phase 2 (Q4 2024)
- [ ] iOS mobile app
- [ ] Advanced geofence automation
- [ ] BI/Analytics dashboard
- [ ] ERPNext module integration

### Phase 3 (Q1 2025)
- [ ] AI route optimization
- [ ] Offline sync capability
- [ ] Multi-language support
- [ ] White-label themes

### Phase 4 (Q2 2025)
- [ ] Integration marketplace
- [ ] Webhook support
- [ ] GraphQL API option
- [ ] Advanced reporting with custom fields

---

## Support & Documentation

### Resources
- API Documentation: Swagger/OpenAPI (ready to generate)
- Deployment Guide: DEPLOYMENT.md
- Architecture Diagrams: In this document
- Video Tutorials: (Ready for recording)

### Contact
- Support: support@nexusrajan.com
- Issues: GitHub Issues
- Feature Requests: Product feedback form

---

## License & Attribution

**Confidential - nexusrajan.com**

Built with:
- Node.js + Express
- React + Vite
- PostgreSQL
- Socket.io
- Tailwind CSS
- OpenStreetMap + Leaflet

---

**Document Version**: 1.0  
**Last Updated**: 2024-09-12  
**Status**: Complete & Production-Ready
