export default function TestMiddlewarePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
        <h1 className="text-2xl font-bold mb-4">Middleware Test Page</h1>
        <p className="text-gray-600 mb-4">
          If you can see this page, it means the route is accessible.
        </p>
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-blue-800">
            This page should be blocked by middleware if the matcher is working correctly.
          </p>
        </div>
      </div>
    </div>
  );
}

