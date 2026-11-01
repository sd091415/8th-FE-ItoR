import type { Ref } from 'react';

import { useLocation, useMatch } from 'react-router';

import { LoginDialog } from '@/features/auth/ui/LoginDialog';
import type { LoginHandler } from '@/features/auth/model/login';
import { ReorderIcon } from '@/shared/assets/icons';
import { IconButton } from '@/shared/ui/IconButton';
import { PageHeader } from '@/shared/ui/PageHeader';

import { HomeHeaderActions } from './HomeHeaderActions';
import { PostHeaderActions } from './PostHeaderActions';
import { WriteHeaderActions } from './WriteHeaderActions';
import { ProfileHeaderActions } from './ProfileHeaderActions';

interface AppHeaderProps {
  signedIn: boolean;
  loginOpen: boolean;
  onLoginOpenChange: (open: boolean) => void;
  onLogin: LoginHandler;
  onWrite: () => void;
  canManagePost: boolean;
  postPending: boolean;
  profilePending: boolean;
  onEditPost: () => void;
  onDeletePost: () => Promise<boolean>;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  menuButtonRef: Ref<HTMLButtonElement>;
}

export function AppHeader({
  signedIn,
  loginOpen,
  onLoginOpenChange,
  onLogin,
  onWrite,
  canManagePost,
  postPending,
  profilePending,
  onEditPost,
  onDeletePost,
  sidebarOpen,
  onToggleSidebar,
  menuButtonRef,
}: AppHeaderProps) {
  const { pathname } = useLocation();
  const editMatch = useMatch('/posts/:postId/edit');
  const isWritingPage = pathname === '/posts/new' || editMatch !== null;
  const isPostPage = useMatch('/posts/:postId') !== null && !isWritingPage;
  const isBlogPage = pathname === '/' || isPostPage || isWritingPage;
  const isSignupPage = pathname === '/mypage/signup' || pathname.startsWith('/mypage/signup/');
  const isProfilePage = pathname === '/mypage/settings' || pathname === '/mypage/settings/edit';

  return (
    <PageHeader
      showLogo={!sidebarOpen}
      className={
        isBlogPage || isProfilePage
          ? `h-18 bg-white/90 py-4 font-auth backdrop-blur-[2px] ${isWritingPage || isProfilePage ? 'border-b border-neutral-100' : ''}`
          : undefined
      }
      menu={
        !sidebarOpen && (
          <IconButton
            ref={menuButtonRef}
            label="메뉴 열기"
            aria-expanded={false}
            onClick={onToggleSidebar}
          >
            <ReorderIcon aria-hidden="true" />
          </IconButton>
        )
      }
      actions={
        <>
          {isWritingPage && signedIn && (
            <WriteHeaderActions editing={editMatch !== null} pending={postPending} />
          )}
          {pathname === '/' && <HomeHeaderActions onWrite={onWrite} />}
          {isProfilePage && signedIn && (
            <ProfileHeaderActions editing={pathname.endsWith('/edit')} pending={profilePending} />
          )}
          {isPostPage && (
            <PostHeaderActions
              key={pathname}
              canManage={canManagePost}
              pending={postPending}
              onEdit={onEditPost}
              onDelete={onDeletePost}
            />
          )}
          <LoginDialog
            open={loginOpen}
            onOpenChange={onLoginOpenChange}
            onLogin={onLogin}
            trigger={isBlogPage || isSignupPage || isProfilePage ? null : undefined}
          />
        </>
      }
    />
  );
}
