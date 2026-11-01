import { getUploadedImageUrl } from '@/shared/utils/getUploadedImageUrl';

import { getAuthSnapshot } from './tokenSession';
import { imageApi } from './imageApi';

export async function uploadImage(file: File, signal?: AbortSignal) {
  const session = getAuthSnapshot();
  if (!session.hasSession) throw new Error('사진을 업로드하려면 로그인이 필요합니다.');
  const requireSession = () => {
    if (signal?.aborted) throw new DOMException('사진 업로드가 취소되었습니다.', 'AbortError');
    const current = getAuthSnapshot();
    if (!current.hasSession || current.revision !== session.revision) {
      throw new Error('로그인 상태가 변경되었습니다. 사진을 다시 선택해주세요.');
    }
  };
  requireSession();
  const { data } = await imageApi.getPresignedUrl(file.name, signal);
  const imageUrl = getUploadedImageUrl(data);
  requireSession();
  try {
    await imageApi.upload(data, file, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('사진 업로드에 실패했습니다. 사진을 다시 선택해주세요.', { cause: error });
  }
  requireSession();
  return imageUrl;
}
