const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, requireHR, requireManager } = require('../middleware/auth');

const router = express.Router();

// Get all candidates (HR access)
router.get('/', authenticateToken, requireManager, (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    skills,
    experience_years,
    status = 'active'
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let params = [];

  if (status) {
    whereConditions.push('status = ?');
    params.push(status);
  }

  if (search) {
    whereConditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR current_position LIKE ? OR current_company LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (skills) {
    whereConditions.push('skills LIKE ?');
    params.push(`%${skills}%`);
  }

  if (experience_years) {
    whereConditions.push('experience_years >= ?');
    params.push(parseInt(experience_years));
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  db.get(
    `SELECT COUNT(*) as total FROM candidates ${whereClause}`,
    params,
    (err, countResult) => {
      if (err) {
        console.error('Error counting candidates:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Get candidates
      db.all(
        `SELECT 
          id, email, first_name, last_name, phone, current_position, current_company,
          experience_years, skills, created_at, updated_at, status
        FROM candidates
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset],
        (err, candidates) => {
          if (err) {
            console.error('Error fetching candidates:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Parse skills JSON for each candidate
          const processedCandidates = candidates.map(candidate => ({
            ...candidate,
            skills: candidate.skills ? JSON.parse(candidate.skills) : []
          }));

          res.json({
            candidates: processedCandidates,
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

// Get candidate details
router.get('/:id', authenticateToken, requireManager, (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT * FROM candidates WHERE id = ?',
    [id],
    (err, candidate) => {
      if (err) {
        console.error('Error fetching candidate:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

      // Remove password and parse skills
      delete candidate.password;
      candidate.skills = candidate.skills ? JSON.parse(candidate.skills) : [];

      // Get candidate's applications
      db.all(
        `SELECT 
          a.*,
          j.title as job_title,
          j.department,
          j.location
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE a.candidate_id = ?
        ORDER BY a.applied_date DESC`,
        [id],
        (err, applications) => {
          if (err) {
            console.error('Error fetching candidate applications:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Get resume analysis
          db.get(
            'SELECT * FROM resume_analysis WHERE candidate_id = ? ORDER BY processed_at DESC LIMIT 1',
            [id],
            (err, resumeAnalysis) => {
              if (err) {
                console.error('Error fetching resume analysis:', err);
              }

              if (resumeAnalysis) {
                resumeAnalysis.skills = resumeAnalysis.skills ? JSON.parse(resumeAnalysis.skills) : [];
                resumeAnalysis.education = resumeAnalysis.education ? JSON.parse(resumeAnalysis.education) : [];
                resumeAnalysis.experience = resumeAnalysis.experience ? JSON.parse(resumeAnalysis.experience) : [];
                resumeAnalysis.contact_info = resumeAnalysis.contact_info ? JSON.parse(resumeAnalysis.contact_info) : {};
                resumeAnalysis.certifications = resumeAnalysis.certifications ? JSON.parse(resumeAnalysis.certifications) : [];
                resumeAnalysis.languages = resumeAnalysis.languages ? JSON.parse(resumeAnalysis.languages) : [];
              }

              res.json({
                candidate,
                applications,
                resume_analysis: resumeAnalysis
              });
            }
          );
        }
      );
    }
  );
});

// Update candidate status
router.put('/:id/status', authenticateToken, requireHR, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['active', 'inactive', 'blacklisted'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    'UPDATE candidates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        console.error('Error updating candidate status:', err);
        return res.status(500).json({ error: 'Failed to update candidate status' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

      res.json({ message: 'Candidate status updated successfully' });
    }
  );
});

// Get candidate statistics
router.get('/stats/overview', authenticateToken, requireManager, (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM candidates',
    'SELECT COUNT(*) as active FROM candidates WHERE status = "active"',
    'SELECT COUNT(*) as inactive FROM candidates WHERE status = "inactive"',
    'SELECT COUNT(*) as today FROM candidates WHERE DATE(created_at) = DATE("now")',
    'SELECT COUNT(*) as this_month FROM candidates WHERE DATE(created_at) >= DATE("now", "start of month")',
    'SELECT AVG(experience_years) as avg_experience FROM candidates WHERE experience_years > 0'
  ];

  const stats = {};
  let completed = 0;

  queries.forEach((query, index) => {
    db.get(query, (err, result) => {
      if (!err) {
        switch (index) {
          case 0: stats.total = result.total; break;
          case 1: stats.active = result.active; break;
          case 2: stats.inactive = result.inactive; break;
          case 3: stats.today = result.today; break;
          case 4: stats.this_month = result.this_month; break;
          case 5: stats.avg_experience = result.avg_experience || 0; break;
        }
      }
      if (++completed === queries.length) {
        res.json(stats);
      }
    });
  });
});

// Search candidates by skills or criteria
router.post('/search', authenticateToken, requireManager, (req, res) => {
  const {
    skills = [],
    experience_min = 0,
    experience_max = 50,
    location,
    education_level,
    availability
  } = req.body;

  let whereConditions = ['status = "active"'];
  let params = [];

  if (skills.length > 0) {
    const skillConditions = skills.map(() => 'skills LIKE ?');
    whereConditions.push(`(${skillConditions.join(' OR ')})`);
    skills.forEach(skill => params.push(`%${skill}%`));
  }

  if (experience_min > 0) {
    whereConditions.push('experience_years >= ?');
    params.push(experience_min);
  }

  if (experience_max < 50) {
    whereConditions.push('experience_years <= ?');
    params.push(experience_max);
  }

  if (location) {
    whereConditions.push('(city LIKE ? OR state LIKE ? OR country LIKE ?)');
    const locationTerm = `%${location}%`;
    params.push(locationTerm, locationTerm, locationTerm);
  }

  const whereClause = whereConditions.join(' AND ');

  db.all(
    `SELECT 
      id, email, first_name, last_name, phone, current_position, current_company,
      experience_years, skills, city, state, country, linkedin_url, portfolio_url
    FROM candidates
    WHERE ${whereClause}
    ORDER BY experience_years DESC
    LIMIT 50`,
    params,
    (err, candidates) => {
      if (err) {
        console.error('Error searching candidates:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Process candidates and calculate match scores
      const processedCandidates = candidates.map(candidate => {
        const candidateSkills = candidate.skills ? JSON.parse(candidate.skills) : [];
        
        // Calculate skill match score
        let skillMatchScore = 0;
        if (skills.length > 0) {
          const matchedSkills = candidateSkills.filter(candidateSkill => 
            skills.some(searchSkill => 
              candidateSkill.toLowerCase().includes(searchSkill.toLowerCase())
            )
          );
          skillMatchScore = (matchedSkills.length / skills.length) * 100;
        }

        return {
          ...candidate,
          skills: candidateSkills,
          match_score: Math.round(skillMatchScore)
        };
      });

      // Sort by match score
      processedCandidates.sort((a, b) => b.match_score - a.match_score);

      res.json({
        candidates: processedCandidates,
        search_criteria: { skills, experience_min, experience_max, location },
        total_found: processedCandidates.length
      });
    }
  );
});

module.exports = router;