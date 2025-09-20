const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin, requireHR } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, limit = 10, role, department } = req.query;
  const offset = (page - 1) * limit;
  
  let whereConditions = [];
  let params = [];

  if (role) {
    whereConditions.push('role = ?');
    params.push(role);
  }

  if (department) {
    whereConditions.push('department = ?');
    params.push(department);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  db.all(
    `SELECT id, email, first_name, last_name, role, department, phone, is_active, created_at
     FROM users ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset],
    (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.get(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        params,
        (err, countResult) => {
          if (err) {
            console.error('Error counting users:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            users,
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

// Update user status
router.put('/users/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot modify your own account status' });
  }

  db.run(
    'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [is_active ? 1 : 0, id],
    function(err) {
      if (err) {
        console.error('Error updating user status:', err);
        return res.status(500).json({ error: 'Failed to update user status' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User status updated successfully' });
    }
  );
});

// Delete user
router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  // Check if user has posted jobs
  db.get(
    'SELECT COUNT(*) as count FROM jobs WHERE posted_by = ?',
    [id],
    (err, result) => {
      if (err) {
        console.error('Error checking user jobs:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete user with associated jobs. Deactivate the account instead.' 
        });
      }

      db.run(
        'DELETE FROM users WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ error: 'Failed to delete user' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
          }

          res.json({ message: 'User deleted successfully' });
        }
      );
    }
  );
});

// Get system settings
router.get('/settings', authenticateToken, requireAdmin, (req, res) => {
  db.all(
    'SELECT * FROM settings ORDER BY setting_key',
    (err, settings) => {
      if (err) {
        console.error('Error fetching settings:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.setting_key] = {
          value: setting.setting_value,
          description: setting.description,
          updated_at: setting.updated_at
        };
      });

      res.json(settingsObj);
    }
  );
});

// Update system setting
router.put('/settings/:key', authenticateToken, requireAdmin, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (!value) {
    return res.status(400).json({ error: 'Setting value is required' });
  }

  db.run(
    'UPDATE settings SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
    [value, req.user.id, key],
    function(err) {
      if (err) {
        console.error('Error updating setting:', err);
        return res.status(500).json({ error: 'Failed to update setting' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Setting not found' });
      }

      res.json({ message: 'Setting updated successfully' });
    }
  );
});

// Get email templates
router.get('/email-templates', authenticateToken, requireHR, (req, res) => {
  db.all(
    `SELECT 
      et.*,
      u.first_name || ' ' || u.last_name as created_by_name
     FROM email_templates et
     LEFT JOIN users u ON et.created_by = u.id
     WHERE et.is_active = 1
     ORDER BY et.template_type, et.name`,
    (err, templates) => {
      if (err) {
        console.error('Error fetching email templates:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ templates });
    }
  );
});

// Create email template
router.post('/email-templates', authenticateToken, requireHR, (req, res) => {
  const { name, subject, body, template_type } = req.body;

  if (!name || !subject || !body || !template_type) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const validTypes = ['application_received', 'interview_invitation', 'rejection', 'offer', 'welcome'];
  if (!validTypes.includes(template_type)) {
    return res.status(400).json({ error: 'Invalid template type' });
  }

  db.run(
    `INSERT INTO email_templates (name, subject, body, template_type, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [name, subject, body, template_type, req.user.id],
    function(err) {
      if (err) {
        console.error('Error creating email template:', err);
        return res.status(500).json({ error: 'Failed to create email template' });
      }

      res.status(201).json({
        message: 'Email template created successfully',
        template_id: this.lastID
      });
    }
  );
});

// Update email template
router.put('/email-templates/:id', authenticateToken, requireHR, (req, res) => {
  const { id } = req.params;
  const { name, subject, body, is_active } = req.body;

  const updateFields = [];
  const updateValues = [];

  if (name !== undefined) {
    updateFields.push('name = ?');
    updateValues.push(name);
  }

  if (subject !== undefined) {
    updateFields.push('subject = ?');
    updateValues.push(subject);
  }

  if (body !== undefined) {
    updateFields.push('body = ?');
    updateValues.push(body);
  }

  if (is_active !== undefined) {
    updateFields.push('is_active = ?');
    updateValues.push(is_active ? 1 : 0);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updateValues.push(id);

  db.run(
    `UPDATE email_templates SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues,
    function(err) {
      if (err) {
        console.error('Error updating email template:', err);
        return res.status(500).json({ error: 'Failed to update email template' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Email template not found' });
      }

      res.json({ message: 'Email template updated successfully' });
    }
  );
});

// Get system dashboard data
router.get('/dashboard', authenticateToken, requireHR, (req, res) => {
  const queries = {
    totalJobs: 'SELECT COUNT(*) as count FROM jobs',
    activeJobs: 'SELECT COUNT(*) as count FROM jobs WHERE status = "active"',
    totalApplications: 'SELECT COUNT(*) as count FROM applications',
    pendingApplications: 'SELECT COUNT(*) as count FROM applications WHERE status = "pending"',
    totalCandidates: 'SELECT COUNT(*) as count FROM candidates WHERE status = "active"',
    recentApplications: `
      SELECT 
        a.id, a.applied_date, a.status,
        c.first_name || ' ' || c.last_name as candidate_name,
        j.title as job_title
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      ORDER BY a.applied_date DESC
      LIMIT 5
    `,
    applicationsByStatus: 'SELECT status, COUNT(*) as count FROM applications GROUP BY status',
    jobsByDepartment: 'SELECT department, COUNT(*) as count FROM jobs WHERE status = "active" GROUP BY department'
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    if (key === 'recentApplications' || key === 'applicationsByStatus' || key === 'jobsByDepartment') {
      db.all(query, (err, rows) => {
        if (!err) results[key] = rows;
        if (++completed === totalQueries) res.json(results);
      });
    } else {
      db.get(query, (err, row) => {
        if (!err) results[key] = row.count;
        if (++completed === totalQueries) res.json(results);
      });
    }
  });
});

module.exports = router;