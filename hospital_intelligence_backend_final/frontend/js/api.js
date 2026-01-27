const API_BASE = 'http://localhost:8080/api';

export const api = {
    // Core Request Handler
    request: async (endpoint, method = 'GET', body = null) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });
            
            // Handle Auth Failure
            if (res.status === 401) { 
                console.warn("Session expired or unauthorized");
                window.location.href = 'login.html'; 
                return null;
            }

            // Handle Empty Responses (void methods)
            const text = await res.text();
            return text ? JSON.parse(text) : {};
            
        } catch (e) {
            console.error(`API Error ${endpoint}:`, e);
            return null;
        }
    },

    // Visual helper for the heartbeat animation only (No database equivalent)
    getMockVitals: () => ({
        bpm: 60 + Math.floor(Math.random() * 40),
        spo2: 95 + Math.floor(Math.random() * 5),
        temp: (36.5 + Math.random()).toFixed(1)
    }),
    
    // Auth
    login: async (username, password) => {
        const data = await api.request('/auth/login', 'POST', { username, password });
        if (data && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('user', username);
            return data.role;
        }
        return null;
    },

    logout: () => {
        localStorage.clear();
        window.location.href = 'login.html';
    }
};