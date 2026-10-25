import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-serif text-4xl font-bold text-navy-900 mb-2">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-6 text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-navy-800 text-cream-50 rounded-md text-sm hover:bg-navy-700 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
