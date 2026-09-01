// Define los insumos ecológicos del carrito
export interface Producto {
  id: string; // Coincide con el UUID de Prisma
  nombre: string;
  descripcion?: string;
  precio: number; // Representa el valor en puntos
  categoria?: string;
  urlImagen?: string;
  stock: number;
  creadoEn?: string;
  actualizadoEn?: string;
}