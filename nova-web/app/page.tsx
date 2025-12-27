import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Nova Browser Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered voice-controlled browser with FunctionGemma and Ollama
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Voice Commands</h3>
            <p className="text-gray-600 text-sm">
              Control your browser using natural language
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Local AI</h3>
            <p className="text-gray-600 text-sm">
              Powered by FunctionGemma via Ollama
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
            <p className="text-gray-600 text-sm">
              All processing happens locally
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Fast</h3>
            <p className="text-gray-600 text-sm">
              Instant command processing
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link
            href="/browser"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg transition-colors text-lg"
          >
            Launch Voice Browser
          </Link>
        </div>

        {/* Quick Start */}
        <div className="mt-16 max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Quick Start</h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Install Ollama</h3>
                <p className="text-gray-600 text-sm">
                  Download from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ollama.ai</a>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Pull FunctionGemma</h3>
                <code className="block bg-gray-100 px-3 py-2 rounded mt-2 text-sm">
                  ollama pull functiongemma
                </code>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Start Using</h3>
                <p className="text-gray-600 text-sm">
                  Click the microphone and say commands like &quot;open google&quot; or &quot;search for cats&quot;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Commands Reference */}
        <div className="mt-12 max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Voice Commands</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <code className="text-blue-600 font-semibold">&quot;open google&quot;</code>
              <p className="text-gray-600 text-sm mt-1">Navigate to website</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <code className="text-blue-600 font-semibold">&quot;search for AI&quot;</code>
              <p className="text-gray-600 text-sm mt-1">Google search</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <code className="text-blue-600 font-semibold">&quot;go back&quot;</code>
              <p className="text-gray-600 text-sm mt-1">Browser back</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <code className="text-blue-600 font-semibold">&quot;refresh page&quot;</code>
              <p className="text-gray-600 text-sm mt-1">Reload page</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
