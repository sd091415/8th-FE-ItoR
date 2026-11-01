import { useEffect, useSyncExternalStore } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  clearAuthSession,
  getAuthSnapshot,
  subscribeAuthSession,
} from '@/shared/apis/tokenSession';
import { getApiErrorMessage } from '@/shared/apis/response';
import { useUserQuery } from '@/features/profile/api/useUserQuery';

import './authSession';

export function useAuthSession() {
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSnapshot);
  const user = useUserQuery(session);
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.removeQueries({
      predicate: (query) =>
        query.meta?.requiresAuth === true &&
        (!session.hasSession || query.queryKey[2] !== session.revision),
    });
  }, [queryClient, session.hasSession, session.revision]);

  return {
    user: session.hasSession ? (user.data ?? null) : null,
    isRestoring: session.hasSession && user.isPending,
    error: user.isError && !user.data ? getApiErrorMessage(user.error) : null,
    retry: () => {
      void user.refetch();
    },
    logout: () => {
      clearAuthSession();
      void queryClient.cancelQueries();
      queryClient.removeQueries();
    },
  };
}
