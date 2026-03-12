"use client";

import { useState, useCallback } from "react";
import type { Project, User } from "@/types";
import {
  useAddMember,
  useRemoveMember,
  useArchiveMember,
  useUnarchiveMember,
  useBulkDeleteMembers,
  useBulkArchiveMembers,
} from "@/hooks/useMembers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const roleLabels: Record<string, string> = {
  admin: "管理者",
  member: "メンバー",
  viewer: "閲覧者",
};

interface MemberListProps {
  project: Project;
  users: User[];
  projectId: string;
}

export function MemberList({ project, users, projectId }: MemberListProps) {
  const addMember = useAddMember(projectId);
  const removeMember = useRemoveMember(projectId);
  const archiveMember = useArchiveMember(projectId);
  const unarchiveMember = useUnarchiveMember(projectId);
  const bulkDeleteMembers = useBulkDeleteMembers(projectId);
  const bulkArchiveMembers = useBulkArchiveMembers(projectId);

  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const memberUserIds = new Set(project.members.map((m) => m.user_id));
  const availableUsers = users.filter((u) => !memberUserIds.has(u.id));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const filteredMembers = project.members.filter((m) =>
    showArchived ? m.is_archived : !m.is_archived
  );

  const allSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedIds.has(m.user_id));

  const toggleSelect = useCallback((userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (members: typeof filteredMembers) => {
      setSelectedIds((prev) => {
        const allChecked = members.every((m) => prev.has(m.user_id));
        if (allChecked) {
          const next = new Set(prev);
          members.forEach((m) => next.delete(m.user_id));
          return next;
        } else {
          const next = new Set(prev);
          members.forEach((m) => next.add(m.user_id));
          return next;
        }
      });
    },
    []
  );

  async function handleAdd() {
    if (!selectedUser) return;
    await addMember.mutateAsync({
      user_id: selectedUser,
      role: selectedRole,
    });
    setSelectedUser("");
    setSelectedRole("member");
    setOpen(false);
  }

  async function handleRemove(userId: string) {
    if (confirm("このメンバーをプロジェクトから削除しますか？")) {
      await removeMember.mutateAsync(userId);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }

  async function handleArchive(userId: string) {
    await archiveMember.mutateAsync(userId);
  }

  async function handleUnarchive(userId: string) {
    await unarchiveMember.mutateAsync(userId);
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (confirm(`選択した ${selectedIds.size} 人のメンバーを削除しますか？`)) {
      await bulkDeleteMembers.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  }

  async function handleBulkArchive() {
    if (selectedIds.size === 0) return;
    await bulkArchiveMembers.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
  }

  function handleClearSelection() {
    setSelectedIds(new Set());
  }

  const activeCount = project.members.filter((m) => !m.is_archived).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {activeCount} 人のメンバー
          </p>
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={() => {
              setShowArchived((v) => !v);
              setSelectedIds(new Set());
            }}
          >
            {showArchived ? "アクティブを表示" : "アーカイブ済みを表示"}
          </button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">メンバーを追加</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>メンバーを追加</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {availableUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  追加可能なユーザーがいません。先にメンバー管理でユーザーを登録してください。
                </p>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      ユーザー
                    </label>
                    <Select
                      value={selectedUser}
                      onValueChange={setSelectedUser}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="ユーザーを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      ロール
                    </label>
                    <Select
                      value={selectedRole}
                      onValueChange={setSelectedRole}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">管理者</SelectItem>
                        <SelectItem value="member">メンバー</SelectItem>
                        <SelectItem value="viewer">閲覧者</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAdd}
                    disabled={!selectedUser || addMember.isPending}
                  >
                    {addMember.isPending ? "追加中..." : "追加"}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <span className="text-sm text-blue-700">
            {selectedIds.size} 件選択中
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkArchive}
            disabled={bulkArchiveMembers.isPending}
          >
            一括アーカイブ
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMembers.isPending}
          >
            一括削除
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClearSelection}>
            選択解除
          </Button>
        </div>
      )}

      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground">
            {showArchived
              ? "アーカイブ済みのメンバーはいません"
              : "メンバーがまだいません"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-2 border-gray-400 accent-blue-600"
              checked={allSelected}
              onChange={() => toggleAll(filteredMembers)}
            />
            <span className="text-xs text-muted-foreground">すべて選択</span>
          </div>
          {filteredMembers.map((member) => {
            const user = userMap.get(member.user_id);
            const isChecked = selectedIds.has(member.user_id);
            return (
              <div
                key={member.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  member.is_archived ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-2 border-gray-400 accent-blue-600"
                    checked={isChecked}
                    onChange={() => toggleSelect(member.user_id)}
                  />
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {user?.name?.charAt(0) || "?"}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {user?.name || "不明なユーザー"}
                      </p>
                      {member.is_archived && (
                        <Badge variant="secondary" className="text-xs">
                          アーカイブ
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {roleLabels[member.role] || member.role}
                  </Badge>
                  {member.is_archived ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnarchive(member.user_id)}
                      disabled={unarchiveMember.isPending}
                    >
                      復元
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(member.user_id)}
                      disabled={archiveMember.isPending}
                    >
                      アーカイブ
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemove(member.user_id)}
                    disabled={removeMember.isPending}
                  >
                    削除
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
