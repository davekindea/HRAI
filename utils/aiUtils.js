const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const natural = require('natural');
const fs = require('fs');
const path = require('path');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const TfIdf = natural.TfIdf;

// Skill keywords database
const SKILL_KEYWORDS = {
  programming: [
    'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
    'kotlin', 'typescript', 'scala', 'perl', 'r', 'matlab', 'sql', 'html', 'css'
  ],
  frameworks: [
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 
    'laravel', 'rails', 'asp.net', 'jquery', 'bootstrap', 'tailwind'
  ],
  databases: [
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
    'cassandra', 'dynamodb', 'firebase'
  ],
  cloud: [
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'gitlab',
    'github actions', 'circleci'
  ],
  tools: [
    'git', 'jira', 'confluence', 'slack', 'figma', 'sketch', 'photoshop', 'illustrator',
    'excel', 'powerpoint', 'tableau', 'power bi'
  ],
  soft_skills: [
    'leadership', 'communication', 'teamwork', 'problem solving', 'analytical thinking',
    'project management', 'agile', 'scrum', 'mentoring', 'presentation skills'
  ]
};

// Education keywords
const EDUCATION_KEYWORDS = [
  'bachelor', 'master', 'phd', 'doctorate', 'diploma', 'certificate', 'degree',
  'university', 'college', 'school', 'education', 'graduated', 'gpa'
];

// Experience keywords
const EXPERIENCE_KEYWORDS = [
  'years', 'experience', 'worked', 'developed', 'managed', 'led', 'created',
  'implemented', 'designed', 'built', 'maintained', 'improved', 'optimized'
];

/**
 * Parse resume file and extract structured information
 */
const parseResume = async (filePath) => {
  try {
    let text = '';
    const fileExtension = path.extname(filePath).toLowerCase();

    // Extract text based on file type
    if (fileExtension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (fileExtension === '.docx' || fileExtension === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else {
      throw new Error('Unsupported file format');
    }

    // Clean and normalize text
    const cleanedText = text.replace(/\s+/g, ' ').trim().toLowerCase();
    
    // Extract structured information
    const extractedData = {
      text: cleanedText,
      skills: extractSkills(cleanedText),
      education: extractEducation(cleanedText),
      experience: extractExperience(cleanedText),
      contactInfo: extractContactInfo(cleanedText),
      certifications: extractCertifications(cleanedText),
      languages: extractLanguages(cleanedText),
      summary: generateSummary(cleanedText),
      confidence: calculateConfidence(cleanedText)
    };

    return extractedData;
  } catch (error) {
    console.error('Resume parsing error:', error);
    return {
      text: '',
      skills: [],
      education: [],
      experience: [],
      contactInfo: {},
      certifications: [],
      languages: [],
      summary: 'Failed to parse resume',
      confidence: 0
    };
  }
};

/**
 * Extract skills from resume text
 */
const extractSkills = (text) => {
  const skills = [];
  const tokens = tokenizer.tokenize(text);
  
  // Check for each skill category
  Object.values(SKILL_KEYWORDS).flat().forEach(skill => {
    const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (skillRegex.test(text)) {
      skills.push(skill);
    }
  });

  // Remove duplicates and return
  return [...new Set(skills)];
};

/**
 * Extract education information
 */
const extractEducation = (text) => {
  const education = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    EDUCATION_KEYWORDS.forEach(keyword => {
      if (line.includes(keyword)) {
        // Extract degree and institution
        const degreeMatch = line.match(/(bachelor|master|phd|doctorate|diploma|certificate|degree)\s+(?:of\s+|in\s+)?([^,\n]+)/i);
        if (degreeMatch) {
          education.push({
            degree: degreeMatch[0],
            field: degreeMatch[2] || '',
            institution: extractInstitution(line)
          });
        }
      }
    });
  });

  return education;
};

/**
 * Extract work experience
 */
const extractExperience = (text) => {
  const experience = [];
  
  // Look for year patterns (e.g., "2020-2023", "2020 - present")
  const yearPattern = /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi;
  const matches = text.match(yearPattern);
  
  if (matches) {
    matches.forEach(match => {
      const beforeMatch = text.substring(0, text.indexOf(match));
      const afterMatch = text.substring(text.indexOf(match) + match.length);
      
      // Extract job title and company (simple heuristic)
      const lines = beforeMatch.split('\n').slice(-3).concat(afterMatch.split('\n').slice(0, 3));
      
      experience.push({
        period: match,
        context: lines.join(' ').trim().substring(0, 200)
      });
    });
  }

  return experience;
};

/**
 * Extract contact information
 */
