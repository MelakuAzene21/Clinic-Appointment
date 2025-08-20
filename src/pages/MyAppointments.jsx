// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useChat } from '../context/ChatContext'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import ReviewForm from '../components/ReviewForm'
import AppointmentActions from '../components/AppointmentActions'

const MyAppointments = () => {
  const { getUserAppointments, submitReview, cancelAppointment, rescheduleAppointment, token } = useContext(AppContext)
  const { createChat } = useChat()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [showAppointmentActions, setShowAppointmentActions] = useState(false)
  const [appointmentForActions, setAppointmentForActions] = useState(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!token) {
        setError('Please login to view your appointments')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const result = await getUserAppointments()
        
        if (result.success) {
          setAppointments(result.data)
        } else {
          setError(result.message)
        }
      } catch (err) {
        setError('Failed to fetch appointments')
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [getUserAppointments, token])

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canCancelOrReschedule = (appointment) => {
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return false
    }

    // Check if appointment is within 24 hours
    const appointmentDateTime = new Date(appointment.appointmentDate)
    appointmentDateTime.setHours(parseInt(appointment.appointmentTime.split(':')[0]))
    appointmentDateTime.setMinutes(parseInt(appointment.appointmentTime.split(':')[1]))
    
    const now = new Date()
    const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60)
    
    return hoursUntilAppointment >= 24
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleChatClick = async (appointmentId) => {
    try {
      const chat = await createChat(appointmentId)
      if (chat) {
        navigate('/chat')
      }
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  const handleReviewSubmit = async (reviewData) => {
    try {
      setSubmittingReview(true)
      const result = await submitReview(reviewData)
      
      if (result.success) {
        // Refresh appointments to show updated data
        const result = await getUserAppointments()
        if (result.success) {
          setAppointments(result.data)
        }
        setShowReviewForm(false)
        setSelectedAppointment(null)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to submit review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleAppointmentActions = (appointment) => {
    setAppointmentForActions(appointment)
    setShowAppointmentActions(true)
  }

  const handleCancelAppointment = async (appointmentId, cancellationReason) => {
    try {
      const result = await cancelAppointment(appointmentId, cancellationReason)
      if (result.success) {
        // Refresh appointments to show updated data
        const result = await getUserAppointments()
        if (result.success) {
          setAppointments(result.data)
        }
        setShowAppointmentActions(false)
        setAppointmentForActions(null)
      }
      return result
    } catch (err) {
      setError('Failed to cancel appointment. Please try again.')
      return { success: false, message: 'Failed to cancel appointment' }
    }
  }

  const handleRescheduleAppointment = async (appointmentId, appointmentDate, appointmentTime) => {
    try {
      const result = await rescheduleAppointment(appointmentId, appointmentDate, appointmentTime)
      if (result.success) {
        // Refresh appointments to show updated data
        const result = await getUserAppointments()
        if (result.success) {
          setAppointments(result.data)
        }
        setShowAppointmentActions(false)
        setAppointmentForActions(null)
      }
      return result
    } catch (err) {
      setError('Failed to reschedule appointment. Please try again.')
      return { success: false, message: 'Failed to reschedule appointment' }
    }
  }

  const openReviewForm = (appointment) => {
    setSelectedAppointment(appointment)
    setShowReviewForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h1>
      
      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <img src={assets.appointment_img} alt="No appointments" className="w-32 h-32 mx-auto mb-4 opacity-50" />
          <p className="text-gray-500 text-lg">No appointments found</p>
          <p className="text-gray-400">Book your first appointment to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {appointments.map((appointment) => (
            <div key={appointment._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start space-x-4">
                  <img 
                    src={appointment.doctor?.image || assets.profile_pic} 
                    alt={appointment.doctor?.name} 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {appointment.doctor?.name}
                    </h3>
                    <p className="text-gray-600">{appointment.doctor?.speciality}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}
                    </p>
                    {appointment.symptoms && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                      </p>
                    )}
                    {appointment.notes && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {appointment.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 sm:ml-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                  <p className="text-lg font-semibold text-primary mt-2">
                    ${appointment.amount}
                  </p>
                  <button
                    onClick={() => handleChatClick(appointment._id)}
                    className="mt-2 flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    <img src={assets.chats_icon} alt="Chat" className="w-4 h-4" />
                    Chat
                  </button>
                  
                  {/* Appointment Actions Button for pending/confirmed appointments */}
                  {canCancelOrReschedule(appointment) && (
                    <button
                      onClick={() => handleAppointmentActions(appointment)}
                      className="mt-2 flex items-center gap-2 bg-orange-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      Actions
                    </button>
                  )}
                  
                  {/* Review Button for completed appointments */}
                  {appointment.status === 'completed' && appointment.prescription && (
                    <button
                      onClick={() => openReviewForm(appointment)}
                      className="mt-2 flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Review
                    </button>
                  )}
                </div>
              </div>

              {appointment.prescription && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Prescription</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Diagnosis:</span> {appointment.prescription.diagnosis}
                  </p>
                  {appointment.prescription.medicines && appointment.prescription.medicines.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Medicines:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {appointment.prescription.medicines.map((medicine, index) => (
                          <li key={index}>
                            {medicine.name} - {medicine.dosage} ({medicine.duration})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {appointment.prescription.recommendations && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Recommendations:</span> {appointment.prescription.recommendations}
                    </p>
                  )}
                </div>
              )}

              {/* Cancellation Details */}
              {appointment.status === 'cancelled' && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-900 mb-2">Cancellation Details</h4>
                  {appointment.cancellationReason && (
                    <p className="text-sm text-red-700 mb-2">
                      <span className="font-medium">Reason:</span> {appointment.cancellationReason}
                    </p>
                  )}
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Cancelled by:</span> {appointment.cancelledBy === 'patient' ? 'You' : appointment.cancelledBy}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && selectedAppointment && (
        <ReviewForm
          appointment={selectedAppointment}
          onSubmit={handleReviewSubmit}
          onCancel={() => {
            setShowReviewForm(false)
            setSelectedAppointment(null)
          }}
          isSubmitting={submittingReview}
        />
      )}

      {/* Appointment Actions Modal */}
      {showAppointmentActions && appointmentForActions && (
        <AppointmentActions
          appointment={appointmentForActions}
          onCancel={handleCancelAppointment}
          onReschedule={handleRescheduleAppointment}
          onClose={() => {
            setShowAppointmentActions(false)
            setAppointmentForActions(null)
          }}
        />
      )}
    </div>
  )
}

export default MyAppointments
