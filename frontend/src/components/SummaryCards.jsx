import { Shield, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function SummaryCards({ summary }) {
  const cards = [
    {
      label: 'Total Scanned',
      value: summary.total,
      icon: <Shield size={20} />,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Malicious',
      value: summary.malicious,
      icon: <AlertOctagon size={20} />,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      label: 'Suspicious',
      value: summary.suspicious,
      icon: <AlertTriangle size={20} />,
      color: 'from-yellow-500 to-amber-600',
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      label: 'Clean',
      value: summary.clean,
      icon: <CheckCircle2 size={20} />,
      color: 'from-green-500 to-emerald-600',
      textColor: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(card => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-xl border ${card.borderColor} ${card.bgColor} p-4 transition-all hover:scale-[1.02]`}
        >
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.color} opacity-5 rounded-bl-full`}></div>
          <div className="relative z-10">
            <div className={`${card.textColor} mb-2 opacity-70`}>{card.icon}</div>
            <p className={`text-3xl font-bold ${card.textColor} m-0`}>{card.value}</p>
            <p className="text-xs text-gray-500 m-0 mt-1">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
