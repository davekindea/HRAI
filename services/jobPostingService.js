const axios = require('axios');
const cheerio = require('cheerio');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/job-posting.log' }),
    new winston.transports.Console()
  ]
});

class JobPostingService {
  constructor() {
    this.channels = {
      indeed: {
        name: 'Indeed',
        apiUrl: 'https://api.indeed.com/ads/apisearch',
        enabled: !!process.env.INDEED_API_KEY,
        requiresAuth: true
      },
      linkedin: {
        name: 'LinkedIn',
        apiUrl: 'https://api.linkedin.com/v2/jobPostings',
        enabled: !!process.env.LINKEDIN_ACCESS_TOKEN,
        requiresAuth: true
      },
      glassdoor: {
        name: 'Glassdoor',
        apiUrl: 'https://api.glassdoor.com/api/api.htm',
        enabled: !!process.env.GLASSDOOR_PARTNER_ID,
        requiresAuth: true
      },
      ziprecruiter: {
        name: 'ZipRecruiter',
        apiUrl: 'https://api.ziprecruiter.com/jobs/v1',
        enabled: !!process.env.ZIPRECRUITER_API_KEY,
        requiresAuth: true
      },
      twitter: {
        name: 'Twitter',
        enabled: !!process.env.TWITTER_API_KEY,
        requiresAuth: true
      },
      facebook: {
        name: 'Facebook',
        enabled: !!process.env.FACEBOOK_ACCESS_TOKEN,
        requiresAuth: true
      }
    };
  }

  // Post job to multiple channels
  async postJobToChannels(jobData, selectedChannels = []) {
    const results = {};
    
    // If no channels selected, use all enabled channels
    if (selectedChannels.length === 0) {
      selectedChannels = Object.keys(this.channels).filter(
        channel => this.channels[channel].enabled
      );
    }

    for (const channel of selectedChannels) {
      try {
        logger.info(`Posting job to ${channel}`, { jobId: jobData.id, channel });
        
        const result = await this.postToChannel(channel, jobData);
        results[channel] = {
          success: true,
          data: result,
          postedAt: new Date().toISOString()
        };
        
        logger.info(`Successfully posted to ${channel}`, { 
          jobId: jobData.id, 
          channel, 
          externalId: result.externalId 
        });
      } catch (error) {
        logger.error(`Failed to post to ${channel}`, { 
          jobId: jobData.id, 
          channel, 
          error: error.message 
        });
        
        results[channel] = {
          success: false,
          error: error.message,
          attemptedAt: new Date().toISOString()
        };
      }
    }

    return results;
  }

