import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Loader2, AlertTriangle, FileText, Upload, Zap, Eye, Download } from 'lucide-react';
import ResultsTable from '../components/ResultsTable';
import SummaryCards from '../components/SummaryCards';
import ProgressBar from '../components/ProgressBar';

export default function Dashboard() {
  const { token } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, ioc: '', status: '' });
  const [summary, setSummary] = useState(null);
  const [dryRunData, setDryRunData] = useState(null);
  const [options, setOptions] = useState({ dryRun: false, noCache: false, onlyApis: '' });
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setInputText(prev => prev + (prev ? '\n' : '') + evt.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleScan = async () => {
    if (!inputText.trim()) return;
    setIsScanning(true);
    setError(null);
    setResults([]);
    setSummary(null);
    setDryRunData(null);
    setProgress({ current: 0, total: 0, ioc: '', status: '' });

    try {
      const res = await fetch('http://localhost:5555/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: inputText,
          dryRun: options.dryRun,
          noCache: options.noCache,
          onlyApis: options.onlyApis || null
        })
      });

      // Dry run returns JSON
      if (options.dryRun) {
        const data = await res.json();
        setDryRunData(data.parsed);
        setIsScanning(false);
        return;
      }

      // SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'start') {
              setProgress({ current: 0, total: event.total, ioc: '', status: 'starting' });
            } else if (event.type === 'progress') {
              setProgress({ current: event.current, total: event.total, ioc: event.ioc, status: 'scanning' });
            } else if (event.type === 'result') {
              setProgress({ current: event.current, total: event.total, ioc: event.ioc, status: 'done' });
              setResults(prev => [...prev, event.result]);
            } else if (event.type === 'error') {
              setProgress({ current: event.current, total: event.total, ioc: event.ioc, status: 'error' });
            } else if (event.type === 'done') {
              setSummary(event.summary);
            }
          } catch {}
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to the scanner service.');
    } finally {
      setIsScanning(false);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ summary, results }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-scan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['IOC', 'Type', 'Verdict', 'Risk Score', 'Flag Reasons'];
    const rows = results.map(r => [
      r.ioc,
      r.type,
      r.verdict || 'UNKNOWN',
      r.riskScore || 0,
      (r.flagReasons || []).join('; ')
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-scan-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Scanner Input */}
      <section className="glass-panel p-6 sm:p-8 relative overflow-hidden group">
        <div className="absolute -inset-1 opacity-20 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl group-hover:opacity-40 transition-opacity duration-700"></div>
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="text-purple-400" size={24} />
            <h2 className="text-2xl font-semibold m-0 text-white">Threat Analytics Engine</h2>
          </div>
          <p className="text-gray-400 text-sm m-0">
            Paste logs, firewall rules, or raw text. Auto-detects IPs, domains, hashes and enriches via VirusTotal, AbuseIPDB & Shodan.
          </p>

          <div className="relative mt-1">
            <textarea
              id="scanner-input"
              className="w-full h-48 bg-surface-dark/80 border border-border-dark rounded-xl p-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm resize-y shadow-inner"
              placeholder={"Paste arbitrary text here...\ne.g. Process spawned connecting to 8.8.8.8 and downloading file 44d88612fea8a8f36de82e1278abb02f"}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />
          </div>

          {/* Options row */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-1.5 text-gray-400 cursor-pointer select-none">
              <input type="checkbox" checked={options.dryRun} onChange={e => setOptions(p => ({ ...p, dryRun: e.target.checked }))}
                className="accent-purple-500 rounded" />
              <Eye size={14} /> Dry Run
            </label>
            <label className="flex items-center gap-1.5 text-gray-400 cursor-pointer select-none">
              <input type="checkbox" checked={options.noCache} onChange={e => setOptions(p => ({ ...p, noCache: e.target.checked }))}
                className="accent-purple-500 rounded" />
              <Zap size={14} /> No Cache
            </label>
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="text-xs">APIs:</span>
              <input
                type="text"
                value={options.onlyApis}
                onChange={e => setOptions(p => ({ ...p, onlyApis: e.target.value }))}
                placeholder="vt,shodan,abuseipdb"
                className="bg-surface-dark/80 border border-border-dark rounded-md py-1 px-2 text-gray-300 text-xs w-36 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <FileText size={14} /> IPv4, Domains, MD5, SHA1, SHA256 — defanged supported
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-400 transition-colors bg-surface-dark/60 border border-border-dark rounded-lg px-3 py-1.5"
              >
                <Upload size={12} /> Upload .txt/.csv
              </button>
              <input ref={fileInputRef} type="file" accept=".txt,.csv,.log" className="hidden" onChange={handleFileUpload} />
            </div>
            <button
              id="scan-button"
              className="primary-button flex items-center gap-2"
              onClick={handleScan}
              disabled={isScanning || !inputText.trim()}
            >
              {isScanning
                ? <><Loader2 className="animate-spin" size={18} /> Scanning...</>
                : <><Shield size={18} /> {options.dryRun ? 'Parse Only' : 'Initiate Scan'}</>
              }
            </button>
          </div>
        </div>
      </section>

      {/* Progress */}
      {isScanning && progress.total > 0 && (
        <ProgressBar current={progress.current} total={progress.total} ioc={progress.ioc} status={progress.status} />
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/50 flex items-center gap-3 shadow-lg">
          <AlertTriangle className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm m-0">{error}</p>
        </div>
      )}

      {/* Dry Run Results */}
      {dryRunData && (
        <section className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Eye size={18} className="text-purple-400" /> Dry Run — {dryRunData.length} IOCs Parsed
          </h3>
          <div className="flex flex-wrap gap-2">
            {dryRunData.map((item, i) => (
              <span key={i} className="font-mono text-xs bg-surface-dark/80 border border-border-dark rounded-lg px-3 py-1.5 text-gray-300 flex items-center gap-2">
                {item.ioc}
                <span className="bg-border-dark px-1.5 py-0.5 rounded text-[10px] text-gray-500 uppercase">{item.type}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Summary + Results */}
      {(summary || results.length > 0) && (
        <>
          {summary && <SummaryCards summary={summary} />}

          <section className="glass-panel p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold flex items-center gap-2 m-0 text-white">
                <span className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                Scan Results
                <span className="ml-2 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                  {results.length} Found
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={exportJSON} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-400 transition-colors bg-surface-dark/60 border border-border-dark rounded-lg px-3 py-1.5">
                  <Download size={12} /> JSON
                </button>
                <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-400 transition-colors bg-surface-dark/60 border border-border-dark rounded-lg px-3 py-1.5">
                  <Download size={12} /> CSV
                </button>
              </div>
            </div>
            <ResultsTable results={results} />
          </section>
        </>
      )}

      {results.length === 0 && !isScanning && !dryRunData && !error && (
        <div className="glass-panel p-12 text-center border-dashed text-gray-500 flex flex-col items-center justify-center">
          <Shield size={48} className="opacity-15 mb-4" />
          <p className="m-0">Enter IOCs above and click scan to begin</p>
        </div>
      )}
    </div>
  );
}
