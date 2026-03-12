"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Base64Page() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");

  function handleConvert() {
    setError("");
    try {
      if (mode === "encode") {
        setOutput(btoa(unescape(encodeURIComponent(input))));
      } else {
        setOutput(decodeURIComponent(escape(atob(input.trim()))));
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }

  function handleSwap() {
    setInput(output);
    setOutput("");
    setError("");
    setMode(mode === "encode" ? "decode" : "encode");
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Base64 Encoder / Decoder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Base64のエンコード・デコードができます（UTF-8対応）
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Button
          variant={mode === "encode" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("encode")}
        >
          Encode
        </Button>
        <Button
          variant={mode === "decode" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("decode")}
        >
          Decode
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {mode === "encode" ? "Plain Text" : "Base64"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="h-64 w-full rounded-md border border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={
                mode === "encode"
                  ? "Enter text to encode..."
                  : "Enter Base64 to decode..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleConvert}>
                {mode === "encode" ? "Encode" : "Decode"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleSwap}>
                Swap
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {mode === "encode" ? "Base64" : "Plain Text"}
              </CardTitle>
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
              <pre className="h-64 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-muted/30 p-3 font-mono text-sm">
                {output || "Result will appear here"}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
