"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function DnaPromptEditor({
  brandSlug,
  initialPrompt,
}: {
  brandSlug: string;
  initialPrompt: string;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [submitting, setSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/brands/${brandSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dna_prompt: prompt }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed to save");
      return;
    }
    setSavedAt(new Date().toLocaleTimeString());
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={20}
        className="font-mono text-xs"
        placeholder="Brand voice. Banned phrases. Anti-positioning. Do-nots..."
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          {savedAt ? `Saved at ${savedAt}` : "Not saved yet"}
        </p>
        <Button onClick={save} disabled={submitting}>
          {submitting ? "Saving..." : "Save DNA prompt"}
        </Button>
      </div>
    </div>
  );
}
