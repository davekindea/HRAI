const moment = require('moment');
const winston = require('winston');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');

// Configure data export logger
const exportLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/data-export.log' }),
    new winston.transports.Console()
  ]
});

class DataExportService {
  constructor() {
    this.exportQueue = [];
    this.activeExports = new Map();
    this.exportHistory = [];
    this.maxConcurrentExports = 5;
    this.exportTimeoutMs = 300000; // 5 minutes
    
    this.supportedFormats = {
      csv: 'csv',
      excel: 'xlsx',
      pdf: 'pdf',
      json: 'json',
      xml: 'xml',
      zip: 'zip'
    };

    this.dataSourceMappings = {
      employees: 'employee_data',
      applications: 'application_data',
      jobs: 'job_postings',
      interviews: 'interview_records',
      performance: 'performance_reviews',
      attendance: 'attendance_records',
      payroll: 'payroll_data',
      training: 'training_records',
      surveys: 'survey_responses'
    };

    this.exportLimits = {
      csv: 1000000, // 1 million rows
      excel: 1048576, // Excel limit
      pdf: 10000, // Reasonable PDF limit
      json: 500000,
      xml: 500000
    };

    this.ensureExportDirectories();
  }

  // Ensure export directories exist
  ensureExportDirectories() {
    const directories = [
      'exports',
      'exports/csv',
      'exports/excel',
      'exports/pdf',
      'exports/json',
      'exports/temp',
      'exports/bulk'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });

