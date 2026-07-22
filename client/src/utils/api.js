const API_URL = 'http://localhost:5000/api';

// Simple fetch wrapper with interceptors for token refresh
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Skip content-type if sending FormData (image upload)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // Attach access token
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, fetchOptions);

    // If unauthorized, attempt token refresh once
    if (response.status === 401 && !options._retry) {
      options._retry = true;
      console.log('Access token expired, attempting silent refresh...');

      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Send credentials (cookie contains the refresh token)
          body: JSON.stringify({}),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.accessToken;
          localStorage.setItem('accessToken', newAccessToken);

          // Retry the original request with the new token
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          response = await fetch(url, fetchOptions);
        } else {
          // Refresh token failed/expired
          console.warn('Refresh token expired, logging user out...');
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          // Optional: redirect to login or let the app state trigger it
        }
      } catch (refreshErr) {
        console.error('Error refreshing token:', refreshErr);
      }
    }

    // Parse response
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Request failed on ${endpoint}:`, error.message);
    throw error;
  }
};
