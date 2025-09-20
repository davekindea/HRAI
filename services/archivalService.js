const archiver = require('archiver');
const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');
const winston = require('winston');
const cron = require('node-cron');

// Configure archival logger
const archivalLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/archival.log' }),
    new winston.transports.Console()
  ]
});

class DataArchivalService {
  constructor() {
    this.archiveDirectory = path.join(__dirname, '../archives');
    this.tempDirectory = path.join(__dirname, '../tmp/archival');
    
    // Archival policies
    this.archivalPolicies = {
      candidates: {
        activeRetention: 365, // days - keep active for 1 year
        archiveRetention: 2555, // days - keep archived for 7 years (legal requirement)
        deleteAfter: 2920, // days - delete after 8 years
        criteria: ['application_date', 'last_activity_date']
      },
      applications: {
        activeRetention: 1095, // days - keep active for 3 years
        archiveRetention: 2555, // days - keep archived for 7 years
        deleteAfter: 2920, // days - delete after 8 years
        criteria: ['application_date', 'status_updated_date']
      },
      interviews: {
        activeRetention: 730, // days - keep active for 2 years
        archiveRetention: 1825, // days - keep archived for 5 years
        deleteAfter: 2190, // days - delete after 6 years
        criteria: ['interview_date', 'completed_date']
      },
      assessments: {
        activeRetention: 1095, // days - keep active for 3 years
        archiveRetention: 2555, // days - keep archived for 7 years
        deleteAfter: 2920, // days - delete after 8 years
        criteria: ['completion_date', 'assigned_date']
      },
      communications: {
        activeRetention: 365, // days - keep active for 1 year
        archiveRetention: 1825, // days - keep archived for 5 years
        deleteAfter: 2190, // days - delete after 6 years
        criteria: ['sent_date', 'last_reply_date']
      },
      documents: {
        activeRetention: 1095, // days - keep active for 3 years
        archiveRetention: 2555, // days - keep archived for 7 years
        deleteAfter: 2920, // days - delete after 8 years
        criteria: ['upload_date', 'last_accessed_date']
      }
    };

    // Initialize directories and schedule tasks
    this.initialize();
  }

  async initialize() {
    try {
      await this.ensureDirectories();
      this.scheduleArchivalTasks();
      archivalLogger.info('Data archival service initialized successfully');
    } catch (error) {
      archivalLogger.error('Failed to initialize archival service', { error: error.message });
    }
  }

