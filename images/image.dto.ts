export interface ImageDto {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path?: string;
}

export interface ImageQueryDTO {
  readonly filename?: string;
  readonly originalName?: string;
  readonly mimeType?: string;
  readonly size: string;
  readonly sortBy?: string;
  readonly orderBy?: 'DESC' | 'ASC';
  readonly limit?: number;
  readonly offset?: number;
}
