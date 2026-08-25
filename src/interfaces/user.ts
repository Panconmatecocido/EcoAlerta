// src/interfaces/user.ts
export type UserRole = 'citizen' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  points: number; // Puntos verdes acumulados
}