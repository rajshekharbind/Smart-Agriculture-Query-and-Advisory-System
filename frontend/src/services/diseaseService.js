import api from './api';

// Disease prediction service
export const diseaseService = {
  // Predict disease from image
  predictDisease: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const response = await api.post('/api/predict-disease/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for image processing
      });
      return response.data;
    } catch (error) {
      console.error('Disease prediction failed:', error);
      const detail = error?.response?.data?.detail;
      throw new Error(detail || error.message || 'Disease prediction failed');
    }
  }
};
