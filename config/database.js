const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './database/hr_system.db';

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    const tables = [
      // Users table (HR staff, admins, hiring managers)
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'hr_manager', 'recruiter', 'hiring_manager')),
        department TEXT,
        phone TEXT,
        avatar TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Candidates table
      `CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        date_of_birth DATE,
        gender TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        postal_code TEXT,
        linkedin_url TEXT,
        portfolio_url TEXT,
        resume_file TEXT,
        profile_image TEXT,
        skills TEXT, -- JSON array of skills
        experience_years INTEGER,
        current_position TEXT,
        current_company TEXT,
        expected_salary REAL,
        availability_date DATE,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Jobs table
      `CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        location TEXT NOT NULL,
        job_type TEXT NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
        experience_level TEXT NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
        description TEXT NOT NULL,
        requirements TEXT NOT NULL,
        responsibilities TEXT NOT NULL,
        salary_min REAL,
        salary_max REAL,
        benefits TEXT,
        skills_required TEXT, -- JSON array
        education_required TEXT,
        remote_allowed BOOLEAN DEFAULT 0,
        urgent BOOLEAN DEFAULT 0,
        posted_by INTEGER NOT NULL,
        assigned_recruiter INTEGER,
        status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
        application_deadline DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (posted_by) REFERENCES users(id),
        FOREIGN KEY (assigned_recruiter) REFERENCES users(id)
      )`,

      // Applications table
      `CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        candidate_id INTEGER NOT NULL,
        cover_letter TEXT,
        resume_file TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected')),
        applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INTEGER,
        reviewed_date DATETIME,
        reviewer_notes TEXT,
        ai_match_score REAL, -- AI-calculated match score (0-100)
        ai_summary TEXT, -- AI-generated candidate summary
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        FOREIGN KEY (candidate_id) REFERENCES candidates(id),
        FOREIGN KEY (reviewed_by) REFERENCES users(id),
        UNIQUE(job_id, candidate_id)
      )`,

      // Interviews table
      `CREATE TABLE IF NOT EXISTS interviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER NOT NULL,
        interview_type TEXT NOT NULL CHECK (interview_type IN ('phone', 'video', 'in-person', 'technical', 'panel')),
        scheduled_date DATETIME NOT NULL,
        duration_minutes INTEGER DEFAULT 60,
        interviewer_id INTEGER NOT NULL,
        location TEXT,
        meeting_link TEXT,
        status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
        feedback TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        recommendation TEXT CHECK (recommendation IN ('hire', 'maybe', 'no_hire')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES applications(id),
        FOREIGN KEY (interviewer_id) REFERENCES users(id)
      )`,

      // Resume parsing results
      `CREATE TABLE IF NOT EXISTS resume_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candidate_id INTEGER NOT NULL,
        original_filename TEXT NOT NULL,
        extracted_text TEXT,
        skills TEXT, -- JSON array of extracted skills
        education TEXT, -- JSON array of education
        experience TEXT, -- JSON array of work experience
        contact_info TEXT, -- JSON object with contact details
        certifications TEXT, -- JSON array
        languages TEXT, -- JSON array
        ai_summary TEXT,
        confidence_score REAL,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id)
      )`,

      // Job matching results
      `CREATE TABLE IF NOT EXISTS job_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candidate_id INTEGER NOT NULL,
        job_id INTEGER NOT NULL,
        match_score REAL NOT NULL, -- 0-100
        skill_match_score REAL,
        experience_match_score REAL,
        location_match_score REAL,
        salary_match_score REAL,
        match_reasons TEXT, -- JSON array of reasons
        calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id),
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        UNIQUE(candidate_id, job_id)
      )`,

      // Email templates
      `CREATE TABLE IF NOT EXISTS email_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        template_type TEXT NOT NULL CHECK (template_type IN ('application_received', 'interview_invitation', 'rejection', 'offer', 'welcome')),
        is_active BOOLEAN DEFAULT 1,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`,

      // System settings
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_by INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )`
    ];

    let completed = 0;
    const total = tables.length;

    tables.forEach((table, index) => {
      db.run(table, (err) => {
        if (err) {
          console.error(`Error creating table ${index}:`, err.message);
          reject(err);
        } else {
          completed++;
          if (completed === total) {
            console.log('All database tables created successfully');
            insertDefaultData().then(resolve).catch(reject);
          }
        }
      });
    });
  });
};

const insertDefaultData = () => {
  return new Promise((resolve, reject) => {
    // Insert default admin user
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    
    const defaultUser = `
      INSERT OR IGNORE INTO users (email, password, first_name, last_name, role, department)
      VALUES ('admin@hrms.com', '${defaultPassword}', 'System', 'Administrator', 'admin', 'IT')
    `;
    
    const defaultSettings = [
      "INSERT OR IGNORE INTO settings (setting_key, setting_value, description) VALUES ('company_name', 'TechCorp Solutions', 'Company name')",
      "INSERT OR IGNORE INTO settings (setting_key, setting_value, description) VALUES ('max_file_size', '10485760', 'Maximum file upload size in bytes')",
      "INSERT OR IGNORE INTO settings (setting_key, setting_value, description) VALUES ('allowed_file_types', 'pdf,doc,docx', 'Allowed resume file types')",
      "INSERT OR IGNORE INTO settings (setting_key, setting_value, description) VALUES ('auto_email_notifications', 'true', 'Enable automatic email notifications')"
    ];
    
    db.run(defaultUser, (err) => {
      if (err) {
        console.error('Error inserting default user:', err.message);
        reject(err);
      } else {
        let settingsCompleted = 0;
        defaultSettings.forEach(setting => {
          db.run(setting, (err) => {
            if (err) {
              console.error('Error inserting default setting:', err.message);
            }
            settingsCompleted++;
            if (settingsCompleted === defaultSettings.length) {
              console.log('Default data inserted successfully');
              resolve();
            }
          });
        });
      }
    });
  });
};

module.exports = {
  db,
  initializeDatabase
};