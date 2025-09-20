const moment = require('moment');
const winston = require('winston');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Configure report builder logger
const reportLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/report-builder.log' }),
    new winston.transports.Console()
  ]
});

class ReportBuilderService {
  constructor() {
    this.reportTemplates = new Map();
    this.savedReports = new Map();
    this.reportCache = new Map();
    
    this.dataSourceTypes = {
      employees: 'employees',
      applications: 'applications',
      jobs: 'jobs',
      interviews: 'interviews',
      performance: 'performance_reviews',
      attendance: 'attendance',
      payroll: 'payroll',
      training: 'training_records',
      surveys: 'surveys',
      custom: 'custom_queries'
    };

    this.fieldTypes = {
      text: 'text',
      number: 'number',
      date: 'date',
      boolean: 'boolean',
      select: 'select',
      multiSelect: 'multi_select',
      calculated: 'calculated'
    };

    this.aggregationTypes = {
      count: 'COUNT',
      sum: 'SUM',
      average: 'AVG',
      min: 'MIN',
      max: 'MAX',
      distinct: 'DISTINCT'
    };

    this.visualizationTypes = {
      table: 'table',
      chart: 'chart',
      graph: 'graph',
      pivot: 'pivot_table',
      dashboard: 'dashboard'
    };

    this.exportFormats = {
      pdf: 'pdf',
      csv: 'csv',
      excel: 'xlsx',
      json: 'json'
    };

    this.initializeDefaultTemplates();
  }

