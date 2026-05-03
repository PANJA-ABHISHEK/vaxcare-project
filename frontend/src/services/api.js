export const getBaseUrl = () => {
  return "";
};

export const fetchApi = async (endpoint, config = {}) => {
  const url = `${getBaseUrl()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  config.headers = config.headers || {};
  
  if (config.body && !config.headers['Content-Type'] && !(config.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('vaxToken');
  if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
      const response = await fetch(url, config);
      
      if ((response.status === 401 || response.status === 403) && !url.includes('/login') && !url.includes('/signup')) {
          console.warn('Unauthorized request. Logging out...');
          localStorage.removeItem('vaxUser');
          localStorage.removeItem('vaxToken');
          if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
              window.location.href = './index.html';
          }
      }

      return response;
  } catch (error) {
      console.error('API Fetch error:', error);
      throw error;
  }
};
