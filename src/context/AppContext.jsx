import { createContext, useState, useEffect } from "react";
import axios from 'axios';

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const currencySymbol = '$';
  const API_BASE_URL = 'http://localhost:5000/api';

  // Configure axios defaults
  axios.defaults.baseURL = API_BASE_URL;
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Fetch doctors from backend
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/doctors');
      setDoctors(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to fetch doctors');
      // Fallback to static data if API fails
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token: newToken, ...userData } = response.data.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true, data: response.data.data };
    } catch (err) {
      console.error('Login error:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token: newToken, ...userInfo } = response.data.data;
      
      setToken(newToken);
      setUser(userInfo);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true, data: response.data.data };
    } catch (err) {
      console.error('Registration error:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Get current user
  const getCurrentUser = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.data);
    } catch (err) {
      console.error('Error fetching user:', err);
      logout(); // Clear invalid token
    }
  };

  // Create appointment
  const createAppointment = async (appointmentData) => {
    try {
      const response = await axios.post('/appointments', appointmentData);
      return { success: true, data: response.data.data };
    } catch (err) {
      console.error('Appointment creation error:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Failed to create appointment' 
      };
    }
  };

  // Get user appointments
  const getUserAppointments = async () => {
    try {
      const response = await axios.get('/appointments');
      return { success: true, data: response.data.data };
    } catch (err) {
      console.error('Error fetching appointments:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Failed to fetch appointments' 
      };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/users/profile', profileData);
      setUser(response.data.data);
      return { success: true, data: response.data.data };
    } catch (err) {
      console.error('Profile update error:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Failed to update profile' 
      };
    }
  };

  // Initialize app
  useEffect(() => {
    fetchDoctors();
    if (token) {
      getCurrentUser();
    }
  }, []);

  const value = {
    doctors,
    loading,
    error,
    user,
    token,
    currencySymbol,
    login,
    register,
    logout,
    createAppointment,
    getUserAppointments,
    updateProfile,
    fetchDoctors
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;