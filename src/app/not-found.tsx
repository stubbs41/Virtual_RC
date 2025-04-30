import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-lg mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
