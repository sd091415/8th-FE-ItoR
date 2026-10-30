import { useRef, useState } from 'react';

import { useCurrentTime } from '@/shared/hooks/useCurrentTime';
import { notify } from '@/shared/ui/StatusToast';

import type { CommentAuthor, PostComment } from '../model/comment';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';

interface CommentSectionProps {
  onLogin: () => void;
  currentUser: CommentAuthor | null;
  comments: PostComment[];
  onCreate: (content: string) => void | Promise<void>;
  onEdit: (id: string, content: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function CommentSection({
  onLogin,
  currentUser,
  comments,
  onCreate,
  onEdit,
  onDelete,
}: CommentSectionProps) {
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const now = useCurrentTime();

  async function addComment(content: string) {
    if (!currentUser) throw new Error('로그인이 필요합니다.');
    await onCreate(content);
    setMessage('댓글을 등록했습니다.');
  }

  async function editComment(id: string, content: string) {
    await onEdit(id, content);
    setMessage('');
    notify.success('저장되었습니다!');
    heading.current?.focus({ preventScroll: true });
  }

  async function deleteComment(id: string) {
    await onDelete(id);
    setMessage('');
    notify.success('삭제가 완료되었습니다!');
    heading.current?.focus({ preventScroll: true });
  }
  return (
    <section
      aria-labelledby="post-comments"
      className="border-b border-neutral-100 bg-white pb-9 sm:pb-16"
    >
      <div className="mx-auto w-full max-w-[688px]">
        <h2
          ref={heading}
          id="post-comments"
          tabIndex={-1}
          className="flex scroll-mt-4 items-center gap-2 px-4 pt-4 pb-3 text-base leading-6 font-medium text-black focus-visible:outline-2 focus-visible:outline-gitlog-action"
        >
          댓글 <span className="font-normal text-gitlog-action">{comments.length}</span>
        </h2>
        {comments.length === 0 ? (
          <p className="my-5 px-4 py-3 text-center text-sm leading-6 font-light text-stone-300">
            작성된 댓글이 없습니다.
            <br />
            응원의 첫 번째 댓글을 달아주세요.
          </p>
        ) : (
          <ul aria-label="댓글 목록" className="mt-5 mb-5 space-y-2.5">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                now={now}
                onEdit={editComment}
                onDelete={deleteComment}
              />
            ))}
          </ul>
        )}
        <p role="status" className="sr-only">
          {message}
        </p>
        <div className="px-4 py-3">
          {currentUser ? (
            <CommentForm key={currentUser.id} author={currentUser} onSubmit={addComment} />
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="w-full rounded-sm border border-neutral-200 px-4 py-5 text-left text-sm leading-6 font-light text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gitlog-action"
            >
              <span className="block min-h-16">로그인을 하고 댓글을 달아보세요!</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
