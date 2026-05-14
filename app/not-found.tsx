import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-10 text-center">
      <h2 className="text-lg font-semibold">Not found</h2>
      <p className="mt-2 text-sm text-neutral-600">
        The page or brand you're looking for doesn't exist.
      </p>
      <Link
        href="/brands"
        className="mt-4 inline-block text-sm text-blue-600 hover:underline"
      >
        ← Back to brands
      </Link>
    </div>
  );
}
