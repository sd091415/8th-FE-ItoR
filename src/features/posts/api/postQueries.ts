import type { PostListParams } from '../model/postResponse';

export const postQueries = {
  all: ['posts'] as const,
  mine: (revision: number) => ['posts', 'mine', revision] as const,
  list: (params: PostListParams, authenticated: boolean, revision: number) =>
    [...postQueries.all, 'list', { ...params, authenticated, revision }] as const,
  detail: (postId: string, authenticated: boolean, revision: number) =>
    [...postQueries.all, 'detail', postId, { authenticated, revision }] as const,
};
