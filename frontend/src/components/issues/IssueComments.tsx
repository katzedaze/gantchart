"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Comment, ProjectMemberWithUser } from "@/types";
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useUploadAttachment,
} from "@/hooks/useComments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface IssueCommentsProps {
  issueId: string;
  members: ProjectMemberWithUser[];
  currentUserId?: string;
}

export function IssueComments({
  issueId,
  members,
  currentUserId,
}: IssueCommentsProps) {
  const { data: comments, isLoading } = useComments(issueId);
  const createComment = useCreateComment(issueId);
  const updateComment = useUpdateComment(issueId);
  const deleteComment = useDeleteComment(issueId);
  const uploadAttachment = useUploadAttachment(issueId);

  const [body, setBody] = useState("");
  const [authorId, setAuthorId] = useState(currentUserId || "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [preview, setPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageUpload = useCallback(
    async (file: File) => {
      try {
        const attachment = await uploadAttachment.mutateAsync(file);
        const imageUrl = `${API_BASE_URL}${attachment.filepath}`;
        const markdownImage = `![${file.name}](${imageUrl})`;
        setBody((prev) => {
          const pos = textareaRef.current?.selectionStart ?? prev.length;
          return prev.slice(0, pos) + markdownImage + prev.slice(pos);
        });
      } catch {
        alert("画像のアップロードに失敗しました");
      }
    },
    [uploadAttachment]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await handleImageUpload(file);
          return;
        }
      }
    },
    [handleImageUpload]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await handleImageUpload(file);
      e.target.value = "";
    },
    [handleImageUpload]
  );

  async function handleSubmit() {
    if (!body.trim() || !authorId) return;
    await createComment.mutateAsync({ body: body.trim(), author_id: authorId });
    setBody("");
    setPreview(false);
  }

  async function handleUpdate(commentId: string) {
    if (!editBody.trim()) return;
    await updateComment.mutateAsync({ commentId, body: editBody.trim() });
    setEditingId(null);
    setEditBody("");
  }

  async function handleDelete(commentId: string) {
    if (!confirm("このコメントを削除しますか？")) return;
    await deleteComment.mutateAsync(commentId);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function insertMarkdown(syntax: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.slice(start, end);
    let replacement = "";

    switch (syntax) {
      case "bold":
        replacement = `**${selected || "テキスト"}**`;
        break;
      case "italic":
        replacement = `*${selected || "テキスト"}*`;
        break;
      case "code":
        replacement = selected.includes("\n")
          ? `\`\`\`\n${selected || "コード"}\n\`\`\``
          : `\`${selected || "コード"}\``;
        break;
      case "link":
        replacement = `[${selected || "リンクテキスト"}](URL)`;
        break;
      case "list":
        replacement = `- ${selected || "リスト項目"}`;
        break;
      case "heading":
        replacement = `### ${selected || "見出し"}`;
        break;
    }

    setBody(body.slice(0, start) + replacement + body.slice(end));
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground">
        コメント ({comments?.length || 0})
      </h3>

      {/* Comment list */}
      <div className="space-y-3">
        {comments?.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isEditing={editingId === comment.id}
            editBody={editBody}
            onEditBodyChange={setEditBody}
            onStartEdit={() => {
              setEditingId(comment.id);
              setEditBody(comment.body);
            }}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={() => handleUpdate(comment.id)}
            onDelete={() => handleDelete(comment.id)}
            formatTime={formatTime}
          />
        ))}
      </div>

      {/* New comment form */}
      <div className="rounded-lg border">
        <div className="border-b px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPreview(false)}
                data-active={!preview}
              >
                編集
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setPreview(true)}
                data-active={preview}
              >
                プレビュー
              </Button>
            </div>
            {!preview && (
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-xs font-bold"
                  onClick={() => insertMarkdown("bold")}
                  title="太字"
                >
                  B
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-xs italic"
                  onClick={() => insertMarkdown("italic")}
                  title="斜体"
                >
                  I
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 font-mono text-xs"
                  onClick={() => insertMarkdown("code")}
                  title="コード"
                >
                  {"<>"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => insertMarkdown("link")}
                  title="リンク"
                >
                  🔗
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => insertMarkdown("list")}
                  title="リスト"
                >
                  ≡
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-xs font-bold"
                  onClick={() => insertMarkdown("heading")}
                  title="見出し"
                >
                  H
                </Button>
                <div className="mx-1 h-4 w-px bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  title="画像をアップロード"
                >
                  📎 画像
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}
          </div>
        </div>

        {preview ? (
          <div className="min-h-[100px] p-3">
            {body ? (
              <MarkdownContent content={body} />
            ) : (
              <p className="text-sm text-muted-foreground">
                プレビューするコンテンツがありません
              </p>
            )}
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="マークダウンでコメントを入力... (Ctrl+Enterで送信)"
            rows={4}
            className="resize-none rounded-none border-0 focus-visible:ring-0"
          />
        )}

        <div className="flex items-center justify-between border-t px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">投稿者:</span>
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className="h-7 rounded border bg-background px-2 text-xs"
            >
              <option value="">選択してください</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user_name}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={
              !body.trim() || !authorId || createComment.isPending
            }
          >
            {createComment.isPending ? "送信中..." : "コメント"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        マークダウン記法が使えます。画像はクリップボードから貼り付け、またはファイル選択でアップロードできます。
      </p>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-p:my-1 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-0.5 prose-pre:bg-muted prose-pre:p-3 prose-img:rounded-md prose-img:max-h-80">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function CommentItem({
  comment,
  isEditing,
  editBody,
  onEditBodyChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  formatTime,
}: {
  comment: Comment;
  isEditing: boolean;
  editBody: string;
  onEditBodyChange: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  formatTime: (d: string) => string;
}) {
  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            {comment.author?.name?.charAt(0) || "?"}
          </span>
          <span className="text-sm font-medium">
            {comment.author?.name || "不明"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(comment.created_at)}
          </span>
          {comment.created_at !== comment.updated_at && (
            <span className="text-xs text-muted-foreground">(編集済み)</span>
          )}
        </div>
        {!isEditing && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onStartEdit}
            >
              編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              削除
            </Button>
          </div>
        )}
      </div>
      <div className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editBody}
              onChange={(e) => onEditBodyChange(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSaveEdit}>
                保存
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                キャンセル
              </Button>
            </div>
          </div>
        ) : (
          <MarkdownContent content={comment.body} />
        )}
      </div>
    </div>
  );
}
