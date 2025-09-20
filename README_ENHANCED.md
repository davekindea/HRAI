# AI-Based HR and Job Management System

A comprehensive, AI-powered HR and recruitment platform with advanced front-office and back-office features.

## 🚀 Features

### Core Features
- **Job Posting & Management** - Create, edit, and manage job listings
- **Candidate Management** - Track candidates through the entire recruitment pipeline
- **Application Processing** - Handle applications with AI-powered resume parsing
- **User Management** - Role-based access control (Admin, HR Manager, Recruiter)
- **Basic Analytics** - Overview of recruitment metrics

### 🔥 Enhanced Features (New)

#### Front-Office Features
- **Multi-Channel Job Distribution** - Post jobs to multiple job boards and social media platforms simultaneously
- **Advanced Candidate Assessments** - Technical, cognitive, personality, and skills assessments with automated scoring
- **Interview Scheduling** - Calendar integration with automated notifications and reminders
- **Candidate Self-Service Portal** - Upload documents, check application status, take assessments
- **Real-time Notifications** - Email and SMS notifications for all stakeholders

#### Back-Office Features
- **Advanced Analytics & Reporting** - Comprehensive metrics including:
  - Candidate source tracking and effectiveness
  - Drop-off analysis at each recruitment stage
  - Time-to-hire metrics and benchmarking
  - Cost-per-hire analysis
  - Diversity and inclusion metrics
  - Predictive hiring insights
- **GDPR Compliance Suite** - Complete data protection and privacy management:
  - Consent management system
  - Data subject rights (access, rectification, erasure, portability)
  - Automated data retention and archival
  - Privacy impact assessments
  - Audit trail and logging
- **Data Archival System** - Automated archival of old candidate data with:
  - Configurable retention policies
  - Compressed archive storage
  - Search and restore capabilities
  - Legal compliance tracking

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **Natural** - NLP for resume parsing
- **Bcrypt** - Password hashing

### Enhanced Services
- **Nodemailer + Twilio** - Email and SMS notifications
- **Winston** - Logging and audit trails
- **Node-cron** - Scheduled tasks and archival
- **Archiver** - Data compression and archival
- **Crypto-js** - Data encryption for GDPR compliance
- **Axios + Cheerio** - Job board integrations
- **Moment.js** - Date/time handling

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Context API** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📊 API Endpoints

### Core APIs
- `POST /api/auth/login` - User authentication
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `GET /api/candidates` - List candidates
- `POST /api/applications` - Submit application

### Enhanced APIs

#### Interview Management
- `POST /api/interviews/schedule` - Schedule interview
- `GET /api/interviews/available-slots/:date/:interviewerId` - Get available time slots
- `PUT /api/interviews/:id/reschedule` - Reschedule interview
- `PUT /api/interviews/:id/cancel` - Cancel interview

#### Assessment System
- `POST /api/assessments` - Create assessment
- `POST /api/assessments/:id/assign` - Assign to candidate
- `POST /api/assessments/assignments/:id/start` - Start assessment
- `POST /api/assessments/assignments/:id/submit` - Submit assessment

#### GDPR Compliance
- `POST /api/gdpr/consent` - Record consent
- `POST /api/gdpr/export/:userId` - Request data export
- `POST /api/gdpr/rectification/:userId` - Request data correction
- `POST /api/gdpr/erasure/:userId` - Request data deletion

#### Advanced Analytics
- `GET /api/analytics-enhanced/dashboard` - Comprehensive dashboard
- `GET /api/analytics-enhanced/sources` - Source effectiveness analysis
- `GET /api/analytics-enhanced/funnel` - Conversion funnel metrics
- `GET /api/analytics-enhanced/dropoff` - Drop-off analysis
- `GET /api/analytics-enhanced/diversity` - Diversity metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-hr-job-management
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

