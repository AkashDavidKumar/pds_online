import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API from '../services/api';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Package, 
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  ArrowLeft,
  ShieldCheck,
  Fingerprint,
  Phone,
  Mail
} from 'lucide-react';

export default function Distribute() {
  const { slotId: urlSlotId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use URL param as primary ID, fallback to location state
  const slotId = urlSlotId || (location.state as any)?.slotId;
  const method = (location.state as any)?.method || 'biometric'; 

  const [beneficiary, setBeneficiary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [receiptSent, setReceiptSent] = useState(false);
  const [error, setError] = useState('');
  
  const [items, setItems] = useState({
    rice: 0,
    wheat: 0,
    sugar: 0,
    dal: 0
  });
  
  const [quotaData, setQuotaData] = useState<any>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);

  useEffect(() => {
    if (slotId) {
        fetchInitialData();
    } else {
        setFetching(false);
    }
  }, [slotId]);

  const fetchInitialData = async () => {
    try {
      setFetching(true);
      // 1. Fetch Slot & Beneficiary details via the NEW dedicated API
      const { data: res } = await API.get(`/dealer/slot/${slotId}`);
      setBeneficiary(res.data.user);

      // 2. Fetch Quota
      const { data: qRes } = await API.post('/dealer/verify-slot', { slotId });
      setQuotaData(qRes.quota);
    } catch (err) {
      console.error("Data fetch failed:", err);
      setError("Failed to fetch beneficiary context. Please restart verification.");
    } finally {
      setFetching(false);
      setQuotaLoading(false);
    }
  };

  const getProductQuota = (productKey: string) => {
    if (!quotaData || !quotaData.balance) return 0;
    const balance = quotaData.balance;
    const keys = Object.keys(balance);
    const keyMatch = keys.find(k => {
      const kLow = k.toLowerCase().replace('_', ' ');
      const pLow = productKey.toLowerCase().replace('_', ' ');
      return kLow.includes(pLow) || pLow.includes(kLow);
    });
    return keyMatch ? balance[keyMatch] : 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/dealer/distribute', { slotId, items, authMethod: method });
      setReceiptSent(res.data?.receiptSent === true);
      setSuccess(true);
      setTimeout(() => navigate('/dealer/dashboard'), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Distribution failed. Check stock levels.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Securing Beneficiary Context...</p>
            </div>
        </div>
     );
  }

  if (!beneficiary || !slotId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-6" />
        <h1 className="text-2xl font-black text-slate-900">Beneficiary Not Found</h1>
        <p className="text-slate-500 mt-2 mb-8 uppercase tracking-widest text-[10px] font-black">{error || 'Security Context Missing. Re-Verify Beneficiary.'}</p>
        <button onClick={() => navigate('/dealer/verify')} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-blue-200 uppercase text-xs tracking-widest active:scale-95 transition-all">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
        
        {success ? (
          <div className="bg-white/90 backdrop-blur-md p-20 rounded-[48px] shadow-2xl border-4 border-emerald-500/20 text-center flex flex-col items-center">
             <div className="w-24 h-24 bg-emerald-500 text-white rounded-[32px] flex items-center justify-center shadow-xl shadow-emerald-200 mb-8 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
             </div>
             <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Ration Issued!</h1>
             <p className="text-slate-500 font-bold max-w-sm mx-auto mb-4 text-lg">Digital Receipt Generated & Inventory Updated.</p>
             {receiptSent ? (
               <div className="mb-8 flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-3">
                 <Mail className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                 <p className="text-emerald-700 font-black text-xs uppercase tracking-widest">Delivery receipt sent to beneficiary's email</p>
               </div>
             ) : (
               <div className="mb-8 flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-6 py-3">
                 <Phone className="w-5 h-5 text-amber-500 flex-shrink-0" />
                 <p className="text-amber-700 font-black text-xs uppercase tracking-widest">No email on file — receipt not dispatched</p>
               </div>
             )}
             <p className="text-slate-400 text-sm mb-10">Returning to dashboard...</p>
             <button onClick={() => navigate('/dealer/dashboard')} className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl">Back to Base</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10">
            
            <header className="flex items-center justify-between">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase hover:text-slate-900 transition-colors tracking-widest"
              >
                <ArrowLeft className="w-5 h-5" />
                Return to Verification
              </button>
              <div className="flex items-center gap-4">
                 <div className="px-5 py-2 bg-emerald-50 group border-2 border-emerald-100 rounded-2xl flex items-center gap-3 transition-all">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{method === 'biometric' ? 'Biometric Verified' : 'OTP Authorized'}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <Package className="w-6 h-6 text-blue-600" />
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Commodity Disbursement</h1>
                 </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* LEFT: FORM */}
              <section className="lg:col-span-8 space-y-6">
                <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-md p-10 rounded-[48px] shadow-2xl border border-slate-100 relative overflow-hidden">
                  <h2 className="text-xl font-black text-slate-800 mb-10 flex items-center gap-3">
                     <ShoppingCart className="w-6 h-6 text-blue-500" />
                     Allotment Weights
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    {[
                      { id: 'rice', label: 'Rice (Arisi)', color: 'border-blue-500' },
                      { id: 'wheat', label: 'Wheat (Godhumai)', color: 'border-amber-500' },
                      { id: 'sugar', label: 'Sugar (Sarkarai)', color: 'border-emerald-500' },
                      { id: 'dal', label: 'Dal (Paruppu)', color: 'border-indigo-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{item.label}</label>
                        <div className="flex items-center gap-3">
                           <input 
                             id={`input-${item.id}`}
                             type="number" 
                             className={`w-full p-6 bg-slate-50 border-2 rounded-2xl font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all ${item.color}/30`}
                             placeholder={`0 kg`}
                             min="0"
                             value={items[item.id as keyof typeof items] || ''}
                             onChange={(e) => setItems({...items, [item.id]: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                           />
                           <span className="font-bold text-slate-300">kg</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="mt-8 p-6 bg-rose-50 border border-rose-100 text-rose-500 font-bold text-xs rounded-2xl flex items-center gap-3 animate-head-shake">
                      <AlertTriangle className="w-5 h-5" />
                      {error}
                    </div>
                  )}

                  <button 
                    disabled={loading}
                    className="w-full mt-10 py-6 bg-slate-900 text-white font-black rounded-[32px] text-lg hover:bg-black transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-3 group"
                  >
                     {loading ? 'Finalizing with Server...' : 'Confirm Delivery'}
                     <Receipt className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  </button>
                </form>
              </section>

              {/* RIGHT: CUSTOMER SUMMARY */}
              <section className="lg:col-span-4 space-y-6">
                <div className="bg-slate-900 text-white p-10 rounded-[48px] shadow-2xl border-4 border-white/5 sticky top-24">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-8 pb-4 border-b border-white/10">Beneficiary Voucher</h2>
                   
                   <div className="mb-10">
                      <p className="text-3xl font-black tracking-tight leading-none mb-2">{beneficiary.name || beneficiary.headOfFamily || 'Resident'}</p>
                      <div className="flex gap-2">
                        <span className="text-[9px] font-black bg-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">{beneficiary.cardType || 'NPHH'}</span>
                        <span className="text-[9px] font-black bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">RC: {beneficiary.rationCardNumber?.slice(-4) || 'XXXX'}</span>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/20 tracking-widest uppercase mb-1">Authorization</span>
                        <div className="flex items-center gap-2">
                            {method === 'biometric' ? <Fingerprint className="w-5 h-5 text-blue-400" /> : <Phone className="w-5 h-5 text-blue-600" />}
                            <span className="font-bold text-xs uppercase tracking-tight">{method} Success</span>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/10">
                        <span className="text-[10px] font-black text-white/20 tracking-widest uppercase block mb-4">Remaining Entitlement</span>
                         <div className="space-y-4">
                            {quotaLoading ? (
                               <div className="text-[10px] font-bold text-white/20 animate-pulse text-center py-4">Checking Allotment Ledger...</div>
                            ) : quotaData && quotaData.balance ? (
                                [
                                  { name: 'Rice', val: getProductQuota('rice') },
                                  { name: 'Wheat', val: getProductQuota('wheat') },
                                  { name: 'Sugar', val: getProductQuota('sugar') },
                                  { name: 'Dal', val: getProductQuota('dal') }
                                ].map((q, i) => (
                                  <div key={i} className="flex justify-between items-center text-xs font-bold border-b border-white/5 pb-3">
                                    <span className="opacity-50">{q.name}</span>
                                    <span className={`transition-colors ${q.val > 0 ? 'text-blue-400' : 'text-rose-500'}`}>{q.val} kg</span>
                                  </div>
                                ))
                            ) : (
                                <div className="text-[10px] font-bold text-rose-500/50 text-center py-4">No Quota Record Found For March 2026</div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              </section>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
