export interface newsDTO {
  id: string;
  url: string;
  description: string;
  post: string;
  image: string;
  showOnMain: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsQueryDTO {
  id?: string;
  title?: string;
  showOnMain?: boolean;
  orderBy?: 'DESC' | 'ASC';
  sortBy?: 'id';
  limit?: number;
  offset?: number;
}

export interface CreateNewsPostDTO {
  url: string;
  description: string;
  post: string;
  image: string;
  showOnMain: boolean;
}
