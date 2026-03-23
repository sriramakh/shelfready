import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <p className="text-6xl font-extrabold text-slate-200 mb-4">404</p>
      <h1 className="text-xl font-bold text-slate-900 mb-2">Page not found</h1>
      <p className="text-sm text-slate-500 text-center max-w-md mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
