const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');
const { authenticateToken, requireHR, requireManager } = require('../middleware/auth');
const { parseResume, calculateAIMatchScore } = require('../utils/aiUtils');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Submit job application
router.post('/apply/:jobId', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (req.user.userType !== 'candidate') {
      return res.status(403).json({ error: 'Only candidates can apply for jobs' });
    }

    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const resumeFile = req.file;

    // Check if job exists and is active
    db.get(
      'SELECT * FROM jobs WHERE id = ? AND status = "active"',
      [jobId],
      async (err, job) => {
        if (err) {
          console.error('Error checking job:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!job) {
          return res.status(404).json({ error: 'Job not found or not active' });
        }

        // Check if candidate already applied
        db.get(
          'SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?',
          [jobId, req.user.id],
          async (err, existingApplication) => {
            if (err) {
              console.error('Error checking existing application:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            if (existingApplication) {
              return res.status(409).json({ error: 'You have already applied for this job' });
            }

            let aiMatchScore = 0;
            let aiSummary = '';

            // Process resume if uploaded
            if (resumeFile) {
              try {
                const resumeAnalysis = await parseResume(resumeFile.path);
                const matchResult = await calculateAIMatchScore(resumeAnalysis, job);
                aiMatchScore = matchResult.score;
                aiSummary = matchResult.summary;

                // Save resume analysis
                db.run(
                  `INSERT INTO resume_analysis (
                    candidate_id, original_filename, extracted_text, skills, education,
                    experience, contact_info, certifications, ai_summary, confidence_score
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    req.user.id,
                    resumeFile.originalname,
                    resumeAnalysis.text,
                    JSON.stringify(resumeAnalysis.skills),
                    JSON.stringify(resumeAnalysis.education),
                    JSON.stringify(resumeAnalysis.experience),
                    JSON.stringify(resumeAnalysis.contactInfo),
                    JSON.stringify(resumeAnalysis.certifications),
                    resumeAnalysis.summary,
                    resumeAnalysis.confidence
                  ]
                );
              } catch (error) {
                console.error('Resume parsing error:', error);
                // Continue with application even if resume parsing fails
              }
            }

            // Submit application
            db.run(
              `INSERT INTO applications (
                job_id, candidate_id, cover_letter, resume_file, ai_match_score, ai_summary
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                jobId,
                req.user.id,
                coverLetter || null,
                resumeFile ? resumeFile.filename : null,
                aiMatchScore,
                aiSummary
              ],
              function(err) {
                if (err) {
                  console.error('Error submitting application:', err);
                  return res.status(500).json({ error: 'Failed to submit application' });
                }

                res.status(201).json({
                  message: 'Application submitted successfully',
                  application_id: this.lastID,
                  ai_match_score: aiMatchScore
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get candidate's applications
router.get('/my-applications', authenticateToken, (req, res) => {
  if (req.user.userType !== 'candidate') {
    return res.status(403).json({ error: 'Only candidates can view their applications' });
  }

  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;
  
  let whereCondition = 'a.candidate_id = ?';
  let params = [req.user.id];

  if (status) {
    whereCondition += ' AND a.status = ?';
    params.push(status);
  }

  db.all(
    `SELECT 
      a.*,
      j.title as job_title,
      j.department,
      j.location,
      j.job_type,
      j.status as job_status,
      u.first_name || ' ' || u.last_name as reviewed_by_name
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    LEFT JOIN users u ON a.reviewed_by = u.id
    WHERE ${whereCondition}
    ORDER BY a.applied_date DESC
    LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset],
    (err, applications) => {
      if (err) {
        console.error('Error fetching applications:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ applications });
    }
  );
});

// Get all applications (HR access)
router.get('/', authenticateToken, requireManager, (req, res) => {
  const {
    page = 1,
    limit = 10,
    job_id,
    status,
    sort_by = 'applied_date',
    sort_order = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let params = [];

  if (job_id) {
    whereConditions.push('a.job_id = ?');
    params.push(job_id);
  }

  if (status) {
    whereConditions.push('a.status = ?');
    params.push(status);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const validSortColumns = ['applied_date', 'ai_match_score', 'status'];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'applied_date';
  const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Get total count
  db.get(
    `SELECT COUNT(*) as total FROM applications a ${whereClause}`,
    params,
    (err, countResult) => {
      if (err) {
        console.error('Error counting applications:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Get applications
      db.all(
        `SELECT 
          a.*,
          c.first_name || ' ' || c.last_name as candidate_name,
          c.email as candidate_email,
          c.phone as candidate_phone,
          j.title as job_title,
          j.department,
          j.location,
          u.first_name || ' ' || u.last_name as reviewed_by_name
        FROM applications a
        JOIN candidates c ON a.candidate_id = c.id
        JOIN jobs j ON a.job_id = j.id
        LEFT JOIN users u ON a.reviewed_by = u.id
        ${whereClause}
        ORDER BY a.${sortColumn} ${sortDirection}
        LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset],
        (err, applications) => {
          if (err) {
            console.error('Error fetching applications:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            applications,
            pagination: {
              current_page: parseInt(page),
              per_page: parseInt(limit),
              total: countResult.total,
              total_pages: Math.ceil(countResult.total / limit)
            }
          });
        }
      );
    }
  );
});

// Get single application details
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  let query;
  let params;

  if (req.user.userType === 'candidate') {
    // Candidates can only view their own applications
    query = `
      SELECT 
        a.*,
        j.title as job_title,
        j.department,
        j.location,
        j.job_type,
        j.description as job_description,
        u.first_name || ' ' || u.last_name as reviewed_by_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN users u ON a.reviewed_by = u.id
      WHERE a.id = ? AND a.candidate_id = ?
    `;
    params = [id, req.user.id];
  } else {
    // HR staff can view all applications
    query = `
      SELECT 
        a.*,
        c.first_name || ' ' || c.last_name as candidate_name,
        c.email as candidate_email,
        c.phone as candidate_phone,
        c.linkedin_url,
        c.portfolio_url,
        c.current_position,
        c.current_company,
        c.experience_years,
        j.title as job_title,
        j.department,
        j.location,
        j.job_type,
        j.skills_required,
        u.first_name || ' ' || u.last_name as reviewed_by_name
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN users u ON a.reviewed_by = u.id
      WHERE a.id = ?
    `;
    params = [id];
  }

  db.get(query, params, (err, application) => {
    if (err) {
      console.error('Error fetching application:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Parse skills_required if it exists
    if (application.skills_required) {
      application.skills_required = JSON.parse(application.skills_required);
    }

    res.json(application);
  });
});

// Update application status (HR only)
router.put('/:id/status', authenticateToken, requireHR, (req, res) => {
  const { id } = req.params;
  const { status, reviewer_notes } = req.body;

  const validStatuses = [
    'pending', 'reviewed', 'shortlisted', 'interview_scheduled', 
    'interviewed', 'offered', 'hired', 'rejected'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    `UPDATE applications 
     SET status = ?, reviewed_by = ?, reviewed_date = CURRENT_TIMESTAMP, 
         reviewer_notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, req.user.id, reviewer_notes || null, id],
    function(err) {
      if (err) {
        console.error('Error updating application status:', err);
        return res.status(500).json({ error: 'Failed to update application status' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }

      res.json({ message: 'Application status updated successfully' });
    }
  );
});

// Bulk update application statuses
router.put('/bulk/status', authenticateToken, requireHR, (req, res) => {
  const { application_ids, status, reviewer_notes } = req.body;

  if (!Array.isArray(application_ids) || application_ids.length === 0) {
    return res.status(400).json({ error: 'Application IDs array is required' });
  }

  const validStatuses = [
    'pending', 'reviewed', 'shortlisted', 'interview_scheduled', 
    'interviewed', 'offered', 'hired', 'rejected'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const placeholders = application_ids.map(() => '?').join(',');
  
  db.run(
    `UPDATE applications 
     SET status = ?, reviewed_by = ?, reviewed_date = CURRENT_TIMESTAMP, 
         reviewer_notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id IN (${placeholders})`,
    [status, req.user.id, reviewer_notes || null, ...application_ids],
    function(err) {
      if (err) {
        console.error('Error bulk updating applications:', err);
        return res.status(500).json({ error: 'Failed to update applications' });
      }

      res.json({ 
        message: `${this.changes} applications updated successfully`,
        updated_count: this.changes
      });
    }
  );
});

// Get application statistics
router.get('/stats/overview', authenticateToken, requireManager, (req, res) => {
  const { job_id } = req.query;
  
  let whereClause = '';
  let params = [];
  
  if (job_id) {
    whereClause = 'WHERE job_id = ?';
    params = [job_id];
  }

  const queries = [
    `SELECT COUNT(*) as total FROM applications ${whereClause}`,
    `SELECT status, COUNT(*) as count FROM applications ${whereClause} GROUP BY status`,
    `SELECT AVG(ai_match_score) as avg_score FROM applications ${whereClause} WHERE ai_match_score > 0`,
    `SELECT COUNT(*) as today FROM applications ${whereClause} AND DATE(applied_date) = DATE('now')`
  ];

  const stats = {};
  let completed = 0;

  // Total applications
  db.get(queries[0], params, (err, result) => {
    if (!err) stats.total = result.total;
    if (++completed === 4) res.json(stats);
  });

  // By status
  db.all(queries[1], params, (err, results) => {
    if (!err) {
      stats.by_status = {};
      results.forEach(row => {
        stats.by_status[row.status] = row.count;
      });
    }
    if (++completed === 4) res.json(stats);
  });

  // Average AI match score
  db.get(queries[2], params, (err, result) => {
    if (!err) stats.avg_ai_score = result.avg_score || 0;
    if (++completed === 4) res.json(stats);
  });

  // Today's applications
  db.get(queries[3], params, (err, result) => {
    if (!err) stats.today = result.today;
    if (++completed === 4) res.json(stats);
  });
});

module.exports = router;