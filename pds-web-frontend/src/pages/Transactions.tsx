import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import { 
  History as HistoryIcon, 
  ChevronLeft,
  Calendar,
  Clock,
  ArrowRight,
  PackageCheck
} from 'lucide-react';

export default function Transactions() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/transactions/me')
      .then(res => setHistory(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-fade-in-up">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Link to="/dashboard" className="w-12 h-12 bg-white hover:bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center transition-all active:scale-90">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Purchase Ledger</h1>
              <p className="text-slate-500 font-bold text-sm">Review your authenticated PDS shop collections</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 text-white font-black text-xs uppercase tracking-widest">
            <HistoryIcon className="w-4 h-4" />
            <span>{history.length} Records Found</span>
          </div>
        </header>

        {/* Transactions List */}
        <div className="space-y-4">
          {loading ? (
             <div className="bg-white p-20 rounded-[32px] border-2 border-slate-100/50 flex flex-col items-center justify-center gap-4">
                 <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent shadow-md"></div>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Updating Ledger...</p>
             </div>
          ) : history.length === 0 ? (
            <div className="bg-white p-20 rounded-[32px] text-center border-2 border-dashed border-slate-200 flex flex-col items-center group hover:border-blue-300 transition-colors">
              <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-8 group-hover:scale-110 transition-transform">
                <PackageCheck className="w-12 h-12" />
              </div>
              <p className="text-2xl font-black text-slate-800">No Transactions Yet</p>
              <p className="text-slate-400 mt-2 font-medium max-w-[280px] mx-auto">Your collection history will appear here once you visit the shop.</p>
            </div>
          ) : (
            <div className="grid gap-4">
               {history.map((tx: any, idx: number) => {
                 return (
                    <div key={idx} className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
                       <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest ${
                         tx.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                       }`}>
                          {tx.status || 'Success'}
                       </div>

                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg">
                                <span className="text-[10px] font-bold opacity-50 uppercase leading-none mb-1">Pass</span>
                                <span className="text-xl font-black leading-none italic">#{tx.transactionNumber?.slice(-3)}</span>
                             </div>
                             <div>
                                <div className="flex items-center gap-3 text-slate-400 mb-2">
                                   <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span className="text-[10px] font-black uppercase tracking-tighter">{new Date(tx.date).toLocaleDateString()}</span>
                                   </div>
                                   <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span className="text-[10px] font-black uppercase tracking-tighter">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                   </div>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                   {tx.shopId?.name || 'Local FPS Shop'}
                                   <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">{tx.shopId?.location || 'Anna Nagar West, Chennai'}</p>
                             </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 md:justify-end">
                             {tx.items?.map((item: any, i: number) => (
                                <div key={i} className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 group-hover:border-blue-100 transition-colors">
                                   <span className="text-xs font-black text-slate-900">{item.quantity}kg</span>
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.productId?.name || 'Item'}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 );
               })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
