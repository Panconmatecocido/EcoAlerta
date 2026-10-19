export type UserRole = 'citizen' | 'agent' | 'admin' | 'collaborator';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  points: number; // Puntos verdes acumulados
  municipio?: string;
  municipioId?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  identifier: string; // Email o nombre de usuario
  password: string;
}

export interface RegisterData {
  username: string;
  email?: string;
  password: string;
  confirmPassword?: string;
}
