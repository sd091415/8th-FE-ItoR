import { useNavigate, useOutletContext } from 'react-router';
import { useUpdateProfileMutation } from '@/features/profile/api/useUpdateProfileMutation';
import { useUserQuery } from '@/features/profile/api/useUserQuery';
import { getApiErrorMessage } from '@/shared/apis/response';
import { getAuthSnapshot } from '@/shared/apis/tokenSession';

import type { ProfileDraft } from '@/features/profile/model/profile';
import { ProfileSettingsForm } from '@/features/profile/ui/ProfileSettingsForm';
import { GitlogButton } from '@/shared/ui/GitlogButton';
import { notify } from '@/shared/ui/StatusToast';

import type { AppLayoutContext } from '../layouts/AppLayout';

export function ProfileSettingsPage({ editing = false }: { editing?: boolean }) {
  const { previewUser, openLogin } = useOutletContext<AppLayoutContext>();
  const update = useUpdateProfileMutation();
  const me = useUserQuery(getAuthSnapshot());
  const navigate = useNavigate();
  if (!previewUser)
    return (
      <main className="p-8 text-center font-auth">
        <h1>로그인이 필요합니다.</h1>
        <GitlogButton onClick={openLogin} className="mt-4">
          로그인하기
        </GitlogButton>
      </main>
    );
  async function save(draft: ProfileDraft) {
    if (!previewUser || update.isPending) return false;
    try {
      const result = await update.mutateAsync({ profile: previewUser, draft });
      navigate('/mypage/settings');
      if (!result.refreshed) {
        notify.error('변경은 저장되었지만 최신 정보를 불러오지 못했습니다. 다시 조회해주세요.');
      } else {
        notify.success(result.changed ? '저장되었습니다!' : '변경된 내용이 없습니다.');
      }
      return true;
    } catch (error) {
      notify.error(getApiErrorMessage(error));
      return false;
    }
  }
  return (
    <main className="font-auth">
      <h1 className="sr-only">{editing ? '내 프로필 수정' : '내 프로필 설정'}</h1>
      {me.isError && (
        <div className="p-4 text-center">
          <p role="alert">최신 정보를 불러오지 못했습니다. {getApiErrorMessage(me.error)}</p>
          <GitlogButton
            disabled={me.isFetching || update.isPending}
            onClick={() => {
              void me.refetch();
            }}
            className="mt-3"
          >
            {me.isFetching ? '조회 중...' : '다시 조회'}
          </GitlogButton>
        </div>
      )}
      <ProfileSettingsForm
        key={`${previewUser.id}-${editing}`}
        profile={previewUser}
        editing={editing}
        pending={update.isPending}
        onSave={save}
      />
    </main>
  );
}
