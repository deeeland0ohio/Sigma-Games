import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-red-500/10" />
      <div className="z-10 flex flex-col items-center text-center space-y-6 max-w-md bg-zinc-900/80 p-10 rounded-2xl border border-zinc-800 backdrop-blur-sm">
        <AlertTriangle className="w-20 h-20 text-red-500" />
        <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-md">
          404
        </h1>
        <p className="text-xl text-zinc-300">
          Oops! The page you were looking for doesn't exist.
        </p>
        <a
          href="/"
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </a>
      </div>
    </div>
  );
}
