// src/interfaces/user.ts
export type UserRole = 'citizen' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  points: number; // Puntos verdes acumulados
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