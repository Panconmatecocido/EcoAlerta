// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '../interfaces/user';
import {
  getCurrentUser,
  saveCurrentUser,
  removeCurrentUser,
  getStoredUsers,
  saveNewUser,
  StoredUserAccount,
} from '../utils/storage';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  updateUserPoints?: (nuevosPuntos: number) => void;
  recargarPerfilUsuario?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializar sesión y sincronizar con la Base de Datos PostgreSQL
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = await getCurrentUser();

        if (storedUser) {
          // 1. Intentar sincronizar datos frescos desde la Base de Datos
          try {
            const queryParams = new URLSearchParams();
            if (storedUser.id) queryParams.append('id', storedUser.id);
            if (storedUser.email) queryParams.append('email', storedUser.email);

            const res = await api.get<{ success: boolean; user: User }>(
              `/api/auth/me?${queryParams.toString()}`
            );

            if (res.success && res.user) {
              await saveCurrentUser(res.user);
              setUser(res.user);
              return;
            }
          } catch (syncError) {
            console.warn(
              'No se pudo sincronizar usuario con el servidor DB, usando sesión local:',
              syncError
            );
          }

          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Recargar perfil del usuario directamente desde la BD (fuente de verdad)
  const recargarPerfilUsuario = async () => {
    if (!user) return;
    try {
      const queryParams = new URLSearchParams();
      if (user.id) queryParams.append('id', user.id);
      if (user.email) queryParams.append('email', user.email);

      const res = await api.get<{ success: boolean; user: User }>(
        `/api/auth/me?${queryParams.toString()}`
      );

      if (res.success && res.user) {
        await saveCurrentUser(res.user);
        setUser(res.user);
      }
    } catch (error) {
      console.warn('Error al recargar perfil desde DB:', error);
    }
  };

  // Actualizar puntos del usuario autenticado
  const updateUserPoints = async (nuevosPuntos: number) => {
    if (user) {
      const usuarioActualizado = { ...user, points: nuevosPuntos };
      setUser(usuarioActualizado);
      await saveCurrentUser(usuarioActualizado);
    }
  };

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmedId = credentials.identifier.trim();
    const trimmedPassword = credentials.password.trim();

    if (!trimmedId || !trimmedPassword) {
      return { success: false, message: 'Por favor completa todos los campos' };
    }

    try {
      // 1. Iniciar sesión contra el Backend DB (fuente de verdad)
      const res = await api.post<{ success: boolean; user: User; message?: string }>(
        '/api/auth/login',
        { identifier: trimmedId, password: trimmedPassword }
      );

      if (res.success && res.user) {
        await saveCurrentUser(res.user);
        setUser(res.user);
        return { success: true };
      }

      return {
        success: false,
        message: res.message || 'Usuario o contraseña incorrectos',
      };
    } catch (apiError: any) {
      console.warn('Fallo login contra API backend:', apiError.message);

      // Fallback a almacenamiento local si el backend está sin conectividad
      try {
        const usersList = await getStoredUsers();
        const account = usersList.find(
          (u) =>
            u.user.email.toLowerCase() === trimmedId.toLowerCase() ||
            u.user.name.toLowerCase() === trimmedId.toLowerCase()
        );

        if (account && account.passwordHash === trimmedPassword) {
          await saveCurrentUser(account.user);
          setUser(account.user);
          return { success: true };
        }
      } catch (localError) {
        console.error('Fallo fallback local:', localError);
      }

      return {
        success: false,
        message: apiError.message || 'Error al iniciar sesión en el servidor',
      };
    }
  };

  const register = async (
    data: RegisterData
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmedUsername = data.username.trim();
    const trimmedPassword = data.password.trim();
    const trimmedConfirm = data.confirmPassword ? data.confirmPassword.trim() : '';
    const trimmedEmail =
      data.email?.trim() || `${trimmedUsername.toLowerCase().replace(/\s+/g, '')}@ecoalerta.com`;

    if (!trimmedUsername || !trimmedPassword) {
      return { success: false, message: 'Completa los campos obligatorios' };
    }

    if (trimmedConfirm && trimmedPassword !== trimmedConfirm) {
      return { success: false, message: 'Las contraseñas no coinciden' };
    }

    if (trimmedPassword.length < 4) {
      return { success: false, message: 'La contraseña debe tener al menos 4 caracteres' };
    }

    try {
      // 1. Registrar directamente en la Base de Datos PostgreSQL
      const res = await api.post<{ success: boolean; user: User; message?: string }>(
        '/api/auth/register',
        {
          nombre: trimmedUsername,
          email: trimmedEmail,
          password: trimmedPassword,
        }
      );

      if (res.success && res.user) {
        await saveCurrentUser(res.user);
        setUser(res.user);
        return { success: true };
      }

      return {
        success: false,
        message: res.message || 'No se pudo completar el registro en la base de datos',
      };
    } catch (apiError: any) {
      console.warn('Fallo registro contra API backend:', apiError.message);

      // Fallback local si el servidor no responde
      try {
        const usersList = await getStoredUsers();
        const alreadyExists = usersList.some(
          (u) => u.user.name.toLowerCase() === trimmedUsername.toLowerCase()
        );

        if (alreadyExists) {
          return { success: false, message: 'El nombre de usuario ya está registrado' };
        }

        const newUser: User = {
          id: `user-${Date.now()}`,
          name: trimmedUsername,
          email: trimmedEmail,
          role: 'citizen',
          points: 120,
          createdAt: new Date().toISOString(),
        };

        const newAccount: StoredUserAccount = {
          user: newUser,
          passwordHash: trimmedPassword,
        };

        await saveNewUser(newAccount);
        await saveCurrentUser(newUser);
        setUser(newUser);

        return { success: true };
      } catch (localError) {
        console.error('Error al registrar usuario local:', localError);
      }

      return {
        success: false,
        message: apiError.message || 'Error al registrar usuario en el servidor',
      };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const googleUser: User = {
        id: `google-user-${Date.now()}`,
        name: 'Usuario Google',
        email: 'usuario.google@gmail.com',
        role: 'citizen',
        points: 120,
        createdAt: new Date().toISOString(),
      };

      await saveCurrentUser(googleUser);
      setUser(googleUser);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'No se pudo iniciar sesión con Google' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await removeCurrentUser();
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        loginWithGoogle,
        updateUserPoints,
        recargarPerfilUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};