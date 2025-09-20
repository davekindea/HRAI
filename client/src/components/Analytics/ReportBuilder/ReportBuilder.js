import React, { useState, useEffect } from 'react';
import { reportBuilderService } from '../../../services/analyticsService';
import LoadingSpinner from '../../UI/LoadingSpinner';
import { 
  Plus, 
  Save, 
  Eye, 
  Play, 
  Settings, 
  Download,
  Copy,
  Trash2,
  FileText,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

const ReportBuilder = () => {
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Report configuration state
  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    dataSource: '',
    fields: [],
    filters: {},
    groupBy: [],
    chartType: 'table',
    sortBy: '',
    sortOrder: 'asc'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [reportsData, templatesData, dataSourcesData] = await Promise.all([
        reportBuilderService.getReport(),
        reportBuilderService.getTemplates(),
        reportBuilderService.getDataSources()
      ]);
      setReports(reportsData.reports || []);
      setTemplates(templatesData.templates || []);
      setDataSources(dataSourcesData.dataSources || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setReportConfig({
      name: '',
      description: '',
      dataSource: '',
      fields: [],
      filters: {},
      groupBy: [],
      chartType: 'table',
      sortBy: '',
      sortOrder: 'asc'
    });
    setSelectedReport(null);
    setShowBuilder(true);
    setPreviewData(null);
  };

  const handleEditReport = (report) => {
    setReportConfig(report.config);
    setSelectedReport(report);
    setShowBuilder(true);
  };

  const handleSaveReport = async () => {
    try {
      if (selectedReport) {
        await reportBuilderService.updateReport(selectedReport.id, reportConfig);
      } else {
        await reportBuilderService.createReport(reportConfig);
      }
      await fetchInitialData();
      setShowBuilder(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const handlePreviewReport = async () => {
    try {
      setPreviewLoading(true);
      const preview = await reportBuilderService.previewReport(reportConfig);
      setPreviewData(preview);
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await reportBuilderService.deleteReport(reportId);
      await fetchInitialData();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const getChartIcon = (chartType) => {
    switch (chartType) {
      case 'bar':
        return BarChart3;
      case 'pie':
        return PieChart;
      case 'line':
        return LineChart;
      default:
        return FileText;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {!showBuilder ? (
        // Reports List View
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Report Builder</h1>
              <p className="mt-2 text-gray-600">
                Create, manage, and run custom reports
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </button>
          </div>

          {/* Templates Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 cursor-pointer"
                  onClick={() => {
                    setReportConfig({ ...reportConfig, ...template.config });
                    setShowBuilder(true);
                  }}
                >
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Existing Reports */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Reports</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {reports.map((report) => {
                const ChartIcon = getChartIcon(report.config?.chartType);
                return (
                  <div key={report.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ChartIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <h4 className="font-medium text-gray-900">{report.name}</h4>
                          <p className="text-sm text-gray-600">{report.description}</p>
                          <p className="text-xs text-gray-500">
                            Last modified: {new Date(report.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditReport(report)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditReport(report)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {}}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {reports.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No reports created yet</p>
                  <button
                    onClick={handleCreateNew}
                    className="mt-4 text-primary-600 hover:text-primary-700"
                  >
                    Create your first report
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // Report Builder View
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Report Configuration</h3>
                <button
                  onClick={() => setShowBuilder(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Name
                  </label>
                  <input
                    type="text"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={reportConfig.description}
                    onChange={(e) => setReportConfig({ ...reportConfig, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Source
                  </label>
                  <select
                    value={reportConfig.dataSource}
                    onChange={(e) => setReportConfig({ ...reportConfig, dataSource: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select data source</option>
                    {dataSources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chart Type
                  </label>
                  <select
                    value={reportConfig.chartType}
                    onChange={(e) => setReportConfig({ ...reportConfig, chartType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="table">Table</option>
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="area">Area Chart</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handlePreviewReport}
                  disabled={!reportConfig.name || !reportConfig.dataSource}
                  className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </button>
                <button
                  onClick={handleSaveReport}
                  disabled={!reportConfig.name || !reportConfig.dataSource}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              {previewLoading ? (
                <LoadingSpinner />
              ) : previewData ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    {previewData.rows} rows • Generated {new Date().toLocaleString()}
                  </div>
                  {reportConfig.chartType === 'table' ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {previewData.columns?.map((column) => (
                              <th
                                key={column}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.data?.slice(0, 10).map((row, index) => (
                            <tr key={index}>
                              {previewData.columns?.map((column) => (
                                <td
                                  key={column}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                  {row[column]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center border border-gray-200 rounded-lg">
                      <p className="text-gray-500">Chart preview would appear here</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Configure your report and click Preview to see results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportBuilder;
