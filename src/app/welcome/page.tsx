export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">3D Model Search Aggregator</h1>
      <p className="text-xl mb-8">Search across multiple 3D model platforms</p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login
        </a>
        <a
          href="/register"
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
        >
          Register
        </a>
      </div>
    </div>
  );
}
