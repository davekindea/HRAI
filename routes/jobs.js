const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, requireHR, requireManager } = require('../middleware/auth');

const router = express.Router();

// Get all active jobs (public access)
router.get('/public', (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    department,
    location,
    job_type,
    experience_level,
    remote_allowed
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = ['status = "active"'];
  let params = [];

  if (search) {
    whereConditions.push('(title LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (department) {
    whereConditions.push('department = ?');
    params.push(department);
  }

  if (location) {
    whereConditions.push('location LIKE ?');
    params.push(`%${location}%`);
  }

  if (job_type) {
    whereConditions.push('job_type = ?');
    params.push(job_type);
  }

  if (experience_level) {
    whereConditions.push('experience_level = ?');
    params.push(experience_level);
  }

  if (remote_allowed === 'true') {
    whereConditions.push('remote_allowed = 1');
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  db.get(
    `SELECT COUNT(*) as total FROM jobs WHERE ${whereClause}`,
    params,
    (err, countResult) => {
      if (err) {
        console.error('Error counting jobs:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Get jobs with pagination
      db.all(
        `SELECT 
          j.*,
          u.first_name || ' ' || u.last_name as posted_by_name,
          r.first_name || ' ' || r.last_name as recruiter_name
        FROM jobs j
        LEFT JOIN users u ON j.posted_by = u.id
        LEFT JOIN users r ON j.assigned_recruiter = r.id
        WHERE ${whereClause}
        ORDER BY j.urgent DESC, j.created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset],
        (err, jobs) => {
          if (err) {
            console.error('Error fetching jobs:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            jobs: jobs.map(job => ({
              ...job,
              skills_required: job.skills_required ? JSON.parse(job.skills_required) : [],
              benefits: job.benefits ? job.benefits.split(',').map(b => b.trim()) : []
            })),
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

// Get single job details (public access)
router.get('/public/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT 
      j.*,
      u.first_name || ' ' || u.last_name as posted_by_name,
      r.first_name || ' ' || r.last_name as recruiter_name,
      r.email as recruiter_email
    FROM jobs j
    LEFT JOIN users u ON j.posted_by = u.id
    LEFT JOIN users r ON j.assigned_recruiter = r.id
    WHERE j.id = ? AND j.status = 'active'`,
    [id],
    (err, job) => {
      if (err) {
        console.error('Error fetching job:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({
        ...job,
        skills_required: job.skills_required ? JSON.parse(job.skills_required) : [],
        benefits: job.benefits ? job.benefits.split(',').map(b => b.trim()) : []
      });
    }
  );
});

// Get all jobs (HR access)
router.get('/', authenticateToken, requireManager, (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    department,
    assigned_recruiter
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let params = [];

  if (status) {
    whereConditions.push('j.status = ?');
    params.push(status);
  }

  if (department) {
    whereConditions.push('j.department = ?');
    params.push(department);
  }

  if (assigned_recruiter) {
    whereConditions.push('j.assigned_recruiter = ?');
    params.push(assigned_recruiter);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  db.get(
    `SELECT COUNT(*) as total FROM jobs j ${whereClause}`,
    params,
    (err, countResult) => {
      if (err) {
        console.error('Error counting jobs:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Get jobs with application counts
      db.all(
        `SELECT 
          j.*,
          u.first_name || ' ' || u.last_name as posted_by_name,
          r.first_name || ' ' || r.last_name as recruiter_name,
          COUNT(a.id) as application_count
        FROM jobs j
        LEFT JOIN users u ON j.posted_by = u.id
        LEFT JOIN users r ON j.assigned_recruiter = r.id
        LEFT JOIN applications a ON j.id = a.job_id
        ${whereClause}
        GROUP BY j.id
        ORDER BY j.created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset],
        (err, jobs) => {
          if (err) {
            console.error('Error fetching jobs:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            jobs: jobs.map(job => ({
              ...job,
              skills_required: job.skills_required ? JSON.parse(job.skills_required) : []
            })),
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

// Create new job
router.post('/', authenticateToken, requireHR, (req, res) => {
  const {
    title,
    department,
    location,
    job_type,
    experience_level,
    description,
    requirements,
    responsibilities,
    salary_min,
    salary_max,
    benefits,
    skills_required,
    education_required,
    remote_allowed,
    urgent,
    assigned_recruiter,
    application_deadline
  } = req.body;

  if (!title || !department || !location || !job_type || !experience_level || !description || !requirements || !responsibilities) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  const skillsJson = Array.isArray(skills_required) ? JSON.stringify(skills_required) : null;

  db.run(
    `INSERT INTO jobs (
      title, department, location, job_type, experience_level, description, requirements,
      responsibilities, salary_min, salary_max, benefits, skills_required, education_required,
      remote_allowed, urgent, posted_by, assigned_recruiter, application_deadline
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      department,
      location,
      job_type,
      experience_level,
      description,
      requirements,
      responsibilities,
      salary_min || null,
      salary_max || null,
      benefits || null,
      skillsJson,
      education_required || null,
      remote_allowed ? 1 : 0,
      urgent ? 1 : 0,
      req.user.id,
      assigned_recruiter || null,
      application_deadline || null
    ],
    function(err) {
      if (err) {
        console.error('Error creating job:', err);
        return res.status(500).json({ error: 'Failed to create job' });
      }

      res.status(201).json({
        message: 'Job created successfully',
        job_id: this.lastID
      });
    }
  );
});

// Update job
router.put('/:id', authenticateToken, requireHR, (req, res) => {
  const { id } = req.params;
  const allowedFields = [
    'title', 'department', 'location', 'job_type', 'experience_level', 'description',
    'requirements', 'responsibilities', 'salary_min', 'salary_max', 'benefits',
    'skills_required', 'education_required', 'remote_allowed', 'urgent',
    'assigned_recruiter', 'application_deadline', 'status'
  ];

  const updateFields = [];
  const updateValues = [];

  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key) && req.body[key] !== undefined) {
      if (key === 'skills_required' && Array.isArray(req.body[key])) {
        updateFields.push(`${key} = ?`);
        updateValues.push(JSON.stringify(req.body[key]));
      } else if (key === 'remote_allowed' || key === 'urgent') {
        updateFields.push(`${key} = ?`);
        updateValues.push(req.body[key] ? 1 : 0);
      } else {
        updateFields.push(`${key} = ?`);
        updateValues.push(req.body[key]);
      }
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(id);

  db.run(
    `UPDATE jobs SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues,
    function(err) {
      if (err) {
        console.error('Error updating job:', err);
        return res.status(500).json({ error: 'Failed to update job' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({ message: 'Job updated successfully' });
    }
  );
});

// Delete job
router.delete('/:id', authenticateToken, requireHR, (req, res) => {
  const { id } = req.params;

  // Check if job has applications
  db.get(
    'SELECT COUNT(*) as count FROM applications WHERE job_id = ?',
    [id],
    (err, result) => {
      if (err) {
        console.error('Error checking applications:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete job with existing applications. Change status to closed instead.' 
        });
      }

      db.run(
        'DELETE FROM jobs WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            console.error('Error deleting job:', err);
            return res.status(500).json({ error: 'Failed to delete job' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Job not found' });
          }

          res.json({ message: 'Job deleted successfully' });
        }
      );
    }
  );
});

// Get job statistics
router.get('/stats/overview', authenticateToken, requireManager, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM jobs',
    'SELECT COUNT(*) as active FROM jobs WHERE status = "active"',
    'SELECT COUNT(*) as draft FROM jobs WHERE status = "draft"',
    'SELECT COUNT(*) as closed FROM jobs WHERE status = "closed"',
    'SELECT department, COUNT(*) as count FROM jobs GROUP BY department ORDER BY count DESC LIMIT 5',
    'SELECT COUNT(*) as urgent FROM jobs WHERE urgent = 1 AND status = "active"'
  ];

  const stats = {};
  let completed = 0;

  // Total jobs
  db.get(queries[0], (err, result) => {
    if (!err) stats.total = result.total;
    if (++completed === 6) res.json(stats);
  });

  // Active jobs
  db.get(queries[1], (err, result) => {
    if (!err) stats.active = result.active;
    if (++completed === 6) res.json(stats);
  });

  // Draft jobs
  db.get(queries[2], (err, result) => {
    if (!err) stats.draft = result.draft;
    if (++completed === 6) res.json(stats);
  });

  // Closed jobs
  db.get(queries[3], (err, result) => {
    if (!err) stats.closed = result.closed;
    if (++completed === 6) res.json(stats);
  });

  // By department
  db.all(queries[4], (err, results) => {
    if (!err) stats.by_department = results;
    if (++completed === 6) res.json(stats);
  });

  // Urgent jobs
  db.get(queries[5], (err, result) => {
    if (!err) stats.urgent = result.urgent;
    if (++completed === 6) res.json(stats);
  });
});

module.exports = router;