import { useEffect, useRef } from 'react';

import { useNavigate, useOutletContext, useSearchParams } from 'react-router';

import { useMyPostListQuery, usePostListQuery } from '@/features/posts/api/usePostQueries';
import { POSTS_PER_PAGE } from '@/features/posts/model/post';
import { PostListItem } from '@/features/posts/ui/PostListItem';
import { MyGitlogProfile } from '@/features/profile/ui/MyGitlogProfile';
import { Pagination } from '@/shared/ui/Pagination';
import { useCurrentTime } from '@/shared/hooks/useCurrentTime';
import { GitlogButton } from '@/shared/ui/GitlogButton';
import { getApiErrorMessage } from '@/shared/apis/response';

import type { AppLayoutContext } from '../layouts/AppLayout';

export function HomePage() {
  const { previewUser, openLogin, startWriting } = useOutletContext<AppLayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const now = useCurrentTime();
  const navigate = useNavigate();
  const heading = useRef<HTMLHeadingElement>(null);
  const isMyGitlog = searchParams.get('view') === 'mine';
  const requestedPage = Number(searchParams.get('page') ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const list = usePostListQuery({ page, size: POSTS_PER_PAGE }, !isMyGitlog);
  const mine = useMyPostListQuery(isMyGitlog && Boolean(previewUser));
  const result = isMyGitlog ? mine : list;
  const posts = isMyGitlog
    ? (mine.data ?? []).slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)
    : (list.data?.posts ?? []);
  const totalPages = isMyGitlog
    ? Math.ceil((mine.data?.length ?? 0) / POSTS_PER_PAGE)
    : (list.data?.totalPages ?? 0);

  useEffect(() => {
    if (!result.data || page <= Math.max(1, totalPages)) return;
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        params.set('page', String(Math.max(1, totalPages)));
        return params;
      },
      { replace: true },
    );
  }, [result.data, page, totalPages, setSearchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  function changePage(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    if (nextPage === 1) params.delete('page');
    else params.set('page', String(nextPage));
    setSearchParams(params);
    heading.current?.focus({ preventScroll: true });
  }

  return (
    <main className="w-full font-auth">
      <h1 ref={heading} tabIndex={-1} className="sr-only">
        {isMyGitlog ? '나의 깃로그' : '깃로그 게시글 목록'}
      </h1>
      {isMyGitlog && previewUser && (
        <MyGitlogProfile user={previewUser} onSettings={() => navigate('/mypage/settings')} />
      )}
      <div className="mx-auto w-full max-w-[688px] pt-5 pb-9 sm:pt-8 sm:pb-16">
        {isMyGitlog && !previewUser ? (
          <div className="space-y-4 px-4 py-8 text-center">
            <p>로그인하면 나의 깃로그를 확인할 수 있습니다.</p>
            <GitlogButton onClick={openLogin}>로그인하기</GitlogButton>
          </div>
        ) : result.isPending ? (
          <p role="status" className="px-4 py-8 text-center">
            {isMyGitlog ? '내 게시물을 확인하고 있습니다.' : '게시물을 불러오고 있습니다.'}
          </p>
        ) : result.isError ? (
          <div className="space-y-4 px-4 py-8 text-center">
            <p role="alert">{getApiErrorMessage(result.error)}</p>
            <GitlogButton onClick={() => void result.refetch()}>다시 시도</GitlogButton>
          </div>
        ) : posts.length === 0 ? (
          <div className="space-y-4 px-4 py-8 text-center">
            <p>{isMyGitlog ? '아직 작성한 깃로그가 없습니다.' : '등록된 깃로그가 없습니다.'}</p>
            <GitlogButton onClick={startWriting}>깃로그 쓰기</GitlogButton>
          </div>
        ) : (
          <>
            <ul aria-label="게시글 목록">
              {posts.map((post) => (
                <PostListItem key={post.id} post={post} now={now} />
              ))}
            </ul>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={changePage}
              className="mt-5 justify-center sm:mt-8"
            />
          </>
        )}
      </div>
    </main>
  );
}
