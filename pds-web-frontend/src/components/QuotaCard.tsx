import { 
  Package, 
  Leaf, 
  Candy, 
  Nut,
  Scale
} from 'lucide-react';

interface QuotaCardProps {
  title: string;
  total: number;
  remaining: number;
  unit: string;
  color: string;
}

export default function QuotaCard({ title, total, remaining, unit, color }: QuotaCardProps) {
  const percentage = total > 0 ? (remaining / total) * 100 : 0;
  
  const getIcon = () => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('rice') || lowerTitle.includes('arisi')) return <Package className="w-5 h-5" />;
    if (lowerTitle.includes('wheat') || lowerTitle.includes('godhumai')) return <Leaf className="w-5 h-5" />;
    if (lowerTitle.includes('sugar') || lowerTitle.includes('sarkkarai')) return <Candy className="w-5 h-5" />;
    if (lowerTitle.includes('dal') || lowerTitle.includes('paruppu')) return <Nut className="w-5 h-5" />;
    return <Scale className="w-5 h-5" />;
  };

  return (
    <div className={`p-5 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.03] bg-white/80 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between h-full group`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full ${color}`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{remaining}</span>
            <span className="text-slate-400 text-xs font-semibold">/ {total} {unit}</span>
          </div>
        </div>
        <div className={`p-2.5 rounded-xl ${color.replace('bg-', 'bg-')}/10 ${color.replace('bg-', 'text-')} group-hover:rotate-12 transition-transform`}>
          {getIcon()}
        </div>
      </div>
      
      <div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: color.includes('blue') ? '#3b82f6' : color.includes('amber') ? '#f59e0b' : color.includes('emerald') ? '#10b981' : '#6366f1'
            }}
          ></div>
        </div>
        <div className="flex justify-between mt-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{percentage.toFixed(0)}% Available</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{total - remaining} {unit} Used</span>
        </div>
      </div>
    </div>
  );
}
