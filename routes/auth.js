const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId, userType, role = null) => {
  return jwt.sign(
    { userId, userType, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// HR Staff Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, userType = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const table = userType === 'candidate' ? 'candidates' : 'users';
    const activeCondition = userType === 'candidate' ? '' : 'AND is_active = 1';
    
    db.get(
      `SELECT * FROM ${table} WHERE email = ? ${activeCondition}`,
      [email.toLowerCase()],
      async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user.id, userType, user.role);
        
        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role || 'candidate',
            userType,
            department: user.department
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Candidate Registration
router.post('/register/candidate', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      linkedin,
      portfolio
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO candidates (
        email, password, first_name, last_name, phone, linkedin_url, portfolio_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        email.toLowerCase(),
        hashedPassword,
        firstName,
        lastName,
        phone || null,
        linkedin || null,
        portfolio || null
      ],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email already exists' });
          }
          console.error('Registration error:', err);
          return res.status(500).json({ error: 'Registration failed' });
        }

        const token = generateToken(this.lastID, 'candidate');
        
        res.status(201).json({
          message: 'Registration successful',
          token,
          user: {
            id: this.lastID,
            email,
            firstName,
            lastName,
            userType: 'candidate'
          }
        });
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// HR Staff Registration (Admin only)
router.post('/register/staff', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can register staff members' });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      department,
      phone
    } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const validRoles = ['hr_manager', 'recruiter', 'hiring_manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO users (
        email, password, first_name, last_name, role, department, phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        email.toLowerCase(),
        hashedPassword,
        firstName,
        lastName,
        role,
        department || null,
        phone || null
      ],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email already exists' });
          }
          console.error('Staff registration error:', err);
          return res.status(500).json({ error: 'Registration failed' });
        }

        res.status(201).json({
          message: 'Staff member registered successfully',
          user: {
            id: this.lastID,
            email,
            firstName,
            lastName,
            role,
            department
          }
        });
      }
    );
  } catch (error) {
    console.error('Staff registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  const table = req.user.userType === 'candidate' ? 'candidates' : 'users';
  
  db.get(
    `SELECT * FROM ${table} WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error('Profile fetch error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove password from response
      delete user.password;
      
      res.json({ user });
    }
  );
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const table = req.user.userType === 'candidate' ? 'candidates' : 'users';
    const allowedFields = req.user.userType === 'candidate' 
      ? ['first_name', 'last_name', 'phone', 'linkedin_url', 'portfolio_url', 'current_position', 'current_company']
      : ['first_name', 'last_name', 'phone', 'department'];
    
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key) && req.body[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(req.body[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(req.user.id);
    
    db.run(
      `UPDATE ${table} SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues,
      function(err) {
        if (err) {
          console.error('Profile update error:', err);
          return res.status(500).json({ error: 'Update failed' });
        }
        
        res.json({ message: 'Profile updated successfully' });
      }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

module.exports = router;