const uuid = require('uuid');
const moment = require('moment');
const notificationService = require('./notificationService');

class AssessmentService {
  constructor() {
    // Assessment types
    this.assessmentTypes = {
      technical: {
        name: 'Technical Assessment',
        description: 'Evaluate technical skills and knowledge',
        timeLimit: 120, // minutes
        categories: ['programming', 'system_design', 'algorithms', 'databases']
      },
      cognitive: {
        name: 'Cognitive Assessment',
        description: 'Assess logical reasoning and problem-solving abilities',
        timeLimit: 60,
        categories: ['logical_reasoning', 'numerical_reasoning', 'verbal_reasoning']
      },
      personality: {
        name: 'Personality Assessment',
        description: 'Evaluate personality traits and cultural fit',
        timeLimit: 30,
        categories: ['big_five', 'work_style', 'team_dynamics']
      },
      skills: {
        name: 'Skills Assessment',
        description: 'Test specific job-related skills',
        timeLimit: 90,
        categories: ['communication', 'leadership', 'project_management', 'domain_specific']
      },
      video: {
        name: 'Video Assessment',
        description: 'Record video responses to behavioral questions',
        timeLimit: 45,
        categories: ['behavioral', 'situational', 'presentation']
      }
    };

    // Question banks
    this.questionBanks = this.initializeQuestionBanks();
  }

  // Create a new assessment
  async createAssessment(assessmentData) {
    try {
      const {
        title,
        description,
        type,
        jobId,
        timeLimit,
        passingScore = 70,
        questions = [],
        isActive = true,
        createdBy
      } = assessmentData;

      const assessment = {
        id: uuid.v4(),
        title,
        description,
        type,
        jobId,
        timeLimit: timeLimit || this.assessmentTypes[type]?.timeLimit || 60,
        passingScore,
        questions: questions.length > 0 ? questions : this.generateQuestions(type, 10),
        isActive,
        createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalQuestions: 0,
        completions: 0,
        averageScore: 0
      };

      assessment.totalQuestions = assessment.questions.length;

      return assessment;
    } catch (error) {
      console.error('Failed to create assessment:', error);
      throw error;
    }
  }

  // Generate questions based on assessment type
  generateQuestions(type, count) {
    const bank = this.questionBanks[type] || this.questionBanks.general;
    const questions = [];
    
    // Randomly select questions from the bank
    const shuffled = [...bank].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      questions.push({
        id: uuid.v4(),
        ...shuffled[i],
        order: i + 1
      });
    }

