"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreateProject } from "@/hooks/useProjects";
import { projectCreateSchema, type ProjectCreateInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      key: formData.get("key") as string,
      description: (formData.get("description") as string) || undefined,
    };

    const result = projectCreateSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      const project = await createProject.mutateAsync(
        result.data as ProjectCreateInput
      );
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setErrors({ form: (err as Error).message });
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>新規プロジェクト</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                プロジェクト名
              </label>
              <Input name="name" placeholder="プロジェクト名を入力" />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">キー</label>
              <Input name="key" placeholder="PROJ" className="uppercase" />
              <p className="mt-1 text-xs text-muted-foreground">
                大文字英字のみ。課題キーのプレフィックスに使用されます
              </p>
              {errors.key && (
                <p className="mt-1 text-sm text-destructive">{errors.key}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">説明</label>
              <Textarea name="description" placeholder="プロジェクトの説明" />
            </div>
            {errors.form && (
              <p className="text-sm text-destructive">{errors.form}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? "作成中..." : "作成"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
