import { Link, useNavigate, useOutletContext, useParams } from 'react-router';

import {
  useCreatePostMutation,
  useUpdatePostMutation,
} from '@/features/posts/api/usePostMutations';
import { usePostDetailQuery } from '@/features/posts/api/usePostQueries';
import { createPostDraft } from '@/features/posts/lib/postDraft';
import type { PostDraft } from '@/features/posts/model/postDraft';
import { PostEditor } from '@/features/posts/ui/PostEditor';
import { getApiErrorMessage } from '@/shared/apis/response';
import { Button } from '@/shared/ui/primitives/button';
import { notify } from '@/shared/ui/StatusToast';

import type { AppLayoutContext } from '../layouts/AppLayout';

export function PostWritePage() {
  const { previewUser, openLogin } = useOutletContext<AppLayoutContext>();
  const navigate = useNavigate();
  const { postId } = useParams();
  const detail = usePostDetailQuery(postId, previewUser !== null);
  const createPost = useCreatePostMutation();
  const updatePost = useUpdatePostMutation();

  if (!previewUser)
    return (
      <main className="p-8 text-center font-auth">
        <h1>로그인이 필요합니다.</h1>
        <Button onClick={openLogin} className="mt-4">
          로그인하기
        </Button>
      </main>
    );

  if (postId && detail.isPending)
    return (
      <main className="p-8 text-center font-auth">
        <p role="status">게시물을 불러오고 있습니다.</p>
      </main>
    );

  if (postId && detail.isError && !detail.data)
    return (
      <main className="space-y-4 p-8 text-center font-auth">
        <p role="alert">{getApiErrorMessage(detail.error)}</p>
        <Button onClick={() => void detail.refetch()}>다시 시도</Button>
        <Link to="/" className="block text-gitlog-action underline">
          목록으로
        </Link>
      </main>
    );

  if (postId && !detail.data?.isOwner)
    return (
      <main className="p-8 text-center font-auth">
        <h1>작성자만 게시글을 수정할 수 있습니다.</h1>
        <Link to={`/posts/${postId}`} className="mt-4 inline-block text-gitlog-action underline">
          게시글로 돌아가기
        </Link>
      </main>
    );

  async function publish(draft: PostDraft) {
    if (postId) {
      await updatePost.mutateAsync({ postId, draft });
      navigate(`/posts/${postId}`, { replace: true });
    } else {
      await createPost.mutateAsync(draft);
      navigate('/', { replace: true });
    }
    notify.success('저장되었습니다!');
  }

  return (
    <PostEditor
      key={postId ?? 'new'}
      initialDraft={postId && detail.data ? createPostDraft(detail.data.post) : undefined}
      onPublish={publish}
      submitting={createPost.isPending || updatePost.isPending}
    />
  );
}
