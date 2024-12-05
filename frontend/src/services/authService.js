const API_URL = process.env.REACT_APP_API_URL;

// Function to log in
export const handleLogin = async (credentials) => {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
  
    const data = await response.json();
    console.log("Login response data:", data);
    if (data.token) {
      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user_id);
      console.log("Stored user ID:", localStorage.getItem('userId'));
    }
  };
  
  // Function to check if the user is logged in
  export const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    return token !== null; // You can add more validation, like checking expiration
  };
  
  // Function to log out
  export const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token on logout
  };
  
  // Function to get the token for API requests
  export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  };
  