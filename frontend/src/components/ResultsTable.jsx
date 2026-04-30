import { ExternalLink, AlertOctagon, CheckCircle2, HelpCircle, AlertTriangle } from 'lucide-react';

const verdictConfig = {
  MALICIOUS: { color: 'text-red-400 bg-red-400/10 border-red-500/20', icon: <AlertOctagon size={14} /> },
  SUSPICIOUS: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20', icon: <AlertTriangle size={14} /> },
  CLEAN: { color: 'text-green-400 bg-green-400/10 border-green-500/20', icon: <CheckCircle2 size={14} /> },
  UNKNOWN: { color: 'text-gray-400 bg-gray-400/10 border-gray-500/20', icon: <HelpCircle size={14} /> }
};

export default function ResultsTable({ results }) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="text-xs text-gray-400 uppercase bg-surface-dark border-b border-border-dark sticky top-0">
          <tr>
            <th className="px-4 py-3 font-medium rounded-tl-lg">Indicator</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Verdict</th>
            <th className="px-4 py-3 font-medium">Risk</th>
            <th className="px-4 py-3 font-medium">VirusTotal</th>
            <th className="px-4 py-3 font-medium">AbuseIPDB</th>
            <th className="px-4 py-3 font-medium">Shodan</th>
            <th className="px-4 py-3 font-medium">Flags</th>
            <th className="px-4 py-3 font-medium rounded-tr-lg">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-dark text-gray-300">
          {results.map((res, i) => {
            const vt = res.data?.vt;
            const abuse = res.data?.abuseipdb;
            const shodan = res.data?.shodan;
            const verdict = res.verdict || 'UNKNOWN';
            const vc = verdictConfig[verdict] || verdictConfig.UNKNOWN;

            const vtScore = vt && vt.malicious !== undefined
              ? { mal: vt.malicious, total: (vt.malicious || 0) + (vt.suspicious || 0) + (vt.harmless || 0) + (vt.undetected || 0) }
              : null;

            return (
              <tr key={i} className="hover:bg-surface-dark/50 transition-colors group">
                {/* IOC */}
                <td className="px-4 py-3 font-mono text-white text-xs max-w-[200px] truncate" title={res.ioc}>
                  {res.ioc}
                </td>

                {/* Type */}
                <td className="px-4 py-3">
                  <span className="bg-border-dark px-2 py-0.5 rounded text-xs text-gray-400 font-medium uppercase">
                    {res.type}
                  </span>
                </td>

                {/* Verdict badge */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${vc.color}`}>
                    {vc.icon} {verdict}
                  </span>
                </td>

                {/* Risk score bar */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-surface-dark rounded-full overflow-hidden border border-border-dark">
                      <div
                        className={`h-full rounded-full transition-all ${
                          res.riskScore >= 60 ? 'bg-red-500' : res.riskScore >= 30 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${res.riskScore || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6">{res.riskScore || 0}</span>
                  </div>
                </td>

                {/* VT */}
                <td className="px-4 py-3">
                  {vtScore ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
                      vtScore.mal > 0 ? 'text-red-400 bg-red-400/10 border-red-500/20' : 'text-green-400 bg-green-400/10 border-green-500/20'
                    }`}>
                      {vtScore.mal > 0 ? <AlertOctagon size={12} /> : <CheckCircle2 size={12} />}
                      {vtScore.mal}/{vtScore.total}
                    </span>
                  ) : <span className="text-gray-600">—</span>}
                </td>

                {/* AbuseIPDB */}
                <td className="px-4 py-3">
                  {abuse && abuse.confidenceScore !== undefined ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
                      abuse.confidenceScore > 50 ? 'text-red-400 bg-red-400/10 border-red-500/20'
                        : abuse.confidenceScore > 0 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20'
                        : 'text-green-400 bg-green-400/10 border-green-500/20'
                    }`}>
                      {abuse.confidenceScore}%
                    </span>
                  ) : <span className="text-gray-600">—</span>}
                </td>

                {/* Shodan ports */}
                <td className="px-4 py-3">
                  {shodan && shodan.ports ? (
                    <div className="flex gap-1 flex-wrap max-w-[120px]">
                      {shodan.ports.slice(0, 3).map(p => (
                        <span key={p} className="bg-blue-500/15 text-blue-300 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/25">{p}</span>
                      ))}
                      {shodan.ports.length > 3 && (
                        <span className="text-gray-500 text-[10px]">+{shodan.ports.length - 3}</span>
                      )}
                    </div>
                  ) : <span className="text-gray-600">—</span>}
                </td>

                {/* Flags */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {res.flagReasons?.map((f, j) => (
                      <span key={j} className="text-[10px] bg-red-400/10 text-red-300 px-1.5 py-0.5 rounded border border-red-500/15 truncate max-w-[180px]">{f}</span>
                    ))}
                    {(!res.flagReasons || res.flagReasons.length === 0) && <span className="text-gray-600">—</span>}
                  </div>
                </td>

                {/* Link */}
                <td className="px-4 py-3">
                  {vt?.link && (
                    <a href={vt.link} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors p-1.5 rounded bg-surface-dark border border-border-dark inline-flex" title="View on VirusTotal">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
