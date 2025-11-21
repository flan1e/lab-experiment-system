const API_BASE_URL = 'http://localhost:5000/api';

const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
                'Content-Type': 'application/json',
        ...(token && { 'x-auth-token': token })
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options, headers: {...headers, ...options.headers}
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return response.json();
};

export default apiCall;