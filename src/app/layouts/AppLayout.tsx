import { useEffect, useRef, useState } from 'react';

import { useIsMutating } from '@tanstack/react-query';
import { Outlet, useMatch, useNavigate } from 'react-router';

import { postQueries } from '@/features/posts/api/postQueries';
import { useDeletePostMutation } from '@/features/posts/api/usePostMutations';
import { usePostDetailQuery } from '@/features/posts/api/usePostQueries';
import type { PostComment } from '@/features/comments/model/comment';
import { usePreviewComments } from '@/features/comments/model/usePreviewComments';
import type { Profile } from '@/features/profile/model/profile';
import { profileQueries } from '@/features/profile/api/profileQueries';
import { getApiErrorMessage } from '@/shared/apis/response';
import { Toaster } from '@/shared/ui/primitives/sonner';
import { notify } from '@/shared/ui/StatusToast';
import { cn } from '@/shared/utils/cn';
import { GitlogButton } from '@/shared/ui/GitlogButton';

import { AppHeader } from './header/AppHeader';
import { AppSidebar } from './AppSidebar';
import { useLayoutAuth } from './hooks/useLayoutAuth';
import { useRouteScroll } from './hooks/useRouteScroll';

export interface AppLayoutContext {
  openLogin: () => void;
  previewUser: Profile | null;
  startWriting: () => void;
  commentsByPost: Record<string, PostComment[]>;
  setPostComments: (postId: string, comments: PostComment[]) => void;
}

export function AppLayout() {
  const {
    loginOpen,
    previewUser,
    isRestoring,
    authError,
    retryAuth,
    openLogin,
    changeLoginOpen,
    completeLogin,
    startWriting,
    logout,
  } = useLayoutAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const restoreMenuFocus = useRef(false);

  useEffect(() => {
    if (!sidebarOpen && restoreMenuFocus.current) {
      menuButton.current?.focus({ preventScroll: true });
      restoreMenuFocus.current = false;
    }
  }, [sidebarOpen]);

  function closeSidebar() {
    restoreMenuFocus.current = true;
    setSidebarOpen(false);
  }
  const users = previewUser ? [previewUser] : [];
  const { commentsByPost, setPostComments } = usePreviewComments(users);
  const detailMatch = useMatch('/posts/:postId');
  const writingNewPost = useMatch('/posts/new') !== null;
  const detail = usePostDetailQuery(
    detailMatch?.params.postId,
    !writingNewPost && !isRestoring && !authError,
  );
  const currentPost = detail.data?.post;
  const canManagePost =
    previewUser !== null && detail.isSuccess && detail.data.isOwner && !isRestoring && !authError;
  const deletePost = useDeletePostMutation();
  const postPending = useIsMutating({ mutationKey: postQueries.all }) > 0;
  const profilePending = useIsMutating({ mutationKey: [...profileQueries.all, 'update'] }) > 0;
  const deleting = useRef(false);
  const navigate = useNavigate();
  useRouteScroll();

  async function removeCurrentPost() {
    if (deleting.current || postPending) return false;
    if (!currentPost) {
      notify.error('게시글을 찾을 수 없습니다.');
      return false;
    }
    deleting.current = true;
    try {
      await deletePost.mutateAsync(currentPost.id);
      navigate('/');
      notify.success('삭제가 완료되었습니다!');
      return true;
    } catch (error) {
      notify.error(getApiErrorMessage(error));
      return false;
    } finally {
      deleting.current = false;
    }
  }

  return (
    <div className={cn('min-h-dvh bg-white text-neutral-950', sidebarOpen && 'sm:pl-60 xl:pl-0')}>
      {sidebarOpen && (
        <AppSidebar
          user={previewUser}
          onClose={closeSidebar}
          onStart={() => {
            menuButton.current?.focus({ preventScroll: true });
            setSidebarOpen(false);
            openLogin();
          }}
          onMyGitlog={() => {
            setSidebarOpen(false);
            navigate('/?view=mine');
          }}
          onWrite={() => {
            setSidebarOpen(false);
            startWriting();
          }}
          onSettings={() => {
            setSidebarOpen(false);
            navigate('/mypage/settings');
          }}
          onLogout={logout}
        />
      )}
      <AppHeader
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => (sidebarOpen ? closeSidebar() : setSidebarOpen(true))}
        menuButtonRef={menuButton}
        signedIn={previewUser !== null}
        loginOpen={loginOpen}
        onLoginOpenChange={changeLoginOpen}
        onLogin={completeLogin}
        onWrite={() => {
          setSidebarOpen(false);
          startWriting();
        }}
        canManagePost={canManagePost}
        postPending={postPending}
        profilePending={profilePending}
        onEditPost={() => {
          if (currentPost && !postPending) navigate(`/posts/${currentPost.id}/edit`);
        }}
        onDeletePost={removeCurrentPost}
      />
      {isRestoring ? (
        <p role="status" className="p-8 text-center">
          로그인 정보를 불러오고 있습니다.
        </p>
      ) : authError ? (
        <main className="p-8 text-center">
          <p role="alert">{authError}</p>
          <GitlogButton onClick={retryAuth} className="mt-4">
            다시 시도
          </GitlogButton>
          <GitlogButton onClick={logout} className="mt-4">
            로그아웃
          </GitlogButton>
        </main>
      ) : (
        <Outlet
          context={
            {
              openLogin,
              previewUser,
              startWriting,
              commentsByPost,
              setPostComments,
            } satisfies AppLayoutContext
          }
        />
      )}
      <Toaster offset={88} mobileOffset={88} />
    </div>
  );
}
