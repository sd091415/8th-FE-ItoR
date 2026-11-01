import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getAuthSnapshot } from '@/shared/apis/tokenSession';
import { getApiErrorMessage } from '@/shared/apis/response';
import { postQueries } from '@/features/posts/api/postQueries';

import type { Profile, ProfileDraft } from '../model/profile';
import { createProfileChanges } from '../lib/createProfileChanges';
import { profileApi } from './profileApi';
import { profileQueries } from './profileQueries';
import { userQueryOptions } from './useUserQuery';

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...profileQueries.all, 'update'],
    mutationFn: async ({ profile, draft }: { profile: Profile; draft: ProfileDraft }) => {
      const session = getAuthSnapshot();
      if (!session.hasSession) throw new Error('로그인이 필요합니다.');
      const { user, nickname, picture, password } = createProfileChanges(profile, draft);
      let saved = 0;
      let refreshed = true;
      const sameSession = () =>
        getAuthSnapshot().hasSession && getAuthSnapshot().revision === session.revision;
      const requireSession = () => {
        if (!sameSession()) throw new Error('로그인 상태가 변경되었습니다. 다시 로그인해주세요.');
      };
      const run = async (operation: () => Promise<unknown>) => {
        requireSession();
        await operation();
        saved++;
        requireSession();
      };
      try {
        if (user) await run(() => profileApi.update(user));
        if (nickname) await run(() => profileApi.updateNickname(nickname));
        if (picture) await run(() => profileApi.updatePicture(picture));
        if (password) await run(() => profileApi.updatePassword(password));
      } catch (error) {
        throw new Error(
          `${saved ? '일부 변경 사항은 저장되었습니다. ' : ''}${getApiErrorMessage(error)}`,
          { cause: error },
        );
      } finally {
        if (sameSession() && saved) {
          const key = profileQueries.me(session.revision);
          await queryClient.invalidateQueries({ queryKey: key, exact: true, refetchType: 'none' });
          try {
            await queryClient.fetchQuery(userQueryOptions(session));
          } catch {
            refreshed = false;
          }
          if (sameSession()) await queryClient.invalidateQueries({ queryKey: postQueries.all });
        }
      }
      requireSession();
      return { changed: saved > 0, refreshed };
    },
    retry: false,
  });
}
