import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '../interfaces/user';
import { AuthNetworkError, AuthRepositoryError, authRepository } from '../repositories/auth';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logoutDestination: 'MainApp' | 'Login';
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: (destination?: 'guest' | 'login') => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  authGateVisible: boolean;
  requireAuth: () => boolean;
  dismissAuthGate: () => void;
  updateUserPoints?: (nuevosPuntos: number) => void;
  actualizarFotoPerfil: (fotoPerfilUri: string | null) => Promise<void>;
  actualizarNombrePerfil: (nombre: string) => Promise<void>;
  actualizarPerfilAdmin: (nombre: string, fotoPerfilUri: string) => Promise<void>;
  recargarPerfilUsuario?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authGateVisible, setAuthGateVisible] = useState(false);
  const [logoutDestination, setLogoutDestination] = useState<'MainApp' | 'Login'>('MainApp');

  useEffect(() => {
    let active = true;
    const initializeAuth = async () => {
      try {
        const currentUser = await authRepository.getCurrentSession();
        if (active) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();
    return () => {
      active = false;
    };
  }, []);

  const updateUserPoints = async (nuevosPuntos: number) => {
    if (!user) return;

    const updatedUser = { ...user, points: nuevosPuntos };
    await authRepository.saveSession(updatedUser);
    setUser(updatedUser);
  };

  const actualizarFotoPerfil = async (fotoPerfilUri: string | null) => {
    if (!user) {
      throw new Error('Debes iniciar sesión para cambiar tu foto de perfil.');
    }

    if (user.role === 'admin') {
      const response = await api.patch<{
        success: boolean;
        user: { fotoPerfilUri: string | null };
      }>('/auth/profile', { fotoPerfilUri });
      if (!response.success || response.user?.fotoPerfilUri !== fotoPerfilUri) {
        throw new Error('El servidor no pudo confirmar la actualización de la foto.');
      }
    }

    const updatedUser = { ...user, fotoPerfilUri };
    await authRepository.saveSession(updatedUser);
    setUser(updatedUser);
  };

  const actualizarNombrePerfil = async (nombre: string) => {
    if (!user || (user.role !== 'citizen' && user.role !== 'admin')) {
      throw new Error('Este perfil no permite editar el nombre.');
    }

    const nombreNormalizado = nombre.trim();
    if (nombreNormalizado.length < 2 || nombreNormalizado.length > 80) {
      throw new Error('El nombre debe tener entre 2 y 80 caracteres.');
    }

    const response = await api.patch<{ success: boolean; user: { nombre: string } }>(
      '/auth/profile',
      { nombre: nombreNormalizado }
    );
    if (!response.success || !response.user?.nombre) {
      throw new Error('El servidor no pudo confirmar los cambios del perfil.');
    }

    const updatedUser = { ...user, name: response.user.nombre };
    await authRepository.saveSession(updatedUser);
    setUser(updatedUser);
  };

  const actualizarPerfilAdmin = async (nombre: string, fotoPerfilUri: string) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Solo un administrador autenticado puede editar este perfil.');
    }

    const nombreNormalizado = nombre.trim();
    if (nombreNormalizado.length < 2 || nombreNormalizado.length > 80) {
      throw new Error('El nombre debe tener entre 2 y 80 caracteres.');
    }

    const response = await api.patch<{
      success: boolean;
      user: { nombre: string; fotoPerfilUri: string | null };
    }>('/auth/profile', { nombre: nombreNormalizado, fotoPerfilUri });
    if (
      !response.success ||
      response.user?.nombre !== nombreNormalizado ||
      response.user?.fotoPerfilUri !== fotoPerfilUri
    ) {
      throw new Error('El servidor no pudo confirmar los cambios del perfil.');
    }

    const updatedUser = {
      ...user,
      name: response.user.nombre,
      fotoPerfilUri: response.user.fotoPerfilUri,
    };
    await authRepository.saveSession(updatedUser);
    setUser(updatedUser);
  };

  const recargarPerfilUsuario = async () => {
    if (!user) return;
    try {
      const queryParams = new URLSearchParams();
      if (user.id) queryParams.append('id', user.id);
      if (user.email) queryParams.append('email', user.email);
      const res = await api.get<any>(`/auth/me?${queryParams.toString()}`);
      if (res?.success && (res.user || res.data)) {
        const u = res.user || res.data;
        const perfilActualizado: User = {
          ...user,
          points: u.points ?? u.puntos ?? user.points,
        };
        setUser(perfilActualizado);
        await authRepository.saveSession(perfilActualizado);
      }
    } catch (err) {
      console.warn('Error al recargar perfil:', err);
    }
  };

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; message?: string }> => {
    if (!credentials.identifier.trim() || !credentials.password.trim()) {
      return { success: false, message: 'Por favor completa todos los campos' };
    }

    try {
      const response = await authRepository.login({
        identifier: credentials.identifier.trim(),
        password: credentials.password,
      });
      setUser(response.user);
      return { success: true };
    } catch (error) {
      if (!(error instanceof AuthRepositoryError) && !(error instanceof AuthNetworkError)) {
        console.error('Error durante el inicio de sesión:', error);
      }
      return {
        success: false,
        message:
          error instanceof AuthRepositoryError || error instanceof AuthNetworkError
            ? error.message
            : 'Error interno al iniciar sesión',
      };
    }
  };

  const register = async (
    data: RegisterData
  ): Promise<{ success: boolean; message?: string }> => {
    const name = data.username.trim();
    const email =
      data.email?.trim() ||
      `${name.toLowerCase().replace(/\s+/g, '')}@ecoalerta.com`;
    const password = data.password.trim();

    if (!name || !email || !password) {
      return { success: false, message: 'Completa los campos obligatorios' };
    }

    if (data.confirmPassword && password !== data.confirmPassword.trim()) {
      return { success: false, message: 'Las contraseñas no coinciden' };
    }

    try {
      const response = await authRepository.register({ name, email, password });
      setUser(response.user);
      return { success: true };
    } catch (error) {
      if (!(error instanceof AuthRepositoryError) && !(error instanceof AuthNetworkError)) {
        console.error('Error al registrar usuario:', error);
      }
      return {
        success: false,
        message:
          error instanceof AuthRepositoryError || error instanceof AuthNetworkError
            ? error.message
            : 'Error al registrar usuario',
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
        points: 100,
        createdAt: new Date().toISOString(),
      };

      await authRepository.saveSession(googleUser, `demo-google:${googleUser.id}`);
      setUser(googleUser);
      return { success: true };
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google',
      };
    }
  };

  const logout = async (destination: 'guest' | 'login' = 'guest'): Promise<void> => {
    try {
      await authRepository.clearSession();
      setLogoutDestination(destination === 'login' ? 'Login' : 'MainApp');
      setUser(null);
      setAuthGateVisible(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  const requireAuth = (): boolean => {
    if (user) return true;
    setAuthGateVisible(true);
    return false;
  };

  const dismissAuthGate = () => setAuthGateVisible(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        logoutDestination,
        login,
        register,
        logout,
        loginWithGoogle,
        authGateVisible,
        requireAuth,
        dismissAuthGate,
        updateUserPoints,
        actualizarFotoPerfil,
        actualizarNombrePerfil,
        actualizarPerfilAdmin,
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