  async ensureDirectories() {
    const directories = [this.archiveDirectory, this.tempDirectory];
    
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        archivalLogger.error(`Failed to create directory: ${dir}`, { error: error.message });
      }
    }
  }

  // Schedule automated archival tasks
  scheduleArchivalTasks() {
    // Daily archival check at 2 AM
    cron.schedule('0 2 * * *', async () => {
      archivalLogger.info('Starting scheduled daily archival process');
      await this.performDailyArchival();
    });

    // Weekly deep archival on Sundays at 1 AM
    cron.schedule('0 1 * * 0', async () => {
      archivalLogger.info('Starting scheduled weekly deep archival process');
      await this.performWeeklyArchival();
    });

    // Monthly cleanup on the 1st at midnight
    cron.schedule('0 0 1 * *', async () => {
      archivalLogger.info('Starting scheduled monthly cleanup process');
      await this.performMonthlyCleanup();
    });
  }

  // Main archival orchestrator
  async performDataArchival(dataType = null, options = {}) {
    try {
      archivalLogger.info('Starting data archival process', { dataType, options });

      const archivalReport = {
        startTime: new Date().toISOString(),
        dataTypes: [],
        totalRecordsProcessed: 0,
        totalRecordsArchived: 0,
        totalRecordsDeleted: 0,
        errors: [],
        warnings: []
      };

      const dataTypesToProcess = dataType ? [dataType] : Object.keys(this.archivalPolicies);

      for (const type of dataTypesToProcess) {
        try {
          const result = await this.archiveDataType(type, options);
          archivalReport.dataTypes.push(result);
          archivalReport.totalRecordsProcessed += result.recordsProcessed;
          archivalReport.totalRecordsArchived += result.recordsArchived;
          archivalReport.totalRecordsDeleted += result.recordsDeleted;
        } catch (error) {
          archivalReport.errors.push({
            dataType: type,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      archivalReport.endTime = new Date().toISOString();
      archivalReport.duration = moment(archivalReport.endTime).diff(moment(archivalReport.startTime), 'seconds');

      // Generate archival report
      await this.generateArchivalReport(archivalReport);

      archivalLogger.info('Data archival process completed', {
        duration: archivalReport.duration,
        recordsArchived: archivalReport.totalRecordsArchived,
        recordsDeleted: archivalReport.totalRecordsDeleted
      });

      return archivalReport;
    } catch (error) {
      archivalLogger.error('Data archival process failed', { error: error.message });
      throw error;
    }
  }

  // Archive specific data type
  async archiveDataType(dataType, options = {}) {
    const policy = this.archivalPolicies[dataType];
    if (!policy) {
      throw new Error(`No archival policy defined for data type: ${dataType}`);
    }

    archivalLogger.info(`Processing archival for data type: ${dataType}`);

    const result = {
      dataType,
      recordsProcessed: 0,
      recordsArchived: 0,
      recordsDeleted: 0,
      archiveFiles: [],
      errors: []
    };

    try {
      // Get records eligible for archival
      const recordsToArchive = await this.getRecordsForArchival(dataType, policy, 'archive');
      const recordsToDelete = await this.getRecordsForArchival(dataType, policy, 'delete');

      result.recordsProcessed = recordsToArchive.length + recordsToDelete.length;

      // Archive eligible records
      if (recordsToArchive.length > 0) {
        const archiveResult = await this.createArchive(dataType, recordsToArchive, options);
        result.recordsArchived = archiveResult.recordCount;
        result.archiveFiles = archiveResult.files;

        // Move records to archived status
        await this.markRecordsAsArchived(dataType, recordsToArchive);
      }

      // Delete expired records
      if (recordsToDelete.length > 0 && !options.skipDeletion) {
        await this.deleteExpiredRecords(dataType, recordsToDelete);
        result.recordsDeleted = recordsToDelete.length;
      }

      archivalLogger.info(`Completed archival for ${dataType}`, {
        archived: result.recordsArchived,
        deleted: result.recordsDeleted
      });

      return result;
    } catch (error) {
      archivalLogger.error(`Failed to archive ${dataType}`, { error: error.message });
      result.errors.push(error.message);
      return result;
    }
  }

  // Get records eligible for archival or deletion
  async getRecordsForArchival(dataType, policy, action) {
    const cutoffDate = action === 'archive' 
      ? moment().subtract(policy.activeRetention, 'days')
      : moment().subtract(policy.deleteAfter, 'days');

    // Mock implementation - in production, this would query the database
    const mockRecords = this.generateMockRecords(dataType, cutoffDate, action);
    
    archivalLogger.info(`Found ${mockRecords.length} ${dataType} records eligible for ${action}`, {
      cutoffDate: cutoffDate.toISOString(),
      action
    });

    return mockRecords;
  }

  // Create archive from records
  async createArchive(dataType, records, options = {}) {
    try {
      const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      const archiveBaseName = `${dataType}_archive_${timestamp}`;
      
      // Create temporary directory for this archive
      const tempArchiveDir = path.join(this.tempDirectory, archiveBaseName);
      await fs.mkdir(tempArchiveDir, { recursive: true });

      // Organize records by categories
      const organizedData = this.organizeRecordsForArchival(records);

      // Create data files
      const dataFiles = [];
      for (const [category, categoryRecords] of Object.entries(organizedData)) {
        const filename = `${category}.json`;
        const filepath = path.join(tempArchiveDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(categoryRecords, null, 2));
        dataFiles.push({ category, filename, recordCount: categoryRecords.length });
      }

      // Create metadata file
      const metadata = {
        archiveId: this.generateArchiveId(),
        dataType,
        createdAt: new Date().toISOString(),
        recordCount: records.length,
        dataFiles,
        archivalPolicy: this.archivalPolicies[dataType],
        checksums: await this.generateChecksums(tempArchiveDir),
        retention: {
          createdAt: new Date().toISOString(),
          expiresAt: moment().add(this.archivalPolicies[dataType].archiveRetention, 'days').toISOString()
        }
      };

      const metadataPath = path.join(tempArchiveDir, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      // Create compressed archive
      const archiveFilename = `${archiveBaseName}.zip`;
      const archiveFilepath = path.join(this.archiveDirectory, archiveFilename);
      
      await this.createZipArchive(tempArchiveDir, archiveFilepath);

      // Clean up temporary directory
      await this.cleanupDirectory(tempArchiveDir);

      // Verify archive integrity
      const verified = await this.verifyArchiveIntegrity(archiveFilepath, metadata.checksums);
      
      if (!verified) {
        throw new Error('Archive integrity verification failed');
      }

      archivalLogger.info(`Archive created successfully: ${archiveFilename}`, {
        recordCount: records.length,
        archiveSize: await this.getFileSize(archiveFilepath)
      });

      return {
        archiveId: metadata.archiveId,
        filename: archiveFilename,
        filepath: archiveFilepath,
        recordCount: records.length,
        files: [archiveFilename],
        metadata
      };
    } catch (error) {
      archivalLogger.error('Failed to create archive', { error: error.message });
      throw error;
    }
  }

  // Create ZIP archive
  async createZipArchive(sourceDir, targetPath) {
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(targetPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  // Restore archived data
  async restoreArchivedData(archiveId, restoreOptions = {}) {
    try {
      archivalLogger.info(`Starting data restoration for archive: ${archiveId}`);

      // Find archive file
      const archiveInfo = await this.findArchiveById(archiveId);
      if (!archiveInfo) {
        throw new Error(`Archive not found: ${archiveId}`);
      }

      // Create temporary extraction directory
      const extractDir = path.join(this.tempDirectory, `restore_${archiveId}_${Date.now()}`);
      await fs.mkdir(extractDir, { recursive: true });

      // Extract archive
      await this.extractArchive(archiveInfo.filepath, extractDir);

      // Read metadata
      const metadataPath = path.join(extractDir, 'metadata.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

      // Verify archive integrity
      const verified = await this.verifyArchiveIntegrity(archiveInfo.filepath, metadata.checksums);
      if (!verified) {
        throw new Error('Archive integrity verification failed during restoration');
      }

      // Read and restore data
      const restoredData = {};
      for (const fileInfo of metadata.dataFiles) {
        const filePath = path.join(extractDir, fileInfo.filename);
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
        restoredData[fileInfo.category] = data;
      }

      // Apply restoration to database (if not dry run)
      let restorationResult = { recordsRestored: 0, errors: [] };
      if (!restoreOptions.dryRun) {
        restorationResult = await this.applyDataRestoration(metadata.dataType, restoredData, restoreOptions);
      }

      // Clean up extraction directory
      await this.cleanupDirectory(extractDir);

      archivalLogger.info(`Data restoration completed for archive: ${archiveId}`, {
        recordsRestored: restorationResult.recordsRestored,
        errors: restorationResult.errors.length
      });

      return {
        archiveId,
        dataType: metadata.dataType,
        recordsRestored: restorationResult.recordsRestored,
        errors: restorationResult.errors,
        metadata
      };
    } catch (error) {
      archivalLogger.error(`Failed to restore archive: ${archiveId}`, { error: error.message });
      throw error;
    }
  }

  // Search archived data
  async searchArchivedData(searchCriteria) {
    try {
      archivalLogger.info('Searching archived data', { criteria: searchCriteria });

      const searchResults = {
        archives: [],
        totalMatches: 0,
        searchCriteria
      };

      // Get all archive files
      const archiveFiles = await this.getArchiveFiles();

      for (const archiveFile of archiveFiles) {
        try {
          const matches = await this.searchInArchive(archiveFile, searchCriteria);
          if (matches.length > 0) {
            searchResults.archives.push({
              archiveId: archiveFile.archiveId,
              filename: archiveFile.filename,
              matches: matches.length,
              matchedRecords: matches
            });
            searchResults.totalMatches += matches.length;
          }
        } catch (error) {
          archivalLogger.warn(`Failed to search in archive: ${archiveFile.filename}`, { error: error.message });
        }
      }

      archivalLogger.info('Archive search completed', {
        archivesSearched: archiveFiles.length,
        archivesWithMatches: searchResults.archives.length,
        totalMatches: searchResults.totalMatches
      });

      return searchResults;
    } catch (error) {
      archivalLogger.error('Failed to search archived data', { error: error.message });
      throw error;
    }
  }

  // Get archival statistics
  async getArchivalStatistics() {
    try {
      const stats = {
        totalArchives: 0,
        totalArchivedRecords: 0,
        archivesByDataType: {},
        storageUsed: 0,
        oldestArchive: null,
        newestArchive: null,
        upcomingDeletions: []
      };

      const archiveFiles = await this.getArchiveFiles();
      stats.totalArchives = archiveFiles.length;

      for (const archive of archiveFiles) {
        const metadata = await this.getArchiveMetadata(archive.filepath);
        
        stats.totalArchivedRecords += metadata.recordCount;
        stats.storageUsed += await this.getFileSize(archive.filepath);
        
        if (!stats.archivesByDataType[metadata.dataType]) {
          stats.archivesByDataType[metadata.dataType] = {
            count: 0,
            records: 0,
            storage: 0
          };
        }
        
        stats.archivesByDataType[metadata.dataType].count++;
        stats.archivesByDataType[metadata.dataType].records += metadata.recordCount;
        stats.archivesByDataType[metadata.dataType].storage += await this.getFileSize(archive.filepath);
        
        // Track oldest and newest
        if (!stats.oldestArchive || metadata.createdAt < stats.oldestArchive.createdAt) {
          stats.oldestArchive = metadata;
        }
        
        if (!stats.newestArchive || metadata.createdAt > stats.newestArchive.createdAt) {
          stats.newestArchive = metadata;
        }
        
        // Check for upcoming deletions
        if (metadata.retention?.expiresAt) {
          const expiresAt = moment(metadata.retention.expiresAt);
          if (expiresAt.isBefore(moment().add(30, 'days'))) {
            stats.upcomingDeletions.push({
              archiveId: metadata.archiveId,
              dataType: metadata.dataType,
              expiresAt: metadata.retention.expiresAt,
              recordCount: metadata.recordCount
            });
          }
        }
      }

      return stats;
    } catch (error) {
      archivalLogger.error('Failed to get archival statistics', { error: error.message });
      throw error;
    }
  }

  // Scheduled archival methods
  async performDailyArchival() {
    try {
      await this.performDataArchival(null, { type: 'daily' });
    } catch (error) {
      archivalLogger.error('Daily archival failed', { error: error.message });
    }
  }

  async performWeeklyArchival() {
    try {
      await this.performDataArchival(null, { type: 'weekly', deepScan: true });
      await this.optimizeArchiveStorage();
    } catch (error) {
      archivalLogger.error('Weekly archival failed', { error: error.message });
    }
  }

  async performMonthlyCleanup() {
    try {
      await this.cleanupExpiredArchives();
      await this.validateArchiveIntegrity();
      await this.generateMonthlyArchivalReport();
    } catch (error) {
      archivalLogger.error('Monthly cleanup failed', { error: error.message });
    }
  }

  // Utility methods
  organizeRecordsForArchival(records) {
    const organized = {
      personal_data: [],
      applications: [],
      communications: [],
      documents: [],
      assessments: [],
      other: []
    };

    records.forEach(record => {
      const category = this.categorizeRecord(record);
      if (organized[category]) {
        organized[category].push(record);
      } else {
        organized.other.push(record);
      }
    });

    return organized;
  }

  categorizeRecord(record) {
    // Simple categorization logic - in production, this would be more sophisticated
    if (record.email || record.phone || record.address) return 'personal_data';
    if (record.jobId || record.applicationDate) return 'applications';
    if (record.messageType || record.sentAt) return 'communications';
    if (record.documentType || record.filePath) return 'documents';
    if (record.assessmentId || record.score) return 'assessments';
    return 'other';
  }

  async generateChecksums(directory) {
    // Mock implementation - in production, generate actual checksums
    const files = await fs.readdir(directory);
    const checksums = {};
    
    for (const file of files) {
      checksums[file] = `sha256_${Date.now()}_${Math.random().toString(36)}`;
    }
    
    return checksums;
  }

  async verifyArchiveIntegrity(archivePath, expectedChecksums) {
    // Mock implementation - in production, verify actual checksums
    return true;
  }

  async getFileSize(filepath) {
    try {
      const stats = await fs.stat(filepath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  async cleanupDirectory(directory) {
    try {
      await fs.rmdir(directory, { recursive: true });
    } catch (error) {
      archivalLogger.warn(`Failed to cleanup directory: ${directory}`, { error: error.message });
    }
  }

  generateArchiveId() {
    return `arch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Mock methods for database operations
  generateMockRecords(dataType, cutoffDate, action) {
    const count = Math.floor(Math.random() * 100) + 10;
    const records = [];
    
    for (let i = 0; i < count; i++) {
      records.push({
        id: i + 1,
        dataType,
        createdAt: moment(cutoffDate).subtract(Math.random() * 365, 'days').toISOString(),
        status: action === 'delete' ? 'archived' : 'active'
      });
    }
    
    return records;
  }

  async markRecordsAsArchived(dataType, records) {
    archivalLogger.info(`Marked ${records.length} ${dataType} records as archived`);
  }

  async deleteExpiredRecords(dataType, records) {
    archivalLogger.info(`Deleted ${records.length} expired ${dataType} records`);
  }

  async generateArchivalReport(report) {
    const reportPath = path.join(this.archiveDirectory, `archival_report_${moment().format('YYYY-MM-DD')}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    archivalLogger.info(`Archival report generated: ${reportPath}`);
  }

  async findArchiveById(archiveId) {
    // Mock implementation
    return {
      archiveId,
      filename: `archive_${archiveId}.zip`,
      filepath: path.join(this.archiveDirectory, `archive_${archiveId}.zip`)
    };
  }

  async extractArchive(archivePath, extractDir) {
    // Mock implementation - in production, use a zip extraction library
    archivalLogger.info(`Extracting archive: ${archivePath} to ${extractDir}`);
  }

  async applyDataRestoration(dataType, restoredData, options) {
    // Mock implementation
    return {
      recordsRestored: Object.values(restoredData).reduce((total, records) => total + records.length, 0),
      errors: []
    };
  }

  async getArchiveFiles() {
    // Mock implementation
    return [
      { archiveId: 'arch1', filename: 'candidates_archive_2024-01-01.zip', filepath: '/path/to/archive1.zip' },
      { archiveId: 'arch2', filename: 'applications_archive_2024-01-01.zip', filepath: '/path/to/archive2.zip' }
    ];
  }

  async searchInArchive(archiveFile, searchCriteria) {
    // Mock implementation
    return [];
  }

  async getArchiveMetadata(archivePath) {
    // Mock implementation
    return {
      archiveId: 'mock_id',
      dataType: 'candidates',
      recordCount: 100,
      createdAt: '2024-01-01T00:00:00Z',
      retention: {
        expiresAt: '2026-01-01T00:00:00Z'
      }
    };
  }

  async optimizeArchiveStorage() {
    archivalLogger.info('Optimizing archive storage');
  }

  async cleanupExpiredArchives() {
    archivalLogger.info('Cleaning up expired archives');
  }

  async validateArchiveIntegrity() {
    archivalLogger.info('Validating archive integrity');
  }

  async generateMonthlyArchivalReport() {
    archivalLogger.info('Generating monthly archival report');
  }
}

module.exports = new DataArchivalService();
