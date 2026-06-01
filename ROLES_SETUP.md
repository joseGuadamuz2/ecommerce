# Sistema de Roles Implementado

## 📋 Descripción

Se ha implementado un completo sistema de roles basado en Supabase que permite:
- Asignar roles (Admin o Usuario) a cada usuario registrado
- Proteger rutas de administración restringidas solo a administradores
- Gestionar roles desde la interfaz de administración

## 🔧 Roles Disponibles

### Admin (`admin`)
- Acceso completo a todas las funciones administrativas
- Puede crear, editar y eliminar usuarios
- Puede asignar roles a otros usuarios
- Acceso a todas las rutas bajo `/admin`

### Usuario (`user`)
- Acceso limitado
- Solo puede ver su perfil y catálogo público
- No tiene acceso a funciones administrativas

## 📊 Configuración en Supabase

### Paso 1: Crear la tabla de roles

1. Ve a Supabase Console → SQL Editor
2. Copia y ejecuta el contenido del archivo `setup_roles.sql`
3. Esto creará la tabla `user_roles` con las políticas de seguridad necesarias

### Paso 2: Asignar el rol de admin a tu usuario

1. En Supabase Console, ve a Authentication → Users
2. Busca a `admin1@ecomerce.com`
3. Copia el UUID del usuario
4. Ve a la tabla `user_roles` y crea un nuevo registro:
   - **user_id**: UUID del usuario (paso 3)
   - **email**: `admin1@ecomerce.com`
   - **role**: `admin`

O usa esta consulta SQL (reemplaza `YOUR_USER_UUID`):
```sql
INSERT INTO user_roles (user_id, email, role)
VALUES ('YOUR_USER_UUID', 'admin1@ecomerce.com', 'admin');
```

## 🚀 Cómo Funciona

### AuthContext Actualizado
El contexto de autenticación ahora incluye:
- `role`: El rol del usuario (`admin` o `user`)
- `isAdmin`: Booleano que indica si el usuario es administrador
- `email`: Email del usuario autenticado

### AdminRoute Component
Componente que protege rutas requiriendo un rol específico:
```tsx
<Route 
  path="/admin/usuarios" 
  element={<AdminRoute requiredRole="admin"><AdminUsers /></AdminRoute>} 
/>
```

### Gestión de Roles
En la página `/admin/usuarios`, puedes:
1. Ver todos los usuarios registrados con sus roles
2. Cambiar el rol de un usuario usando el selector dropdown
3. Ver un icono de escudo (🛡️) junto a los usuarios administradores

## 📁 Archivos Modificados/Creados

### Creados:
- `src/services/roleService.ts` - Funciones para gestionar roles
- `src/components/AdminRoute.tsx` - Componente para proteger rutas
- `setup_roles.sql` - Script SQL para crear tabla de roles

### Modificados:
- `src/context/AuthContext.tsx` - Agregado `role`, `email`, `isAdmin`
- `src/pages/AdminUsers.tsx` - Panel de gestión de roles
- `src/components/AdminLayout.tsx` - Actualizado menú de navegación
- `src/App.tsx` - Reemplazadas rutas con `AdminRoute`

## 🔒 Seguridad

- Las políticas RLS en Supabase aseguran que solo admins pueden actualizar/eliminar roles
- Las rutas protegidas verifican el rol en el frontend
- El acceso a la tabla `user_roles` está protegido por RLS en Supabase

## 💡 Funciones Disponibles

### roleService.ts
```typescript
// Obtener rol del usuario actual
const role = await getUserRole(userId)

// Asignar rol a un usuario (solo admin)
await assignRoleToUser(userId, email, 'admin')

// Obtener todos los usuarios con roles
const users = await getAllUserRoles()

// Eliminar rol de usuario
await removeUserRole(userId)
```

## 📌 Próximos Pasos

1. Ejecuta el SQL en `setup_roles.sql` en Supabase
2. Asigna el rol de admin a `admin1@ecomerce.com`
3. Inicia sesión con esa cuenta
4. Ve a `/admin/usuarios` para gestionar roles

## 🎯 Restricciones de Acceso

- `/admin` → Requiere rol `admin`
- `/admin/usuarios` → Requiere rol `admin`
- `/admin/productos` → Requiere rol `admin`
- `/admin/productos/nuevo` → Requiere rol `admin`
- `/admin/productos/editar/:id` → Requiere rol `admin`
- `/admin/configuracion` → Requiere rol `admin`
- `/` (Catálogo público) → Acceso público
- `/login` → Acceso público

---

**Importante**: Asegúrate de ejecutar el SQL en Supabase ANTES de usar la aplicación, de lo contrario obtendrás errores al intentar cargar datos de roles.
