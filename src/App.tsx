import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import ToolDetail from './pages/ToolDetail'
import Compare from './pages/Compare'

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tool/:id" element={<ToolDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
