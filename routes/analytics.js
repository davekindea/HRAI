const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// Get recruitment analytics overview
router.get('/overview', authenticateToken, requireManager, (req, res) => {
  const { period = '30', department } = req.query;
  
  let dateFilter = '';
  let params = [];
  
  if (period !== 'all') {
    dateFilter = `AND DATE(created_at) >= DATE('now', '-${parseInt(period)} days')`;
  }
  
  if (department) {
    dateFilter += ' AND department = ?';
    params.push(department);
  }

  const queries = {
    jobsPosted: `SELECT COUNT(*) as count FROM jobs WHERE 1=1 ${dateFilter}`,
    applicationsReceived: `SELECT COUNT(*) as count FROM applications a JOIN jobs j ON a.job_id = j.id WHERE 1=1 ${dateFilter}`,
    candidatesHired: `SELECT COUNT(*) as count FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.status = 'hired' ${dateFilter}`,
    averageTimeToHire: `
      SELECT AVG(julianday(updated_at) - julianday(applied_date)) as avg_days
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.status = 'hired' ${dateFilter}
    `,
    topPerformingJobs: `
      SELECT 
        j.title,
        j.department,
        COUNT(a.id) as application_count,
        COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_count
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.status = 'active' ${department ? 'AND j.department = ?' : ''}
      GROUP BY j.id, j.title, j.department
      ORDER BY application_count DESC
      LIMIT 5
    `,
    applicationTrends: `
      SELECT 
        DATE(a.applied_date) as date,
        COUNT(*) as applications
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE DATE(a.applied_date) >= DATE('now', '-30 days') ${department ? 'AND j.department = ?' : ''}
      GROUP BY DATE(a.applied_date)
      ORDER BY date
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    if (key === 'topPerformingJobs' || key === 'applicationTrends') {
      const queryParams = department && (key === 'topPerformingJobs' || key === 'applicationTrends') ? [department] : [];
      db.all(query, queryParams, (err, rows) => {
        if (!err) results[key] = rows;
        if (++completed === totalQueries) res.json(results);
      });
    } else {
      db.get(query, params, (err, row) => {
        if (!err) {
          if (key === 'averageTimeToHire') {
            results[key] = row.avg_days ? Math.round(row.avg_days) : 0;
          } else {
            results[key] = row.count || 0;
          }
        }
        if (++completed === totalQueries) res.json(results);
      });
    }
  });
});

// Get application funnel analytics
router.get('/funnel', authenticateToken, requireManager, (req, res) => {
  const { period = '30', job_id } = req.query;
  
  let dateFilter = `WHERE DATE(a.applied_date) >= DATE('now', '-${parseInt(period)} days')`;
  let params = [];
  
  if (job_id) {
    dateFilter += ' AND a.job_id = ?';
    params.push(job_id);
  }

  const query = `
    SELECT 
      'Applied' as stage, COUNT(*) as count, 1 as stage_order
    FROM applications a ${dateFilter}
    UNION ALL
    SELECT 
      'Reviewed' as stage, COUNT(*) as count, 2 as stage_order
    FROM applications a ${dateFilter} AND a.status IN ('reviewed', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired')
    UNION ALL
    SELECT 
      'Shortlisted' as stage, COUNT(*) as count, 3 as stage_order
    FROM applications a ${dateFilter} AND a.status IN ('shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired')
    UNION ALL
    SELECT 
      'Interviewed' as stage, COUNT(*) as count, 4 as stage_order
    FROM applications a ${dateFilter} AND a.status IN ('interviewed', 'offered', 'hired')
    UNION ALL
    SELECT 
      'Offered' as stage, COUNT(*) as count, 5 as stage_order
    FROM applications a ${dateFilter} AND a.status IN ('offered', 'hired')
    UNION ALL
    SELECT 
      'Hired' as stage, COUNT(*) as count, 6 as stage_order
    FROM applications a ${dateFilter} AND a.status = 'hired'
    ORDER BY stage_order
  `;

  // Create the repeated params for each UNION query
  const allParams = [];
  for (let i = 0; i < 6; i++) {
    allParams.push(...params);
  }

  db.all(query, allParams, (err, results) => {
    if (err) {
      console.error('Error fetching funnel analytics:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Calculate conversion rates
    const funnel = results.map((stage, index) => {
      let conversionRate = 100;
      if (index > 0 && results[0].count > 0) {
        conversionRate = (stage.count / results[0].count) * 100;
      }
      
      return {
        ...stage,
        conversion_rate: Math.round(conversionRate * 100) / 100
      };
    });

    res.json({ funnel });
  });
});

// Get source analytics (where candidates come from)
router.get('/sources', authenticateToken, requireManager, (req, res) => {
  const { period = '30' } = req.query;
  
  // For now, we'll simulate source data since we don't have a source field
  // In a real implementation, you'd track where applications come from
  const query = `
    SELECT 
      CASE 
        WHEN c.linkedin_url IS NOT NULL THEN 'LinkedIn'
        WHEN c.portfolio_url IS NOT NULL THEN 'Portfolio/Website'
        WHEN c.email LIKE '%@gmail.com' THEN 'Direct Application'
        ELSE 'Other'
      END as source,
      COUNT(*) as applications
    FROM applications a
    JOIN candidates c ON a.candidate_id = c.id
    WHERE DATE(a.applied_date) >= DATE('now', '-${parseInt(period)} days')
    GROUP BY source
    ORDER BY applications DESC
  `;

  db.all(query, (err, results) => {
    if (err) {
      console.error('Error fetching source analytics:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ sources: results });
  });
});

// Get department analytics
router.get('/departments', authenticateToken, requireManager, (req, res) => {
  const { period = '30' } = req.query;
  
  const query = `
    SELECT 
      j.department,
      COUNT(DISTINCT j.id) as active_jobs,
      COUNT(a.id) as total_applications,
      COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hires,
      AVG(a.ai_match_score) as avg_match_score
    FROM jobs j
    LEFT JOIN applications a ON j.id = a.job_id AND DATE(a.applied_date) >= DATE('now', '-${parseInt(period)} days')
    WHERE j.status = 'active'
    GROUP BY j.department
    ORDER BY total_applications DESC
  `;

  db.all(query, (err, results) => {
    if (err) {
      console.error('Error fetching department analytics:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const departments = results.map(dept => ({
      ...dept,
      avg_match_score: dept.avg_match_score ? Math.round(dept.avg_match_score) : 0,
      hire_rate: dept.total_applications > 0 ? 
        Math.round((dept.hires / dept.total_applications) * 100) : 0
    }));

    res.json({ departments });
  });
});

// Get skill demand analytics
router.get('/skills', authenticateToken, requireManager, (req, res) => {
  const { period = '30' } = req.query;
  
  const query = `
    SELECT 
      j.skills_required,
      j.title,
      j.department,
      COUNT(a.id) as applications,
      j.created_at
    FROM jobs j
    LEFT JOIN applications a ON j.id = a.job_id
    WHERE j.skills_required IS NOT NULL 
      AND j.status = 'active'
      AND DATE(j.created_at) >= DATE('now', '-${parseInt(period)} days')
    GROUP BY j.id
  `;

  db.all(query, (err, results) => {
    if (err) {
      console.error('Error fetching skill analytics:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Aggregate skills across all jobs
    const skillCounts = {};
    
    results.forEach(job => {
      if (job.skills_required) {
        try {
          const skills = JSON.parse(job.skills_required);
          skills.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    // Convert to array and sort by demand
    const skillDemand = Object.entries(skillCounts)
      .map(([skill, demand]) => ({ skill, demand }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 20); // Top 20 skills

    res.json({ 
      skillDemand,
      totalJobs: results.length
    });
  });
});

// Get recruiter performance analytics
router.get('/recruiters', authenticateToken, requireManager, (req, res) => {
  const { period = '30' } = req.query;
  
  const query = `
    SELECT 
      u.id,
      u.first_name || ' ' || u.last_name as name,
      COUNT(DISTINCT j.id) as jobs_managed,
      COUNT(a.id) as applications_reviewed,
      COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as successful_hires,
      AVG(CASE WHEN a.reviewed_date IS NOT NULL THEN 
        julianday(a.reviewed_date) - julianday(a.applied_date) 
      END) as avg_review_time
    FROM users u
    LEFT JOIN jobs j ON u.id = j.assigned_recruiter
    LEFT JOIN applications a ON j.id = a.job_id AND a.reviewed_by = u.id
      AND DATE(a.applied_date) >= DATE('now', '-${parseInt(period)} days')
    WHERE u.role IN ('recruiter', 'hr_manager') AND u.is_active = 1
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY successful_hires DESC
  `;

  db.all(query, (err, results) => {
    if (err) {
      console.error('Error fetching recruiter analytics:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const recruiters = results.map(recruiter => ({
      ...recruiter,
      avg_review_time: recruiter.avg_review_time ? 
        Math.round(recruiter.avg_review_time * 100) / 100 : 0,
      hire_rate: recruiter.applications_reviewed > 0 ? 
        Math.round((recruiter.successful_hires / recruiter.applications_reviewed) * 100) : 0
    }));

    res.json({ recruiters });
  });
});

// Get AI match score analytics
router.get('/ai-insights', authenticateToken, requireManager, (req, res) => {
  const { period = '30' } = req.query;
  
  const queries = {
    scoreDistribution: `
      SELECT 
        CASE 
          WHEN ai_match_score >= 80 THEN '80-100'
          WHEN ai_match_score >= 60 THEN '60-79'
          WHEN ai_match_score >= 40 THEN '40-59'
          WHEN ai_match_score >= 20 THEN '20-39'
          ELSE '0-19'
        END as score_range,
        COUNT(*) as count
      FROM applications 
      WHERE ai_match_score > 0 
        AND DATE(applied_date) >= DATE('now', '-${parseInt(period)} days')
      GROUP BY score_range
      ORDER BY MIN(ai_match_score) DESC
    `,
    scoreVsHireRate: `
      SELECT 
        ROUND(ai_match_score/10)*10 as score_bucket,
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'hired' THEN 1 END) as hires
      FROM applications 
      WHERE ai_match_score > 0 
        AND DATE(applied_date) >= DATE('now', '-${parseInt(period)} days')
      GROUP BY score_bucket
      ORDER BY score_bucket
    `,
    averageScoreByDepartment: `
      SELECT 
        j.department,
        AVG(a.ai_match_score) as avg_score,
        COUNT(a.id) as application_count
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.ai_match_score > 0 
        AND DATE(a.applied_date) >= DATE('now', '-${parseInt(period)} days')
      GROUP BY j.department
      ORDER BY avg_score DESC
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.all(query, (err, rows) => {
      if (!err) {
        if (key === 'scoreVsHireRate') {
          results[key] = rows.map(row => ({
            ...row,
            hire_rate: row.total_applications > 0 ? 
              Math.round((row.hires / row.total_applications) * 100) : 0
          }));
        } else if (key === 'averageScoreByDepartment') {
          results[key] = rows.map(row => ({
            ...row,
            avg_score: Math.round(row.avg_score)
          }));
        } else {
          results[key] = rows;
        }
      }
      if (++completed === totalQueries) res.json(results);
    });
  });
});

module.exports = router;