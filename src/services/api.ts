export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

const BASE_URL = ''; // Relative path leverages Vite middleware / Express directly

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('documorph_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async register(data: { name: string; email: string; password: string }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch('/api/auth/me', {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async updateProfile(data: { name?: string; avatar?: string }) {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async googleAuth(data: { email: string; name?: string; avatar?: string }) {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Tool Processing
  async processTool(toolSlug: string, formData: FormData) {
    try {
      const res = await fetch(`/api/tools/process/${toolSlug}`, {
        method: 'POST',
        headers: { ...getAuthHeader() }, // Note: fetch sets multipart boundary automatically
        body: formData,
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          return {
            success: false,
            message: `Service communication error (${res.status}). Please retry your conversion.`,
          };
        }
      }

      if (!res.ok) {
        return {
          success: false,
          message: data?.message || `Server error (${res.status}): ${res.statusText || 'Processing failed'}`,
          code: data?.code,
        };
      }

      if (!data || typeof data !== 'object') {
        return {
          success: false,
          message: 'Server did not return a valid response object. Please try again.',
        };
      }

      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network connection error during processing. Please try again.',
      };
    }
  },

  async downloadProcessedBlob(downloadUrl: string): Promise<Blob> {
    const res = await fetch(downloadUrl);
    if (!res.ok) {
      throw new Error(`Failed to download file (${res.status})`);
    }
    return res.blob();
  },

  async inspectPdf(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/tools/inspect', {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  async getCloudinaryStatus() {
    try {
      const res = await fetch('/api/tools/cloudinary-status');
      return await res.json();
    } catch {
      return { success: false, status: { connected: false, message: 'Could not connect to server.' } };
    }
  },

  // Files
  async getMyFiles() {
    const res = await fetch('/api/files', {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    return res.json();
  },

  async renameFile(id: string, newName: string) {
    const res = await fetch(`/api/files/${id}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ newName }),
    });
    return res.json();
  },

  async toggleFavorite(id: string) {
    const res = await fetch(`/api/files/${id}/favorite`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async deleteFile(id: string) {
    const res = await fetch(`/api/files/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  // Conversions
  async getConversions() {
    const res = await fetch('/api/conversions/history', {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async deleteConversion(id: string) {
    const res = await fetch(`/api/conversions/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async clearHistory() {
    const res = await fetch('/api/conversions/clear', {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  // Admin
  async getAdminStats() {
    const res = await fetch('/api/admin/stats', {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async getAdminUsers() {
    const res = await fetch('/api/admin/users', {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async updateUserStatus(id: string, updates: any) {
    const res = await fetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteAdminUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async getAdminFiles() {
    const res = await fetch('/api/admin/files', {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async getAdminConversions() {
    const res = await fetch('/api/admin/conversions', {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async getAdminLogs() {
    const res = await fetch('/api/admin/logs', {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async getAdminSettings() {
    const res = await fetch('/api/admin/settings', {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async updateAdminSettings(settings: any) {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Payments & Plan Upgrades
  async upgradePlan(params: { plan: 'pro' | 'enterprise'; billingCycle?: 'monthly' | 'yearly' }) {
    const res = await fetch('/api/payment/upgrade-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async initiateSSLCommerzPayment(params: {
    plan: 'pro' | 'enterprise';
    currency?: 'BDT' | 'USD';
    billingCycle?: 'monthly' | 'yearly';
    phoneNumber?: string;
  }) {
    const res = await fetch('/api/payment/sslcommerz/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async simulateCompletePayment(params: {
    tranId: string;
    paymentMethod?: string;
    phoneNumber?: string;
  }) {
    const res = await fetch('/api/payment/sslcommerz/simulate-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getMyPayments() {
    const res = await fetch('/api/payment/history', {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async getPaymentStatus(tranId: string) {
    const res = await fetch(`/api/payment/status/${tranId}`);
    return res.json();
  },
};
