-- Crear tabla de roles de usuario
-- Ejecuta este SQL en Supabase Console

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
-- Permitir que usuarios autenticados vean su propio rol
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id OR 
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );

-- Permitir que solo admins actualicen roles
CREATE POLICY "Only admins can update roles" ON user_roles
  FOR UPDATE USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );

-- Permitir que solo admins inserten roles
CREATE POLICY "Only admins can insert roles" ON user_roles
  FOR INSERT WITH CHECK (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin' OR
    auth.uid() IS NULL  -- Para el admin inicial
  );

-- Permitir que solo admins eliminen roles
CREATE POLICY "Only admins can delete roles" ON user_roles
  FOR DELETE USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );

-- PASOS DESPUÉS DE EJECUTAR:
-- 1. Ve a la tabla user_roles en Supabase
-- 2. Inserta un registro para tu usuario admin:
--    - user_id: (obtén el UUID de auth.users para admin1@ecomerce.com)
--    - email: admin1@ecomerce.com
--    - role: admin
-- 
-- O usa esta consulta (reemplaza el UUID):
-- INSERT INTO user_roles (user_id, email, role)
-- VALUES ('TU_USER_UUID_AQUI', 'admin1@ecomerce.com', 'admin');