const extractContactInfo = (text) => {
  const contactInfo = {};
  
  // Email pattern
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (emailMatch) {
    contactInfo.email = emailMatch[0];
  }
  
  // Phone pattern
  const phoneMatch = text.match(/(\+?1?[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g);
  if (phoneMatch) {
    contactInfo.phone = phoneMatch[0];
  }
  
  // LinkedIn pattern
  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/gi);
  if (linkedinMatch) {
    contactInfo.linkedin = linkedinMatch[0];
  }
  
  return contactInfo;
};

/**
 * Extract certifications
 */
const extractCertifications = (text) => {
  const certifications = [];
  const certKeywords = ['certified', 'certification', 'certificate', 'aws', 'azure', 'pmp', 'cissp', 'cism'];
  
  certKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}[^.\n]*`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      certifications.push(...matches.map(match => match.trim()));
    }
  });
  
  return [...new Set(certifications)];
};

/**
 * Extract languages
 */
const extractLanguages = (text) => {
  const languages = [];
  const commonLanguages = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'arabic', 'hindi', 'portuguese'];
  
  commonLanguages.forEach(lang => {
    if (text.includes(lang)) {
      languages.push(lang);
    }
  });
  
  return languages;
};

/**
 * Extract institution name from education line
 */
const extractInstitution = (line) => {
  // Simple heuristic to extract institution name
  const words = line.split(' ');
  const institutionKeywords = ['university', 'college', 'institute', 'school'];
  
  for (let i = 0; i < words.length; i++) {
    if (institutionKeywords.some(keyword => words[i].toLowerCase().includes(keyword))) {
      // Take surrounding words as institution name
      const start = Math.max(0, i - 2);
      const end = Math.min(words.length, i + 3);
      return words.slice(start, end).join(' ');
    }
  }
  
  return '';
};

/**
 * Generate AI summary of candidate
 */
const generateSummary = (text) => {
  const sentences = text.split('.');
  const keywordsCount = {};
  
  // Count important keywords
  Object.values(SKILL_KEYWORDS).flat().forEach(skill => {
    if (text.includes(skill)) {
      keywordsCount[skill] = (keywordsCount[skill] || 0) + 1;
    }
  });
  
  // Find most relevant skills
  const topSkills = Object.entries(keywordsCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([skill]) => skill);
  
  if (topSkills.length > 0) {
    return `Candidate with expertise in ${topSkills.join(', ')}. ${sentences[0] || ''}`;
  }
  
  return 'Professional candidate with diverse skills and experience.';
};

/**
 * Calculate confidence score for parsing accuracy
 */
const calculateConfidence = (text) => {
  let score = 0;
  
  // Check for email
  if (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) score += 20;
  
  // Check for phone
  if (text.match(/(\+?1?[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/)) score += 15;
  
  // Check for skills
  const skillCount = Object.values(SKILL_KEYWORDS).flat().filter(skill => text.includes(skill)).length;
  score += Math.min(skillCount * 5, 30);
  
  // Check for education keywords
  const eduCount = EDUCATION_KEYWORDS.filter(keyword => text.includes(keyword)).length;
  score += Math.min(eduCount * 10, 20);
  
  // Check for experience keywords
  const expCount = EXPERIENCE_KEYWORDS.filter(keyword => text.includes(keyword)).length;
  score += Math.min(expCount * 3, 15);
  
  return Math.min(score, 100);
};

/**
 * Calculate AI match score between candidate and job
 */
const calculateAIMatchScore = async (resumeAnalysis, job) => {
  try {
    const jobSkills = job.skills_required ? JSON.parse(job.skills_required) : [];
    const candidateSkills = resumeAnalysis.skills || [];
    
    let skillMatchScore = 0;
    let experienceScore = 0;
    let educationScore = 0;
    let overallScore = 0;
    
    // Calculate skill match (40% weight)
    if (jobSkills.length > 0) {
      const matchedSkills = candidateSkills.filter(skill => 
        jobSkills.some(jobSkill => 
          skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
          jobSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      skillMatchScore = (matchedSkills.length / jobSkills.length) * 100;
    } else {
      skillMatchScore = 50; // Default score if no skills specified
    }
    
    // Calculate experience relevance (30% weight)
    const experienceYears = extractExperienceYears(resumeAnalysis.text);
    const requiredExperienceText = job.experience_level;
    
    switch (requiredExperienceText) {
      case 'entry':
        experienceScore = experienceYears <= 2 ? 100 : Math.max(50, 100 - (experienceYears - 2) * 10);
        break;
      case 'mid':
        experienceScore = experienceYears >= 2 && experienceYears <= 5 ? 100 : 
                         experienceYears < 2 ? 70 : Math.max(50, 100 - (experienceYears - 5) * 5);
        break;
      case 'senior':
        experienceScore = experienceYears >= 5 ? 100 : Math.max(30, experienceYears * 15);
        break;
      case 'executive':
        experienceScore = experienceYears >= 10 ? 100 : Math.max(20, experienceYears * 8);
        break;
      default:
        experienceScore = 75;
    }
    
    // Calculate education relevance (20% weight)
    const hasRelevantEducation = resumeAnalysis.education.length > 0;
    educationScore = hasRelevantEducation ? 80 : 40;
    
    // Calculate text similarity (10% weight)
    const textSimilarity = calculateTextSimilarity(resumeAnalysis.text, job.description + ' ' + job.requirements);
    
    // Weighted overall score
    overallScore = (
      skillMatchScore * 0.4 +
      experienceScore * 0.3 +
      educationScore * 0.2 +
      textSimilarity * 0.1
    );
    
    // Generate match summary
    const matchedSkills = candidateSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    const summary = generateMatchSummary({
      overallScore,
      skillMatchScore,
      experienceScore,
      educationScore,
      matchedSkills,
      totalJobSkills: jobSkills.length,
      experienceYears
    });
    
    return {
      score: Math.round(overallScore),
      summary,
      breakdown: {
        skillMatch: Math.round(skillMatchScore),
        experience: Math.round(experienceScore),
        education: Math.round(educationScore),
        textSimilarity: Math.round(textSimilarity)
      }
    };
  } catch (error) {
    console.error('AI match scoring error:', error);
    return {
      score: 0,
      summary: 'Unable to calculate match score',
      breakdown: {
        skillMatch: 0,
        experience: 0,
        education: 0,
        textSimilarity: 0
      }
    };
  }
};

/**
 * Extract years of experience from text
 */
const extractExperienceYears = (text) => {
  const yearMatches = text.match(/(\d+)\s*years?\s+(?:of\s+)?experience/gi);
  if (yearMatches) {
    const years = yearMatches.map(match => {
      const num = match.match(/\d+/);
      return num ? parseInt(num[0]) : 0;
    });
    return Math.max(...years);
  }
  
  // Look for year ranges in experience section
  const yearRanges = text.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi);
  if (yearRanges) {
    let totalYears = 0;
    yearRanges.forEach(range => {
      const [start, end] = range.split(/[-–]/);
      const startYear = parseInt(start.trim());
      const endYear = end.trim().toLowerCase().includes('present') || end.trim().toLowerCase().includes('current') 
        ? new Date().getFullYear() 
        : parseInt(end.trim());
      totalYears += (endYear - startYear);
    });
    return totalYears;
  }
  
  return 0;
};

/**
 * Calculate text similarity using TF-IDF
 */
const calculateTextSimilarity = (text1, text2) => {
  const tfidf = new TfIdf();
  tfidf.addDocument(text1);
  tfidf.addDocument(text2);
  
  // Get top terms from each document
  const terms1 = [];
  const terms2 = [];
  
  tfidf.listTerms(0).slice(0, 20).forEach(item => terms1.push(item.term));
  tfidf.listTerms(1).slice(0, 20).forEach(item => terms2.push(item.term));
  
  // Calculate Jaccard similarity
  const intersection = terms1.filter(term => terms2.includes(term));
  const union = [...new Set([...terms1, ...terms2])];
  
  return union.length > 0 ? (intersection.length / union.length) * 100 : 0;
};

/**
 * Generate match summary text
 */
const generateMatchSummary = (data) => {
  const { overallScore, skillMatchScore, matchedSkills, totalJobSkills, experienceYears } = data;
  
  let summary = '';
  
  if (overallScore >= 80) {
    summary = 'Excellent match! ';
  } else if (overallScore >= 60) {
    summary = 'Good match. ';
  } else if (overallScore >= 40) {
    summary = 'Moderate match. ';
  } else {
    summary = 'Limited match. ';
  }
  
  if (matchedSkills.length > 0) {
    summary += `Candidate has ${matchedSkills.length}/${totalJobSkills} required skills (${matchedSkills.slice(0, 3).join(', ')})${matchedSkills.length > 3 ? ' and more' : ''}. `;
  }
  
  if (experienceYears > 0) {
    summary += `${experienceYears} years of relevant experience. `;
  }
  
  return summary.trim();
};

module.exports = {
  parseResume,
  calculateAIMatchScore,
  extractSkills,
  extractExperience,
  extractEducation,
  extractContactInfo
};