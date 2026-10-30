import { useRef, useState } from 'react';

import { ChatIcon, MoreVertIcon } from '@/shared/assets/icons';
import { ActionMenu } from '@/shared/ui/ActionMenu';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { IconButton } from '@/shared/ui/IconButton';
import { Button } from '@/shared/ui/primitives/button';

interface PostHeaderActionsProps {
  canManage: boolean;
  pending?: boolean;
  onEdit: () => void;
  onDelete: () => Promise<boolean>;
}

export function PostHeaderActions({
  canManage,
  pending = false,
  onEdit,
  onDelete,
}: PostHeaderActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const selectedAction = useRef(false);
  return (
    <>
      <Button asChild variant="ghost" size="icon-lg" aria-label="댓글로 이동">
        <a href="#post-comments">
          <ChatIcon aria-hidden="true" className="size-6" />
        </a>
      </Button>
      {canManage && (
        <ActionMenu
          appearance="post"
          onCloseAutoFocus={(event) => {
            if (selectedAction.current) event.preventDefault();
            selectedAction.current = false;
          }}
          label="게시글 메뉴 열기"
          trigger={
            <IconButton ref={menuButton} label="게시글 메뉴 열기" size="lg" disabled={pending}>
              <MoreVertIcon aria-hidden="true" />
            </IconButton>
          }
          items={[
            {
              id: 'edit',
              label: '수정하기',
              onSelect: () => {
                selectedAction.current = true;
                onEdit();
              },
            },
            {
              id: 'delete',
              label: '삭제하기',
              destructive: true,
              onSelect: () => {
                selectedAction.current = true;
                setDeleteOpen(true);
              },
            },
          ]}
        />
      )}
      <ConfirmDialog
        pending={pending}
        open={deleteOpen && canManage}
        onOpenChange={setDeleteOpen}
        title="해당 블로그를 삭제하시겠어요?"
        description="삭제된 블로그는 다시 확인할 수 없어요."
        confirmLabel="삭제하기"
        confirmVariant="destructiveSolid"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          menuButton.current?.focus();
        }}
        onConfirm={async () => {
          if (pending) return;
          if (await onDelete()) setDeleteOpen(false);
        }}
      />
    </>
  );
}
