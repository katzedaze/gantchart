"use client";

import { useState, useCallback } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function QrGeneratorPage() {
  const [input, setInput] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const [size, setSize] = useState(256);

  const handleGenerate = useCallback(async () => {
    setError("");
    if (!input.trim()) {
      setError("URLまたはテキストを入力してください");
      return;
    }
    try {
      const url = await QRCode.toDataURL(input.trim(), {
        width: size,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setDataUrl(url);
    } catch (e) {
      setError((e as Error).message);
      setDataUrl("");
    }
  }, [input, size]);

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">QR Code Generator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          URLやテキストからQRコードを生成します
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Input</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              className="w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://example.com"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Size:</label>
              <select
                className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              >
                <option value={128}>128px</option>
                <option value={256}>256px</option>
                <option value={512}>512px</option>
                <option value={1024}>1024px</option>
              </select>
              <Button size="sm" onClick={handleGenerate}>
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">QR Code</CardTitle>
              {dataUrl && (
                <Button size="sm" variant="ghost" onClick={handleDownload}>
                  Download
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : dataUrl ? (
              <div className="flex justify-center rounded-md border border-border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dataUrl} alt="QR Code" className="max-w-full" />
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                QR Code will appear here
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
