import type { Profile, ProfileDraft } from '../model/profile';
import type {
  UpdateUserBody,
  UpdateNicknameBody,
  UpdatePictureBody,
  UpdatePasswordBody,
} from '../model/userRequest';
import { validateProfile } from './validateProfile';

interface ProfileChanges {
  user?: UpdateUserBody;
  nickname?: UpdateNicknameBody;
  picture?: UpdatePictureBody;
  password?: UpdatePasswordBody;
}

export function createProfileChanges(profile: Profile, draft: ProfileDraft): ProfileChanges {
  const error = Object.values(validateProfile(draft, profile.method))[0];
  if (error) throw new Error(error);
  const email = draft.email.trim();
  const nickname = draft.nickname.trim();
  const name = draft.name.trim();
  const birthDate = draft.birthDate.replace(/\s/g, '');
  const picture = draft.avatarUrl?.trim() ?? '';
  const changes: ProfileChanges = {};
  if (
    email !== profile.email ||
    name !== profile.name ||
    birthDate !== profile.birthDate ||
    draft.introduction !== (profile.introduction ?? '')
  ) {
    changes.user = {
      email,
      nickname,
      name,
      birthDate,
      introduction: draft.introduction,
      profilePicture: profile.avatarUrl || undefined,
    };
  } else if (nickname !== profile.nickname) {
    changes.nickname = { nickname };
  }
  if (picture !== (profile.avatarUrl ?? '')) changes.picture = { profilePicture: picture };
  if (profile.method === 'email' && draft.password) changes.password = { password: draft.password };
  return changes;
}
