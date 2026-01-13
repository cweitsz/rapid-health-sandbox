import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm opacity-80">
        That route doesn’t exist. Shocking, I know.
      </p>
      <div className="flex gap-4">
        <Link className="underline" href="/">
          Home
        </Link>
        <Link className="underline" href="/intake">
          Intake
        </Link>
      </div>
    </main>
  );
}
