import { getAuthSnapshot } from '@/shared/apis/tokenSession';

import type { Post } from '../model/post';
import { POSTS_PER_PAGE } from '../model/post';
import { mapPostSummary } from '../lib/mapPostResponse';
import { postsApi } from './postsApi';

export async function getMyPosts(revision: number, signal?: AbortSignal) {
  const requireSession = () => {
    if (signal?.aborted) throw new DOMException('조회가 취소되었습니다.', 'AbortError');
    const session = getAuthSnapshot();
    if (!session.hasSession || session.revision !== revision) {
      throw new Error('로그인 상태가 변경되었습니다. 다시 로그인해주세요.');
    }
  };
  const owned: Post[] = [];
  const visited = new Set<string>();
  let page = 1;
  let totalPages = 1;
  // shortcut: 목록 전체와 인증 상세의 isOwner를 확인한다.
  while (page <= totalPages) {
    requireSession();
    const { data } = await postsApi.getList({ page, size: POSTS_PER_PAGE }, true, signal);
    requireSession();
    totalPages = data.pageMax;
    const candidates = data.posts.filter((post) => {
      if (visited.has(post.postId)) return false;
      visited.add(post.postId);
      return true;
    });
    // 상세 요청은 한 번에 최대 4개만 보내고 목록 순서를 유지한다.
    for (let start = 0; start < candidates.length; start += 4) {
      requireSession();
      const group = await Promise.all(
        candidates.slice(start, start + 4).map(async (summary) => {
          const { data: detail } = await postsApi.getDetail(summary.postId, true, signal);
          requireSession();
          return detail.isOwner ? mapPostSummary(summary) : null;
        }),
      );
      group.forEach((post) => {
        if (post) owned.push(post);
      });
    }
    page++;
  }
  requireSession();
  return owned;
}
