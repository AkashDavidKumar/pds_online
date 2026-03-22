import { useEffect, useState, useContext } from 'react';
import Navbar from '../components/Navbar';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Package, 
  ArrowRight,
  Search,
  LayoutDashboard,
  Zap,
  Activity
} from 'lucide-react';

export default function DealerDashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dealer/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <Activity className="w-16 h-16 mb-4 animate-spin-slow" />
            <p className="font-black text-xs uppercase tracking-[0.3em]">Accessing PDS Node...</p>
          </div>
        ) : (
          <>
            <section className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                   {user?.name || 'Dealer'} Portal
                   <span className="text-[9px] font-black px-3 py-1 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 uppercase tracking-widest">
                     Online
                   </span>
                </h1>
                <p className="text-slate-500 font-bold mt-1 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Authorized FPS Node: <span className="text-slate-900">#42 Anna Nagar</span>
                </p>
              </div>
              <Link 
                to="/dealer/verify" 
                className="group px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2 text-xs"
              >
                <Search className="w-4 h-4" />
                Begin Verification
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </section>

            {/* HIGH-LEVEL STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Today Visits', val: stats?.todayStats?.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Completed', val: stats?.todayStats?.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Pending', val: stats?.todayStats?.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Volume Today', val: `${stats?.todayStats?.totalKg || 0}kg`, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' }
              ].map((s, i) => (
                <div key={i} className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100 flex items-center gap-4 group hover:border-slate-900 transition-all">
                  <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                    <p className="text-xl font-black text-slate-900 tracking-tight">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* LOW STOCK ALERT BANNER */}
            {stats?.lowStockAlerts?.length > 0 && (
              <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 rounded-[32px] flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-red-900 font-black text-sm uppercase tracking-tight">Critical Stock Warning</p>
                    <p className="text-red-600/70 font-bold text-xs uppercase tracking-widest">
                      Low inventory for: {stats.lowStockAlerts.join(', ')}
                    </p>
                  </div>
                </div>
                <Link to="/dealer/inventory" className="px-6 py-2.5 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-100">
                  Refill Stock
                </Link>
              </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* STOCK STATUS - 7 cols */}
              <section className="lg:col-span-8 bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Package className="w-6 h-6 text-blue-600" />
                    Live Stock Levels
                  </h2>
                  <Link to="/dealer/inventory" className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline bg-blue-50 px-3 py-1.5 rounded-lg">Manage Repository</Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { label: 'Rice', val: stats?.inventory?.rice, max: 1000, color: 'bg-blue-500' },
                    { label: 'Wheat', val: stats?.inventory?.wheat, max: 1000, color: 'bg-amber-500' },
                    { label: 'Sugar', val: stats?.inventory?.sugar, max: 1000, color: 'bg-emerald-500' },
                    { label: 'Dal', val: stats?.inventory?.dal, max: 1000, color: 'bg-indigo-500' }
                  ].map((item, idx) => (
                     <div key={idx} className={`p-6 rounded-3xl border ${stats?.lowStockAlerts?.includes(item.label) ? 'border-red-200 bg-red-50/30' : 'border-slate-50' } space-y-4`}>
                        <div className="flex justify-between items-end">
                           <div className="flex items-center gap-2">
                             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                             {stats?.lowStockAlerts?.includes(item.label) && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                           </div>
                           <p className="text-xl font-black text-slate-900">{item.val} <span className="text-[10px] text-slate-400 uppercase">kg</span></p>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                           <div className={`h-full ${stats?.lowStockAlerts?.includes(item.label) ? 'bg-red-500' : item.color} transition-all duration-1000`} style={{ width: `${(item.val / item.max) * 100}%` }}></div>
                        </div>
                     </div>
                  ))}
                </div>

                {/* TODAY'S THROUGHPUT SUB-WIDGET */}
                <div className="mt-12 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                   <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Today's Distribution Volume</h3>
                   <div className="flex flex-wrap gap-10">
                      {[
                        { label: 'Rice', val: stats?.todayStats?.distributed?.rice || 0 },
                        { label: 'Wheat', val: stats?.todayStats?.distributed?.wheat || 0 },
                        { label: 'Sugar', val: stats?.todayStats?.distributed?.sugar || 0 },
                        { label: 'Dal', val: stats?.todayStats?.distributed?.dal || 0 }
                      ].map((d, i) => (
                        <div key={i} className="flex flex-col">
                           <span className="text-xl font-black text-slate-900">{d.val}kg</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.label}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </section>

              {/* ACTION CENTER - 4 cols */}
              <section className="lg:col-span-4 space-y-4">
                 <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border-4 border-white h-full">
                    <h2 className="text-xl font-black mb-8 flex items-center gap-3 tracking-tight">
                       <LayoutDashboard className="w-5 h-5 text-blue-400" />
                       Operation Center
                    </h2>
                    
                    <div className="space-y-4">
                       <Link to="/dealer/verify" className="flex items-center justify-between p-6 bg-white/10 rounded-3xl hover:bg-white/20 transition-all border border-white/10 group">
                          <div>
                             <p className="text-sm font-black">Verify Identity</p>
                             <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Process New Arrivals</p>
                          </div>
                          <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                       </Link>

                       <Link to="/dealer/inventory" className="flex items-center justify-between p-6 bg-white/10 rounded-3xl hover:bg-white/20 transition-all border border-white/10 group">
                          <div>
                             <p className="text-sm font-black">Stock Management</p>
                             <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Add Bulk Intake</p>
                          </div>
                          <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />
                       </Link>

                       <button className="w-full flex items-center justify-between p-6 bg-white/10 rounded-3xl hover:bg-white/20 transition-all border border-white/10 group opacity-40 cursor-not-allowed">
                          <div>
                             <p className="text-sm font-black">System Audit</p>
                             <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Download Reports</p>
                          </div>
                          <Clock className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="mt-12 p-6 bg-blue-600/20 rounded-3xl border border-blue-600/30">
                       <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Network Status</p>
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-bold text-white">Central PDS Hub Connected</span>
                       </div>
                    </div>
                 </div>
              </section>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