    return questions;
  }

  // Assign assessment to candidate
  async assignAssessment(assessmentId, candidateId, dueDate = null) {
    try {
      const assignment = {
        id: uuid.v4(),
        assessmentId,
        candidateId,
        status: 'assigned',
        assignedAt: new Date().toISOString(),
        dueDate: dueDate || moment().add(7, 'days').toISOString(),
        startedAt: null,
        completedAt: null,
        score: null,
        answers: [],
        timeSpent: 0,
        attempts: 0,
        maxAttempts: 1
      };

      // Send notification to candidate
      await this.sendAssessmentInvitation(assignment);

      return assignment;
    } catch (error) {
      console.error('Failed to assign assessment:', error);
      throw error;
    }
  }

  // Start assessment for candidate
  async startAssessment(assignmentId, candidateId) {
    try {
      const assignment = await this.getAssignmentById(assignmentId);
      
      if (assignment.candidateId !== candidateId) {
        throw new Error('Unauthorized access to assessment');
      }
      
      if (assignment.status === 'completed') {
        throw new Error('Assessment already completed');
      }
      
      if (assignment.attempts >= assignment.maxAttempts) {
        throw new Error('Maximum attempts reached');
      }

      // Check if due date has passed
      if (moment(assignment.dueDate).isBefore(moment())) {
        throw new Error('Assessment due date has passed');
      }

      // Update assignment
      assignment.status = 'in_progress';
      assignment.startedAt = new Date().toISOString();
      assignment.attempts += 1;

      // Get assessment questions (without correct answers for security)
      const assessment = await this.getAssessmentById(assignment.assessmentId);
      const secureQuestions = assessment.questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options,
        order: q.order,
        timeLimit: q.timeLimit,
        instructions: q.instructions
      }));

      return {
        assignment,
        questions: secureQuestions,
        timeLimit: assessment.timeLimit
      };
    } catch (error) {
      console.error('Failed to start assessment:', error);
      throw error;
    }
  }

  // Submit assessment answer
  async submitAnswer(assignmentId, questionId, answer) {
    try {
      const assignment = await this.getAssignmentById(assignmentId);
      
      if (assignment.status !== 'in_progress') {
        throw new Error('Assessment is not in progress');
      }

      // Check if time limit exceeded
      const timeElapsed = moment().diff(moment(assignment.startedAt), 'minutes');
      const assessment = await this.getAssessmentById(assignment.assessmentId);
      
      if (timeElapsed > assessment.timeLimit) {
        // Auto-submit assessment
        return await this.submitAssessment(assignmentId);
      }

      // Save answer
      const answerRecord = {
        questionId,
        answer,
        submittedAt: new Date().toISOString(),
        timeSpent: 0 // You could track time per question
      };

      // Update or add answer
      const existingAnswerIndex = assignment.answers.findIndex(a => a.questionId === questionId);
      if (existingAnswerIndex >= 0) {
        assignment.answers[existingAnswerIndex] = answerRecord;
      } else {
        assignment.answers.push(answerRecord);
      }

      return { success: true, totalAnswered: assignment.answers.length };
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw error;
    }
  }

  // Submit complete assessment
  async submitAssessment(assignmentId) {
    try {
      const assignment = await this.getAssignmentById(assignmentId);
      const assessment = await this.getAssessmentById(assignment.assessmentId);

      // Calculate score
      const score = await this.calculateScore(assignment, assessment);
      
      // Update assignment
      assignment.status = 'completed';
      assignment.completedAt = new Date().toISOString();
      assignment.score = score;
      assignment.timeSpent = moment(assignment.completedAt).diff(
        moment(assignment.startedAt), 'minutes'
      );

      // Generate detailed results
      const results = await this.generateAssessmentResults(assignment, assessment);

      // Send completion notification
      await this.sendAssessmentCompletion(assignment, results);

      return {
        assignment,
        results,
        passed: score >= assessment.passingScore
      };
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      throw error;
    }
  }

  // Calculate assessment score
  async calculateScore(assignment, assessment) {
    let totalScore = 0;
    let maxScore = 0;

    for (const question of assessment.questions) {
      maxScore += question.points || 1;
      
      const answer = assignment.answers.find(a => a.questionId === question.id);
      if (answer) {
        const points = this.scoreQuestion(question, answer.answer);
        totalScore += points;
      }
    }

    return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  }

  // Score individual question
  scoreQuestion(question, answer) {
    const points = question.points || 1;
    
    switch (question.type) {
      case 'multiple_choice':
      case 'single_choice':
        return answer === question.correctAnswer ? points : 0;
      
      case 'multiple_select':
        const correctAnswers = question.correctAnswers || [];
        const selectedAnswers = Array.isArray(answer) ? answer : [answer];
        const correctCount = selectedAnswers.filter(a => correctAnswers.includes(a)).length;
        const incorrectCount = selectedAnswers.filter(a => !correctAnswers.includes(a)).length;
        const partialScore = Math.max(0, correctCount - incorrectCount);
        return Math.min(points, (partialScore / correctAnswers.length) * points);
      
      case 'text':
      case 'essay':
        // These would typically require manual grading or AI scoring
        return this.scoreTextAnswer(question, answer);
      
      case 'coding':
        return this.scoreCodingAnswer(question, answer);
      
      default:
        return 0;
    }
  }

  // Score text/essay answers (simplified AI scoring)
  scoreTextAnswer(question, answer) {
    if (!answer || answer.trim().length === 0) return 0;
    
    // Simple keyword-based scoring
    const keywords = question.keywords || [];
    const answerLower = answer.toLowerCase();
    const keywordCount = keywords.filter(keyword => 
      answerLower.includes(keyword.toLowerCase())
    ).length;
    
    const keywordScore = keywords.length > 0 ? keywordCount / keywords.length : 0.5;
    const lengthScore = Math.min(1, answer.length / (question.minLength || 100));
    
    return Math.round((keywordScore * 0.7 + lengthScore * 0.3) * (question.points || 1));
  }

  // Score coding answers (simplified)
  scoreCodingAnswer(question, answer) {
    if (!answer || answer.trim().length === 0) return 0;
    
    // In a real implementation, this would run test cases
    // For now, just check if answer contains expected elements
    const expectedElements = question.expectedElements || [];
    const answerLower = answer.toLowerCase();
    const elementCount = expectedElements.filter(element => 
      answerLower.includes(element.toLowerCase())
    ).length;
    
    return expectedElements.length > 0 
      ? Math.round((elementCount / expectedElements.length) * (question.points || 1))
      : Math.round((question.points || 1) * 0.5);
  }

  // Generate detailed assessment results
  async generateAssessmentResults(assignment, assessment) {
    const results = {
      overallScore: assignment.score,
      passed: assignment.score >= assessment.passingScore,
      timeSpent: assignment.timeSpent,
      completedAt: assignment.completedAt,
      categoryBreakdown: {},
      questionResults: [],
      recommendations: []
    };

    // Calculate category scores
    const categories = {};
    
    for (const question of assessment.questions) {
      const category = question.category || 'general';
      if (!categories[category]) {
        categories[category] = { total: 0, scored: 0, count: 0 };
      }
      
      categories[category].total += question.points || 1;
      categories[category].count += 1;
      
      const answer = assignment.answers.find(a => a.questionId === question.id);
      if (answer) {
        const score = this.scoreQuestion(question, answer.answer);
        categories[category].scored += score;
        
        results.questionResults.push({
          questionId: question.id,
          question: question.question,
          category: category,
          userAnswer: answer.answer,
          correctAnswer: question.correctAnswer,
          score: score,
          maxScore: question.points || 1,
          feedback: this.generateQuestionFeedback(question, answer.answer, score)
        });
      }
    }

    // Calculate percentage for each category
    for (const [category, data] of Object.entries(categories)) {
      results.categoryBreakdown[category] = {
        score: data.total > 0 ? Math.round((data.scored / data.total) * 100) : 0,
        questionsAnswered: data.count,
        totalQuestions: assessment.questions.filter(q => 
          (q.category || 'general') === category
        ).length
      };
    }

    // Generate recommendations
    results.recommendations = this.generateRecommendations(results);

    return results;
  }

  // Generate question-specific feedback
  generateQuestionFeedback(question, answer, score) {
    const maxScore = question.points || 1;
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    if (percentage >= 100) {
      return question.correctFeedback || 'Excellent! You got this question completely correct.';
    } else if (percentage >= 50) {
      return question.partialFeedback || 'Good effort! You partially answered this question correctly.';
    } else {
      return question.incorrectFeedback || 'This answer needs improvement. Please review the concepts.';
    }
  }

  // Generate recommendations based on results
  generateRecommendations(results) {
    const recommendations = [];
    
    // Overall performance recommendations
    if (results.overallScore >= 90) {
      recommendations.push('Outstanding performance! You demonstrate excellent knowledge and skills.');
    } else if (results.overallScore >= 70) {
      recommendations.push('Good performance overall with some areas for improvement.');
    } else {
      recommendations.push('Consider additional training or experience in key areas before reapplying.');
    }

    // Category-specific recommendations
    for (const [category, data] of Object.entries(results.categoryBreakdown)) {
      if (data.score < 60) {
        recommendations.push(`Focus on improving skills in ${category.replace('_', ' ')}.`);
      } else if (data.score >= 90) {
        recommendations.push(`Strong performance in ${category.replace('_', ' ')}.`);
      }
    }

    // Time management feedback
    if (results.timeSpent < 30) {
      recommendations.push('Consider taking more time to thoroughly answer questions.');
    }

    return recommendations;
  }

  // Send assessment invitation
  async sendAssessmentInvitation(assignment) {
    try {
      const candidate = await this.getCandidateById(assignment.candidateId);
      const assessment = await this.getAssessmentById(assignment.assessmentId);
      
      const emailData = {
        candidateName: candidate.name,
        assessmentTitle: assessment.title,
        assessmentDescription: assessment.description,
        timeLimit: assessment.timeLimit,
        dueDate: moment(assignment.dueDate).format('MMMM DD, YYYY'),
        assessmentLink: `${process.env.APP_URL}/assessments/${assignment.id}/start`
      };

      await notificationService.sendEmail({
        to: candidate.email,
        subject: `Assessment Invitation: ${assessment.title}`,
        template: 'assessment_invitation',
        data: emailData
      });
    } catch (error) {
      console.error('Failed to send assessment invitation:', error);
    }
  }

  // Send assessment completion notification
  async sendAssessmentCompletion(assignment, results) {
    try {
      const candidate = await this.getCandidateById(assignment.candidateId);
      const assessment = await this.getAssessmentById(assignment.assessmentId);
      
      const emailData = {
        candidateName: candidate.name,
        assessmentTitle: assessment.title,
        score: assignment.score,
        passed: results.passed,
        timeSpent: assignment.timeSpent,
        recommendations: results.recommendations.slice(0, 3) // Top 3 recommendations
      };

      await notificationService.sendEmail({
        to: candidate.email,
        subject: `Assessment Results: ${assessment.title}`,
        template: 'assessment_results',
        data: emailData
      });
    } catch (error) {
      console.error('Failed to send assessment completion notification:', error);
    }
  }

  // Get assessment analytics
  async getAssessmentAnalytics(assessmentId) {
    try {
      // This would typically query the database for all assignments
      const assignments = await this.getAssignmentsByAssessmentId(assessmentId);
      
      const analytics = {
        totalAssigned: assignments.length,
        totalCompleted: assignments.filter(a => a.status === 'completed').length,
        totalInProgress: assignments.filter(a => a.status === 'in_progress').length,
        averageScore: 0,
        passRate: 0,
        averageTimeSpent: 0,
        scoreDistribution: {},
        categoryPerformance: {}
      };

      const completedAssignments = assignments.filter(a => a.status === 'completed');
      
      if (completedAssignments.length > 0) {
        // Calculate averages
        const totalScore = completedAssignments.reduce((sum, a) => sum + (a.score || 0), 0);
        const totalTime = completedAssignments.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
        const passedCount = completedAssignments.filter(a => a.score >= 70).length;
        
        analytics.averageScore = Math.round(totalScore / completedAssignments.length);
        analytics.passRate = Math.round((passedCount / completedAssignments.length) * 100);
        analytics.averageTimeSpent = Math.round(totalTime / completedAssignments.length);
        
        // Score distribution
        const scoreRanges = ['0-20', '21-40', '41-60', '61-80', '81-100'];
        scoreRanges.forEach(range => {
          analytics.scoreDistribution[range] = 0;
        });
        
        completedAssignments.forEach(assignment => {
          const score = assignment.score || 0;
          if (score <= 20) analytics.scoreDistribution['0-20']++;
          else if (score <= 40) analytics.scoreDistribution['21-40']++;
          else if (score <= 60) analytics.scoreDistribution['41-60']++;
          else if (score <= 80) analytics.scoreDistribution['61-80']++;
          else analytics.scoreDistribution['81-100']++;
        });
      }

      return analytics;
    } catch (error) {
      console.error('Failed to get assessment analytics:', error);
      throw error;
    }
  }

  // Initialize question banks
  initializeQuestionBanks() {
    return {
      technical: [
        {
          type: 'multiple_choice',
          question: 'What is the time complexity of a binary search algorithm?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
          correctAnswer: 'O(log n)',
          category: 'algorithms',
          points: 2,
          correctFeedback: 'Correct! Binary search has O(log n) time complexity.',
          incorrectFeedback: 'Binary search divides the search space in half each iteration.'
        },
        {
          type: 'coding',
          question: 'Write a function to reverse a string in Python.',
          category: 'programming',
          points: 5,
          expectedElements: ['def', 'return', '[::-1]'],
          correctAnswer: 'def reverse_string(s):\n    return s[::-1]'
        }
      ],
      cognitive: [
        {
          type: 'multiple_choice',
          question: 'If all Bloops are Razzles and all Razzles are Lazzles, then all Bloops are definitely Lazzles.',
          options: ['True', 'False', 'Cannot be determined'],
          correctAnswer: 'True',
          category: 'logical_reasoning',
          points: 1
        }
      ],
      personality: [
        {
          type: 'single_choice',
          question: 'In a team setting, I prefer to:',
          options: [
            'Take the lead and direct others',
            'Collaborate equally with everyone',
            'Support others and follow their lead',
            'Work independently when possible'
          ],
          category: 'work_style',
          points: 1
        }
      ],
      skills: [
        {
          type: 'essay',
          question: 'Describe a time when you had to resolve a conflict in your team. What was your approach?',
          category: 'leadership',
          points: 3,
          minLength: 200,
          keywords: ['conflict', 'resolution', 'communication', 'team', 'solution']
        }
      ],
      general: [
        {
          type: 'multiple_choice',
          question: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 'Paris',
          category: 'general',
          points: 1
        }
      ]
    };
  }

  // Utility methods (these would typically interact with database)
  async getAssessmentById(assessmentId) {
    // Mock data - in real implementation, fetch from database
    return {
      id: assessmentId,
      title: 'Technical Assessment',
      description: 'Evaluate technical skills',
      type: 'technical',
      timeLimit: 120,
      passingScore: 70,
      questions: this.questionBanks.technical
    };
  }

  async getAssignmentById(assignmentId) {
    // Mock data - in real implementation, fetch from database
    return {
      id: assignmentId,
      assessmentId: 'assessment-1',
      candidateId: 'candidate-1',
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      dueDate: moment().add(7, 'days').toISOString(),
      answers: [],
      attempts: 0,
      maxAttempts: 1
    };
  }

  async getCandidateById(candidateId) {
    // Mock data - in real implementation, fetch from database
    return {
      id: candidateId,
      name: 'John Doe',
      email: 'john.doe@email.com'
    };
  }

  async getAssignmentsByAssessmentId(assessmentId) {
    // Mock data - in real implementation, fetch from database
    return [];
  }
}

module.exports = new AssessmentService();