  // Initialize default report templates
  initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        id: 'employee_roster',
        name: 'Employee Roster',
        description: 'Complete list of all employees with basic information',
        dataSource: 'employees',
        fields: ['first_name', 'last_name', 'email', 'department', 'position', 'hire_date', 'status'],
        filters: [],
        groupBy: ['department'],
        orderBy: [{ field: 'last_name', direction: 'ASC' }]
      },
      {
        id: 'recruitment_summary',
        name: 'Recruitment Summary',
        description: 'Overview of recruitment activities and metrics',
        dataSource: 'applications',
        fields: ['job_title', 'candidate_name', 'application_date', 'status', 'source'],
        filters: [{ field: 'application_date', operator: 'last_30_days' }],
        groupBy: ['status'],
        aggregations: [
          { field: 'id', type: 'COUNT', alias: 'total_applications' }
        ]
      },
      {
        id: 'performance_overview',
        name: 'Performance Overview',
        description: 'Employee performance ratings and goal completion',
        dataSource: 'performance',
        fields: ['employee_name', 'review_period', 'overall_rating', 'goals_completed', 'improvement_areas'],
        filters: [{ field: 'review_period', operator: 'current_year' }],
        groupBy: ['department'],
        aggregations: [
          { field: 'overall_rating', type: 'AVG', alias: 'avg_rating' }
        ]
      },
      {
        id: 'turnover_analysis',
        name: 'Turnover Analysis',
        description: 'Employee turnover rates and trends',
        dataSource: 'employees',
        fields: ['department', 'termination_date', 'termination_reason', 'tenure_months'],
        filters: [{ field: 'status', operator: 'equals', value: 'terminated' }],
        groupBy: ['department', 'termination_reason'],
        aggregations: [
          { field: 'id', type: 'COUNT', alias: 'termination_count' },
          { field: 'tenure_months', type: 'AVG', alias: 'avg_tenure' }
        ]
      },
      {
        id: 'attendance_report',
        name: 'Attendance Report',
        description: 'Employee attendance patterns and metrics',
        dataSource: 'attendance',
        fields: ['employee_name', 'date', 'check_in_time', 'check_out_time', 'hours_worked', 'status'],
        filters: [{ field: 'date', operator: 'last_30_days' }],
        groupBy: ['employee_name'],
        aggregations: [
          { field: 'hours_worked', type: 'SUM', alias: 'total_hours' },
          { field: 'date', type: 'COUNT', alias: 'days_worked' }
        ]
      }
    ];

    defaultTemplates.forEach(template => {
      this.reportTemplates.set(template.id, template);
    });

    reportLogger.info('Default report templates initialized', { 
      templateCount: defaultTemplates.length 
    });
  }

  // Create custom report
  async createCustomReport(userId, reportConfig) {
    try {
      reportLogger.info('Creating custom report', { userId, reportConfig });

      const reportId = this.generateReportId();
      const report = {
        id: reportId,
        name: reportConfig.name,
        description: reportConfig.description || '',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataSource: reportConfig.dataSource,
        fields: reportConfig.fields || [],
        filters: reportConfig.filters || [],
        groupBy: reportConfig.groupBy || [],
        orderBy: reportConfig.orderBy || [],
        aggregations: reportConfig.aggregations || [],
        visualizations: reportConfig.visualizations || [],
        layout: reportConfig.layout || 'table',
        isPublic: reportConfig.isPublic || false,
        tags: reportConfig.tags || [],
        schedule: reportConfig.schedule || null
      };

      // Validate report configuration
      await this.validateReportConfig(report);

      // Save report configuration
      this.savedReports.set(reportId, report);

      reportLogger.info('Custom report created successfully', { reportId, userId });
      return report;
    } catch (error) {
      reportLogger.error('Failed to create custom report', { error: error.message, userId });
      throw error;
    }
  }

  // Execute report
  async executeReport(reportId, userId, executeOptions = {}) {
    try {
      reportLogger.info('Executing report', { reportId, userId, executeOptions });

      const report = this.savedReports.get(reportId) || this.reportTemplates.get(reportId);
      if (!report) {
        throw new Error(`Report not found: ${reportId}`);
      }

      // Check permissions
      await this.checkReportPermissions(report, userId);

      // Generate cache key
      const cacheKey = this.generateCacheKey(reportId, executeOptions);
      
      // Check cache if not forced refresh
      if (!executeOptions.forceRefresh && this.reportCache.has(cacheKey)) {
        const cached = this.reportCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
          reportLogger.info('Returning cached report data', { reportId });
          return cached.data;
        }
      }

      // Execute report query
      const reportData = await this.executeReportQuery(report, executeOptions);

      // Apply post-processing
      const processedData = await this.processReportData(reportData, report);

      // Generate visualizations if requested
      const visualizations = await this.generateReportVisualizations(processedData, report);

      const result = {
        reportId,
        reportName: report.name,
        executedAt: new Date().toISOString(),
        executedBy: userId,
        dataSource: report.dataSource,
        totalRecords: processedData.length,
        data: processedData,
        visualizations,
        metadata: {
          fields: report.fields,
          filters: report.filters,
          groupBy: report.groupBy,
          orderBy: report.orderBy,
          aggregations: report.aggregations
        }
      };

      // Cache result
      this.reportCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      reportLogger.info('Report executed successfully', { 
        reportId, 
        userId, 
        recordCount: processedData.length 
      });

      return result;
    } catch (error) {
      reportLogger.error('Failed to execute report', { 
        error: error.message, 
        reportId, 
        userId 
      });
      throw error;
    }
  }

  // Get available data sources
  async getAvailableDataSources(userId) {
    try {
      const dataSources = [
        {
          id: 'employees',
          name: 'Employees',
          description: 'Employee master data and employment information',
          fields: await this.getDataSourceFields('employees'),
          recordCount: await this.getDataSourceRecordCount('employees')
        },
        {
          id: 'applications',
          name: 'Job Applications',
          description: 'Candidate applications and recruitment data',
          fields: await this.getDataSourceFields('applications'),
          recordCount: await this.getDataSourceRecordCount('applications')
        },
        {
          id: 'jobs',
          name: 'Job Postings',
          description: 'Job postings and position data',
          fields: await this.getDataSourceFields('jobs'),
          recordCount: await this.getDataSourceRecordCount('jobs')
        },
        {
          id: 'interviews',
          name: 'Interviews',
          description: 'Interview schedules and feedback',
          fields: await this.getDataSourceFields('interviews'),
          recordCount: await this.getDataSourceRecordCount('interviews')
        },
        {
          id: 'performance',
          name: 'Performance Reviews',
          description: 'Employee performance evaluations and ratings',
          fields: await this.getDataSourceFields('performance'),
          recordCount: await this.getDataSourceRecordCount('performance')
        },
        {
          id: 'attendance',
          name: 'Attendance Records',
          description: 'Employee attendance and time tracking',
          fields: await this.getDataSourceFields('attendance'),
          recordCount: await this.getDataSourceRecordCount('attendance')
        },
        {
          id: 'payroll',
          name: 'Payroll Data',
          description: 'Salary and compensation information',
          fields: await this.getDataSourceFields('payroll'),
          recordCount: await this.getDataSourceRecordCount('payroll')
        },
        {
          id: 'training',
          name: 'Training Records',
          description: 'Employee training and development activities',
          fields: await this.getDataSourceFields('training'),
          recordCount: await this.getDataSourceRecordCount('training')
        }
      ];

      return dataSources;
    } catch (error) {
      reportLogger.error('Failed to get data sources', { error: error.message });
      throw error;
    }
  }

  // Get saved reports for user
  async getSavedReports(userId, filters = {}) {
    try {
      const userReports = Array.from(this.savedReports.values())
        .filter(report => 
          report.createdBy === userId || 
          report.isPublic || 
          this.hasReportAccess(report, userId)
        );

      // Apply filters
      let filteredReports = userReports;
      
      if (filters.search) {
        filteredReports = filteredReports.filter(report =>
          report.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          report.description.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.dataSource) {
        filteredReports = filteredReports.filter(report =>
          report.dataSource === filters.dataSource
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredReports = filteredReports.filter(report =>
          filters.tags.some(tag => report.tags.includes(tag))
        );
      }

      // Sort reports
      filteredReports.sort((a, b) => {
        if (filters.sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (filters.sortBy === 'created') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (filters.sortBy === 'updated') {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        }
        return 0;
      });

      return filteredReports;
    } catch (error) {
      reportLogger.error('Failed to get saved reports', { error: error.message, userId });
      throw error;
    }
  }

  // Export report data
  async exportReport(reportId, userId, format, options = {}) {
    try {
      reportLogger.info('Exporting report', { reportId, userId, format, options });

      // Execute report to get data
      const reportResult = await this.executeReport(reportId, userId, options);
      const filename = `${reportResult.reportName}_${moment().format('YYYY-MM-DD_HH-mm-ss')}`;

      let exportResult;

      switch (format.toLowerCase()) {
        case 'csv':
          exportResult = await this.exportToCSV(reportResult, filename, options);
          break;
        case 'xlsx':
        case 'excel':
          exportResult = await this.exportToExcel(reportResult, filename, options);
          break;
        case 'pdf':
          exportResult = await this.exportToPDF(reportResult, filename, options);
          break;
        case 'json':
          exportResult = await this.exportToJSON(reportResult, filename, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      reportLogger.info('Report exported successfully', { 
        reportId, 
        userId, 
        format, 
        filename: exportResult.filename 
      });

      return exportResult;
    } catch (error) {
      reportLogger.error('Failed to export report', { 
        error: error.message, 
        reportId, 
        userId, 
        format 
      });
      throw error;
    }
  }

  // Export to CSV
  async exportToCSV(reportResult, filename, options = {}) {
    try {
      const fields = reportResult.metadata.fields;
      const parser = new Parser({ fields });
      const csv = parser.parse(reportResult.data);

      const filepath = path.join(process.cwd(), 'exports', `${filename}.csv`);
      
      // Ensure exports directory exists
      const exportsDir = path.dirname(filepath);
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      fs.writeFileSync(filepath, csv);

      return {
        format: 'csv',
        filename: `${filename}.csv`,
        filepath,
        size: fs.statSync(filepath).size,
        recordCount: reportResult.data.length
      };
    } catch (error) {
      reportLogger.error('Failed to export CSV', { error: error.message });
      throw error;
    }
  }

  // Export to Excel
  async exportToExcel(reportResult, filename, options = {}) {
    try {
      const worksheet = XLSX.utils.json_to_sheet(reportResult.data);
      const workbook = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');

      // Add metadata sheet if requested
      if (options.includeMetadata) {
        const metadataSheet = XLSX.utils.json_to_sheet([{
          'Report Name': reportResult.reportName,
          'Executed At': reportResult.executedAt,
          'Executed By': reportResult.executedBy,
          'Data Source': reportResult.dataSource,
          'Total Records': reportResult.totalRecords
        }]);
        XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
      }

      const filepath = path.join(process.cwd(), 'exports', `${filename}.xlsx`);
      
      // Ensure exports directory exists
      const exportsDir = path.dirname(filepath);
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      XLSX.writeFile(workbook, filepath);

      return {
        format: 'xlsx',
        filename: `${filename}.xlsx`,
        filepath,
        size: fs.statSync(filepath).size,
        recordCount: reportResult.data.length
      };
    } catch (error) {
      reportLogger.error('Failed to export Excel', { error: error.message });
      throw error;
    }
  }

  // Export to PDF
  async exportToPDF(reportResult, filename, options = {}) {
    try {
      const doc = new PDFDocument();
      const filepath = path.join(process.cwd(), 'exports', `${filename}.pdf`);
      
      // Ensure exports directory exists
      const exportsDir = path.dirname(filepath);
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      doc.pipe(fs.createWriteStream(filepath));

      // Add header
      doc.fontSize(20).text(reportResult.reportName, 50, 50);
      doc.fontSize(12).text(`Generated on: ${moment(reportResult.executedAt).format('YYYY-MM-DD HH:mm:ss')}`, 50, 80);
      doc.text(`Total Records: ${reportResult.totalRecords}`, 50, 100);

      // Add data table (simplified for demo)
      let yPosition = 140;
      const pageHeight = doc.page.height - 100;

      // Headers
      const fields = reportResult.metadata.fields.slice(0, 6); // Limit fields for PDF
      let xPosition = 50;
      fields.forEach((field, index) => {
        doc.text(field, xPosition, yPosition);
        xPosition += 100;
      });

      yPosition += 20;

      // Data rows (limit for demo)
      const limitedData = reportResult.data.slice(0, 50);
      limitedData.forEach(row => {
        if (yPosition > pageHeight) {
          doc.addPage();
          yPosition = 50;
        }

        xPosition = 50;
        fields.forEach(field => {
          const value = row[field] || '';
          doc.text(String(value).substring(0, 15), xPosition, yPosition);
          xPosition += 100;
        });
        yPosition += 15;
      });

      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          resolve({
            format: 'pdf',
            filename: `${filename}.pdf`,
            filepath,
            size: fs.statSync(filepath).size,
            recordCount: reportResult.data.length
          });
        });
        doc.on('error', reject);
      });
    } catch (error) {
      reportLogger.error('Failed to export PDF', { error: error.message });
      throw error;
    }
  }

  // Export to JSON
  async exportToJSON(reportResult, filename, options = {}) {
    try {
      const jsonData = {
        metadata: {
          reportName: reportResult.reportName,
          executedAt: reportResult.executedAt,
          executedBy: reportResult.executedBy,
          dataSource: reportResult.dataSource,
          totalRecords: reportResult.totalRecords,
          fields: reportResult.metadata.fields,
          filters: reportResult.metadata.filters
        },
        data: reportResult.data
      };

      const filepath = path.join(process.cwd(), 'exports', `${filename}.json`);
      
      // Ensure exports directory exists
      const exportsDir = path.dirname(filepath);
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2));

      return {
        format: 'json',
        filename: `${filename}.json`,
        filepath,
        size: fs.statSync(filepath).size,
        recordCount: reportResult.data.length
      };
    } catch (error) {
      reportLogger.error('Failed to export JSON', { error: error.message });
      throw error;
    }
  }

  // Utility methods
  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateCacheKey(reportId, options) {
    return `${reportId}_${JSON.stringify(options)}`;
  }

  async validateReportConfig(report) {
    // Validate data source
    if (!this.dataSourceTypes[report.dataSource]) {
      throw new Error(`Invalid data source: ${report.dataSource}`);
    }

    // Validate fields
    if (!report.fields || report.fields.length === 0) {
      throw new Error('Report must have at least one field');
    }

    // Validate aggregations
    if (report.aggregations) {
      report.aggregations.forEach(agg => {
        if (!this.aggregationTypes[agg.type]) {
          throw new Error(`Invalid aggregation type: ${agg.type}`);
        }
      });
    }

    return true;
  }

  async checkReportPermissions(report, userId) {
    // Implement permission checking logic
    return true;
  }

  hasReportAccess(report, userId) {
    // Implement access control logic
    return report.isPublic || report.createdBy === userId;
  }

  async executeReportQuery(report, options) {
    // Mock implementation - replace with actual database query
    const mockData = [];
    const recordCount = Math.floor(Math.random() * 1000) + 100;
    
    for (let i = 0; i < recordCount; i++) {
      const record = {};
      report.fields.forEach(field => {
        record[field] = this.generateMockFieldValue(field);
      });
      mockData.push(record);
    }

    return mockData;
  }

  generateMockFieldValue(field) {
    // Generate mock data based on field name
    switch (field) {
      case 'first_name':
        return ['John', 'Jane', 'Bob', 'Alice', 'Charlie'][Math.floor(Math.random() * 5)];
      case 'last_name':
        return ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)];
      case 'email':
        return `user${Math.floor(Math.random() * 1000)}@company.com`;
      case 'department':
        return ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'][Math.floor(Math.random() * 5)];
      case 'hire_date':
        return moment().subtract(Math.floor(Math.random() * 1000), 'days').format('YYYY-MM-DD');
      case 'salary':
        return Math.floor(Math.random() * 100000) + 50000;
      default:
        return `Sample ${field}`;
    }
  }

  async processReportData(data, report) {
    // Apply any post-processing, calculations, or transformations
    return data;
  }

  async generateReportVisualizations(data, report) {
    // Generate visualizations based on report configuration
    return [];
  }

  async getDataSourceFields(dataSource) {
    // Mock implementation - return available fields for data source
    const fieldMappings = {
      employees: ['id', 'first_name', 'last_name', 'email', 'department', 'position', 'hire_date', 'salary', 'status'],
      applications: ['id', 'job_id', 'candidate_name', 'email', 'application_date', 'status', 'source'],
      jobs: ['id', 'title', 'department', 'location', 'type', 'status', 'posted_date', 'salary_range'],
      interviews: ['id', 'application_id', 'interviewer', 'scheduled_date', 'status', 'feedback'],
      performance: ['id', 'employee_id', 'review_period', 'overall_rating', 'goals_completed', 'improvement_areas'],
      attendance: ['id', 'employee_id', 'date', 'check_in_time', 'check_out_time', 'hours_worked', 'status']
    };

    return fieldMappings[dataSource] || [];
  }

  async getDataSourceRecordCount(dataSource) {
    // Mock implementation - return record count for data source
    return Math.floor(Math.random() * 10000) + 1000;
  }
}

module.exports = new ReportBuilderService();
