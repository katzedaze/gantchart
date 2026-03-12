"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImageWhiteoutPage() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [threshold, setThreshold] = useState(230);
  const [mode, setMode] = useState<"light" | "color">("light");
  const [targetColor, setTargetColor] = useState("#ffffff");
  const [tolerance, setTolerance] = useState(60);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      setOriginalUrl(reader.result as string);
      setResultUrl("");
    };
    reader.readAsDataURL(file);
  }, []);

  const processImage = useCallback(() => {
    if (!originalUrl) return;
    setProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      if (mode === "light") {
        // Light background removal: pixels brighter than threshold → white
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness >= threshold) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = 255;
          }
        }
      } else {
        // Color-based removal: pixels close to target color → white
        const hex = targetColor.replace("#", "");
        const tr = parseInt(hex.substring(0, 2), 16);
        const tg = parseInt(hex.substring(2, 4), 16);
        const tb = parseInt(hex.substring(4, 6), 16);

        for (let i = 0; i < data.length; i += 4) {
          const dr = data[i] - tr;
          const dg = data[i + 1] - tg;
          const db = data[i + 2] - tb;
          const distance = Math.sqrt(dr * dr + dg * dg + db * db);
          if (distance <= tolerance) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = 255;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setResultUrl(canvas.toDataURL("image/png"));
      setProcessing(false);
    };
    img.src = originalUrl;
  }, [originalUrl, threshold, mode, targetColor, tolerance]);

  function handleDownload() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "whiteout.png";
    a.click();
  }

  function handleReset() {
    setOriginalUrl("");
    setResultUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Image Whiteout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          画像の背景を白抜きにしてプレビュー・ダウンロードできます
        </p>
      </div>

      {/* Upload + Settings */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upload & Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
            />
          </div>

          {/* Mode */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Mode</label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={mode === "light" ? "default" : "outline"}
                onClick={() => setMode("light")}
              >
                Brightness Threshold
              </Button>
              <Button
                size="sm"
                variant={mode === "color" ? "default" : "outline"}
                onClick={() => setMode("color")}
              >
                Color Match
              </Button>
            </div>
          </div>

          {mode === "light" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Brightness Threshold: {threshold}
              </label>
              <input
                type="range"
                min={100}
                max={255}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                この値より明るいピクセルを白に置換します (0=黒, 255=白)
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Target Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={targetColor}
                    onChange={(e) => setTargetColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-border"
                  />
                  <span className="flex items-center font-mono text-sm">{targetColor}</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Tolerance: {tolerance}
                </label>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={processImage} disabled={!originalUrl || processing}>
              {processing ? "Processing..." : "Whiteout"}
            </Button>
            {originalUrl && (
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {originalUrl && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Original</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center rounded-md border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)_50%/16px_16px] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalUrl}
                  alt="Original"
                  className="max-h-80 max-w-full object-contain"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Result</CardTitle>
                {resultUrl && (
                  <Button size="sm" variant="ghost" onClick={handleDownload}>
                    Download
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {resultUrl ? (
                <div className="flex justify-center rounded-md border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)_50%/16px_16px] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resultUrl}
                    alt="Whiteout result"
                    className="max-h-80 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                  Click &quot;Whiteout&quot; to process
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
