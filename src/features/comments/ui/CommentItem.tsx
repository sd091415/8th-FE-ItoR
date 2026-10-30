import { useRef, useState } from 'react';

import { getApiErrorMessage } from '@/shared/apis/response';
import { MoreVertIcon } from '@/shared/assets/icons';
import { ActionMenu } from '@/shared/ui/ActionMenu';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { IconButton } from '@/shared/ui/IconButton';
import { ProfileAvatar } from '@/shared/ui/ProfileAvatar';
import { notify } from '@/shared/ui/StatusToast';
import { formatPublishedTime } from '@/shared/utils/formatPublishedTime';

import type { CommentAuthor, PostComment } from '../model/comment';
import { CommentForm } from './CommentForm';

interface CommentItemProps {
  comment: PostComment;
  currentUser: CommentAuthor | null;
  now: number;
  onEdit: (id: string, content: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function CommentItem({ comment, currentUser, now, onEdit, onDelete }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deletingRef = useRef(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const selectedAction = useRef<'edit' | 'delete' | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const owned = currentUser !== null && comment.isOwner;

  async function deleteComment() {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setDeleteError('');
    try {
      await onDelete(comment.id);
      setDeleteOpen(false);
    } catch (cause) {
      const message = getApiErrorMessage(cause, '댓글을 삭제하지 못했습니다. 다시 시도해주세요.');
      setDeleteError(message);
      notify.error(message);
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  return (
    <li className="pb-5">
      <article>
        <div className="flex items-center">
          <div className="flex min-w-0 flex-1 items-start gap-1.5 px-4 py-3">
            <ProfileAvatar alt="" src={comment.author.avatarUrl} size="sm" className="size-5" />
            <div className="min-w-0">
              <h3 className="text-sm leading-6 font-normal break-words text-zinc-800">
                {comment.author.nickname}
              </h3>
              <time
                dateTime={comment.createdAt}
                className="text-xs leading-5 font-light text-neutral-400"
              >
                {formatPublishedTime(comment.createdAt, now)}
              </time>
            </div>
          </div>
          {owned && (
            <div className="pr-2">
              <ActionMenu
                appearance="post"
                onCloseAutoFocus={(event) => {
                  if (!selectedAction.current) return;
                  event.preventDefault();
                  if (selectedAction.current === 'edit') editor.current?.focus();
                  selectedAction.current = null;
                }}
                label="댓글 메뉴 열기"
                trigger={
                  <IconButton
                    ref={menuButton}
                    disabled={editing || deleting}
                    label={`${comment.author.nickname} 댓글 메뉴 열기`}
                    className="size-10"
                  >
                    <MoreVertIcon aria-hidden="true" className="size-6" />
                  </IconButton>
                }
                items={[
                  {
                    id: 'edit',
                    label: '수정하기',
                    onSelect: () => {
                      selectedAction.current = 'edit';
                      setEditing(true);
                    },
                  },
                  {
                    id: 'delete',
                    label: '삭제하기',
                    destructive: true,
                    onSelect: () => {
                      selectedAction.current = 'delete';
                      setDeleteError('');
                      setDeleteOpen(true);
                    },
                  },
                ]}
              />
            </div>
          )}
        </div>
        {editing && owned ? (
          <div className="px-4 py-3">
            <CommentForm
              textareaRef={editor}
              author={comment.author}
              initialContent={comment.content}
              onCancel={() => {
                setEditing(false);
                requestAnimationFrame(() => menuButton.current?.focus());
              }}
              onSubmit={async (content) => {
                await onEdit(comment.id, content);
                setEditing(false);
              }}
            />
          </div>
        ) : (
          <p className="py-3 pr-4 pl-10 text-sm leading-6 font-light break-words whitespace-pre-wrap text-zinc-800">
            {comment.content}
          </p>
        )}
      </article>
      <ConfirmDialog
        open={deleteOpen && owned}
        onOpenChange={setDeleteOpen}
        title="해당 댓글을 삭제하시겠어요?"
        description={deleteError || '삭제된 댓글은 다시 확인할 수 없어요.'}
        confirmLabel="삭제하기"
        confirmVariant="destructiveSolid"
        pending={deleting}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = menuButton.current ?? document.getElementById('post-comments');
          target?.focus({ preventScroll: true });
        }}
        onConfirm={() => void deleteComment()}
      />
    </li>
  );
}
