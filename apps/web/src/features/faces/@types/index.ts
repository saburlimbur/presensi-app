export interface FaceEmbedding {
  id: string;
  imageUrl: string;
  imageUrl_url: string | null;
  createdAt: string;
}

export interface MyFacesData {
  total: number;
  embeddings: FaceEmbedding[];
}

export interface MyFacesResponse {
  success: boolean;
  message?: string;
  data: MyFacesData;
}

export interface ResetFaceResponse {
  success: boolean;
  message?: string;
}
