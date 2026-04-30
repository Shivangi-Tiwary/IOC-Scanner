import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Key, Save, Loader2, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

export default function Settings() {
  const { user, token, updateProfile } = useAuth();
  const [keys, setKeys] = useState({
    vt: user?.keys?.vt || '',
    abuseipdb: user?.keys?.abuseipdb || '',
    shodan: user?.keys?.shodan || ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Whitelist state
  const [whitelist, setWhitelist] = useState([]);
  const [wlLoaded, setWlLoaded] = useState(false);
  const [newWl, setNewWl] = useState({ ioc: '', type: 'ip' });

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile({ keys });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const loadWhitelist = async () => {
    try {
      const res = await fetch('http://localhost:5555/api/whitelist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setWhitelist(data.data);
      setWlLoaded(true);
    } catch {
      setWlLoaded(true);
    }
  };

  const addToWhitelist = async () => {
    if (!newWl.ioc.trim()) return;
    try {
      const res = await fetch('http://localhost:5555/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newWl)
      });
      const data = await res.json();
      if (data.success) {
        setWhitelist(prev => [data.data, ...prev]);
        setNewWl({ ioc: '', type: 'ip' });
      }
    } catch {}
  };

  const removeFromWhitelist = async (id) => {
    try {
      await fetch(`http://localhost:5555/api/whitelist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setWhitelist(prev => prev.filter(w => w._id !== id));
    } catch {}
  };

  if (!wlLoaded) loadWhitelist();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <SettingsIcon size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white m-0">Settings</h2>
          <p className="text-gray-500 text-sm m-0">Manage your API keys and whitelist</p>
        </div>
      </div>

      {/* API Keys */}
      <section className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute -inset-1 opacity-10 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <Key size={18} className="text-purple-400" /> API Keys
          </h3>
          <p className="text-gray-500 text-xs mb-5">Each user uses their own keys. Rate limits are per-key.</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/40 flex items-center gap-2 text-red-300 text-sm">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          {saved && (
            <div className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-500/40 flex items-center gap-2 text-green-300 text-sm">
              <CheckCircle2 size={16} /> Keys saved successfully!
            </div>
          )}

          <form onSubmit={handleSaveKeys} className="flex flex-col gap-4">
            {[
              { label: 'VirusTotal API Key', key: 'vt', placeholder: 'Enter your VT key...' },
              { label: 'AbuseIPDB API Key', key: 'abuseipdb', placeholder: 'Enter your AbuseIPDB key...' },
              { label: 'Shodan API Key', key: 'shodan', placeholder: 'Enter your Shodan key...' }
            ].map(item => (
              <div key={item.key}>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">{item.label}</label>
                <input
                  type="password"
                  value={keys[item.key]}
                  onChange={e => setKeys(prev => ({ ...prev, [item.key]: e.target.value }))}
                  className="w-full bg-surface-dark/80 border border-border-dark rounded-lg py-2.5 px-4 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm font-mono"
                  placeholder={item.placeholder}
                />
              </div>
            ))}

            <button type="submit" disabled={saving} className="primary-button self-end flex items-center gap-2 mt-2">
              {saving ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : <><Save size={16} /> Save Keys</>}
            </button>
          </form>
        </div>
      </section>

      {/* Whitelist */}
      <section className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Whitelist</h3>
        <p className="text-gray-500 text-xs mb-5">IOCs on this list will be skipped during scans.</p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newWl.ioc}
            onChange={e => setNewWl(prev => ({ ...prev, ioc: e.target.value }))}
            placeholder="IP / domain / hash..."
            className="flex-1 bg-surface-dark/80 border border-border-dark rounded-lg py-2 px-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm"
          />
          <select
            value={newWl.type}
            onChange={e => setNewWl(prev => ({ ...prev, type: e.target.value }))}
            className="bg-surface-dark/80 border border-border-dark rounded-lg py-2 px-3 text-gray-300 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="ip">IP</option>
            <option value="domain">Domain</option>
            <option value="hash">Hash</option>
          </select>
          <button onClick={addToWhitelist} className="primary-button text-sm py-2 px-4">Add</button>
        </div>

        {whitelist.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-4">No whitelisted IOCs yet</p>
        ) : (
          <div className="divide-y divide-border-dark">
            {whitelist.map(w => (
              <div key={w._id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-200">{w.ioc}</span>
                  <span className="bg-border-dark px-2 py-0.5 rounded text-xs text-gray-500 uppercase">{w.type}</span>
                </div>
                <button onClick={() => removeFromWhitelist(w._id)} className="text-gray-500 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
