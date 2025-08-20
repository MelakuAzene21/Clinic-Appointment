import React, { useState } from 'react';
import { toast } from 'react-toastify';

const AppointmentActions = ({ 
  appointment, 
  onCancel, 
  onReschedule, 
  onClose 
}) => {
  const [action, setAction] = useState(null); // 'cancel' or 'reschedule'
  const [cancellationReason, setCancellationReason] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onCancel(appointment._id, cancellationReason);
      if (result.success) {
        toast.success('Appointment cancelled successfully');
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to cancel appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      toast.error('Please select both date and time');
      return;
    }

    // Check if new date/time is in the future
    const newDateTime = new Date(`${newDate}T${newTime}`);
    if (newDateTime <= new Date()) {
      toast.error('New appointment date and time must be in the future');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onReschedule(appointment._id, newDate, newTime);
      if (result.success) {
        toast.success('Appointment rescheduled successfully');
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to reschedule appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCancelOrReschedule = () => {
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return false;
    }

    // Check if appointment is within 24 hours
    const appointmentDateTime = new Date(appointment.appointmentDate);
    appointmentDateTime.setHours(parseInt(appointment.appointmentTime.split(':')[0]));
    appointmentDateTime.setMinutes(parseInt(appointment.appointmentTime.split(':')[1]));
    
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);
    
    return hoursUntilAppointment >= 24;
  };

  if (!canCancelOrReschedule()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Actions</h3>
          <p className="text-gray-600 mb-4">
            {appointment.status === 'cancelled' 
              ? 'This appointment has already been cancelled.'
              : appointment.status === 'completed'
              ? 'This appointment has been completed and cannot be modified.'
              : 'This appointment cannot be cancelled or rescheduled as it is within 24 hours of the scheduled time.'
            }
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Actions</h3>
        
        {!action ? (
          <div className="space-y-3">
            <button
              onClick={() => setAction('cancel')}
              className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Cancel Appointment
            </button>
            <button
              onClick={() => setAction('reschedule')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reschedule Appointment
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        ) : action === 'cancel' ? (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Cancel Appointment</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
                maxLength="500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {cancellationReason.length}/500 characters
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button
                onClick={() => setAction(null)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Reschedule Appointment</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Time
              </label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select time</option>
                <option value="09:00">9:00 AM</option>
                <option value="09:30">9:30 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="10:30">10:30 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="12:30">12:30 PM</option>
                <option value="13:00">1:00 PM</option>
                <option value="13:30">1:30 PM</option>
                <option value="14:00">2:00 PM</option>
                <option value="14:30">2:30 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="15:30">3:30 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="16:30">4:30 PM</option>
                <option value="17:00">5:00 PM</option>
                <option value="17:30">5:30 PM</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReschedule}
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
              <button
                onClick={() => setAction(null)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentActions;
