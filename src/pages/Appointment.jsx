// eslint-disable-next-line no-unused-vars
import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import assets from '../assets/assets'
import ReviewsDisplay from '../components/ReviewsDisplay'
import RelatedDoctors from '../components/RelatedDoctors'

const Appointment = () => {
  const { docId } = useParams()
  const navigate = useNavigate()
  const { doctors, currencySymbol, createAppointment, user, token, getDoctorSlots } = useContext(AppContext)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const [docInfo, setDocInfo] = useState(null)
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [notes, setNotes] = useState('')

  const fetchDocInfo = async () => {
    const docInfo = doctors.find(doc => doc._id === docId)
    setDocInfo(docInfo)
  }

  const getAvailableSlots = async () => {
    setDocSlots([])
    const today = new Date()
    const collected = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(today)
      day.setDate(today.getDate() + i)
      const isoDate = day.toISOString().split('T')[0]
      const resp = await getDoctorSlots(docId, isoDate)
      const slots = resp.success ? resp.data.slots : []
      const timeSlots = slots.map((t) => {
        const [hh, mm] = t.split(':')
        const d = new Date(day)
        d.setHours(parseInt(hh), parseInt(mm), 0, 0)
        return { datetime: d, time: t }
      })
      collected.push(timeSlots)
    }
    setDocSlots(collected)
    // pick first day with available slots
    const firstAvailableIndex = collected.findIndex(arr => (arr && arr.length > 0))
    if (firstAvailableIndex >= 0) {
      setSlotIndex(firstAvailableIndex)
      setSlotTime('')
      setInfo('')
    } else {
      setSlotIndex(0)
      setSlotTime('')
      setInfo('No available slots in the next 7 days. Please check back later or choose another doctor.')
    }
  }

  const handleBookAppointment = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    if (!slotTime) {
      setError('Please select a time slot')
      return
    }

    setLoading(true)
    setError('')

    try {
      const selectedDate = docSlots[slotIndex][0].datetime
      const appointmentData = {
        doctorId: docId,
        appointmentDate: selectedDate.toISOString().split('T')[0],
        appointmentTime: slotTime,
        symptoms,
        notes
      }

      const result = await createAppointment(appointmentData)
      
      if (result.success) {
        navigate('/my-appointments')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocInfo()
  }, [doctors, docId])

  useEffect(() => {
    getAvailableSlots()
  }, [docInfo])

  if (!docInfo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor information...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Doctor Details */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt={docInfo.name} />
        </div>

        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
            {docInfo.name}
            <img className='w-5' src={assets.verified_icon} alt="" />
          </p>
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>

          <div>
            <p className='flex items-center gap-1 text-sm font-medium text-gray-900 mt-3'>
              About <img src={assets.info_icon} alt="" />
            </p>
            <p className='text-sm text-gray-500 max-w-[700px] mt-1'>
              {docInfo.about}
            </p>
          </div>

          <p className='text-gray-500 font-medium mt-4'>
            Appointment fee: <span className='text-gray-600'>{currencySymbol}{docInfo.fees}</span>
          </p>
          
          {/* Rating Display */}
          <div className="flex items-center space-x-2 mt-3">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${star <= docInfo.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {docInfo.rating.toFixed(1)} ({docInfo.totalReviews} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Booking Slots */}
      <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
        <p>Booking Slots</p>
        
        {(error || info) && (
          <div className='w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded mt-4'>
            {error || info}
          </div>
        )}

        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
          {docSlots.length && docSlots.map((item, index) => {
            const hasSlots = item && item.length > 0
            const isSelected = slotIndex === index
            return (
              <div
                onClick={() => {
                  if (!hasSlots) {
                    setInfo('Doctor is not working on this day.')
                    return
                  }
                  setInfo('')
                  setSlotIndex(index)
                  setSlotTime('')
                }}
                className={`text-center py-6 min-w-16 rounded-full ${hasSlots ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${isSelected ? 'bg-primary text-white' : 'border border-gray-200'}`}
                key={index}
                title={hasSlots ? '' : 'No slots available'}
              >
                <p>{item[0] ? daysOfWeek[item[0].datetime.getDay()] : daysOfWeek[(new Date(new Date().setDate(new Date().getDate() + index))).getDay()]}</p>
                <p>{item[0] ? item[0].datetime.getDate() : new Date(new Date().setDate(new Date().getDate() + index)).getDate()}</p>
                {!hasSlots && (
                  <p className='text-[10px] mt-1'>No slots</p>
                )}
              </div>
            )
          })}
        </div>

        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {docSlots.length && docSlots[slotIndex] && docSlots[slotIndex].length > 0 ? (
            docSlots[slotIndex].map((item, index) => (
              <p
                onClick={() => setSlotTime(item.time)}
                className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-400'}`}
                key={index}
              >
                {item.time}
              </p>
            ))
          ) : (
            <p className='text-sm text-gray-500'>Doctor is not working on this day.</p>
          )}
        </div>

        {/* Symptoms and Notes */}
        <div className='mt-6 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Symptoms (Optional)</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
              rows="3"
              placeholder="Describe your symptoms..."
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Additional Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
              rows="3"
              placeholder="Any additional information..."
            />
          </div>
        </div>

        <button 
          onClick={handleBookAppointment}
          disabled={loading || !slotTime}
          className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? 'Booking...' : 'Book an Appointment'}
        </button>
      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <ReviewsDisplay 
          doctorId={docId} 
          doctorRating={docInfo.rating} 
          doctorTotalReviews={docInfo.totalReviews} 
        />
      </div>

      {/* Listing Related Doctors */}
      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
    </div>
  )
}

export default Appointment
