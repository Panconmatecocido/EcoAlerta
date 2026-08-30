// Define los insumos ecológicos del carrito
export interface Product {
  id: string; // Tipo string por el UUID de Prisma
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
}