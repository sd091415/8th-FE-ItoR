import { useState } from 'react';

import { useNavigate } from 'react-router';

import { useAuthSession } from '@/features/auth/api/useAuthSession';
import { useLoginMutation } from '@/features/auth/api/useLoginMutation';
import { startKakaoAuth } from '@/features/auth/api/startKakaoAuth';
import type { LoginHandler } from '@/features/auth/model/login';

export function useLayoutAuth() {
  const navigate = useNavigate();
  const session = useAuthSession();
  const login = useLoginMutation();
  const [loginOpen, setLoginOpen] = useState(false);
  const [writeAfterLogin, setWriteAfterLogin] = useState(false);

  function openLogin() {
    setLoginOpen(true);
  }

  function changeLoginOpen(open: boolean) {
    setLoginOpen(open);
    if (!open) setWriteAfterLogin(false);
  }

  const completeLogin: LoginHandler = async (method, credentials) => {
    if (method === 'kakao') {
      startKakaoAuth();
      return;
    }
    if (!credentials) throw new Error('이메일과 비밀번호를 입력해주세요.');
    if (login.isPending) throw new Error('로그인 요청을 처리하고 있습니다.');
    await login.mutateAsync(credentials);
    setLoginOpen(false);
    setWriteAfterLogin(false);
    if (writeAfterLogin) navigate('/posts/new');
  };

  function startWriting() {
    if (session.user) navigate('/posts/new');
    else {
      setWriteAfterLogin(true);
      openLogin();
    }
  }

  function logout() {
    session.logout();
    setLoginOpen(false);
    setWriteAfterLogin(false);
    navigate('/');
  }

  return {
    loginOpen,
    previewUser: session.user,
    isRestoring: session.isRestoring,
    authError: session.error,
    retryAuth: session.retry,
    openLogin,
    changeLoginOpen,
    completeLogin,
    startWriting,
    logout,
  };
}
