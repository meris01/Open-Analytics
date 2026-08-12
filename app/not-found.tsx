import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="label-caps text-fg-subtle">404</p>
      <h1 className="headline-lg">Page not found</h1>
      <Link href="/overview" className="btn btn-primary">Back to overview</Link>
    </div>
  );
}
