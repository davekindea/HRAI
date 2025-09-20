import api from './api';

class PayrollService {
  // ============================================================================
  // COMPENSATION CALCULATOR SERVICES
  // ============================================================================

  async calculateTotalCompensation(data) {
    const response = await api.post('/compensation-calculator/calculate', data);
    return response.data;
  }

  async generateOfferPackage(data) {
    const response = await api.post('/compensation-calculator/offer-package', data);
    return response.data;
  }

  async calculateEquityValue(data) {
    const response = await api.post('/compensation-calculator/equity-value', data);
    return response.data;
  }

  async getMarketData(params) {
    const response = await api.get('/compensation-calculator/market-data', { params });
    return response.data;
  }

  async getCompensationHistory(employeeId, params) {
    const response = await api.get(`/compensation-calculator/history/${employeeId}`, { params });
    return response.data;
  }

  async compareOffers(data) {
    const response = await api.post('/compensation-calculator/compare-offers', data);
    return response.data;
  }

  async getCostOfLivingAdjustments(params) {
    const response = await api.get('/compensation-calculator/cost-of-living', { params });
    return response.data;
  }

  // ============================================================================
  // BENEFITS MANAGEMENT SERVICES
  // ============================================================================

  async getAvailableBenefits(params) {
    const response = await api.get('/benefits-management/benefits', { params });
    return response.data;
  }

  async getEligibleBenefits(employeeId, params) {
    const response = await api.get(`/benefits-management/eligible/${employeeId}`, { params });
    return response.data;
  }

  async enrollInBenefits(data) {
    const response = await api.post('/benefits-management/enroll', data);
    return response.data;
  }

  async updateBenefitEnrollment(enrollmentId, data) {
    const response = await api.put(`/benefits-management/enrollment/${enrollmentId}`, data);
    return response.data;
  }

  async processLifeEvent(data) {
    const response = await api.post('/benefits-management/life-events', data);
    return response.data;
  }

  async getBenefitSummary(employeeId, params) {
    const response = await api.get(`/benefits-management/summary/${employeeId}`, { params });
    return response.data;
  }

  async manageDependents(data) {
    const response = await api.post('/benefits-management/dependents', data);
    return response.data;
  }

  async getBenefitUtilization(params) {
    const response = await api.get('/benefits-management/utilization', { params });
    return response.data;
  }

  // ============================================================================
  // PAYROLL PROCESSING SERVICES
  // ============================================================================

  async calculatePayroll(data) {
    const response = await api.post('/payroll-processing/calculate', data);
    return response.data;
  }

  async processPayroll(data) {
    const response = await api.post('/payroll-processing/process', data);
    return response.data;
  }

  async getPayStubs(params) {
    const response = await api.get('/payroll-processing/paystubs', { params });
    return response.data;
  }

  async processDirectDeposit(data) {
    const response = await api.post('/payroll-processing/direct-deposit', data);
    return response.data;
  }

  async getDeductions(params) {
    const response = await api.get('/payroll-processing/deductions', { params });
    return response.data;
  }

  async calculateOvertime(data) {
    const response = await api.post('/payroll-processing/overtime', data);
    return response.data;
  }

  async getTimeOffAccruals(employeeId, params) {
    const response = await api.get(`/payroll-processing/accruals/${employeeId}`, { params });
    return response.data;
  }

  async validatePayrollData(data) {
    const response = await api.post('/payroll-processing/validate', data);
    return response.data;
  }

  // ============================================================================
  // COMPENSATION MANAGEMENT SERVICES
  // ============================================================================

  async processRaise(data) {
    const response = await api.post('/compensation-management/raise', data);
    return response.data;
  }

  async processBonusPayment(data) {
    const response = await api.post('/compensation-management/bonus', data);
    return response.data;
  }

  async grantEquityCompensation(data) {
    const response = await api.post('/compensation-management/equity-grant', data);
    return response.data;
  }

  async processPromotion(data) {
    const response = await api.post('/compensation-management/promotion', data);
    return response.data;
  }

  async getCompensationReviews(params) {
    const response = await api.get('/compensation-management/reviews', { params });
    return response.data;
  }

  async analyzePayEquity(params) {
    const response = await api.get('/compensation-management/pay-equity', { params });
    return response.data;
  }

