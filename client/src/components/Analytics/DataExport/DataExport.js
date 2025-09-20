import React, { useState, useEffect } from 'react';
import { dataExportService } from '../../../services/analyticsService';
import LoadingSpinner from '../../UI/LoadingSpinner';
import { 
  Download, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Trash2,
  Settings,
  Plus
} from 'lucide-react';

const DataExport = () => {
  const [exports, setExports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    name: '',
    dataSource: '',
    format: 'csv',
    filters: {},
    fields: [],
    templateId: ''
  });

  useEffect(() => {
    fetchExportData();
  }, []);

  const fetchExportData = async () => {
    try {
      setLoading(true);
      const [exportsData, templatesData, formatsData] = await Promise.all([
        dataExportService.getExportHistory(),
        dataExportService.getExportTemplates(),
        dataExportService.getAvailableFormats()
      ]);
      setExports(exportsData.exports || []);
      setTemplates(templatesData.templates || []);
      setFormats(formatsData.formats || []);
    } catch (error) {
      console.error('Error fetching export data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportInitiate = async () => {
    try {
      const result = await dataExportService.initiateExport(exportConfig);
      setShowExportModal(false);
      setExportConfig({
        name: '',
        dataSource: '',
        format: 'csv',
        filters: {},
        fields: [],
        templateId: ''
      });
      fetchExportData();
    } catch (error) {
      console.error('Error initiating export:', error);
    }
  };

  const handleDownload = async (exportId) => {
    try {
      const response = await dataExportService.downloadExport(exportId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `export_${exportId}.${exports.find(e => e.id === exportId)?.format || 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading export:', error);
    }
  };

  const handleCancelExport = async (exportId) => {
    try {
      await dataExportService.cancelExport(exportId);
      fetchExportData();
    } catch (error) {
      console.error('Error canceling export:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Export</h1>
          <p className="mt-2 text-gray-600">
            Export your data in various formats for analysis and reporting
          </p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Export
        </button>
      </div>

      {/* Quick Export Templates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Export Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 cursor-pointer"
              onClick={() => {
                setExportConfig({ ...exportConfig, templateId: template.id, ...template.config });
                setShowExportModal(true);
              }}
            >
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <h4 className="font-medium text-gray-900">{template.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">{template.description}</p>
              <div className="flex items-center text-xs text-gray-500">
                <span>{template.format.toUpperCase()}</span>
                <span className="mx-2">•</span>
                <span>{template.estimatedSize}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Export History</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {exports.map((exportItem) => (
            <div key={exportItem.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(exportItem.status)}
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">{exportItem.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Format: {exportItem.format.toUpperCase()}</span>
                      <span>Created: {new Date(exportItem.createdAt).toLocaleDateString()}</span>
                      {exportItem.fileSize && <span>Size: {formatFileSize(exportItem.fileSize)}</span>}
                      {exportItem.recordCount && <span>Records: {exportItem.recordCount.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(exportItem.status)}`}>
                    {exportItem.status.charAt(0).toUpperCase() + exportItem.status.slice(1)}
                  </span>
                  {exportItem.status === 'completed' && (
                    <button
                      onClick={() => handleDownload(exportItem.id)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  {(exportItem.status === 'pending' || exportItem.status === 'processing') && (
                    <button
                      onClick={() => handleCancelExport(exportItem.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Cancel"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {exportItem.progress && exportItem.status === 'processing' && (
                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${exportItem.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{exportItem.progress}% complete</p>
                </div>
              )}
            </div>
          ))}
          {exports.length === 0 && (
            <div className="px-6 py-8 text-center">
              <Download className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No exports created yet</p>
              <button
                onClick={() => setShowExportModal(true)}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                Create your first export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Create New Export</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Name
                </label>
                <input
                  type="text"
                  value={exportConfig.name}
                  onChange={(e) => setExportConfig({ ...exportConfig, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Monthly Candidate Report"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Source
                </label>
                <select
                  value={exportConfig.dataSource}
                  onChange={(e) => setExportConfig({ ...exportConfig, dataSource: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select data source</option>
                  <option value="candidates">Candidates</option>
                  <option value="jobs">Jobs</option>
                  <option value="applications">Applications</option>
                  <option value="interviews">Interviews</option>
                  <option value="hires">Hires</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={exportConfig.format}
                  onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {formats.map((format) => (
                    <option key={format.id} value={format.id}>
                      {format.name} (.{format.extension})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleExportInitiate}
                disabled={!exportConfig.name || !exportConfig.dataSource}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExport;