  // Post to specific channel
  async postToChannel(channel, jobData) {
    switch (channel) {
      case 'indeed':
        return await this.postToIndeed(jobData);
      case 'linkedin':
        return await this.postToLinkedIn(jobData);
      case 'glassdoor':
        return await this.postToGlassdoor(jobData);
      case 'ziprecruiter':
        return await this.postToZipRecruiter(jobData);
      case 'twitter':
        return await this.postToTwitter(jobData);
      case 'facebook':
        return await this.postToFacebook(jobData);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  // Indeed API integration
  async postToIndeed(jobData) {
    try {
      const payload = {
        publisher: process.env.INDEED_PUBLISHER_ID,
        v: '2',
        format: 'json',
        callback: '',
        q: jobData.title,
        l: jobData.location,
        sort: 'relevance',
        radius: '25',
        st: 'jobsite',
        jt: 'fulltime',
        start: '0',
        limit: '25',
        fromage: '15',
        filter: '1',
        latlong: '1',
        co: 'us',
        chnl: '',
        userip: '1.2.3.4',
        useragent: 'Mozilla/5.0'
      };

      // Note: Indeed's API is read-only, so this is a mock implementation
      // For actual posting, you'd need to use Indeed's job posting platform
      
      const response = await axios.get(this.channels.indeed.apiUrl, {
        params: payload,
        headers: {
          'User-Agent': 'HR-Platform/1.0'
        }
      });

      return {
        externalId: `indeed_${Date.now()}`,
        url: `https://indeed.com/jobs?q=${encodeURIComponent(jobData.title)}&l=${encodeURIComponent(jobData.location)}`,
        response: response.data
      };
    } catch (error) {
      throw new Error(`Indeed posting failed: ${error.message}`);
    }
  }

  // LinkedIn API integration
  async postToLinkedIn(jobData) {
    try {
      const payload = {
        jobPosting: {
          companyPage: process.env.LINKEDIN_COMPANY_PAGE,
          title: jobData.title,
          description: jobData.description,
          location: {
            countryCode: 'US',
            city: jobData.location
          },
          jobFunction: {
            code: this.mapJobFunction(jobData.category)
          },
          seniority: {
            code: this.mapSeniorityLevel(jobData.level)
          },
          employmentType: {
            code: this.mapEmploymentType(jobData.type)
          },
          jobPostingOperationType: 'CREATE'
        }
      };

      const response = await axios.post(
        this.channels.linkedin.apiUrl,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return {
        externalId: response.data.id,
        url: `https://linkedin.com/jobs/view/${response.data.id}`,
        response: response.data
      };
    } catch (error) {
      throw new Error(`LinkedIn posting failed: ${error.message}`);
    }
  }

  // Glassdoor API integration
  async postToGlassdoor(jobData) {
    try {
      const payload = {
        't.p': process.env.GLASSDOOR_PARTNER_ID,
        't.k': process.env.GLASSDOOR_API_KEY,
        'userip': '0.0.0.0',
        'useragent': 'HR-Platform',
        'format': 'json',
        'v': '1',
        'action': 'jobs-prog',
        'jobTitle': jobData.title,
        'jobLocation': jobData.location,
        'jobDescription': jobData.description,
        'jobCompany': jobData.company
      };

      const response = await axios.get(this.channels.glassdoor.apiUrl, {
        params: payload
      });

      return {
        externalId: `glassdoor_${Date.now()}`,
        url: `https://glassdoor.com/Jobs/${jobData.title}-jobs-SRCH_KO0,${jobData.title.length}.htm`,
        response: response.data
      };
    } catch (error) {
      throw new Error(`Glassdoor posting failed: ${error.message}`);
    }
  }

  // ZipRecruiter API integration
  async postToZipRecruiter(jobData) {
    try {
      const payload = {
        api_key: process.env.ZIPRECRUITER_API_KEY,
        job_title: jobData.title,
        job_description: jobData.description,
        job_location: jobData.location,
        job_company: jobData.company,
        job_type: jobData.type || 'Full-Time',
        job_category: jobData.category,
        salary_min: jobData.salaryMin,
        salary_max: jobData.salaryMax
      };

      const response = await axios.post(
        this.channels.ziprecruiter.apiUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        externalId: response.data.job_id,
        url: response.data.job_url,
        response: response.data
      };
    } catch (error) {
      throw new Error(`ZipRecruiter posting failed: ${error.message}`);
    }
  }

  // Twitter posting
  async postToTwitter(jobData) {
    try {
      const tweetText = this.formatTweet(jobData);
      
      // Note: This would use Twitter API v2
      const payload = {
        text: tweetText
      };

      const response = await axios.post(
        'https://api.twitter.com/2/tweets',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        externalId: response.data.data.id,
        url: `https://twitter.com/user/status/${response.data.data.id}`,
        response: response.data
      };
    } catch (error) {
      throw new Error(`Twitter posting failed: ${error.message}`);
    }
  }

  // Facebook posting
  async postToFacebook(jobData) {
    try {
      const payload = {
        message: this.formatFacebookPost(jobData),
        access_token: process.env.FACEBOOK_ACCESS_TOKEN
      };

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PAGE_ID}/feed`,
        payload
      );

      return {
        externalId: response.data.id,
        url: `https://facebook.com/${response.data.id}`,
        response: response.data
      };
    } catch (error) {
      throw new Error(`Facebook posting failed: ${error.message}`);
    }
  }

  // Format tweet for Twitter
  formatTweet(jobData) {
    const maxLength = 280;
    let tweet = `🚀 We're hiring! ${jobData.title} at ${jobData.company}\n`;
    tweet += `📍 ${jobData.location}\n`;
    
    if (jobData.salary) {
      tweet += `💰 ${jobData.salary}\n`;
    }
    
    tweet += `Apply now: ${process.env.APP_URL}/jobs/${jobData.id}\n`;
    tweet += `#hiring #jobs #${jobData.category.replace(/\s+/g, '')}`;

    // Truncate if too long
    if (tweet.length > maxLength) {
      const truncateLength = maxLength - 3; // for "..."
      tweet = tweet.substring(0, truncateLength) + '...';
    }

    return tweet;
  }

  // Format Facebook post
  formatFacebookPost(jobData) {
    let post = `🎯 Job Opportunity Alert!\n\n`;
    post += `Position: ${jobData.title}\n`;
    post += `Company: ${jobData.company}\n`;
    post += `Location: ${jobData.location}\n`;
    
    if (jobData.salary) {
      post += `Salary: ${jobData.salary}\n`;
    }
    
    post += `\n${jobData.description.substring(0, 300)}...\n\n`;
    post += `Ready to take the next step in your career? Apply now!\n`;
    post += `${process.env.APP_URL}/jobs/${jobData.id}\n\n`;
    post += `#Hiring #JobOpportunity #${jobData.category.replace(/\s+/g, '')} #Careers`;

    return post;
  }

  // Mapping functions for LinkedIn
  mapJobFunction(category) {
    const mapping = {
      'Engineering': 'ENG',
      'Sales': 'SA',
      'Marketing': 'MKT',
      'Human Resources': 'HR',
      'Finance': 'FIN',
      'Operations': 'OP',
      'Information Technology': 'IT',
      'Design': 'DES'
    };
    return mapping[category] || 'OTH';
  }

  mapSeniorityLevel(level) {
    const mapping = {
      'Entry Level': '1',
      'Associate': '2',
      'Mid-Senior Level': '3',
      'Director': '4',
      'Executive': '5'
    };
    return mapping[level] || '2';
  }

  mapEmploymentType(type) {
    const mapping = {
      'Full-time': 'F',
      'Part-time': 'P',
      'Contract': 'C',
      'Temporary': 'T',
      'Volunteer': 'V',
      'Internship': 'I'
    };
    return mapping[type] || 'F';
  }

  // Get posting analytics
  async getPostingAnalytics(jobId, timeframe = 30) {
    try {
      // This would fetch analytics from various job boards
      const analytics = {
        totalViews: 0,
        totalApplies: 0,
        channelBreakdown: {},
        performanceMetrics: {
          viewToApplyRate: 0,
          averageTimeOnPage: 0,
          topSources: []
        }
      };

      // Fetch data from each channel
      for (const [channel, config] of Object.entries(this.channels)) {
        if (config.enabled) {
          try {
            const channelAnalytics = await this.getChannelAnalytics(channel, jobId, timeframe);
            analytics.channelBreakdown[channel] = channelAnalytics;
            analytics.totalViews += channelAnalytics.views || 0;
            analytics.totalApplies += channelAnalytics.applies || 0;
          } catch (error) {
            logger.error(`Failed to get analytics for ${channel}`, { error: error.message });
          }
        }
      }

      // Calculate performance metrics
      if (analytics.totalViews > 0) {
        analytics.performanceMetrics.viewToApplyRate = 
          (analytics.totalApplies / analytics.totalViews * 100).toFixed(2);
      }

      return analytics;
    } catch (error) {
      logger.error('Failed to get posting analytics', { error: error.message });
      throw error;
    }
  }

  // Get analytics from specific channel
  async getChannelAnalytics(channel, jobId, timeframe) {
    // Mock analytics data - in real implementation, this would call each platform's analytics API
    const mockData = {
      views: Math.floor(Math.random() * 1000) + 100,
      applies: Math.floor(Math.random() * 50) + 5,
      clicks: Math.floor(Math.random() * 200) + 20,
      saves: Math.floor(Math.random() * 30) + 3
    };

    return mockData;
  }

  // Get available channels
  getAvailableChannels() {
    return Object.keys(this.channels)
      .filter(channel => this.channels[channel].enabled)
      .map(channel => ({
        id: channel,
        name: this.channels[channel].name,
        enabled: this.channels[channel].enabled,
        requiresAuth: this.channels[channel].requiresAuth
      }));
  }

  // Update job posting across channels
  async updateJobAcrossChannels(jobId, updatedData, channels = []) {
    const results = {};
    
    for (const channel of channels) {
      try {
        const result = await this.updateJobOnChannel(channel, jobId, updatedData);
        results[channel] = {
          success: true,
          data: result,
          updatedAt: new Date().toISOString()
        };
      } catch (error) {
        results[channel] = {
          success: false,
          error: error.message,
          attemptedAt: new Date().toISOString()
        };
      }
    }

    return results;
  }

  // Update job on specific channel
  async updateJobOnChannel(channel, jobId, updatedData) {
    // Implementation would depend on each platform's update API
    logger.info(`Updating job on ${channel}`, { jobId, channel });
    return { updated: true, channel, jobId };
  }

  // Remove job from channels
  async removeJobFromChannels(jobId, channels = []) {
    const results = {};
    
    for (const channel of channels) {
      try {
        const result = await this.removeJobFromChannel(channel, jobId);
        results[channel] = {
          success: true,
          data: result,
          removedAt: new Date().toISOString()
        };
      } catch (error) {
        results[channel] = {
          success: false,
          error: error.message,
          attemptedAt: new Date().toISOString()
        };
      }
    }

    return results;
  }

  // Remove job from specific channel
  async removeJobFromChannel(channel, jobId) {
    // Implementation would depend on each platform's deletion API
    logger.info(`Removing job from ${channel}`, { jobId, channel });
    return { removed: true, channel, jobId };
  }
}

module.exports = new JobPostingService();
