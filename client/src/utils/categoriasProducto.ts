export const CATEGORIAS_PRODUCTO = ['Hogar', 'Limpieza', 'Cuidado Personal', 'Papelería', 'Otros'] as const;

export type CategoriaProducto = (typeof CATEGORIAS_PRODUCTO)[number];

export const CATEGORIA_POR_DEFECTO: CategoriaProducto = 'Otros';
