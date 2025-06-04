import { Platform } from 'react-native';

export const uploadFile = async (
  uri: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Get the file extension from the URI
    const fileExtension = uri.split('.').pop();
    const fileName = `image.${fileExtension}`;
    
    // Append the file to form data
    formData.append('file', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      type: `image/${fileExtension}`,
      name: fileName,
    } as any);

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.fileUrl);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', 'https://serenidad.click/mealpack/uploadFile');
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}; 