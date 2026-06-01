import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import AdminLayout from '../components/AdminLayout'
import { createUserAsAdmin, listAllUsers, deleteUserAsAdmin, updateUserAsAdmin } from '../services/authService'
import { assignRoleToUser, getAllUserRoles, getUserRole } from '../services/roleService'
import { Plus, Trash2, Copy, CheckCircle, Edit2, Shield } from 'lucide-react'
import type { UserRole } from '../services/roleService'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  user_metadata?: Record<string, any>
  role?: UserRole
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [editForm, setEditForm] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const allUsers = await listAllUsers()
      const userRoles = await getAllUserRoles()
      
      // Crear un mapa de roles para búsqueda rápida
      const roleMap = new Map(userRoles.map(ur => [ur.user_id, ur.role]))
      
      // Asignar roles a usuarios
      const usersWithRoles = allUsers.map(user => ({
        ...user,
        role: roleMap.get(user.id) || 'user' as UserRole,
      }))
      
      setUsers(usersWithRoles as User[])
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los usuarios.',
        icon: 'error',
        confirmButtonColor: '#6366f1',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.email || !form.password) {
      Swal.fire({
        title: 'Campos requeridos',
        text: 'Email y contraseña son obligatorios.',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
      })
      return
    }

    if (form.password.length < 6) {
      Swal.fire({
        title: 'Contraseña débil',
        text: 'La contraseña debe tener al menos 6 caracteres.',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
      })
      return
    }

    setSaving(true)

    try {
      await createUserAsAdmin(form.email, form.password)

      Swal.fire({
        title: '¡Usuario creado!',
        text: `${form.email} ha sido registrado correctamente.`,
        icon: 'success',
        confirmButtonColor: '#6366f1',
      })

      setForm({ email: '', password: '' })
      setShowForm(false)
      await loadUsers()
    } catch (err: any) {
      let errorMsg = 'No se pudo crear el usuario.'
      if (err.message?.includes('already exists')) {
        errorMsg = 'Este email ya está registrado.'
      }
      Swal.fire({
        title: 'Error',
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#6366f1',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setEditForm({
      email: user.email,
      password: '',
    })
    setShowEditForm(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingUser) return

    if (!editForm.email) {
      Swal.fire({
        title: 'Campos requeridos',
        text: 'El email es obligatorio.',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
      })
      return
    }

    if (editForm.password && editForm.password.length < 6) {
      Swal.fire({
        title: 'Contraseña débil',
        text: 'La contraseña debe tener al menos 6 caracteres.',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
      })
      return
    }

    setSaving(true)

    try {
      const updateData: any = { email: editForm.email }
      if (editForm.password) {
        updateData.password = editForm.password
      }

      await updateUserAsAdmin(editingUser.id, updateData)

      Swal.fire({
        title: '¡Actualizado!',
        text: 'Usuario actualizado correctamente.',
        icon: 'success',
        confirmButtonColor: '#6366f1',
      })

      setShowEditForm(false)
      setEditingUser(null)
      await loadUsers()
    } catch (err: any) {
      let errorMsg = 'No se pudo actualizar el usuario.'
      if (err.message?.includes('already exists')) {
        errorMsg = 'Este email ya está registrado.'
      }
      Swal.fire({
        title: 'Error',
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#6366f1',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (userId: string, email: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: `${email} será eliminado permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
    })

    if (!result.isConfirmed) return

    try {
      await deleteUserAsAdmin(userId)
      Swal.fire({
        title: '¡Eliminado!',
        text: 'El usuario fue eliminado correctamente.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#6366f1',
      })
      await loadUsers()
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar el usuario.',
        icon: 'error',
        confirmButtonColor: '#6366f1',
      })
    }
  }

  const handleChangeRole = async (user: User, newRole: UserRole) => {
    try {
      await assignRoleToUser(user.id, user.email, newRole)
      
      Swal.fire({
        title: '¡Actualizado!',
        text: `${user.email} es ahora ${newRole === 'admin' ? 'Administrador' : 'Usuario normal'}.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#6366f1',
      })
      
      await loadUsers()
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cambiar el rol del usuario.',
        icon: 'error',
        confirmButtonColor: '#6366f1',
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return <AdminLayout><p style={{ textAlign: 'center', padding: '2rem' }}>Cargando usuarios...</p></AdminLayout>
  }

  return (
    <AdminLayout>
      <div style={styles.header}>
        <h1 style={styles.title}>👥 Gestión de Usuarios</h1>
        <button
          style={styles.addBtn}
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          {!showForm && 'Nuevo usuario'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Registrar nuevo usuario</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                style={styles.input}
                placeholder="usuario@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Contraseña</label>
              <input
                type="password"
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div style={styles.actions}>
              <button
                type="submit"
                style={{ ...styles.btn, background: '#6366f1', color: '#fff' }}
                disabled={saving}
              >
                {saving ? 'Creando...' : 'Crear usuario'}
              </button>
              <button
                type="button"
                style={{ ...styles.btn, background: '#e5e7eb', color: '#333' }}
                onClick={() => {
                  setShowForm(false)
                  setForm({ email: '', password: '' })
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Usuarios registrados ({users.length})</h2>

        {users.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>No hay usuarios registrados.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={{ ...styles.cell, textAlign: 'left' }}>Email</th>
                  <th style={{ ...styles.cell, textAlign: 'center' }}>Rol</th>
                  <th style={{ ...styles.cell, textAlign: 'left' }}>Registrado</th>
                  <th style={{ ...styles.cell, textAlign: 'left' }}>Último acceso</th>
                  <th style={{ ...styles.cell, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={styles.row}>
                    <td style={styles.cell}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span>{user.email}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(user.id)}
                          style={styles.copyBtn}
                          title="Copiar ID"
                        >
                          {copied === user.id ? (
                            <CheckCircle size={16} style={{ color: '#22c55e' }} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td style={{ ...styles.cell, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleChangeRole(user, e.target.value as UserRole)}
                          style={styles.roleSelect}
                          title="Cambiar rol"
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Admin</option>
                        </select>
                        {user.role === 'admin' && <Shield size={16} style={{ color: '#f59e0b' }} title="Administrador" />}
                      </div>
                    </td>
                    <td style={styles.cell}>
                      {new Date(user.created_at).toLocaleDateString('es-ES', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </td>
                    <td style={styles.cell}>
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td style={{ ...styles.cell, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleEditClick(user)}
                          style={styles.editBtn}
                          title="Editar usuario"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user.id, user.email)}
                          style={styles.deleteBtn}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {showEditForm && editingUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.sectionTitle}>Editar usuario</h2>
            <form onSubmit={handleUpdateUser} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  style={styles.input}
                  placeholder="usuario@ejemplo.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Nueva contraseña (dejar vacío para no cambiar)</label>
                <input
                  type="password"
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres (opcional)"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                />
              </div>

              <div style={styles.actions}>
                <button
                  type="submit"
                  style={{ ...styles.btn, background: '#6366f1', color: '#fff' }}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  style={{ ...styles.btn, background: '#e5e7eb', color: '#333' }}
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingUser(null)
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  } as React.CSSProperties,
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#1f2937',
  } as React.CSSProperties,
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
  } as React.CSSProperties,
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#1f2937',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  } as React.CSSProperties,
  input: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  } as React.CSSProperties,
  btn: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  } as React.CSSProperties,
  tableWrapper: {
    overflowX: 'auto',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  headerRow: {
    borderBottom: '2px solid #e5e7eb',
    background: '#f9fafb',
  } as React.CSSProperties,
  row: {
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  cell: {
    padding: '1rem',
    color: '#1f2937',
  } as React.CSSProperties,
  copyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6366f1',
    padding: '0.25rem',
  } as React.CSSProperties,
  deleteBtn: {
    background: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  editBtn: {
    background: '#dbeafe',
    color: '#0284c7',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modalContent: {
    background: '#fff',
    borderRadius: '0.75rem',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
  } as React.CSSProperties,
  roleSelect: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    background: '#fff',
    color: '#374151',
  } as React.CSSProperties,
}