5. **Start the development servers**
   ```bash
   # Start backend (from root directory)
   npm run dev
   
   # Start frontend (in another terminal)
   cd client
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/api/health

### Default Login Credentials
- **Admin**: admin@company.com / password123
- **HR Manager**: hr@company.com / password123
- **Recruiter**: recruiter@company.com / password123

## 🔧 Configuration

### Environment Variables
See `.env.example` for all available configuration options:

#### Required for Core Features
- `JWT_SECRET` - JWT signing secret
- `DB_PATH` - SQLite database path

#### Required for Enhanced Features
- `EMAIL_*` - Email service configuration
- `TWILIO_*` - SMS service configuration
- `ENCRYPTION_KEY` - Data encryption for GDPR
- Job board API keys (Indeed, LinkedIn, etc.)
- Social media API keys (Twitter, Facebook, etc.)

### Feature Toggles
Many enhanced features can be enabled/disabled via environment variables:
- `ENABLE_EMAIL_NOTIFICATIONS` - Email notifications
- `ENABLE_SMS_NOTIFICATIONS` - SMS notifications
- `ARCHIVAL_SCHEDULE_ENABLED` - Automated archival
- `ENABLE_REAL_TIME_ANALYTICS` - Real-time analytics

## 📋 Usage Guide

### For HR Administrators
1. **Job Management** - Create and distribute jobs across multiple channels
2. **Analytics Dashboard** - Monitor recruitment metrics and KPIs
3. **GDPR Compliance** - Manage data protection and candidate rights
4. **Assessment Creation** - Design and deploy candidate assessments

### For Recruiters
1. **Candidate Pipeline** - Track candidates through recruitment stages
2. **Interview Scheduling** - Schedule and manage interviews with calendar integration
3. **Assessment Review** - Review candidate assessment results
4. **Communication** - Send automated notifications to candidates

### For Candidates
1. **Job Application** - Apply for positions through the portal
2. **Assessment Taking** - Complete assigned assessments online
3. **Interview Confirmation** - Receive and respond to interview invitations
4. **Status Tracking** - Monitor application progress

## 🛡 Security & Compliance

### Data Protection
- **Encryption at Rest** - Sensitive data encrypted using AES
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access** - Granular permission system
- **Audit Logging** - Comprehensive activity tracking

### GDPR Compliance
- **Consent Management** - Track and manage user consents
- **Data Subject Rights** - Automated handling of GDPR requests
- **Data Retention** - Configurable retention policies
- **Privacy by Design** - Built-in privacy protections

### Best Practices
- Regular security audits
- Encrypted data transmission
- Secure file uploads
- Rate limiting on APIs

## 📈 Analytics & Reporting

### Key Metrics
- **Source Effectiveness** - ROI analysis of recruitment channels
- **Time-to-Hire** - Average hiring duration by department/role
- **Conversion Rates** - Success rates at each pipeline stage
- **Drop-off Analysis** - Identify bottlenecks in the process
- **Cost Analysis** - Total recruitment costs and cost-per-hire
- **Diversity Metrics** - Equal opportunity tracking

### Reporting Features
- **Real-time Dashboards** - Live recruitment metrics
- **Custom Reports** - Build reports with specific metrics
- **Data Export** - Export data in multiple formats
- **Trend Analysis** - Historical performance tracking
- **Predictive Insights** - AI-powered hiring forecasts

## 🔄 Archival & Data Management

### Automated Archival
- **Daily Processing** - Identify records for archival
- **Compressed Storage** - Efficient archive storage
- **Searchable Archives** - Find archived candidate data
- **Legal Compliance** - Meet retention requirements

### Data Lifecycle
1. **Active Data** (0-1 years) - Readily accessible
2. **Archived Data** (1-7 years) - Compressed storage
3. **Deleted Data** (7+ years) - Permanently removed

## 🚨 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Verify database file exists
ls -la hr_platform.db

# Check database permissions
chmod 664 hr_platform.db
```

#### Email Notifications
```bash
# Test email configuration
curl -X POST http://localhost:5000/api/test/email
```

#### File Uploads
```bash
# Check upload directory permissions
chmod 755 uploads/
```

### Logs
- Application logs: `logs/app.log`
- GDPR audit logs: `logs/gdpr-audit.log`
- Notification logs: `logs/notifications.log`
- Archival logs: `logs/archival.log`

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Standards
- ESLint configuration included
- Follow existing code structure
- Add JSDoc comments for new functions
- Include error handling

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support and questions:
- Create an issue on GitHub
- Email: support@hrplatform.com
- Documentation: [Wiki](link-to-wiki)

## 🗺 Roadmap

### Upcoming Features
- **AI-Powered Matching** - Advanced candidate-job matching
- **Video Interviews** - Integrated video assessment platform
- **Mobile App** - Native mobile applications
- **API Gateway** - Enhanced API management
- **Machine Learning** - Predictive hiring analytics
- **Blockchain Verification** - Credential verification

---

**Built with ❤️ by MiniMax Agent**
