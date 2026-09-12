# Super Tracker SaaS Deployment Guide

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (managed by Docker)
- Nginx (for reverse proxy)

### 1. Clone & Setup

```bash
git clone <repo-url> /opt/super-tracker
cd /opt/super-tracker
cp .env.example .env
# Edit .env with your configuration
```

### 2. Build Docker Images

```bash
docker compose build
```

### 3. Start Services

```bash
docker compose up -d
docker compose ps  # Verify all running
```

### 4. Initialize Master Database

```bash
docker exec -it st-api npx ts-node scripts/init-master-db.ts
```

### 5. Create First Tenant

```bash
docker exec -it st-api npx ts-node scripts/provision-tenant.ts \
  --name "Acme Corp" \
  --slug "acme" \
  --admin "admin@acme.com"
```

### 6. Configure Nginx

```bash
sudo cp config/nginx-super-tracker.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Setup SSL Certificate

```bash
sudo certbot certonly --nginx -d app.supertracker.io -d admin.supertracker.io
```

## Architecture Overview

### Containers
- **st-postgres**: PostgreSQL database (port 5433)
- **st-api**: Node.js API server with Socket.io (port 4010)
- **st-admin**: React admin console (port 4011)

### Key Features
- Multi-tenant: Separate database per customer
- Real-time: Socket.io for live map updates
- Background GPS: Records every 10m movement
- Task Management: Recurring tasks with multi-employee assignment
- Reports: Daily summaries with PDF/CSV export

## Database Structure

### Master Database (fieldtrack_master)
- tenants
- super_admins
- tenant_billing

### Tenant Database (fieldtrack_t_slug)
- users
- employees
- shifts
- location_pings
- clients
- client_visits
- visit_materials
- tasks
- task_assignees
- task_checklist
- task_comments
- alerts
- notifications
- geofences
- reports

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with email/password

### GPS Tracking
- `POST /api/v1/checkin` - Record location ping
- `GET /api/v1/employees/live` - Get live employee locations
- `GET /api/v1/routes/:employeeId/:date` - Get route replay

### Task Management
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks` - Get employee tasks
- `POST /api/v1/tasks/:taskId/complete` - Complete task

### Client Visits
- `POST /api/v1/visits` - Log client visit
- `GET /api/v1/visits/:employeeId/:date` - Get visit history

### Reports
- `GET /api/v1/reports/daily` - Get daily report

### Alerts
- `GET /api/v1/alerts` - Get all alerts
- `PATCH /api/v1/alerts/:alertId` - Mark alert as read

## Maintenance

### Backup

```bash
# Database backup
docker exec st-postgres pg_dumpall -U st_admin > backup_$(date +%Y%m%d).sql

# Upload files backup
rsync -a /opt/super-tracker/uploads/ /backups/
```

### Monitor Logs

```bash
docker compose logs -f st-api
docker compose logs -f st-postgres
```

### Update Code

```bash
cd /opt/super-tracker
git pull
npm install
npm run build
docker compose restart st-api st-admin
```

## Security Considerations

1. Change default JWT_SECRET
2. Use strong database password
3. Enable SSL/TLS
4. Set up rate limiting in Nginx
5. Regular database backups
6. Monitor API logs for suspicious activity

## Scaling

### Horizontal Scaling
- Add multiple st-api containers behind a load balancer
- Use PostgreSQL streaming replication for HA

### Performance Tuning
- Increase PostgreSQL buffer pool
- Enable Redis caching
- Use CDN for static assets
- Monitor slow queries

## Support

For issues or feature requests, contact: support@nexusrajan.com
