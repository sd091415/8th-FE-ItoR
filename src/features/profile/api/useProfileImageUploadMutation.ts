import { useMutation } from '@tanstack/react-query';

import { uploadImage } from '@/shared/apis/uploadImage';

import { profileQueries } from './profileQueries';

export function useProfileImageUploadMutation() {
  return useMutation({
    mutationKey: [...profileQueries.all, 'uploadImage'],
    mutationFn: ({ file, signal }: { file: File; signal: AbortSignal }) =>
      uploadImage(file, signal),
    retry: false,
  });
}
