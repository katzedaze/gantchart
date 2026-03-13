"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

function decodeJwt(token: string): JwtParts {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: must have 3 parts separated by dots");
  }

  function decodeBase64Url(str: string): Record<string, unknown> {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = decodeURIComponent(escape(atob(padded)));
    return JSON.parse(decoded) as Record<string, unknown>;
  }

  return {
    header: decodeBase64Url(parts[0]),
    payload: decodeBase64Url(parts[1]),
    signature: parts[2],
  };
}

function formatTimestamp(value: unknown): string | null {
  if (typeof value !== "number") return null;
  try {
    return new Date(value * 1000).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });
  } catch {
    return null;
  }
}

export default function JwtDecoderPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<JwtParts | null>(null);
  const [error, setError] = useState("");
  const [decodedAt, setDecodedAt] = useState<number>(0);

  function handleDecode() {
    setError("");
    try {
      setResult(decodeJwt(input));
      setDecodedAt(Date.now());
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">JWT Decoder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          JWTトークンのヘッダーとペイロードをデコードします（署名検証なし）
        </p>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">JWT Token</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="h-28 w-full rounded-md border border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="mt-3">
            <Button size="sm" onClick={handleDecode}>
              Decode
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-blue-600">Header</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-sm">
                {JSON.stringify(result.header, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-green-600">
                Payload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-sm">
                {JSON.stringify(result.payload, null, 2)}
              </pre>
              {/* Timestamp fields */}
              <div className="mt-3 space-y-1">
                {(["iat", "exp", "nbf"] as const).map((key) => {
                  const ts = formatTimestamp(result.payload[key]);
                  if (!ts) return null;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="font-mono font-medium">{key}:</span>
                      <span>{ts}</span>
                      {key === "exp" &&
                        typeof result.payload.exp === "number" &&
                        result.payload.exp * 1000 < decodedAt && (
                          <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">
                            Expired
                          </span>
                        )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-orange-600">
                Signature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="break-all text-xs text-muted-foreground">
                {result.signature}
              </code>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