    exportLogger.info('Export directories ensured');
  }

  // Export data with multiple format support
  async exportData(userId, exportRequest) {
    try {
      exportLogger.info('Starting data export', { userId, exportRequest });

      const exportId = this.generateExportId();
      const exportJob = {
        id: exportId,
        userId,
        dataSource: exportRequest.dataSource,
        format: exportRequest.format.toLowerCase(),
        filters: exportRequest.filters || {},
        fields: exportRequest.fields || [],
        options: exportRequest.options || {},
        status: 'queued',
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        filePath: null,
        fileSize: null,
        recordCount: null,
        downloadUrl: null,
        expiresAt: null,
        error: null
      };

      // Validate export request
      await this.validateExportRequest(exportJob);

      // Add to queue
      this.exportQueue.push(exportJob);
      this.activeExports.set(exportId, exportJob);

      // Process queue
      this.processExportQueue();

      exportLogger.info('Export job queued successfully', { exportId, userId });
      return { exportId, status: 'queued', estimatedTime: this.estimateExportTime(exportJob) };
    } catch (error) {
      exportLogger.error('Failed to queue export job', { error: error.message, userId });
      throw error;
    }
  }

  // Process export queue
  async processExportQueue() {
    const runningExports = Array.from(this.activeExports.values())
      .filter(job => job.status === 'processing').length;

    if (runningExports >= this.maxConcurrentExports || this.exportQueue.length === 0) {
      return;
    }

    const job = this.exportQueue.shift();
    if (!job) return;

    try {
      job.status = 'processing';
      job.startedAt = new Date().toISOString();

      exportLogger.info('Processing export job', { exportId: job.id });

      // Execute export based on format
      const result = await this.executeExport(job);

      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.filePath = result.filePath;
      job.fileSize = result.fileSize;
      job.recordCount = result.recordCount;
      job.downloadUrl = this.generateDownloadUrl(job.id);
      job.expiresAt = moment().add(7, 'days').toISOString(); // 7 day expiry

      exportLogger.info('Export job completed successfully', { 
        exportId: job.id, 
        recordCount: job.recordCount,
        fileSize: job.fileSize 
      });

      // Add to history
      this.exportHistory.push({
        ...job,
        downloadCount: 0
      });

      // Continue processing queue
      setTimeout(() => this.processExportQueue(), 100);
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date().toISOString();

      exportLogger.error('Export job failed', { 
        exportId: job.id, 
        error: error.message 
      });

      // Continue processing queue even if one job fails
      setTimeout(() => this.processExportQueue(), 100);
    }
  }

  // Execute export based on format
  async executeExport(job) {
    const data = await this.fetchDataForExport(job);
    
    switch (job.format) {
      case 'csv':
        return await this.exportToCSV(job, data);
      case 'xlsx':
      case 'excel':
        return await this.exportToExcel(job, data);
      case 'pdf':
        return await this.exportToPDF(job, data);
      case 'json':
        return await this.exportToJSON(job, data);
      case 'xml':
        return await this.exportToXML(job, data);
      case 'zip':
        return await this.exportToZip(job, data);
      default:
        throw new Error(`Unsupported export format: ${job.format}`);
    }
  }

  // Fetch data for export
  async fetchDataForExport(job) {
    exportLogger.info('Fetching data for export', { 
      exportId: job.id, 
      dataSource: job.dataSource 
    });

    // Apply filters and field selection
    const query = this.buildExportQuery(job);
    
    // Execute query (mock implementation)
    const data = await this.executeDataQuery(query, job);

    // Validate record count against limits
    if (data.length > this.exportLimits[job.format]) {
      throw new Error(`Data exceeds export limit of ${this.exportLimits[job.format]} records for ${job.format} format`);
    }

    return data;
  }

  // Export to CSV
  async exportToCSV(job, data) {
    try {
      const filename = `${job.dataSource}_export_${moment().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
      const filePath = path.join(process.cwd(), 'exports', 'csv', filename);

      // Configure CSV options
      const csvOptions = {
        fields: job.fields.length > 0 ? job.fields : Object.keys(data[0] || {}),
        header: job.options.includeHeaders !== false,
        delimiter: job.options.delimiter || ',',
        quote: job.options.quote || '"',
        escape: job.options.escape || '"'
      };

      const parser = new Parser(csvOptions);
      const csvData = parser.parse(data);

      fs.writeFileSync(filePath, csvData, 'utf8');

      const stats = fs.statSync(filePath);

      return {
        filePath,
        fileSize: stats.size,
        recordCount: data.length,
        format: 'csv'
      };
    } catch (error) {
      exportLogger.error('Failed to export CSV', { 
        error: error.message, 
        exportId: job.id 
      });
      throw error;
    }
  }

  // Export to Excel
  async exportToExcel(job, data) {
    try {
      const filename = `${job.dataSource}_export_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
      const filePath = path.join(process.cwd(), 'exports', 'excel', filename);

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create main data sheet
      const worksheet = XLSX.utils.json_to_sheet(data, {
        header: job.fields.length > 0 ? job.fields : undefined
      });

      // Apply formatting if specified
      if (job.options.formatting) {
        this.applyExcelFormatting(worksheet, job.options.formatting);
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      // Add metadata sheet if requested
      if (job.options.includeMetadata) {
        const metadataSheet = this.createMetadataSheet(job, data);
        XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
      }

      // Add summary sheet if requested
      if (job.options.includeSummary) {
        const summarySheet = this.createSummarySheet(data, job);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }

      // Write file
      XLSX.writeFile(workbook, filePath);

      const stats = fs.statSync(filePath);

      return {
        filePath,
        fileSize: stats.size,
        recordCount: data.length,
        format: 'xlsx'
      };
    } catch (error) {
      exportLogger.error('Failed to export Excel', { 
        error: error.message, 
        exportId: job.id 
      });
      throw error;
    }
  }

  // Export to PDF
  async exportToPDF(job, data) {
    try {
      const filename = `${job.dataSource}_export_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
      const filePath = path.join(process.cwd(), 'exports', 'pdf', filename);

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
          margin: 50,
          size: job.options.pageSize || 'A4',
          layout: job.options.orientation || 'portrait'
        });

        doc.pipe(fs.createWriteStream(filePath));

        // Add header
        this.addPDFHeader(doc, job);

        // Add data table
        this.addPDFDataTable(doc, data, job);

        // Add footer
        this.addPDFFooter(doc, job, data);

        doc.end();

        doc.on('end', () => {
          const stats = fs.statSync(filePath);
          resolve({
            filePath,
            fileSize: stats.size,
            recordCount: data.length,
            format: 'pdf'
          });
        });

        doc.on('error', reject);
      });
    } catch (error) {
      exportLogger.error('Failed to export PDF', { 
        error: error.message, 
        exportId: job.id 
      });
      throw error;
    }
  }

  // Export to JSON
  async exportToJSON(job, data) {
    try {
      const filename = `${job.dataSource}_export_${moment().format('YYYY-MM-DD_HH-mm-ss')}.json`;
      const filePath = path.join(process.cwd(), 'exports', 'json', filename);

      const exportData = {
        metadata: {
          exportId: job.id,
          dataSource: job.dataSource,
          exportedAt: new Date().toISOString(),
          recordCount: data.length,
          fields: job.fields.length > 0 ? job.fields : Object.keys(data[0] || {}),
          filters: job.filters
        },
        data: data
      };

      const jsonData = JSON.stringify(exportData, null, job.options.pretty ? 2 : 0);
      fs.writeFileSync(filePath, jsonData, 'utf8');

      const stats = fs.statSync(filePath);

      return {
        filePath,
        fileSize: stats.size,
        recordCount: data.length,
        format: 'json'
      };
    } catch (error) {
      exportLogger.error('Failed to export JSON', { 
        error: error.message, 
        exportId: job.id 
      });
      throw error;
    }
  }

  // Export to XML
  async exportToXML(job, data) {
    try {
      const filename = `${job.dataSource}_export_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xml`;
      const filePath = path.join(process.cwd(), 'exports', 'json', filename);

      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xmlContent += `<export>\n`;
      xmlContent += `  <metadata>\n`;
      xmlContent += `    <exportId>${job.id}</exportId>\n`;
      xmlContent += `    <dataSource>${job.dataSource}</dataSource>\n`;
      xmlContent += `    <exportedAt>${new Date().toISOString()}</exportedAt>\n`;
      xmlContent += `    <recordCount>${data.length}</recordCount>\n`;
      xmlContent += `  </metadata>\n`;
      xmlContent += `  <data>\n`;

      data.forEach(record => {
        xmlContent += `    <record>\n`;
        Object.keys(record).forEach(key => {
          const value = this.escapeXml(String(record[key] || ''));
          xmlContent += `      <${key}>${value}</${key}>\n`;
        });
        xmlContent += `    </record>\n`;
      });

      xmlContent += `  </data>\n`;
      xmlContent += `</export>`;

      fs.writeFileSync(filePath, xmlContent, 'utf8');

      const stats = fs.statSync(filePath);

      return {
        filePath,
        fileSize: stats.size,
        recordCount: data.length,
        format: 'xml'
      };
    } catch (error) {
      exportLogger.error('Failed to export XML', { 
        error: error.message, 
        exportId: job.id 
      });
      throw error;
    }
  }

  // Export to ZIP (multiple formats)
  async exportToZip(job, data) {
    try {
      const filename = `${job.dataSource}_export_${moment().format('YYYY-MM-DD_HH-mm-ss')}.zip`;
      const filePath = path.join(process.cwd(), 'exports', 'bulk', filename);

      const output = fs.createWriteStream(filePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);

      // Add CSV version
      const csvResult = await this.exportToCSV(job, data);
      archive.file(csvResult.filePath, { name: `data.csv` });

      // Add JSON version
      const jsonResult = await this.exportToJSON(job, data);
      archive.file(jsonResult.filePath, { name: `data.json` });

      // Add Excel version if data size allows
      if (data.length <= 100000) {
        const excelResult = await this.exportToExcel(job, data);
        archive.file(excelResult.filePath, { name: `data.xlsx` });
      }

      // Add metadata file
      const metadataPath = path.join(process.cwd(), 'exports', 'temp', `metadata_${job.id}.txt`);
      const metadataContent = this.generateMetadataContent(job, data);
      fs.writeFileSync(metadataPath, metadataContent);
      archive.file(metadataPath, { name: 'metadata.txt' });

      await archive.finalize();

      const stats = fs.statSync(filePath);

      // Clean up temporary files
      this.cleanupTempFiles([csvResult.filePath, jsonResult.filePath, metadataPath]);

      return {
        filePath,
        fileSize: stats.size,
        recordCount: data.length,
        format: 'zip'
      };
    } catch (error) {
      exportLogger.error('Failed to export ZIP', { 
        error: error.message, 
        exportId: job.id 
      });
      throw error;
    }
  }

  // Get export status
  async getExportStatus(exportId) {
    const exportJob = this.activeExports.get(exportId);
    if (!exportJob) {
      // Check export history
      const historicalExport = this.exportHistory.find(e => e.id === exportId);
      if (historicalExport) {
        return {
          id: exportId,
          status: historicalExport.status,
          progress: 100,
          downloadUrl: historicalExport.downloadUrl,
          expiresAt: historicalExport.expiresAt,
          fileSize: historicalExport.fileSize,
          recordCount: historicalExport.recordCount
        };
      }
      throw new Error(`Export not found: ${exportId}`);
    }

    return {
      id: exportId,
      status: exportJob.status,
      progress: this.calculateProgress(exportJob),
      estimatedTimeRemaining: this.estimateTimeRemaining(exportJob),
      error: exportJob.error,
      downloadUrl: exportJob.downloadUrl,
      expiresAt: exportJob.expiresAt,
      fileSize: exportJob.fileSize,
      recordCount: exportJob.recordCount
    };
  }

  // Get user export history
  async getExportHistory(userId, filters = {}) {
    let history = this.exportHistory.filter(exp => exp.userId === userId);

    if (filters.status) {
      history = history.filter(exp => exp.status === filters.status);
    }

    if (filters.dataSource) {
      history = history.filter(exp => exp.dataSource === filters.dataSource);
    }

    if (filters.format) {
      history = history.filter(exp => exp.format === filters.format);
    }

    return history.map(exp => ({
      id: exp.id,
      dataSource: exp.dataSource,
      format: exp.format,
      status: exp.status,
      recordCount: exp.recordCount,
      fileSize: exp.fileSize,
      createdAt: exp.createdAt,
      completedAt: exp.completedAt,
      downloadUrl: exp.downloadUrl,
      expiresAt: exp.expiresAt,
      downloadCount: exp.downloadCount
    }));
  }

  // Download exported file
  async downloadExport(exportId, userId) {
    const exportJob = this.activeExports.get(exportId) || 
                     this.exportHistory.find(e => e.id === exportId);

    if (!exportJob) {
      throw new Error(`Export not found: ${exportId}`);
    }

    if (exportJob.userId !== userId) {
      throw new Error('Unauthorized access to export');
    }

    if (exportJob.status !== 'completed') {
      throw new Error(`Export not ready for download. Status: ${exportJob.status}`);
    }

    if (moment().isAfter(exportJob.expiresAt)) {
      throw new Error('Export has expired');
    }

    if (!fs.existsSync(exportJob.filePath)) {
      throw new Error('Export file not found');
    }

    // Increment download count
    if (exportJob.downloadCount !== undefined) {
      exportJob.downloadCount++;
    }

    return {
      filePath: exportJob.filePath,
      filename: path.basename(exportJob.filePath),
      mimeType: this.getMimeType(exportJob.format),
      fileSize: exportJob.fileSize
    };
  }

  // Utility methods
  generateExportId() {
    return `export_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  generateDownloadUrl(exportId) {
    return `/api/exports/${exportId}/download`;
  }

  async validateExportRequest(job) {
    if (!this.supportedFormats[job.format]) {
      throw new Error(`Unsupported format: ${job.format}`);
    }

    if (!this.dataSourceMappings[job.dataSource]) {
      throw new Error(`Invalid data source: ${job.dataSource}`);
    }

    return true;
  }

  buildExportQuery(job) {
    // Build query based on filters and fields
    return {
      dataSource: job.dataSource,
      fields: job.fields,
      filters: job.filters,
      limit: this.exportLimits[job.format]
    };
  }

  async executeDataQuery(query, job) {
    // Mock implementation - replace with actual database query
    const mockData = [];
    const recordCount = Math.min(Math.floor(Math.random() * 10000) + 1000, query.limit);
    
    const fields = query.fields.length > 0 ? query.fields : this.getDefaultFields(query.dataSource);
    
    for (let i = 0; i < recordCount; i++) {
      const record = {};
      fields.forEach(field => {
        record[field] = this.generateMockFieldValue(field, query.dataSource);
      });
      mockData.push(record);
    }

    return mockData;
  }

  getDefaultFields(dataSource) {
    const fieldMappings = {
      employees: ['id', 'firstName', 'lastName', 'email', 'department', 'position', 'hireDate', 'salary'],
      applications: ['id', 'jobId', 'candidateName', 'email', 'applicationDate', 'status', 'source'],
      jobs: ['id', 'title', 'department', 'location', 'type', 'status', 'postedDate'],
      interviews: ['id', 'applicationId', 'interviewer', 'scheduledDate', 'status', 'feedback'],
      performance: ['id', 'employeeId', 'reviewPeriod', 'overallRating', 'goalsCompleted'],
      attendance: ['id', 'employeeId', 'date', 'checkInTime', 'checkOutTime', 'hoursWorked']
    };

    return fieldMappings[dataSource] || ['id', 'data'];
  }

  generateMockFieldValue(field, dataSource) {
    // Generate appropriate mock data based on field name
    if (field.includes('date') || field.includes('Date')) {
      return moment().subtract(Math.floor(Math.random() * 365), 'days').format('YYYY-MM-DD');
    } else if (field.includes('email') || field.includes('Email')) {
      return `user${Math.floor(Math.random() * 1000)}@company.com`;
    } else if (field.includes('name') || field.includes('Name')) {
      return ['John', 'Jane', 'Bob', 'Alice', 'Charlie'][Math.floor(Math.random() * 5)];
    } else if (field.includes('salary') || field.includes('Salary')) {
      return Math.floor(Math.random() * 100000) + 50000;
    } else if (field.includes('rating') || field.includes('Rating')) {
      return (Math.random() * 4 + 1).toFixed(1);
    } else {
      return `Sample ${field} ${Math.floor(Math.random() * 1000)}`;
    }
  }

  estimateExportTime(job) {
    // Estimate export time based on data source and format
    const baseTime = 30; // seconds
    const recordMultiplier = 0.001; // per record
    const formatMultiplier = {
      csv: 1,
      xlsx: 2,
      pdf: 5,
      json: 1.5,
      xml: 2,
      zip: 3
    };

    return Math.round(baseTime * (formatMultiplier[job.format] || 1));
  }

  calculateProgress(job) {
    if (job.status === 'queued') return 0;
    if (job.status === 'processing') return 50;
    if (job.status === 'completed') return 100;
    if (job.status === 'failed') return 0;
    return 0;
  }

  estimateTimeRemaining(job) {
    if (job.status === 'completed' || job.status === 'failed') return 0;
    if (job.status === 'queued') return this.estimateExportTime(job);
    if (job.status === 'processing') {
      const elapsed = moment().diff(moment(job.startedAt), 'seconds');
      const estimated = this.estimateExportTime(job);
      return Math.max(0, estimated - elapsed);
    }
    return 0;
  }

  getMimeType(format) {
    const mimeTypes = {
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf',
      json: 'application/json',
      xml: 'application/xml',
      zip: 'application/zip'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  cleanupTempFiles(filePaths) {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        exportLogger.warn('Failed to cleanup temp file', { filePath, error: error.message });
      }
    });
  }

  applyExcelFormatting(worksheet, formatting) {
    // Apply basic Excel formatting - enhance as needed
    if (formatting.autoWidth) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      const colWidths = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        let maxWidth = 10;
        for (let r = range.s.r; r <= range.e.r; r++) {
          const cellAddress = XLSX.utils.encode_cell({ r, c });
          const cell = worksheet[cellAddress];
          if (cell && cell.v) {
            maxWidth = Math.max(maxWidth, String(cell.v).length);
          }
        }
        colWidths.push({ width: Math.min(maxWidth + 2, 50) });
      }
      worksheet['!cols'] = colWidths;
    }
  }

  createMetadataSheet(job, data) {
    const metadata = [
      { Property: 'Export ID', Value: job.id },
      { Property: 'Data Source', Value: job.dataSource },
      { Property: 'Exported At', Value: new Date().toISOString() },
      { Property: 'Record Count', Value: data.length },
      { Property: 'Export Format', Value: job.format },
      { Property: 'Fields Exported', Value: job.fields.join(', ') }
    ];

    return XLSX.utils.json_to_sheet(metadata);
  }

  createSummarySheet(data, job) {
    // Create basic summary statistics
    const summary = [];
    
    if (data.length > 0) {
      const numericFields = Object.keys(data[0]).filter(key => 
        !isNaN(data[0][key]) && data[0][key] !== ''
      );

      numericFields.forEach(field => {
        const values = data.map(row => Number(row[field])).filter(val => !isNaN(val));
        if (values.length > 0) {
          summary.push({
            Field: field,
            Count: values.length,
            Sum: values.reduce((a, b) => a + b, 0),
            Average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
            Min: Math.min(...values),
            Max: Math.max(...values)
          });
        }
      });
    }

    return XLSX.utils.json_to_sheet(summary);
  }

  addPDFHeader(doc, job) {
    doc.fontSize(20)
       .text(`${job.dataSource.toUpperCase()} Export Report`, 50, 50);
    
    doc.fontSize(12)
       .text(`Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 50, 80)
       .text(`Export ID: ${job.id}`, 50, 95);
  }

  addPDFDataTable(doc, data, job) {
    if (data.length === 0) return;

    const startY = 130;
    const fields = job.fields.length > 0 ? job.fields.slice(0, 6) : Object.keys(data[0]).slice(0, 6);
    const colWidth = 80;
    let currentY = startY;

    // Headers
    doc.fontSize(10).font('Helvetica-Bold');
    fields.forEach((field, index) => {
      doc.text(field, 50 + (index * colWidth), currentY);
    });

    currentY += 20;

    // Data rows (limit to 30 for demo)
    doc.font('Helvetica');
    const limitedData = data.slice(0, 30);
    
    limitedData.forEach(row => {
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }

      fields.forEach((field, index) => {
        const value = String(row[field] || '').substring(0, 12);
        doc.text(value, 50 + (index * colWidth), currentY);
      });

      currentY += 15;
    });
  }

  addPDFFooter(doc, job, data) {
    const footerY = doc.page.height - 50;
    doc.fontSize(10)
       .text(`Total Records: ${data.length}`, 50, footerY)
       .text(`Page 1`, doc.page.width - 100, footerY);
  }

  generateMetadataContent(job, data) {
    return `Export Metadata
================

Export ID: ${job.id}
Data Source: ${job.dataSource}
Format: ${job.format}
Generated: ${new Date().toISOString()}
Record Count: ${data.length}
Fields: ${job.fields.join(', ')}

Filters Applied:
${JSON.stringify(job.filters, null, 2)}

Options:
${JSON.stringify(job.options, null, 2)}
`;
  }

  escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  // Cleanup expired exports
  cleanupExpiredExports() {
    const now = moment();
    
    this.exportHistory = this.exportHistory.filter(exp => {
      if (now.isAfter(exp.expiresAt)) {
        try {
          if (fs.existsSync(exp.filePath)) {
            fs.unlinkSync(exp.filePath);
          }
        } catch (error) {
          exportLogger.warn('Failed to cleanup expired export file', { 
            exportId: exp.id, 
            error: error.message 
          });
        }
        return false;
      }
      return true;
    });

    exportLogger.info('Expired exports cleaned up');
  }
}

module.exports = new DataExportService();
