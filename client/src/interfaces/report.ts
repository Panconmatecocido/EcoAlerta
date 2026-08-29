// Define la estructura de las denuncias de basurales o dengue
export type ReportCategory = 'basural' | 'dengue';
export type ReportStatus = 'pendiente' | 'validado' | 'rechazado';

export interface Report {
  id: string;
  userId: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  createdAt: string;
}