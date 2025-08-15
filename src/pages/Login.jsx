// eslint-disable-next-line no-unused-vars
import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Login = () => {
  const [state, setState] = useState('Sign Up')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, register } = useContext(AppContext)
  const navigate = useNavigate()

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      let result
      
      if (state === 'Sign Up') {
        result = await register({ name, email, password })
      } else {
        result = await login(email, password)
      }

      if (result.success) {
        // Use role from login response for redirection
        const role = result.role || result.data?.role
        if (role === 'doctor') {
          navigate('/doctor')
        } else if (role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/')
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className='min-h-[80vh] flex items-center' onSubmit={onSubmitHandler}>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>{state === 'Sign Up' ? "Create Account" : "Login"}</p>
        <p>Please {state === 'Sign Up' ? "sign up" : "log in"} to book appointment</p>

        {error && (
          <div className='w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
            {error}
          </div>
        )}

        {state === "Sign Up" && (
          <div className='w-full'>
            <p>Full Name</p>
            <input 
              className='border border-zinc-300 rounded w-full p-2 mt-1' 
              type="text" 
              onChange={(e) => setName(e.target.value)} 
              value={name} 
              required 
            />
          </div>
        )}

        <div className='w-full'>
          <p>Email</p>
          <input 
            className='border border-zinc-300 rounded w-full p-2 mt-1' 
            type="email" 
            onChange={(e) => setEmail(e.target.value)} 
            value={email} 
            required 
          />
        </div>
        
        <div className='w-full'>
          <p>Password</p>
          <input 
            className='border border-zinc-300 rounded w-full p-2 mt-1' 
            type="password" 
            onChange={(e) => setPassword(e.target.value)} 
            value={password} 
             
          />
        </div>

        <button 
          className='bg-primary text-white w-full py-2 rounded-md text-base disabled:opacity-50' 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Loading...' : (state === 'Sign Up' ? "Create Account" : "Login")}
        </button>
        
        {state === "Sign Up" ? (
          <p>Already have an account? <span onClick={() => setState('Login')} className='text-primary underline cursor-pointer'>Login here</span></p>
        ) : (
          <p>Create a New Account? <span onClick={() => setState('Sign Up')} className='text-primary underline cursor-pointer'>Click Here</span></p>
        )}
      </div>
    </form>
  )
}

export default Login
