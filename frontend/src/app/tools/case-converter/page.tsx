"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function splitWords(input: string): string[] {
  // Handle separators: space, underscore, hyphen
  let normalized = input.replace(/[-_\s]+/g, " ");
  // Handle camelCase/PascalCase boundaries
  normalized = normalized.replace(/([a-z])([A-Z])/g, "$1 $2");
  normalized = normalized.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return normalized.split(/\s+/).filter(Boolean);
}

function toCamelCase(words: string[]): string {
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join("");
}

function toPascalCase(words: string[]): string {
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toSnakeCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("_");
}

function toKebabCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("-");
}

function toConstantCase(words: string[]): string {
  return words.map((w) => w.toUpperCase()).join("_");
}

function toDotCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join(".");
}

const converters = [
  { label: "camelCase", fn: toCamelCase },
  { label: "PascalCase", fn: toPascalCase },
  { label: "snake_case", fn: toSnakeCase },
  { label: "kebab-case", fn: toKebabCase },
  { label: "CONSTANT_CASE", fn: toConstantCase },
  { label: "dot.case", fn: toDotCase },
] as const;

export default function CaseConverterPage() {
  const [input, setInput] = useState("");

  const words = useMemo(() => splitWords(input), [input]);
  const results = useMemo(
    () => converters.map((c) => ({ label: c.label, value: c.fn(words) })),
    [words]
  );

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Case Converter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          camelCase, snake_case, PascalCase
          など各種ケースに変換します
        </p>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Input</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            className="w-full rounded-md border border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="myVariableName, my_variable_name, MyVariableName..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {words.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Detected words: [{words.join(", ")}]
            </p>
          )}
        </CardContent>
      </Card>

      {input.trim() && (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((r) => (
            <Card key={r.label}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {r.label}
                  </p>
                  <p className="mt-1 font-mono text-sm">{r.value}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(r.value)}
                >
                  Copy
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
