"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const presets = [
  { label: "OGP (1200x630)", w: 1200, h: 630 },
  { label: "HD (1920x1080)", w: 1920, h: 1080 },
  { label: "Square (512x512)", w: 512, h: 512 },
  { label: "Favicon (32x32)", w: 32, h: 32 },
  { label: "Icon (128x128)", w: 128, h: 128 },
  { label: "Banner (728x90)", w: 728, h: 90 },
  { label: "Mobile (375x667)", w: 375, h: 667 },
  { label: "Thumbnail (300x200)", w: 300, h: 200 },
];

export default function DummyImagePage() {
  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(480);
  const [bgColor, setBgColor] = useState("#6366f1");
  const [textColor, setTextColor] = useState("#ffffff");
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [dataUrl, setDataUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Cross lines
    ctx.strokeStyle = textColor;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Text
    const displayText = text || `${width} × ${height}`;
    const fontSize = Math.max(12, Math.min(width, height) / 8);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(displayText, width / 2, height / 2);

    // Size label at bottom
    if (!text) {
      const smallSize = Math.max(10, fontSize * 0.4);
      ctx.font = `${smallSize}px sans-serif`;
      ctx.globalAlpha = 0.6;
      ctx.fillText(format.toUpperCase(), width / 2, height / 2 + fontSize * 0.8);
      ctx.globalAlpha = 1;
    }

    const mimeType = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    setDataUrl(canvas.toDataURL(mimeType, 0.9));
  }, [width, height, bgColor, textColor, text, format]);

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `dummy-${width}x${height}.${format}`;
    a.click();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dummy Image Generator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          プレースホルダー画像を生成してダウンロードできます
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Presets */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Presets</label>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    className="rounded border border-border px-2 py-1 text-xs transition-colors hover:bg-muted"
                    onClick={() => { setWidth(p.w); setHeight(p.h); }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Width (px)</label>
                <Input
                  type="number"
                  min={1}
                  max={4096}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Height (px)</label>
                <Input
                  type="number"
                  min={1}
                  max={4096}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Background</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-border"
                  />
                  <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-border"
                  />
                  <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="font-mono" />
                </div>
              </div>
            </div>

            {/* Custom text */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Custom Text (optional)</label>
              <Input
                placeholder="Default: width × height"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {/* Format */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Format</label>
              <div className="flex gap-2">
                {(["png", "jpeg", "webp"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={format === f ? "default" : "outline"}
                    onClick={() => setFormat(f)}
                  >
                    {f.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={generate} className="w-full">
              Generate
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Preview</CardTitle>
              {dataUrl && (
                <Button size="sm" variant="ghost" onClick={handleDownload}>
                  Download
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {dataUrl ? (
              <div className="flex justify-center rounded-md border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)_50%/16px_16px] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt="Generated dummy"
                  className="max-h-96 max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                Click &quot;Generate&quot; to create an image
              </div>
            )}
            {dataUrl && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {width} × {height} px — {format.toUpperCase()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
