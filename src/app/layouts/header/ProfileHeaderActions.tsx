import { Link } from 'react-router';
import { useIsMutating } from '@tanstack/react-query';

import { profileQueries } from '@/features/profile/api/profileQueries';

import { Button } from '@/shared/ui/primitives/button';

export function ProfileHeaderActions({ editing, pending }: { editing: boolean; pending: boolean }) {
  const uploading = useIsMutating({ mutationKey: [...profileQueries.all, 'uploadImage'] }) > 0;
  return (
    <div className="flex items-center gap-2.5">
      {editing ? (
        <>
          <Button
            asChild
            variant="ghost"
            className="h-10 rounded-full px-3 font-normal text-gitlog-danger hover:text-gitlog-danger"
          >
            <Link
              to="/mypage/settings"
              aria-disabled={pending}
              tabIndex={pending ? -1 : undefined}
              onClick={(event) => {
                if (pending) event.preventDefault();
              }}
            >
              취소하기
            </Link>
          </Button>
          <Button
            type="submit"
            form="profile-settings"
            disabled={pending || uploading}
            variant="ghost"
            className="h-10 rounded-full px-3 font-normal text-black"
          >
            {pending ? '저장 중...' : uploading ? '사진 업로드 중...' : '저장하기'}
          </Button>
        </>
      ) : (
        <Button asChild variant="ghost" className="h-10 rounded-full px-3 font-normal text-black">
          <Link to="/mypage/settings/edit">수정하기</Link>
        </Button>
      )}
    </div>
  );
}
