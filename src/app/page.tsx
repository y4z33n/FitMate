import Chat from '@/components/Chat';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
            FitMate
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Your AI Fitness Assistant</p>
        </header>
        <div className="max-w-4xl mx-auto">
          <Chat />
        </div>
      </div>
    </main>
  );
}
