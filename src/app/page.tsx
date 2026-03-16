export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <main className="flex flex-col items-center px-6 py-12">
        <h1 className="mb-4 text-5xl font-bold text-primary">
          Finnish iGaming Betting Slip Demo
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Milestone 1: Project Setup Complete ✅
        </p>

        <div className="mb-8 flex flex-row flex-wrap justify-center gap-3">
          <span className="rounded-lg bg-primary px-5 py-2 font-medium text-white">
            Next.js 16.1.6
          </span>
          <span className="rounded-lg bg-success px-5 py-2 font-medium text-white">
            TypeScript
          </span>
          <span className="rounded-lg bg-warning px-5 py-2 font-medium text-white">
            Tailwind v4
          </span>
          <span className="rounded-lg bg-error px-5 py-2 font-medium text-white">
            Framer Motion
          </span>
        </div>

        <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-left text-xl font-semibold">
            Project Structure ✅
          </h2>
          <ul className="space-y-2 text-left text-sm text-gray-700">
            <li>✅ App routes: /, /test, /history</li>
            <li>✅ Components: left-pane, right-pane, shared</li>
            <li>✅ Library: calculations, metrics, store</li>
            <li>✅ Data: events.json, history.json</li>
            <li>✅ Types: betting.ts interfaces</li>
          </ul>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Ready for Milestone 2: Data Creation & Logic Implementation
        </p>
      </main>
    </div>
  );
}
