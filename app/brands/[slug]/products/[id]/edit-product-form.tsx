"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product, ProductStatus } from "@/types/product";

export function EditProductForm({
  brandSlug,
  product,
}: {
  brandSlug: string;
  product: Product;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(product.name);
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [description, setDescription] = useState(product.description ?? "");
  const [heroColor, setHeroColor] = useState(product.hero_color ?? "");
  const [oneLiner, setOneLiner] = useState(product.one_liner ?? "");
  const [priceUsd, setPriceUsd] = useState(
    product.price_usd != null ? String(product.price_usd) : ""
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch(
      `/api/brands/${brandSlug}/products/${product.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          status,
          description: description.trim() || null,
          hero_color: heroColor.trim() || null,
          one_liner: oneLiner.trim() || null,
          price_usd: priceUsd ? Number(priceUsd) : null,
        }),
      }
    );
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed to save");
      return;
    }
    router.refresh();
  }

  async function destroy() {
    if (!confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(
      `/api/brands/${brandSlug}/products/${product.id}`,
      { method: "DELETE" }
    );
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed to delete");
      return;
    }
    router.push(`/brands/${brandSlug}/products`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit product</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={save}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
              >
                <option value="pre_order">Pre-order</option>
                <option value="sale">Sale</option>
                <option value="sold_out">Sold out</option>
                <option value="draft">Draft</option>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="one_liner">One-liner</Label>
              <Input
                id="one_liner"
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price USD</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_color">Hero color (hex)</Label>
              <Input
                id="hero_color"
                value={heroColor}
                onChange={(e) => setHeroColor(e.target.value)}
                placeholder="#C4898E"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description / product truth</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Form, material, key surface features the AI must preserve..."
                rows={5}
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={destroy}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
