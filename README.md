# Super Tracker SaaS

A standalone multi-tenant GPS tracking and field employee management SaaS platform. Built with Node.js, React, Socket.io, and PostgreSQL.

## Features

### Admin Web Console
- **Live Map**: Real-time employee tracking on OpenStreetMap
- **Route Replay**: Visualize complete daily routes with stop-by-stop telemetry
- **Employee Management**: Full CRUD with per-employee feature toggles
- **Task Management**: Kanban board with recurring tasks and multi-employee assignment
- **Alerts**: Color-coded alerts (GPS off, low battery, geofence entry, no activity)
- **Daily Reports**: Comprehensive reports with PDF/CSV export
- **Client Management**: CRM integration with geofence tracking
- **User Access Control**: 3-tier role-based access (Manager, Supervisor, Employee)

### Mobile App (React Native)
- **Biometric Login**: Fingerprint/Touch ID authentication
- **Background GPS**: Records location every 10m movement, persists when app closed
- **Check-in System**: One-tap GPS location recording with telemetry
- **Client Visits**: Visit logging with rating, notes, photos, digital signature
- **Task Management**: View and complete assigned tasks with notifications
- **Profile Management**: View employee details and shift schedule

### Customer Portal
- **Task Visibility**: View assigned company tasks with comment threads
- **Visit History**: See completed client visits
- **Service Requests**: Request new services
- **Comment Thread**: Full collaboration between employees, managers, supervisors, and customers

## Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Mobile**: React Native + Expo (Android APK)
- **Database**: PostgreSQL 16 (one per tenant)
- **Real-time**: Socket.io (self-hosted)
- **Authentication**: JWT + bcrypt + Biometric
- **Maps**: OpenStreetMap + Leaflet.js
- **Deployment**: Docker Compose + Nginx

## Project Structure

```
super-tracker/
├── apps/
│   ├── api/                 # Express API server
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── admin/               # React admin console
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   └── mobile/              # React Native mobile app
│       ├── src/
│       └── package.json
├── scripts/
│   ├── init-master-db.ts   # Initialize master database
│   └── provision-tenant.ts  # Create new tenant
├── config/
│   └── nginx-super-tracker.conf  # Nginx configuration
├── docker-compose.yml
├── .env.example
└── DEPLOYMENT.md
```

## Quick Start

### Development

```bash
# Clone repository
git clone <repo-url>
cd super-tracker

# Install dependencies
cd apps/api && npm install
cd ../admin && npm install
cd ../..

# Setup environment
cp .env.example .env

# Start with Docker Compose
docker compose up

# Initialize databases in another terminal
docker exec -it st-api npx ts-node scripts/init-master-db.ts
docker exec -it st-api npx ts-node scripts/provision-tenant.ts --name "Test Co" --slug "test" --admin "admin@test.com"
```

### Access Points
- Admin Console: http://localhost:4011
- API: http://localhost:4010
- Database: localhost:5433

### Demo Credentials
- Email: `admin@test.com`
- Password: `Admin@123456`
- Tenant Slug: `test`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

Quick deployment:
```bash
./scripts/deploy.sh
```

## Database Schema

### Multi-Tenant Architecture
- **Master Database**: Tenant registry and billing
- **Tenant Database**: Employee, location, task, and visit data

### Key Tables
- **location_pings**: GPS check-ins (indexed by employee + timestamp)
- **client_visits**: Visit logs with materials and signature
- **tasks**: Recurring tasks with checklist and comments
- **alerts**: Color-coded alerts with read status
- **reports**: Pre-calculated daily summaries

## API Documentation

### Authentication
```
POST /api/v1/auth/login
{
  "email": "admin@test.com",
  "password": "Admin@123456",
  "tenantSlug": "test"
}
```

Response: `{ token, user }`

### GPS Check-in
```
POST /api/v1/checkin
Authorization: Bearer <token>
{
  "latitude": 12.9352,
  "longitude": 77.6245,
  "accuracy": 15,
  "battery": 87,
  "gpsStatus": "Background",
  "networkType": "4G",
  "phoneModel": "Samsung Galaxy A54"
}
```

### Get Live Employees
```
GET /api/v1/employees/live?branch=Bengaluru&department=Sales
Authorization: Bearer <token>
```

### Create Task
```
POST /api/v1/tasks
Authorization: Bearer <token>
{
  "title": "Weekly site inspection",
  "description": "Check equipment and client satisfaction",
  "assignees": ["emp-001", "emp-002"],
  "customerId": "cust-001",
  "priority": "medium",
  "dueDate": "2024-09-20",
  "recurrence": "weekly"
}
```

## Features Overview

### Real-Time Live Map
- OpenStreetMap integration
- Face-initial pins for each employee
- Click to see battery, GPS status, supervisor
- Side panel with all employees and live status
- Filterable by branch, department, territory

### Route Replay Dashboard
- Select employee and date
- Polyline showing path taken
- Numbered stops with amber markers at client visits
- Stop list with telemetry (check-in times, KM, working hours)
- PDF and CSV export for daily report

### Task Management
- Kanban board: Open, In Progress, Completed
- Create, assign, manage tasks
- Support for recurring tasks (daily/weekly/monthly)
- Multi-employee assignment
- Customer-requested tasks (marked with blue border)
- Task completion notifications

### Alert System
- GPS disabled (red)
- Low battery (amber)
- Geofence entry (blue)
- No activity (amber)
- Mark individual or all as read
- Filterable by alert type

### Daily Reports
- Summary totals: KM travelled, hours worked, visits completed
- Employee-level breakdown
- Filter by branch, department, territory
- Export to PDF or CSV for payroll

## Mobile App Features

- Biometric fingerprint login with username/password fallback
- Persistent background GPS tracking (10m movement threshold)
- One-tap check-in with telemetry capture
- Client visit logging with photo and digital signature
- Task notifications and completion status
- Full employee profile and shift schedule

## Security

- JWT authentication with expiring tokens
- bcrypt password hashing
- Per-tenant database isolation
- HTTPS/TLS encryption
- Role-based access control
- Biometric authentication support
- Rate limiting on API endpoints

## Performance

- Indexed database queries on high-traffic tables
- Socket.io for efficient real-time updates
- Gzip compression for API responses
- CDN-ready static file delivery
- Configurable resource limits per Docker container
- Automatic database connection pooling

## Contributing

We welcome contributions! Please see CONTRIBUTING.md for guidelines.

## License

Confidential - nexusrajan.com

## Support

For questions or support: support@nexusrajan.com

## Roadmap

- [x] MVP with core features
- [ ] Geofence automation
- [ ] Advanced reporting with BI integration
- [ ] Mobile app for iOS
- [ ] AI-powered route optimization
- [ ] Integration with ERPNext
- [ ] Offline sync capability
- [ ] Multi-language support
