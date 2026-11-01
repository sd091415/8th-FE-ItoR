import { useMutation } from '@tanstack/react-query';

import { uploadImage } from '@/shared/apis/uploadImage';
import { postQueries } from './postQueries';

export function usePostImageUploadMutation() {
  return useMutation({
    mutationKey: [...postQueries.all, 'uploadImage'],
    mutationFn: ({ file, signal }: { file: File; signal: AbortSignal }) =>
      uploadImage(file, signal),
    retry: false,
  });
}
