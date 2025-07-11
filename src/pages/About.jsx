// eslint-disable-next-line no-unused-vars
import React from 'react'
import assets from '../assets/assets'

const About = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p>ABOUT <span className='text-gray-700 font-medium'>US</span></p>
      </div>

<div className='my-10 flex flex-col md:flex-row gap-12'>
  <img className='w-full md:max-w-[360px]' src={assets.about_image} alt="" />
  <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
    <p> A premier multispeciality hospital dedicated to providing exceptional healthcare services. Our mission is to deliver compassionate and comprehensive medical care to our patients through a team of highly skilled professionals and state-of-the-art facilities.</p>
    <p>We aspire to be a leading healthcare provider recognized for excellence in patient care, advanced medical treatments, and innovative healthcare solutions.</p>
    <b className='text-gray-800'>Our Vision</b>
    <p>We believe in giving back to the community. Through various outreach programs, health camps, and educational seminars, we aim to promote health and wellness and raise awareness about important health issues.</p>
  </div>
</div>


<div className='text-xl my-4 '>
  <p>WHY <span className='text-gray-700 font-semibold '>CHOOSE US </span></p>


</div>


<div className='flex flex-col sm:flex-row mb-20'>
  <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer '>
    <b>Efficiency:</b>
    <p>Advanced diagnostic imaging and laboratory services</p>
  </div>
  <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer '>
  <b>Convenience:</b>
  <p>Specialized units for intensive care, neonatal care, and more</p>
  </div>
  <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer '>
  <b>Personalization:</b>
  <p>Modern operating theaters and recovery rooms</p>
  </div>
</div>

    </div>
  )
}

export default About
