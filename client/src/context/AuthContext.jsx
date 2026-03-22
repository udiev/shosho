import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)
const API = (import.meta.env.VITE_API_URL || '') + '/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    const savedBusiness = localStorage.getItem('business')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      setBusiness(savedBusiness ? JSON.parse(savedBusiness) : null)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  async function login(email, password) {
    const res = await axios.post(`${API}/auth/login`, { email, password })
    const { token, user, businessId } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    return res.data
  }

  async function register(businessName, name, email, password, phone) {
    const res = await axios.post(`${API}/auth/register`, { businessName, name, email, password, phone })
    const { token, user, business } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('business', JSON.stringify(business))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    setBusiness(business)
    return res.data
  }

  function logout() {
    localStorage.clear()
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setBusiness(null)
  }

  return (
    <AuthContext.Provider value={{ user, business, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
