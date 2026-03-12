"use client";

import { useState, useCallback } from "react";
import { useUsers, useCreateUser, useDeleteUser, useUpdateUser, useArchiveUser, useUnarchiveUser, useBulkDeleteUsers, useBulkArchiveUsers } from "@/hooks/useUsers";
import { userCreateSchema, KATAKANA_RE } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function MembersPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: users, isLoading } = useUsers(true);
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();
  const archiveUser = useArchiveUser();
  const unarchiveUser = useUnarchiveUser();
  const bulkDeleteUsers = useBulkDeleteUsers();
  const bulkArchiveUsers = useBulkArchiveUsers();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameKana, setEditNameKana] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const activeUsers = users?.filter((u) => !u.is_archived) || [];
  const archivedUsers = users?.filter((u) => u.is_archived) || [];
  const displayUsers = showArchived ? archivedUsers : activeUsers;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === displayUsers.length) return new Set();
      return new Set(displayUsers.map((u) => u.id));
    });
  }, [displayUsers]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      name_kana: formData.get("name_kana") as string,
      email: formData.get("email") as string,
    };

    const result = userCreateSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      await createUser.mutateAsync(data);
      setOpen(false);
      setErrors({});
    } catch (err) {
      setErrors({ form: (err as Error).message });
    }
  }

  async function handleUpdate(userId: string) {
    if (editNameKana && !KATAKANA_RE.test(editNameKana)) {
      setErrors({ form: "名前（カナ）はカタカナで入力してください" });
      return;
    }
    try {
      await updateUser.mutateAsync({
        userId,
        data: { name: editName, name_kana: editNameKana, email: editEmail },
      });
      setEditId(null);
      setErrors({});
    } catch (err) {
      setErrors({ form: (err as Error).message });
    }
  }

  async function handleDelete(userId: string) {
    if (confirm("このユーザーを削除しますか？")) {
      await deleteUser.mutateAsync(userId);
    }
  }

  async function handleArchive(userId: string) {
    if (confirm("このユーザーをアーカイブしますか？")) {
      await archiveUser.mutateAsync(userId);
    }
  }

  async function handleUnarchive(userId: string) {
    if (confirm("このユーザーのアーカイブを解除しますか？")) {
      await unarchiveUser.mutateAsync(userId);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} 人のユーザーを削除しますか？`)) return;
    try {
      await bulkDeleteUsers.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch (err) {
      setErrors({ form: (err as Error).message });
    }
  }

  async function handleBulkArchive() {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size} 人のユーザーをアーカイブしますか？`)) return;
    try {
      await bulkArchiveUsers.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch (err) {
      setErrors({ form: (err as Error).message });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">メンバー管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ユーザーの登録・編集・削除ができます
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => { setShowArchived(!showArchived); setSelectedIds(new Set()); }}
          >
            {showArchived
              ? `アクティブ (${activeUsers.length})`
              : `アーカイブ済み (${archivedUsers.length})`}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>ユーザーを追加</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規ユーザー</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">名前</label>
                  <Input name="name" placeholder="山田 太郎" />
                  {errors.name && (
                    <p className="mt-1 text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    名前（カナ）
                  </label>
                  <Input name="name_kana" placeholder="ヤマダ タロウ" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    ソート時にカナ順で並び替えられます
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    メールアドレス
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="taro@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.email}
                    </p>
                  )}
                </div>
                {errors.form && (
                  <p className="text-sm text-destructive">{errors.form}</p>
                )}
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? "作成中..." : "作成"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-md bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} 人選択中
          </span>
          {!showArchived && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkArchive}
              disabled={bulkArchiveUsers.isPending}
            >
              {bulkArchiveUsers.isPending ? "アーカイブ中..." : "一括アーカイブ"}
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleteUsers.isPending}
          >
            {bulkDeleteUsers.isPending ? "削除中..." : "一括削除"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            選択解除
          </Button>
        </div>
      )}

      {/* Select all checkbox */}
      {displayUsers.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={displayUsers.length > 0 && selectedIds.size === displayUsers.length}
            onChange={toggleAll}
            aria-label="全選択"
            className="h-4 w-4 cursor-pointer rounded border-2 border-gray-400 accent-blue-600"
          />
          <span className="text-sm text-muted-foreground">全選択</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : displayUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground">
            {showArchived ? "アーカイブ済みのユーザーはいません" : "ユーザーがまだいません"}
          </p>
          {!showArchived && (
            <Button variant="outline" onClick={() => setOpen(true)}>
              最初のユーザーを追加
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayUsers.map((user) => (
            <Card key={user.id} className={`relative ${user.is_archived ? "opacity-70" : ""}`}>
              <div className="absolute left-3 top-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(user.id)}
                  onChange={() => toggleSelect(user.id)}
                  aria-label={`${user.name}を選択`}
                  className="h-4 w-4 cursor-pointer rounded border-2 border-gray-400 accent-blue-600"
                />
              </div>
              <CardHeader className="pb-3 pl-10">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
                    {user.name.charAt(0)}
                  </span>
                  {editId === user.id ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="名前"
                      />
                      <Input
                        value={editNameKana}
                        onChange={(e) => setEditNameKana(e.target.value)}
                        placeholder="名前（カナ）"
                      />
                      <Input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="メールアドレス"
                      />
                      {errors.form && editId === user.id && (
                        <p className="text-sm text-destructive">{errors.form}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(user.id)}
                          disabled={updateUser.isPending}
                        >
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditId(null); setErrors({}); }}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{user.name}</CardTitle>
                        {user.is_archived && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                            アーカイブ
                          </Badge>
                        )}
                      </div>
                      {user.name_kana && (
                        <p className="text-xs text-muted-foreground">
                          {user.name_kana}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              {editId !== user.id && (
                <CardContent className="pt-0 pl-10">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditId(user.id);
                        setEditName(user.name);
                        setEditNameKana(user.name_kana || "");
                        setEditEmail(user.email);
                      }}
                    >
                      編集
                    </Button>
                    {user.is_archived ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnarchive(user.id)}
                      >
                        復元
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => handleArchive(user.id)}
                      >
                        アーカイブ
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(user.id)}
                    >
                      削除
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
