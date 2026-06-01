import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import ProductList from './pages/ProductList'
import ProductForm from './pages/ProductForm'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Catálogo público */}
          <Route path="/" element={<Catalog />} />
          <Route path="/producto/:id" element={<ProductDetail />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Admin - Requiere rol de administrador */}
          <Route path="/admin" element={<AdminRoute requiredRole="admin"><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/usuarios" element={<AdminRoute requiredRole="admin"><AdminUsers /></AdminRoute>} />
          <Route path="/admin/productos" element={<AdminRoute requiredRole="admin"><ProductList /></AdminRoute>} />
          <Route path="/admin/productos/nuevo" element={<AdminRoute requiredRole="admin"><ProductForm /></AdminRoute>} />
          <Route path="/admin/productos/editar/:id" element={<AdminRoute requiredRole="admin"><ProductForm /></AdminRoute>} />
          <Route path="/admin/configuracion" element={<AdminRoute requiredRole="admin"><Settings /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}