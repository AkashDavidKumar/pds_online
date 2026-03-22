import { useEffect, useState, useContext } from 'react';
import Navbar from '../components/Navbar';
import QuotaCard from '../components/QuotaCard';
import FamilyList from '../components/FamilyList';
import UpdateProfileModal from '../components/UpdateProfileModal';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Settings
} from 'lucide-react';

export default function Dashboard() {
  const { user, refreshUser } = useContext(AuthContext);
  const [quota, setQuota] = useState<any>(null);
  const [slot, setSlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const fetchDashboardData = () => {
    // 1. Fetch TN Specific Quota
    API.get('/v2/quota')
      .then(res => setQuota(res.data))
      .catch(console.error);

    // 2. Fetch Latest Booked Slot
    API.get('/slots/my-slot')
      .then(res => setSlot(res.data))
      .catch(console.error);

    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getDaysUntilReset = () => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const diff = lastDay.getDate() - today.getDate();
    return diff === 0 ? "Resetting Tomorrow" : `Resets in ${diff} Days`;
  };

  const handleUpdateComplete = async () => {
    // 1. Trigger Global Context Refresh (SSOT)
    await refreshUser();
    
    // 2. Dispatch custom event to notify separate FamilyList component
    window.dispatchEvent(new CustomEvent('familyUpdated'));
    
    // 3. Re-fetch local dashboard specific data
    fetchDashboardData();
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-500 font-bold animate-pulse">Loading Your Dashboard...</p>
          </div>
        ) : (
          <>
        {/* Welcome Section */}
        <section className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="hidden md:flex w-20 h-20 bg-white rounded-3xl items-center justify-center text-blue-600 shadow-xl shadow-slate-200 border border-slate-50 font-black text-3xl">
              {user?.name?.[0] || 'R'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                   Welcome, {user?.name || 'Resident'}
                </h1>
                <button 
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="p-2 bg-slate-100 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-lg rounded-xl transition-all"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                 <span className="text-[10px] font-black px-2.5 py-1 bg-blue-600 text-white rounded-lg shadow-sm">
                   {user?.cardType || 'PHH'} CARD
                 </span>
                 <p className="text-slate-400 font-bold text-xs flex items-center gap-2">
                   <MapPin className="w-3.5 h-3.5" />
                   Ration ID: <span className="text-slate-800 font-black tracking-tighter">{user?.rationCardNumber}</span>
                 </p>
              </div>
            </div>
          </div>
          <Link 
            to="/book-slot" 
            className="group px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
          >
            <CalendarDays className="w-5 h-5" />
            Book Shop Visit
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>

        <div className="space-y-12">
          
          {/* SECTION 1: Monthly Entitlements (Dynamic) */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Monthly Entitlements</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tamil Nadu PDS Digital Services</p>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest animate-pulse">{getDaysUntilReset()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                 <CheckCircle2 className="w-4 h-4 text-blue-600" />
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">System Verified</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <QuotaCard 
                title="Rice (Arisi)" 
                total={quota?.rice || 0} 
                remaining={quota?.remaining?.rice || 0} 
                unit="kg" 
                color="bg-blue-500" 
              />
              <QuotaCard 
                title="Wheat (Godhumai)" 
                total={quota?.wheat || 0} 
                remaining={quota?.remaining?.wheat || 0} 
                unit="kg" 
                color="bg-amber-500" 
              />
              <QuotaCard 
                title="Sugar (Sarkkarai)" 
                total={quota?.sugar || 0} 
                remaining={quota?.remaining?.sugar || 0} 
                unit="kg" 
                color="bg-emerald-500" 
              />
              <QuotaCard 
                title="Dal (Paruppu)" 
                total={quota?.dal || 0} 
                remaining={quota?.remaining?.dal || 0} 
                unit="kg" 
                color="bg-indigo-500" 
              />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            
            {/* SECTION 2: Booked Slot Card */}
            <section className="lg:col-span-1">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Your Appointment</h2>
              {slot ? (
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
                  <div className={`absolute top-0 right-0 px-4 py-1.5 font-black uppercase tracking-widest rounded-bl-2xl text-[10px] ${
                    slot.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {slot.status === 'completed' ? '✅ COMPLETED' : '📅 BOOKED'}
                  </div>
                  
                  <div className="flex items-start gap-5 mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shadow-lg ${
                       slot.status === 'completed' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-200'
                    } text-white`}>
                        <span className="text-[10px] uppercase opacity-70">Pass</span>
                        <span className="text-xl">#1</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">{slot.status === 'completed' ? 'Collected On' : 'Scheduled Date'}</p>
                      </div>
                      <p className="font-black text-slate-800 leading-tight">
                        {new Date(slot.completedAt || slot.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                       <div className="flex items-center gap-2 text-slate-500">
                         <Clock className="w-4 h-4" />
                         <span className="text-xs font-bold">Time Window</span>
                       </div>
                       <span className="text-xs font-black text-slate-900">{slot.timeSlot}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                       <div className="flex items-center gap-2 text-slate-500">
                         <MapPin className="w-4 h-4" />
                         <span className="text-xs font-bold">FPS Shop</span>
                       </div>
                       <span className="text-xs font-black text-blue-600">
                         {user?.assignedShop?.name || 'Anna Nagar Circle-1 FPS'}
                       </span>
                    </div>
                  </div>

                  {slot.status === 'completed' ? (
                     <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Ration Collected Successfully</p>
                     </div>
                  ) : (
                    <Link to="/book-slot" className="mt-8 w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-100 text-slate-400 text-xs font-black rounded-2xl hover:bg-slate-50 hover:text-slate-600 transition-all uppercase tracking-widest active:scale-95">
                      Update Appointment
                    </Link>
                  )}
                </div>
              ) : (
                <div className="bg-white/50 backdrop-blur-sm p-10 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center group hover:border-blue-300 transition-colors">
                   <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-6 group-hover:scale-110 transition-transform">
                      <AlertCircle className="w-8 h-8" />
                   </div>
                   <p className="text-slate-800 font-black text-lg">No Active Booking</p>
                   <p className="text-sm text-slate-400 mt-2 mb-8 max-w-[200px]">You need to book a time slot to collect your groceries.</p>
                   <Link 
                    to="/book-slot" 
                    className="flex items-center gap-2 text-blue-600 font-black text-xs hover:gap-3 transition-all uppercase tracking-widest"
                   >
                     Book Now <ArrowRight className="w-4 h-4" />
                   </Link>
                </div>
              )}
            </section>

            {/* SECTION 3: Family Members (List Only) */}
            <section className="lg:col-span-2">
              <FamilyList />
            </section>

          </div>

        </div>

          </>
        )}
      </main>

      {isUpdateModalOpen && (
        <UpdateProfileModal 
          user={user} 
          onClose={() => setIsUpdateModalOpen(false)} 
          onUpdate={handleUpdateComplete} 
        />
      )}
    </div>
  );
}
