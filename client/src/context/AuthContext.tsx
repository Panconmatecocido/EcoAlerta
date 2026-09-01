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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializar sesión y sembrar usuario por defecto si no existen datos
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = await getCurrentUser();
        const storedUsersList = await getStoredUsers();

        // Si la base local está vacía, sembramos un usuario demo para pruebas inmediatas
        if (storedUsersList.length === 0) {
          const demoAccount: StoredUserAccount = {
            user: {
              id: 'demo-user-1',
              name: 'EcoUsuario',
              email: 'ejemplo@email.com',
              role: 'citizen',
              points: 120,
              createdAt: new Date().toISOString(),
            },
            passwordHash: 'password123',
          };
          await saveNewUser(demoAccount);
        }

        if (storedUser) {
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

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmedId = credentials.identifier.trim().toLowerCase();
    const trimmedPassword = credentials.password.trim();

    if (!trimmedId || !trimmedPassword) {
      return { success: false, message: 'Por favor completa todos los campos' };
    }

    try {
      const usersList = await getStoredUsers();
      const account = usersList.find(
        (u) =>
          u.user.email.toLowerCase() === trimmedId ||
          u.user.name.toLowerCase() === trimmedId
      );

      if (!account) {
        return {
          success: false,
          message: 'Usuario o correo no encontrado. ¿Deseas registrarte?',
        };
      }

      if (account.passwordHash !== trimmedPassword) {
        return { success: false, message: 'Contraseña incorrecta' };
      }

      // Guardar usuario autenticado
      await saveCurrentUser(account.user);
      setUser(account.user);
      return { success: true };
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      return { success: false, message: 'Error interno al iniciar sesión' };
    }
  };

  const register = async (
    data: RegisterData
  ): Promise<{ success: boolean; message?: string }> => {
    const trimmedUsername = data.username.trim();
    const trimmedPassword = data.password.trim();
    const trimmedConfirm = data.confirmPassword ? data.confirmPassword.trim() : '';

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
        email: data.email?.trim() || `${trimmedUsername.toLowerCase().replace(/\s+/g, '')}@ecoalerta.com`,
        role: 'citizen',
        points: 50, // Puntos de bienvenida
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
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      return { success: false, message: 'Error al registrar usuario en el almacenamiento local' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const googleUser: User = {
        id: `google-user-${Date.now()}`,
        name: 'Usuario Google',
        email: 'usuario.google@gmail.com',
        role: 'citizen',
        points: 100,
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