// src/services/api.ts

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.47:4000';

export const clienteApi = async <T>(
  endpoint: string,
  opciones: RequestInit = {}
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...opciones.headers,
  };

  try {
    const respuesta = await fetch(url, { ...opciones, headers });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.message || 'Error en la petición al servidor');
    }

    return datos as T;
  } catch (error: any) {
    console.error(`Error HTTP en ${endpoint}:`, error.message);
    throw error;
  }
};

// Envoltorio con métodos HTTP conveniente para adminService u otros servicios
export const api = {
  get: <T>(endpoint: string, opciones?: RequestInit) =>
    clienteApi<T>(endpoint, { method: 'GET', ...opciones }),

  post: <T>(endpoint: string, body?: any, opciones?: RequestInit) =>
    clienteApi<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...opciones,
    }),

  patch: <T>(endpoint: string, body?: any, opciones?: RequestInit) =>
    clienteApi<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...opciones,
    }),

  put: <T>(endpoint: string, body?: any, opciones?: RequestInit) =>
    clienteApi<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...opciones,
    }),

  delete: <T>(endpoint: string, opciones?: RequestInit) =>
    clienteApi<T>(endpoint, { method: 'DELETE', ...opciones }),
};