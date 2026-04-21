(function() {
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
        let [url, config] = args;
        
        // Ensure headers object exists
        config = config || {};
        config.headers = config.headers || {};
        
        // Always try to set Content-Type if not set and body is present
        if (config.body && !config.headers['Content-Type'] && !(config.body instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }

        // Add JWT token if it exists in localStorage
        const token = localStorage.getItem('vaxToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await originalFetch(url, config);
            
            // Handle global 401/403 (Unauthorized/Forbidden) - possibly expired or invalid token
            if ((response.status === 401 || response.status === 403) && !url.includes('/login') && !url.includes('/signup')) {
                console.warn('Unauthorized request. Logging out...');
                localStorage.removeItem('vaxUser');
                localStorage.removeItem('vaxToken');
                if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
                    window.location.href = '/index.html';
                }
            }

            return response;
        } catch (error) {
            console.error('Fetch interceptor error:', error);
            throw error;
        }
    };
})();
