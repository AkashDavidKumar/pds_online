import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { 
  getInventory, 
  getInventoryLogs, 
  updateInventory 
} from '../services/api';

import { 
  Package, 
  Save, 
  RefreshCw,
  AlertCircle,
  History,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export default function Inventory() {
  const [inventory, setInventory] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    riceStock: 0,
    wheatStock: 0,
    sugarStock: 0,
    dalStock: 0
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    await Promise.all([fetchInventory(), fetchLogs()]);
    setLoading(false);
  };

  const fetchInventory = async () => {
    try {
      const res = await getInventory();
      setInventory(res.data);
    } catch (err) {
      console.error("Fetch inventory failed:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data } = await getInventoryLogs('today');
      setLogs(data);
    } catch (err) {
      console.error("Fetch logs failed:", err);
    }
  };

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    setUpdating(true);
    setSuccess(false);

    try {
      const payload = {
        riceStock: Number(formData.riceStock),
        wheatStock: Number(formData.wheatStock),
        sugarStock: Number(formData.sugarStock),
        dalStock: Number(formData.dalStock),
        reason: "Manual Stock Add"
      };

      await updateInventory(payload);
      setSuccess(true);
      setFormData({ riceStock: 0, wheatStock: 0, sugarStock: 0, dalStock: 0 }); // Reset for additive
      init();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 animate-fade-in-up">
        
        {/* Header - Scaled Down */}
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white border-2 border-slate-100 rounded-2xl shadow-xl flex items-center justify-center text-blue-600">
               <Package className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Real-World Inventory</h1>
              <p className="text-slate-400 font-bold text-[10px] md:text-xs tracking-[0.2em] uppercase">
                 Stock Audit & Node Management
              </p>
            </div>
          </div>
          <button 
            onClick={init}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
            Refresh Data
          </button>
        </header>

        {loading ? (
             <div className="flex flex-col items-center py-20 text-slate-300">
                <Package className="w-16 h-16 mb-6 animate-pulse" />
                <p className="font-black text-xs uppercase tracking-[0.3em]">Accessing Central Depot...</p>
             </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
            
            {/* INVENTORY BARS - LEFT */}
            <div className="lg:col-span-8 space-y-8 md:space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {[
                  { label: 'Rice Stock', val: inventory?.riceStock || 0, color: 'bg-blue-500' },
                  { label: 'Wheat Stock', val: inventory?.wheatStock || 0, color: 'bg-amber-500' },
                  { label: 'Sugar Stock', val: inventory?.sugarStock || 0, color: 'bg-emerald-500' },
                  { label: 'Dal Stock', val: inventory?.dalStock || 0, color: 'bg-indigo-500' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group transition-all hover:border-blue-200">
                     <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">{item.label}</p>
                     <div className="flex items-baseline gap-2 mb-6 md:mb-8">
                        <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{item.val}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">kg available</span>
                     </div>
                     <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                        <div className={`h-full ${item.color} shadow-lg shadow-current/20`} style={{ width: `${Math.min((item.val / 1000) * 100, 100)}%` }}></div>
                     </div>
                  </div>
                ))}
              </div>

              {/* LOGS TABLE */}
              <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                 <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                    Daily Operations Log
                 </h2>
                 <div className="space-y-3">
                    {logs.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-slate-50 rounded-[2rem]">
                           <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                           <p className="text-slate-200 font-black text-xs uppercase tracking-widest italic">No transitions logged today</p>
                        </div>
                    ) : (
                        logs.map((log, i) => (
                          <div key={i} className="flex items-center justify-between p-5 md:p-6 bg-slate-50 border border-slate-100/50 rounded-2xl group hover:bg-white hover:border-blue-100 transition-all">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${log.type === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                   {log.type === 'IN' ? <ArrowDownLeft className="w-5 h-5 md:w-6 md:h-6" /> : <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />}
                                </div>
                                <div>
                                   <p className="text-xs md:text-sm font-black text-slate-900">{log.type === 'IN' ? 'Depot Intake' : 'Beneficiary Release'}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.reason || 'Standard Update'}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] md:text-xs font-black text-slate-900 whitespace-nowrap">
                                   {Object.entries(log.items).filter(([_, v]) => (v as any) > 0).map(([k, v]) => `${v}${k[0].toUpperCase()}`).join(', ')}
                                </p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                             </div>
                          </div>
                        ))
                    )}
                 </div>
              </div>
            </div>

            {/* REFILL FORM - RIGHT */}
            <div className="lg:col-span-4">
               <form onSubmit={handleUpdate} className="bg-slate-950 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl relative border-4 border-white lg:sticky lg:top-24">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                       <Save className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black">Stock Intake</h2>
                  </div>

                  <div className="space-y-6 md:space-y-8 mb-12">
                     {['rice', 'wheat', 'sugar', 'dal'].map((it, i) => (
                        <div key={i} className="flex flex-col gap-2 group">
                           <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 group-focus-within:text-blue-500 transition-colors">{it} (kg to add)</label>
                           <input 
                             id={`input-refill-${it}`}
                             type="number" 
                             className="bg-transparent border-b-2 border-white/5 pb-3 text-lg md:text-xl font-black focus:outline-none focus:border-blue-500 transition-all text-white placeholder:text-white/5"
                             value={formData[`${it}Stock` as keyof typeof formData] || ''}
                             onChange={(e) => setFormData({...formData, [`${it}Stock`]: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                           />
                        </div>
                     ))}
                  </div>

                  <button 
                    disabled={updating} 
                    className="w-full py-4 md:py-5 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-slate-950 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/10"
                  >
                     {updating ? 'Processing Intake...' : success ? 'Entry Successful!' : 'Record New Intake'}
                     <CheckCircle2 className={`w-4 h-4 ${!success && 'hidden'}`} />
                  </button>
                  
                  <div className="mt-8 flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                     <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                     <p className="text-[9px] font-bold text-white/30 uppercase leading-relaxed tracking-wider">
                       This is an **Additive Refill**. Input values will be added to existing warehouse balances.
                     </p>
                  </div>
               </form>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