  async getSalaryBands(params) {
    const response = await api.get('/compensation-management/salary-bands', { params });
    return response.data;
  }

  async getCompensationRatio(employeeId, params) {
    const response = await api.get(`/compensation-management/comp-ratio/${employeeId}`, { params });
    return response.data;
  }

  // ============================================================================
  // TAX COMPLIANCE SERVICES
  // ============================================================================

  async getTaxJurisdictions(params) {
    const response = await api.get('/tax-compliance/jurisdictions', { params });
    return response.data;
  }

  async getTaxRates(jurisdictionId, params) {
    const response = await api.get(`/tax-compliance/rates/${jurisdictionId}`, { params });
    return response.data;
  }

  async calculateTaxWithholdings(data) {
    const response = await api.post('/tax-compliance/withholdings/calculate', data);
    return response.data;
  }

  async getTaxForms(params) {
    const response = await api.get('/tax-compliance/forms', { params });
    return response.data;
  }

  async generateTaxDocuments(data) {
    const response = await api.post('/tax-compliance/forms/generate', data);
    return response.data;
  }

  async submitTaxFiling(data) {
    const response = await api.post('/tax-compliance/filings/submit', data);
    return response.data;
  }

  async getComplianceAlerts(params) {
    const response = await api.get('/tax-compliance/alerts', { params });
    return response.data;
  }

  async updateAlertStatus(alertId, data) {
    const response = await api.patch(`/tax-compliance/alerts/${alertId}`, data);
    return response.data;
  }

  async runComplianceAudit(data) {
    const response = await api.post('/tax-compliance/audit/run', data);
    return response.data;
  }

  async getRegulatoryUpdates(params) {
    const response = await api.get('/tax-compliance/regulatory-updates', { params });
    return response.data;
  }

  async updateTaxSettings(data) {
    const response = await api.put('/tax-compliance/settings', data);
    return response.data;
  }

  async getTaxSettings() {
    const response = await api.get('/tax-compliance/settings');
    return response.data;
  }

  // ============================================================================
  // PAYROLL REPORTING SERVICES
  // ============================================================================

  async getPayrollSummary(params) {
    const response = await api.get('/payroll-reporting/summary', { params });
    return response.data;
  }

  async generateDetailedReport(data) {
    const response = await api.post('/payroll-reporting/detailed', data);
    return response.data;
  }

  async getPayStubReports(params) {
    const response = await api.get('/payroll-reporting/paystubs', { params });
    return response.data;
  }

  async generatePayStub(data) {
    const response = await api.post('/payroll-reporting/paystubs/generate', data);
    return response.data;
  }

  async getCostCenterReports(params) {
    const response = await api.get('/payroll-reporting/cost-centers', { params });
    return response.data;
  }

  async getLaborDistribution(params) {
    const response = await api.get('/payroll-reporting/labor-distribution', { params });
    return response.data;
  }

  async getTaxLiabilityReport(params) {
    const response = await api.get('/payroll-reporting/tax-liability', { params });
    return response.data;
  }

  async getBenefitsUtilizationReport(params) {
    const response = await api.get('/payroll-reporting/benefits-utilization', { params });
    return response.data;
  }

  async getComplianceReports(params) {
    const response = await api.get('/payroll-reporting/compliance', { params });
    return response.data;
  }

  async exportReport(data) {
    const response = await api.post('/payroll-reporting/export', data);
    return response.data;
  }

  async scheduleReport(data) {
    const response = await api.post('/payroll-reporting/schedule', data);
    return response.data;
  }

  async getScheduledReports(params) {
    const response = await api.get('/payroll-reporting/scheduled', { params });
    return response.data;
  }

  async updateScheduledReport(scheduleId, data) {
    const response = await api.put(`/payroll-reporting/scheduled/${scheduleId}`, data);
    return response.data;
  }

  async deleteScheduledReport(scheduleId) {
    const response = await api.delete(`/payroll-reporting/scheduled/${scheduleId}`);
    return response.data;
  }

  async getAuditTrail(params) {
    const response = await api.get('/payroll-reporting/audit-trail', { params });
    return response.data;
  }

  async getPayrollAnalytics(params) {
    const response = await api.get('/payroll-reporting/analytics', { params });
    return response.data;
  }
}

export default new PayrollService();