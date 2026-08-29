// Define los insumos ecológicos del carrito
export interface Product {
  id: string;
  title: string;
  description: string;
  costInPoints: number;
  imageUrl: string;
  stock: number;
}