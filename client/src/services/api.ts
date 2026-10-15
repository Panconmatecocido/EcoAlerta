// src/services/api.ts

// Reemplazá '192.168.1.X' por la IP local de tu PC en la red WiFi (o la IP que te da Expo en la terminal)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.47:4000/api';

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