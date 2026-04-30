import { Loader2 } from 'lucide-react';

export default function ProgressBar({ current, total, ioc, status }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="glass-panel p-4 relative overflow-hidden">
      {/* Animated glow background */}
      <div
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      ></div>

      <div className="relative z-10 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm">
          {status === 'scanning' && <Loader2 size={14} className="animate-spin text-purple-400" />}
          <span className="text-gray-300">
            Scanning <span className="font-mono text-purple-300">{ioc}</span>
          </span>
        </div>
        <span className="text-sm font-semibold text-gray-300">
          {current} / {total}
          <span className="ml-2 text-gray-500">({pct}%)</span>
        </span>
      </div>

      {/* Bar */}
      <div className="w-full h-2 bg-surface-dark/80 rounded-full overflow-hidden border border-border-dark">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out relative"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
