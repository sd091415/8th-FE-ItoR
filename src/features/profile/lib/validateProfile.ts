import { validateSignup } from '@/features/auth/lib/validateSignup';
import type { SignupMethod } from '@/features/auth/model/signup';

import type { ProfileDraft, ProfileErrors } from '../model/profile';

export function validateProfile(values: ProfileDraft, method: SignupMethod) {
  const unchangedPassword = !values.password && !values.passwordConfirmation;
  const errors: ProfileErrors = validateSignup(values, method);
  if (unchangedPassword) {
    delete errors.password;
    delete errors.passwordConfirmation;
  }
  const picture = values.avatarUrl?.trim();
  if (picture) {
    try {
      const url = new URL(picture);
      if (!['https:', 'http:'].includes(url.protocol) || picture.length > 1000) {
        errors.avatarUrl =
          '* 프로필 사진은 1000자 이하의 http 또는 https 이미지 URL을 입력해주세요.';
      }
    } catch {
      errors.avatarUrl = '* 올바른 이미지 URL을 입력해주세요.';
    }
  }
  return errors;
}
