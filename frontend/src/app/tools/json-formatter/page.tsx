"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState(2);

  function handleFormat() {
    setError("");
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }

  function handleMinify() {
    setError("");
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">JSON Formatter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          JSONの整形・圧縮・検証ができます
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Input</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="h-80 w-full rounded-md border border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder='{"key": "value"}'
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Indent:</label>
              <select
                className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={1}>1 tab</option>
              </select>
              <Button size="sm" onClick={handleFormat}>
                Format
              </Button>
              <Button size="sm" variant="outline" onClick={handleMinify}>
                Minify
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Output</CardTitle>
              {output && (
                <Button size="sm" variant="ghost" onClick={handleCopy}>
                  Copy
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : (
              <pre className="h-80 overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-sm">
                {output || "Formatted JSON will appear here"}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
