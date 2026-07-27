import { axios } from '../axios-config';

interface UploadImageResponse {
  url: string;
}

export async function uploadImage(image: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', image);

  const response = await axios.post<UploadImageResponse>('/Images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.url;
}
