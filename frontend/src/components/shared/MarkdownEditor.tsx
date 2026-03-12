"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  issueId?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "マークダウンで入力...",
  rows = 6,
  issueId,
}: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!issueId) return;
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(
          `${API_BASE_URL}/issues/${issueId}/attachments`,
          { method: "POST", body: formData }
        );
        if (!response.ok) throw new Error("Upload failed");
        const attachment = await response.json();
        const imageUrl = `${API_BASE_URL}${attachment.filepath}`;
        const markdownImage = `![${file.name}](${imageUrl})`;
        const pos = textareaRef.current?.selectionStart ?? value.length;
        onChange(value.slice(0, pos) + markdownImage + value.slice(pos));
      } catch {
        alert("画像のアップロードに失敗しました");
      }
    },
    [issueId, value, onChange]
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

  function insertMarkdown(syntax: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
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

    onChange(value.slice(0, start) + replacement + value.slice(end));
  }

  return (
    <div className="rounded-lg border">
      <div className="border-b px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 px-2 text-xs ${!preview ? "bg-muted" : ""}`}
              onClick={() => setPreview(false)}
            >
              編集
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 px-2 text-xs ${preview ? "bg-muted" : ""}`}
              onClick={() => setPreview(true)}
            >
              プレビュー
            </Button>
          </div>
          {!preview && (
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-xs font-bold"
                onClick={() => insertMarkdown("bold")}
                title="太字"
              >
                B
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-xs italic"
                onClick={() => insertMarkdown("italic")}
                title="斜体"
              >
                I
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 font-mono text-xs"
                onClick={() => insertMarkdown("code")}
                title="コード"
              >
                {"<>"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                onClick={() => insertMarkdown("link")}
                title="リンク"
              >
                #
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                onClick={() => insertMarkdown("list")}
                title="リスト"
              >
                =
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-xs font-bold"
                onClick={() => insertMarkdown("heading")}
                title="見出し"
              >
                H
              </Button>
              {issueId && (
                <>
                  <div className="mx-1 h-4 w-px bg-border" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    title="画像をアップロード"
                  >
                    画像
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {preview ? (
        <div className="min-h-[100px] p-3">
          {value ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-sm text-muted-foreground">
              プレビューするコンテンツがありません
            </p>
          )}
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={placeholder}
          rows={rows}
          className="resize-none rounded-none border-0 focus-visible:ring-0"
        />
      )}
    </div>
  );
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-p:my-1 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-0.5 prose-pre:bg-muted prose-pre:p-3 prose-img:rounded-md prose-img:max-h-80">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
