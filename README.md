# AI-Based HR & Job Management System

## 🚀 Overview

A comprehensive, AI-powered HR and Job Management software featuring advanced candidate matching, resume parsing, and analytics. This full-stack application provides both front-office (candidate-facing) and back-office (HR management) features.

## ✨ Key Features

### Front-Office (Candidate Portal)
- 📋 **Public Job Board** - Browse and search available positions
- 👤 **Candidate Registration** - Create profiles with skills and experience
- 📄 **Resume Upload & AI Parsing** - Automated skill extraction and analysis
- 📊 **Application Tracking** - Monitor application status and progress
- 🤖 **AI Match Scoring** - Get compatibility scores for job applications
- 💬 **Communication Center** - Interact with recruiters and HR staff

### Back-Office (HR Management)
- 🏢 **Applicant Tracking System (ATS)** - Comprehensive application management
- 📝 **Job Posting Management** - Create, edit, and manage job listings
- 🔍 **Candidate Search & Filtering** - Advanced candidate discovery tools
- 📈 **Analytics Dashboard** - Recruitment metrics and insights
- 🤝 **Interview Management** - Schedule and track interviews
- ⚙️ **Admin Panel** - User management and system configuration
- 📧 **Email Templates** - Automated communication workflows
- 🧠 **AI-Powered Features** - Smart candidate matching and recommendations

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: SQLite (easily upgradable to PostgreSQL/MySQL)
- **Authentication**: JWT-based authentication
- **File Processing**: Resume parsing with PDF/DOCX support
- **AI Features**: Natural Language Processing for skill extraction

### Frontend
- **Framework**: React 18 with React Router
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Query for server state
- **Forms**: React Hook Form with validation
- **Notifications**: React Hot Toast
- **Charts**: Recharts for analytics visualization
- **Icons**: Lucide React

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-hr-job-management
```

### 2. Backend Setup
```bash
# Install backend dependencies
npm install

# Create required directories
mkdir -p uploads database

# Copy environment configuration
cp .env.example .env

# Edit .env file with your configuration
# The default settings should work for development
```

### 3. Frontend Setup
```bash
# Navigate to client directory
cd client

# Install frontend dependencies
npm install

# Return to root directory
cd ..
```

### 4. Database Initialization
The SQLite database will be automatically created and initialized when you start the server for the first time.

### 5. Start the Application

#### Development Mode
```bash
# Start backend server (Terminal 1)
npm run dev

# Start frontend development server (Terminal 2)
cd client && npm start
```

#### Production Mode
```bash
# Build frontend
cd client && npm run build && cd ..

# Start production server
NODE_ENV=production npm start
```

## 🎯 Usage Guide

### Default Admin Account
- **Email**: admin@hrms.com
- **Password**: admin123
- **Role**: System Administrator

### Getting Started

1. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

2. **For HR Professionals**
   - Login with admin credentials or create new HR staff accounts
   - Access the admin dashboard at `/dashboard`
   - Create job postings, review applications, and manage candidates

3. **For Job Seekers**
   - Browse jobs at `/jobs` (no account required)
   - Register for an account to apply for positions
   - Upload resumes for AI-powered skill analysis

## 🗂 Project Structure

```
ai-hr-job-management/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Auth, etc.)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── tailwind.config.js
├── config/                # Backend configuration
│   └── database.js        # Database setup and schema
├── middleware/            # Express middleware
│   └── auth.js           # Authentication middleware
├── routes/               # API route handlers
│   ├── auth.js          # Authentication routes
│   ├── jobs.js          # Job management routes
│   ├── applications.js  # Application routes
│   ├── candidates.js    # Candidate management
│   ├── admin.js         # Admin panel routes
│   └── analytics.js     # Analytics endpoints
├── utils/               # Backend utilities
│   └── aiUtils.js      # AI processing functions
├── uploads/            # File upload directory
├── database/           # SQLite database storage
├── server.js          # Main server file
├── package.json
└── .env              # Environment configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_key
DB_PATH=./database/hr_system.db
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:3000
```

### Database Configuration
- The application uses SQLite by default for easy setup
- Database schema is automatically created on first startup
- To use PostgreSQL or MySQL, modify the database configuration in `config/database.js`

## 🤖 AI Features

### Resume Parsing
- **Supported Formats**: PDF, DOC, DOCX
- **Extracted Data**: Skills, education, experience, contact information
- **Confidence Scoring**: Quality assessment of parsing results

### Candidate Matching
- **Skill Matching**: Automatic comparison of candidate skills with job requirements
- **Experience Analysis**: Years of experience evaluation
- **Education Relevance**: Educational background assessment
- **Overall Match Score**: Weighted scoring algorithm (0-100)

### Analytics & Insights
- **Recruitment Funnel**: Application status progression analysis
- **Source Analytics**: Track where candidates are coming from
- **Performance Metrics**: Recruiter and department performance
- **AI Effectiveness**: Match score correlation with hiring success

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register/candidate` - Candidate registration
- `POST /api/auth/register/staff` - HR staff registration (admin only)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Job Management
- `GET /api/jobs/public` - Get public job listings
- `GET /api/jobs` - Get jobs (authenticated)
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Application Management
- `POST /api/applications/apply/:jobId` - Submit application
- `GET /api/applications` - Get applications
- `PUT /api/applications/:id/status` - Update application status
- `PUT /api/applications/bulk/status` - Bulk status update

### Analytics
- `GET /api/analytics/overview` - Recruitment overview
- `GET /api/analytics/funnel` - Application funnel data
- `GET /api/analytics/ai-insights` - AI matching insights

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for HR staff and candidates
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: Restricted file types and size limits
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Secure cross-origin requests

## 🚀 Deployment

### Docker Deployment (Recommended)
```bash
# Build Docker image
docker build -t ai-hr-system .

# Run container
docker run -p 5000:5000 -v $(pwd)/database:/app/database ai-hr-system
```

### Cloud Deployment
- **Heroku**: Use the included Procfile
- **AWS/GCP/Azure**: Deploy as Node.js application
- **Database**: Upgrade to PostgreSQL for production
- **File Storage**: Use cloud storage (AWS S3, etc.) for uploaded files

## 📚 Development

### Adding New Features
1. **Backend**: Add routes in the `/routes` directory
2. **Frontend**: Create components in `/client/src/components`
3. **Database**: Update schema in `/config/database.js`
4. **AI Features**: Extend `/utils/aiUtils.js`

### Code Standards
- Follow ESLint configuration
- Use Prettier for code formatting
- Write unit tests for critical functions
- Document API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🎉 Acknowledgments

- Built with modern web technologies
- AI-powered features for enhanced recruitment
- Responsive design for all devices
- Comprehensive testing and validation

---

**Author**: MiniMax Agent  
**Version**: 1.0.0  
**Last Updated**: 2025-09-20
# Last updated: 2025-12-11



# TODO: Review implementation
