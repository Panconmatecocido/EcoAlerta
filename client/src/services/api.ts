// src/services/api.ts
import { Producto } from '../interfaces/product';
import { MOCK_PRODUCTOS } from '../mocks/productos';

const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
export const API_URL = RAW_API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

export const clienteApi = async <T>(
  endpoint: string,
  opciones: RequestInit = {}
): Promise<T> => {
  const rutaNormalizada = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const rutaConApi = rutaNormalizada.startsWith('/api/')
    ? rutaNormalizada
    : `/api${rutaNormalizada}`;
  const url = `${API_URL}${rutaConApi}`;

  const esFormData = typeof FormData !== 'undefined' && opciones.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(opciones.headers as Record<string, string>),
  };

  try {
    const respuesta = await fetch(url, { ...opciones, headers });

    const contentType = respuesta.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const texto = await respuesta.text();
      const mensaje = !respuesta.ok
        ? `Error HTTP ${respuesta.status} en ${rutaConApi}: ${texto.slice(0, 100)}`
        : `Respuesta no JSON (${respuesta.status}) en ${rutaConApi}`;
      throw new Error(mensaje);
    }

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

export const obtenerProductos = async (
  categoria?: string,
  busqueda?: string
): Promise<Producto[]> => {
  let resultados: Producto[] = [];

  try {
    const params: Record<string, string> = {};
    if (busqueda && busqueda.trim() !== '') {
      params.busqueda = busqueda.trim();
    }
    const queryStr = new URLSearchParams(params).toString();
    const endpoint = queryStr ? `/api/productos?${queryStr}` : '/api/productos';
    const res = await api.get<{ success: boolean; data: any[] } | any[]>(endpoint);
    const lista = Array.isArray(res) ? res : res.data || [];

    if (lista.length > 0) {
      resultados = lista.map((item: any) => ({
        id: item.id,
        nombre: item.nombre ?? item.titulo ?? '',
        descripcion: item.descripcion ?? '',
        precio: item.precio ?? item.costoPuntos ?? 0,
        categoria: item.categoria ?? 'Todos',
        urlImagen: item.urlImagen ?? item.imagenUrl ?? 'https://via.placeholder.com/150',
        stock: item.stock ?? 0,
        creadoEn: item.creadoEn,
      }));
    } else {
      resultados = [...MOCK_PRODUCTOS];
    }
  } catch {
    resultados = [...MOCK_PRODUCTOS];
  }

  if (categoria && categoria !== 'Todos') {
    resultados = resultados.filter(
      (prod) => !prod.categoria || prod.categoria === 'Todos' || prod.categoria.toLowerCase() === categoria.toLowerCase()
    );
  }

  if (busqueda && busqueda.trim() !== '') {
    const termino = busqueda.toLowerCase();
    resultados = resultados.filter(
      (prod) =>
        prod.nombre.toLowerCase().includes(termino) ||
        prod.descripcion?.toLowerCase().includes(termino)
    );
  }

  return resultados;
};