import { api } from '@/shared/apis/client';
import { isRecord, readApiResponse } from '@/shared/apis/response';

import type { UserResponse } from '../model/userResponse';
import type {
  UpdateUserBody,
  UpdateNicknameBody,
  UpdatePasswordBody,
  UpdatePictureBody,
} from '../model/userRequest';

async function patchUser(path: string, body: object) {
  const response = await api.patch<unknown>(path, body);
  return readApiResponse(
    response.data,
    (data): data is null | undefined | Record<string, unknown> => data == null || isRecord(data),
  );
}

function isUserResponse(value: unknown): value is UserResponse {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    Number.isSafeInteger(value.id) &&
    typeof value.email === 'string' &&
    typeof value.nickname === 'string' &&
    typeof value.name === 'string' &&
    typeof value.birthDate === 'string' &&
    (value.profilePicture == null || typeof value.profilePicture === 'string') &&
    (value.introduction == null || typeof value.introduction === 'string')
  );
}

export const profileApi = {
  update: (body: UpdateUserBody) => patchUser('/users', body),
  updateNickname: (body: UpdateNicknameBody) => patchUser('/users/nickname', body),
  updatePassword: (body: UpdatePasswordBody) => patchUser('/users/password', body),
  updatePicture: (body: UpdatePictureBody) => patchUser('/users/picture', body),
  getMe: async (signal?: AbortSignal) => {
    const response = await api.get<unknown>('/users/me', { signal });
    return readApiResponse(response.data, isUserResponse);
  },
};
