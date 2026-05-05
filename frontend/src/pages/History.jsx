import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { History as HistoryIcon, ChevronRight, Calendar, Shield, AlertTriangle, ArrowRightLeft, X } from 'lucide-react';

export default function History() {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [diffMode, setDiffMode] = useState(false);
  const [diffSelection, setDiffSelection] = useState({ old: null, new: null });
  const [diffResult, setDiffResult] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/scan/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setReports(data.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const viewReport = async (id) => {
    try {
  const res = await fetch(`${API_URL}/api/scan/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setSelectedReport(data.data);
    } catch {}
  };

  const handleDiffSelect = (id) => {
    if (!diffSelection.old) {
      setDiffSelection({ old: id, new: null });
    } else if (!diffSelection.new && id !== diffSelection.old) {
      setDiffSelection(prev => ({ ...prev, new: id }));
      runDiff(diffSelection.old, id);
    }
  };

  const runDiff = async (oldId, newId) => {
    try {
      const res = await fetch(`${API_URL}/api/scan/diff/${oldId}/${newId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setDiffResult(data);
    } catch {}
  };

  const resetDiff = () => {
    setDiffMode(false);
    setDiffSelection({ old: null, new: null });
    setDiffResult(null);
  };

  const verdictColor = (v) => {
    if (v === 'MALICIOUS') return 'text-red-400 bg-red-400/10 border-red-500/30';
    if (v === 'SUSPICIOUS') return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30';
    if (v === 'CLEAN') return 'text-green-400 bg-green-400/10 border-green-500/30';
    return 'text-gray-400 bg-gray-400/10 border-gray-500/30';
  };

  const diffStatusColor = (s) => {
    if (s === 'NEW') return 'text-blue-400 bg-blue-400/10 border-blue-500/30';
    if (s === 'CHANGED') return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30';
    if (s === 'REMOVED') return 'text-red-400 bg-red-400/10 border-red-500/30';
    return 'text-gray-500 bg-gray-500/10 border-gray-600/30';
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <HistoryIcon size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white m-0">Scan History</h2>
            <p className="text-gray-500 text-sm m-0">{reports.length} past scans</p>
          </div>
        </div>
        <button
          onClick={() => diffMode ? resetDiff() : setDiffMode(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            diffMode
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              : 'bg-surface-dark/60 border-border-dark text-gray-400 hover:text-white hover:border-purple-500/40'
          }`}
        >
          {diffMode ? <><X size={14} /> Cancel Diff</> : <><ArrowRightLeft size={14} /> Compare Scans</>}
        </button>
      </div>

      {diffMode && !diffResult && (
        <div className="glass-panel p-4 border-purple-500/30 text-sm text-purple-300 flex items-center gap-2">
          <ArrowRightLeft size={16} />
          {!diffSelection.old
            ? 'Select the OLDER scan to compare from...'
            : 'Now select the NEWER scan to compare against...'
          }
        </div>
      )}

      {/* Diff Result */}
      {diffResult && (
        <section className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-purple-400" /> Diff Results
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-400 uppercase bg-surface-dark border-b border-border-dark">
                <tr>
                  <th className="px-4 py-3 font-medium">IOC</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Old Verdict</th>
                  <th className="px-4 py-3 font-medium">New Verdict</th>
                  <th className="px-4 py-3 font-medium">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {diffResult.diff.map((item, i) => (
                  <tr key={i} className="hover:bg-surface-dark/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-white text-xs">{item.ioc}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold border ${diffStatusColor(item.diffStatus)}`}>
                        {item.diffStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.previousVerdict ? (
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${verdictColor(item.previousVerdict)}`}>
                          {item.previousVerdict}
                        </span>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${verdictColor(item.verdict)}`}>
                        {item.verdict}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {item.previousRiskScore !== undefined && item.previousRiskScore !== item.riskScore ? (
                        <span>
                          <span className="text-gray-500 line-through mr-1">{item.previousRiskScore}</span>
                          → {item.riskScore}
                        </span>
                      ) : item.riskScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Report detail */}
      {selectedReport && !diffMode && (
        <section className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 m-0">
              <Shield size={18} className="text-purple-400" /> Scan Detail
            </h3>
            <button onClick={() => setSelectedReport(null)} className="text-gray-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Total', value: selectedReport.summary.total, color: 'text-blue-400' },
              { label: 'Malicious', value: selectedReport.summary.malicious, color: 'text-red-400' },
              { label: 'Suspicious', value: selectedReport.summary.suspicious, color: 'text-yellow-400' },
              { label: 'Clean', value: selectedReport.summary.clean, color: 'text-green-400' }
            ].map(s => (
              <div key={s.label} className="bg-surface-dark/60 border border-border-dark rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${s.color} m-0`}>{s.value}</p>
                <p className="text-xs text-gray-500 m-0 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-400 uppercase bg-surface-dark border-b border-border-dark">
                <tr>
                  <th className="px-4 py-3 font-medium">IOC</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Verdict</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {selectedReport.results.map((r, i) => (
                  <tr key={i} className="hover:bg-surface-dark/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-white text-xs">{r.ioc}</td>
                    <td className="px-4 py-3">
                      <span className="bg-border-dark px-2 py-0.5 rounded text-xs text-gray-400 uppercase">{r.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold border ${verdictColor(r.verdict)}`}>
                        {r.verdict}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{r.riskScore}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.flagReasons?.map((f, j) => (
                          <span key={j} className="text-xs bg-red-400/10 text-red-300 px-2 py-0.5 rounded border border-red-500/20">{f}</span>
                        ))}
                        {(!r.flagReasons || r.flagReasons.length === 0) && <span className="text-gray-600">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* History list */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-gray-500">Loading history...</div>
      ) : reports.length === 0 ? (
        <div className="glass-panel p-12 text-center text-gray-500 flex flex-col items-center gap-3">
          <HistoryIcon size={48} className="opacity-20" />
          <p>No scan history yet. Run your first scan!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map((r) => (
            <div
              key={r._id}
              onClick={() => diffMode ? handleDiffSelect(r._id) : viewReport(r._id)}
              className={`glass-panel p-4 cursor-pointer hover:border-purple-500/40 transition-all flex items-center justify-between group ${
                diffSelection.old === r._id || diffSelection.new === r._id ? 'border-purple-500/60 bg-purple-500/5' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Calendar size={14} />
                  {new Date(r.scannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300">{r.summary.total} scanned</span>
                  {r.summary.malicious > 0 && (
                    <span className="text-xs bg-red-400/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                      <AlertTriangle size={10} /> {r.summary.malicious} malicious
                    </span>
                  )}
                  {r.summary.suspicious > 0 && (
                    <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20">
                      {r.summary.suspicious} suspicious
                    </span>
                  )}
                  {r.summary.clean > 0 && (
                    <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">
                      {r.summary.clean} clean
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
