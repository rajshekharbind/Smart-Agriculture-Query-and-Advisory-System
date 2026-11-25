import api from './api';

export const agriService = {
  recommendCrop: async (payload) => {
    const res = await api.post('/api/recommend/crop', payload);
    return res.data;
  },
  recommendSeed: async (payload) => {
    const res = await api.post('/api/recommend/seed', payload);
    return res.data;
  },
  analyzeSoil: async (payload) => {
    const res = await api.post('/api/soil/analyze', payload);
    return res.data;
  },
  analyzeSoilImage: async (file, language = 'Hindi') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    const res = await api.post('/api/soil/analyze-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  identifyPest: async (file, language = 'Hindi') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    const res = await api.post('/api/pest/identify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getWeather: async (location) => {
    const res = await api.get('/api/weather', { params: { location } });
    return res.data;
  },
  planIrrigation: async (payload) => {
    const res = await api.post('/api/irrigation/plan', payload);
    return res.data;
  },
  getMandiPrices: async (state, crop) => {
    const res = await api.get('/api/mandi/prices', { params: { state, crop } });
    return res.data;
  },
  getSchemes: async (category) => {
    const res = await api.get('/api/schemes', { params: { category } });
    return res.data;
  },
  getInsuranceHelp: async (payload) => {
    const res = await api.post('/api/insurance/claim-assistant', payload);
    return res.data;
  },
  getOrganicGuides: async () => {
    const res = await api.get('/api/guides/organic');
    return res.data;
  },
  getEquipmentGuides: async () => {
    const res = await api.get('/api/guides/equipment');
    return res.data;
  },
  getCalendars: async () => {
    const res = await api.get('/api/calendar');
    return res.data;
  },
  createCalendar: async (payload) => {
    const res = await api.post('/api/calendar', payload);
    return res.data;
  },
  deleteCalendar: async (id) => {
    const res = await api.delete(`/api/calendar/${id}`);
    return res.data;
  },
  calculateProfit: async (payload) => {
    const res = await api.post('/api/calculator/profit', payload);
    return res.data;
  },
  getProfitHistory: async () => {
    const res = await api.get('/api/calculator/history');
    return res.data;
  },
  getNotifications: async () => {
    const res = await api.get('/api/notifications');
    return res.data;
  },
  createNotification: async (payload) => {
    const res = await api.post('/api/notifications', payload);
    return res.data;
  },
  markNotificationRead: async (id) => {
    const res = await api.patch(`/api/notifications/${id}/read`);
    return res.data;
  },
  getPosts: async () => {
    const res = await api.get('/api/community/posts');
    return res.data;
  },
  createPost: async (payload) => {
    const res = await api.post('/api/community/posts', payload);
    return res.data;
  },
  likePost: async (postId) => {
    const res = await api.post(`/api/community/posts/${postId}/like`);
    return res.data;
  },
  addComment: async (postId, payload) => {
    const res = await api.post(`/api/community/posts/${postId}/comments`, payload);
    return res.data;
  },
  pdfList: async () => {
    const res = await api.get('/api/pdf/list');
    return res.data;
  },
  pdfUpload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/pdf/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  pdfSearch: async (q) => {
    const res = await api.get('/api/pdf/search', { params: { q } });
    return res.data;
  },
  pdfSummarize: async (filename, language = 'Hindi') => {
    const res = await api.post('/api/pdf/summarize', { filename, language });
    return res.data;
  },
  pdfAsk: async (question, language = 'Hindi') => {
    const res = await api.post('/api/pdf/ask', { question, language });
    return res.data;
  },
  downloadPdfReport: async (title, sections) => {
    const res = await api.post(
      '/api/pdf/report',
      { title, sections },
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agrosathi-report.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
  fetchTtsAudioUrl: async (text, language = 'Hindi') => {
    const res = await api.post(
      '/api/voice/tts',
      { text, language },
      { responseType: 'blob' }
    );
    return window.URL.createObjectURL(new Blob([res.data], { type: 'audio/mpeg' }));
  },
  getAdminOverview: async () => {
    const res = await api.get('/api/admin/overview');
    return res.data;
  },
};
