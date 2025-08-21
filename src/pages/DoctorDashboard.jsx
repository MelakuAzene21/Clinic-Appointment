import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import assets from '../assets/assets';

const DoctorDashboard = () => {
  const { user, getDoctorAppointments, updateAppointmentStatus, addPrescription, updateProfile, getDoctorPatients, getDoctorEarnings, getDoctorAvailability, updateDoctorAvailability } = useContext(AppContext);
  const chatContext = useChat();
  const { createChat, chats, currentChat, setCurrentChat, sendMessage, isConnected, unreadCounts } = chatContext;
  
  console.log('ChatContext debug:', chatContext);
  console.log('setCurrentChat function:', setCurrentChat);
  
  // Ensure chat context is properly initialized
  if (!chatContext || !setCurrentChat) {
    console.error('ChatContext not properly initialized:', chatContext);
    return <div>Loading chat context...</div>;
  }
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    medicines: [{ name: '', dosage: '', duration: '', instructions: '' }],
    recommendations: '',
    nextVisit: ''
  });
  const [availability, setAvailability] = useState({
    slotDurationMinutes: 30,
    workingHours: {
      mon: { isWorking: true, start: '10:00', end: '21:00' },
      tue: { isWorking: true, start: '10:00', end: '21:00' },
      wed: { isWorking: true, start: '10:00', end: '21:00' },
      thu: { isWorking: true, start: '10:00', end: '21:00' },
      fri: { isWorking: true, start: '10:00', end: '21:00' },
      sat: { isWorking: true, start: '10:00', end: '21:00' },
      sun: { isWorking: true, start: '10:00', end: '21:00' }
    },
    daysOff: []
  });

  useEffect(() => {
    if (activeTab === 'availability') {
      fetchAvailability();
    }
  }, [activeTab]);

  const fetchAvailability = async () => {
    try {
      const result = await getDoctorAvailability();
      if (result.success) {
        // Merge defaults with backend data to ensure all keys present
        setAvailability(prev => ({
          ...prev,
          ...result.data,
          workingHours: { ...prev.workingHours, ...(result.data?.workingHours || {}) }
        }));
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch availability');
    }
  };

  const handleAvailabilityChange = (dayKey, field, value) => {
    setAvailability(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [dayKey]: {
          ...prev.workingHours[dayKey],
          [field]: field === 'isWorking' ? value : value
        }
      }
    }));
  };

  const handleSaveAvailability = async () => {
    try {
      const result = await updateDoctorAvailability(availability);
      if (result.success) {
        setSuccess('Availability updated successfully!');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to update availability');
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (activeTab === 'patients') {
      fetchPatients();
    } else if (activeTab === 'earnings') {
      fetchEarnings();
    }
  }, [activeTab]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const result = await getDoctorAppointments();
      if (result.success) {
        setAppointments(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const result = await getDoctorPatients();
      if (result.success) {
        setPatients(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch patients');
    }
  };

  const fetchEarnings = async (period = 'month') => {
    try {
      const result = await getDoctorEarnings(period);
      if (result.success) {
        setEarnings(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch earnings');
    }
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      const result = await updateAppointmentStatus(appointmentId, status);
      if (result.success) {
        setSuccess('Appointment status updated successfully!');
        fetchAppointments();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to update appointment status');
    }
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    try {
      const result = await addPrescription(selectedAppointment._id, prescriptionForm);
      if (result.success) {
        setSuccess('Prescription added successfully!');
        setShowPrescriptionModal(false);
        setSelectedAppointment(null);
        setPrescriptionForm({
          diagnosis: '',
          medicines: [{ name: '', dosage: '', duration: '', instructions: '' }],
          recommendations: '',
          nextVisit: ''
        });
        fetchAppointments();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to add prescription');
    }
  };

  const addMedicine = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', duration: '', instructions: '' }]
    }));
  };

  const removeMedicine = (index) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const updateMedicine = (index, field, value) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.map((medicine, i) => 
        i === index ? { ...medicine, [field]: value } : medicine
      )
    }));
  };

  // Chat functions
  const handleStartChat = async (patient) => {
    try {
      console.log('Starting chat with patient:', patient);
      console.log('setCurrentChat function in handleStartChat:', setCurrentChat);
      
      setSelectedPatient(patient);
      setShowChatModal(true);
      
      // Check if chat already exists
      const existingChat = chats.find(chat => 
        chat.patient?._id === patient._id || chat.patient === patient._id
      );
      
      console.log('Existing chat found:', existingChat);
      
      if (existingChat) {
        console.log('Setting existing chat:', existingChat);
        setCurrentChat(existingChat);
      } else {
        // Create new chat
        console.log('Creating new chat for patient:', patient._id);
        const result = await createChat(patient._id);
        console.log('Create chat result:', result);
        if (result.success) {
          setCurrentChat(result.data);
        }
      }
    } catch (err) {
      console.error('Error in handleStartChat:', err);
      setError('Failed to start chat');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !currentChat) return;

    try {
      const result = await sendMessage(currentChat._id, messageText.trim());
      if (result.success) {
        setMessageText('');
      } else {
        setError('Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stats = {
    totalAppointments: appointments.length,
    pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
    completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
    totalEarnings: appointments.filter(apt => apt.status === 'completed').reduce((sum, apt) => sum + apt.amount, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-600">Welcome back, Dr. {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Chat Notification */}
              <div className="relative">
                <button
                  onClick={() => setActiveTab('chats')}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors relative"
                  title="View chats"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
                    </span>
                  )}
                </button>
              </div>
              
              <img src={assets.profile_pic} alt="Doctor" className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-medium text-gray-900">Dr. {user?.name}</p>
                <p className="text-sm text-gray-500">Medical Professional</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[ 
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'appointments', name: 'Appointments', icon: '📅' },
              { id: 'patients', name: 'Patients', icon: '👥' },
              { id: 'chats', name: 'Chats', icon: '💬' },
              { id: 'earnings', name: 'Earnings', icon: '💰' },
              { id: 'availability', name: 'Availability', icon: '🗓️' },
              { id: 'profile', name: 'Profile', icon: '👤' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Manage Availability</h2>
              <button
                onClick={handleSaveAvailability}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save Changes
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slot duration (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="240"
                  value={availability.slotDurationMinutes}
                  onChange={(e) => setAvailability(prev => ({ ...prev, slotDurationMinutes: parseInt(e.target.value || '0') }))}
                  className="mt-1 block w-40 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { key: 'mon', label: 'Monday' },
                  { key: 'tue', label: 'Tuesday' },
                  { key: 'wed', label: 'Wednesday' },
                  { key: 'thu', label: 'Thursday' },
                  { key: 'fri', label: 'Friday' },
                  { key: 'sat', label: 'Saturday' },
                  { key: 'sun', label: 'Sunday' }
                ].map(day => (
                  <div key={day.key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">{day.label}</h3>
                      <label className="inline-flex items-center cursor-pointer">
                        <span className="mr-2 text-sm text-gray-600">Working</span>
                        <input
                          type="checkbox"
                          checked={availability.workingHours?.[day.key]?.isWorking}
                          onChange={(e) => handleAvailabilityChange(day.key, 'isWorking', e.target.checked)}
                          className="h-4 w-4 text-primary border-gray-300 rounded"
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Start</label>
                        <input
                          type="time"
                          value={availability.workingHours?.[day.key]?.start || '10:00'}
                          onChange={(e) => handleAvailabilityChange(day.key, 'start', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          disabled={!availability.workingHours?.[day.key]?.isWorking}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">End</label>
                        <input
                          type="time"
                          value={availability.workingHours?.[day.key]?.end || '21:00'}
                          onChange={(e) => handleAvailabilityChange(day.key, 'end', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          disabled={!availability.workingHours?.[day.key]?.isWorking}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days Off</label>
                <div className="space-y-2">
                  {(availability.daysOff || []).map((d, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={new Date(d).toISOString().split('T')[0]}
                        onChange={(e) => {
                          const v = e.target.value
                          setAvailability(prev => {
                            const next = [...(prev.daysOff || [])]
                            next[idx] = new Date(v)
                            return { ...prev, daysOff: next }
                          })
                        }}
                        className="border border-gray-300 rounded-md px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => setAvailability(prev => ({ ...prev, daysOff: (prev.daysOff || []).filter((_, i) => i !== idx) }))}
                        className="text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAvailability(prev => ({ ...prev, daysOff: [...(prev.daysOff || []), new Date()] }))}
                    className="text-primary text-sm hover:text-primary/80"
                  >
                    + Add Day Off
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalAppointments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pendingAppointments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.completedAppointments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-semibold text-gray-900">${stats.totalEarnings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Chats</p>
                    <p className="text-2xl font-semibold text-gray-900">{chats.length}</p>
                    {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 0 && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full ml-2">
                        {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab('chats')}
                    className="ml-auto px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    View Chats
                  </button>
                </div>
              </div>
            </div>

            {/* Today's Appointments */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading appointments...</p>
                  </div>
                ) : appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={assets.profile_pic} 
                            alt="Patient" 
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{appointment.patient?.name}</p>
                            <p className="text-sm text-gray-600">{formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          <button
                            onClick={() => handleStartChat(appointment.patient)}
                            className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition-colors"
                            title="Chat with patient"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No appointments for today</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Manage Appointments</h2>
              <button
                onClick={fetchAppointments}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading appointments...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.map((appointment) => (
                        <tr key={appointment._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img className="h-10 w-10 rounded-full" src={assets.profile_pic} alt="Patient" />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{appointment.patient?.name}</div>
                                <div className="text-sm text-gray-500">{appointment.patient?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(appointment.appointmentDate)}<br />
                            <span className="text-gray-500">{appointment.appointmentTime}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${appointment.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {appointment.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {appointment.status === 'confirmed' && (
                                <button
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowPrescriptionModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Add Prescription
                                </button>
                              )}
                              <button
                                onClick={() => handleStartChat(appointment.patient)}
                                className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                                title="Chat with patient"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>Chat</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prescription Modal */}
        {showPrescriptionModal && selectedAppointment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add Prescription for {selectedAppointment.patient?.name}
                </h3>
                <form onSubmit={handleAddPrescription} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                    <textarea
                      value={prescriptionForm.diagnosis}
                      onChange={(e) => setPrescriptionForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="3"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Medicines</label>
                    {prescriptionForm.medicines.map((medicine, index) => (
                      <div key={index} className="mt-2 p-4 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Medicine Name</label>
                            <input
                              type="text"
                              value={medicine.name}
                              onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Dosage</label>
                            <input
                              type="text"
                              value={medicine.dosage}
                              onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Duration</label>
                            <input
                              type="text"
                              value={medicine.duration}
                              onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Instructions</label>
                            <input
                              type="text"
                              value={medicine.instructions}
                              onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              required
                            />
                          </div>
                        </div>
                        {prescriptionForm.medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedicine(index)}
                            className="mt-2 text-red-600 text-sm hover:text-red-800"
                          >
                            Remove Medicine
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addMedicine}
                      className="mt-2 text-primary text-sm hover:text-primary/80"
                    >
                      + Add Another Medicine
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recommendations</label>
                    <textarea
                      value={prescriptionForm.recommendations}
                      onChange={(e) => setPrescriptionForm(prev => ({ ...prev, recommendations: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Next Visit</label>
                    <input
                      type="date"
                      value={prescriptionForm.nextVisit}
                      onChange={(e) => setPrescriptionForm(prev => ({ ...prev, nextVisit: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPrescriptionModal(false);
                        setSelectedAppointment(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
                    >
                      Save Prescription
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Patients</h2>
              <button
                onClick={fetchPatients}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Appointments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <tr key={patient._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img className="h-10 w-10 rounded-full" src={assets.profile_pic} alt="Patient" />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{patient.email}</div>
                          <div className="text-sm text-gray-500">{patient.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {patient.totalAppointments}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient.lastVisit ? formatDate(patient.lastVisit) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleStartChat(patient)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            title="Chat with patient"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Chat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {patients.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No patients found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === 'chats' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Patient Chats</h2>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
            </div>

            {chats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chats.map((chat) => (
                  <div key={chat._id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => {
                         setCurrentChat(chat);
                         setSelectedPatient(chat.patient);
                         setShowChatModal(true);
                       }}>
                    <div className="flex items-center space-x-3 mb-4">
                      <img src={assets.profile_pic} alt="Patient" className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {chat.patient?.name || 'Patient'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {chat.lastMessage ? new Date(chat.lastMessage).toLocaleDateString() : 'No messages'}
                        </p>
                      </div>
                      {unreadCounts[chat._id] > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {unreadCounts[chat._id]}
                        </span>
                      )}
                    </div>
                    
                    {chat.messages && chat.messages.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {chat.messages[chat.messages.length - 1]?.content || 'No messages yet'}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {chat.messages ? `${chat.messages.length} messages` : '0 messages'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentChat(chat);
                          setSelectedPatient(chat.patient);
                          setShowChatModal(true);
                        }}
                        className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Open Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No chats yet</h3>
                <p className="text-gray-500">Start chatting with your patients to see conversations here.</p>
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Earnings & Analytics</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchEarnings('week')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Week
                </button>
                <button
                  onClick={() => fetchEarnings('month')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Month
                </button>
                <button
                  onClick={() => fetchEarnings('year')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Year
                </button>
              </div>
            </div>

            {earnings && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                        <p className="text-2xl font-semibold text-gray-900">${earnings.totalEarnings}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Completed Appointments</p>
                        <p className="text-2xl font-semibold text-gray-900">{earnings.totalAppointments}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Average per Appointment</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          ${earnings.totalAppointments > 0 ? Math.round(earnings.totalEarnings / earnings.totalAppointments) : 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Earnings</h3>
                  <div className="space-y-4">
                    {earnings.monthlyEarnings.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{month.month}</p>
                          <p className="text-sm text-gray-500">{month.appointments} appointments</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${month.earnings}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!earnings && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">No earnings data available</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-6 mb-6">
                <img src={assets.profile_pic} alt="Profile" className="w-20 h-20 rounded-full" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Dr. {user?.name}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <p className="text-sm text-gray-500">Medical Professional</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="text-gray-900">{user?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{user?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="text-gray-900 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Account Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Appointments</span>
                      <span className="font-medium">{appointments.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Patients</span>
                      <span className="font-medium">{patients.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Appointments</span>
                      <span className="font-medium">
                        {appointments.filter(apt => apt.status === 'completed').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending Appointments</span>
                      <span className="font-medium">
                        {appointments.filter(apt => apt.status === 'pending').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h4>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                  >
                    View Appointments
                  </button>
                  <button
                    onClick={() => setActiveTab('patients')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    View Patients
                  </button>
                  <button
                    onClick={() => setActiveTab('chats')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    View Chats
                  </button>
                  <button
                    onClick={() => setActiveTab('earnings')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    View Earnings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {showChatModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Chat Header */}
              <div className="bg-primary text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={assets.profile_pic} alt="Patient" className="w-10 h-10 rounded-full" />
                  <div>
                    <h3 className="font-semibold">Chat with {selectedPatient.name}</h3>
                    <p className="text-sm opacity-90">
                      {isConnected ? '🟢 Online' : '🔴 Offline'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowChatModal(false);
                    setSelectedPatient(null);
                    setCurrentChat(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 h-96">
                {currentChat && currentChat.messages && currentChat.messages.length > 0 ? (
                  <div className="space-y-4">
                    {currentChat.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.senderModel === 'Doctor' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderModel === 'Doctor'
                              ? 'bg-primary text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    disabled={!isConnected}
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || !isConnected}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
