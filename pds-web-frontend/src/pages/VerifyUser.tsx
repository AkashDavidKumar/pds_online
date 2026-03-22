import { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowRight,
  ShieldCheck,
  User as UserIcon,
  Fingerprint,
  Phone,
  CheckCircle2,
  Users as UsersIcon,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  ShieldAlert
} from 'lucide-react';

// ─── OTP Countdown Timer Hook ────────────────────────────────────────────────
function useOTPCountdown(active: boolean) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  useEffect(() => {
    if (!active) { setTimeLeft(300); return; }
    setTimeLeft(300);
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [active]);
  return timeLeft;
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function VerifyUser() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  
  // Verification states
  const [verifying, setVerifying] = useState<'none' | 'biometric' | 'otp'>('none');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading'>('idle');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // OTP countdown timer (5 min)
  const otpExpireSeconds = useOTPCountdown(otpSent);

  useEffect(() => {
    fetchTodaySlots();
  }, []);

  const fetchTodaySlots = async () => {
    try {
      const { data } = await API.get('/dealer/queue/today');
      setSlots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(30);
    if (resendRef.current) clearInterval(resendRef.current);
    resendRef.current = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(resendRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const selectSlot = (s: any) => {
    setSelectedSlot(s);
    setVerifying('none');
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setStatusMsg(null);
    setAttemptsRemaining(3);
    setResendCooldown(0);
  };

  const handleSendOTP = async () => {
    if (resendCooldown > 0) return;
    try {
      setApiStatus('loading');
      setStatusMsg(null);
      await API.post('/dealer/send-otp', { userId: selectedSlot.userId?._id });
      setOtpSent(true);
      setOtp('');
      setAttemptsRemaining(3);
      startResendCooldown();
      setStatusMsg({ type: 'info', text: `OTP dispatched to beneficiary's registered email address.` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send OTP. Check server logs.' });
    } finally {
      setApiStatus('idle');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;
    try {
      setApiStatus('loading');
      setStatusMsg(null);
      await API.post('/dealer/verify-otp', { userId: selectedSlot.userId?._id, otp });
      setOtpVerified(true);
      setStatusMsg({ type: 'success', text: 'Identity verified. Proceeding to distribution...' });
      setTimeout(() => navigate(`/dealer/distribute/${selectedSlot._id}`, { state: { method: 'otp' } }), 2000);
    } catch (err: any) {
      const data = err.response?.data;
      const remaining = data?.attemptsRemaining ?? attemptsRemaining - 1;
      setAttemptsRemaining(remaining);
      if (data?.code === 'MAX_ATTEMPTS_REACHED' || data?.code === 'OTP_EXPIRED') {
        setOtpSent(false);
        setOtp('');
        setStatusMsg({ type: 'error', text: data?.message || 'Verification failed.' });
      } else {
        setStatusMsg({ type: 'warning', text: data?.message || 'Incorrect OTP.' });
      }
    } finally {
      setApiStatus('idle');
    }
  };

  const handleBiometric = () => {
    setApiStatus('loading');
    setTimeout(() => {
      setApiStatus('idle');
      setOtpVerified(true);
      setTimeout(() => navigate(`/dealer/distribute/${selectedSlot._id}`, { state: { method: 'biometric' } }), 2000);
    }, 2500);
  };

  const filteredSlots = (slots || []).filter(s => {
    const name = s.userId?.name || s.userId?.headOfFamily || 'Resident';
    const rc = s.userId?.rationCardNumber || '';
    const mobile = s.userId?.mobileNumber || '';
    return name.toLowerCase().includes(search.toLowerCase()) || rc.includes(search) || mobile.includes(search);
  });

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
        
        <header className="mb-12 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-600 rounded-[24px] shadow-xl flex items-center justify-center text-white">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Today Registration Desk</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Verify identity to release commodities</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* SLOT LIST - LEFT */}
          <div className="lg:col-span-7">
            <div className="relative mb-6">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="text" 
                placeholder="Search beneficiary (Name or Card No)" 
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[28px] font-black text-slate-900 focus:outline-none focus:border-blue-500/50 shadow-xl transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {loading ? (
                <div className="text-center py-20 text-slate-300 animate-pulse font-black text-xs uppercase tracking-widest">Accessing TNPDS Allotment Server...</div>
              ) : filteredSlots.length === 0 ? (
                <div className="text-center py-20 text-slate-300 font-bold italic">No bookings found for criteria.</div>
              ) : (
                filteredSlots.map((s, idx) => (
                  <div key={idx} 
                    onClick={() => selectSlot(s)}
                    className={`p-6 bg-white border-2 rounded-[32px] cursor-pointer transition-all flex items-center justify-between group
                      ${selectedSlot?._id === s._id ? 'border-blue-500 shadow-2xl shadow-blue-200 -translate-y-1' : 'border-transparent shadow-xl hover:border-slate-100 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xs group-hover:bg-blue-600 transition-colors">
                        {(s.userId?.name || s.userId?.headOfFamily || 'R')[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 tracking-tight">{s.userId?.name || s.userId?.headOfFamily || 'Resident'}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400">Card: {s.userId?.rationCardNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${s.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        {s.status}
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* VERIFICATION PANEL - RIGHT */}
          <div className="lg:col-span-5">
            {selectedSlot ? (
              <div className="bg-white p-8 rounded-[48px] shadow-2xl border border-slate-100 transition-all">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-[36px] flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <UserIcon className="w-10 h-10 text-slate-300" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {selectedSlot.userId?.name || selectedSlot.userId?.headOfFamily || 'Resident'}
                  </h2>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Beneficiary Identity Found</p>
                </div>

                {/* STATUS MESSAGE BANNER */}
                {statusMsg && (
                  <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                    statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                    statusMsg.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> :
                     statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> :
                     statusMsg.type === 'warning' ? <ShieldAlert className="w-4 h-4 flex-shrink-0" /> :
                     <Phone className="w-4 h-4 flex-shrink-0" />}
                    {statusMsg.text}
                  </div>
                )}

                {/* VERIFIED STATE */}
                {otpVerified ? (
                  <div className="p-8 text-center animate-bounce">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                    <p className="text-lg font-black text-emerald-600">Authorized!</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest uppercase">Redirecting to Distribution...</p>
                  </div>

                ) : verifying === 'none' ? (
                  <div className="space-y-4">
                    <p className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Security Checkpoint</p>
                    <button
                      onClick={() => setVerifying('biometric')}
                      className="w-full flex items-center justify-between p-5 bg-slate-900 text-white rounded-3xl hover:bg-black transition-all active:scale-95 group shadow-xl"
                    >
                      <div className="flex items-center gap-4">
                        <Fingerprint className="w-7 h-7 text-blue-400" />
                        <div className="text-left">
                          <p className="text-sm font-black">Biometric Scan</p>
                          <p className="text-[10px] font-bold text-white/30">Primary Authorization</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                    <button
                      onClick={() => setVerifying('otp')}
                      className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 text-slate-900 rounded-3xl hover:border-slate-900 hover:bg-slate-50 transition-all active:scale-95 group shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Phone className="w-7 h-7 text-blue-600" />
                        <div className="text-left">
                          <p className="text-sm font-black">Secure OTP</p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {selectedSlot.userId?.email
                              ? `${selectedSlot.userId.email.slice(0, 2)}***@${selectedSlot.userId.email.split('@')[1]}`
                              : 'No email on record'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>

                ) : verifying === 'biometric' ? (
                  <div className="text-center py-8">
                    <Fingerprint className={`w-20 h-20 mx-auto mb-4 text-blue-600 ${apiStatus === 'loading' ? 'animate-pulse scale-110' : ''}`} />
                    <h3 className="text-lg font-black text-slate-900">{apiStatus === 'loading' ? 'Scanning Finger...' : 'Place right thumb on scanner'}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mb-6 tracking-widest uppercase mt-1">SIMULATED EYE-TECH SCANNER V.02</p>
                    {apiStatus !== 'loading' && (
                      <div className="flex gap-4">
                        <button onClick={() => setVerifying('none')} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-xs uppercase transition-all">Cancel</button>
                        <button onClick={handleBiometric} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase shadow-xl hover:bg-black transition-all">Scan Now</button>
                      </div>
                    )}
                  </div>

                ) : (
                  /* OTP FLOW */
                  <div className="text-center">
                    <div className="relative mb-6">
                      <Phone className={`w-14 h-14 text-blue-600 mx-auto ${apiStatus === 'loading' ? 'animate-spin' : ''}`} />
                      {otpSent && otpExpireSeconds > 0 && (
                        <div className="absolute -top-1 -right-1 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                          {formatTime(otpExpireSeconds)}
                        </div>
                      )}
                    </div>

                    {!otpSent ? (
                      <div className="space-y-5">
                        <p className="text-sm font-black text-slate-900">Send OTP to Registered Email</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                          System will dispatch a 6-digit token to<br />
                          {selectedSlot.userId?.email
                            ? `${selectedSlot.userId.email.slice(0, 2)}***@${selectedSlot.userId.email.split('@')[1]}`
                            : <span className="text-red-400">No email on record</span>}
                        </p>
                        <div className="flex gap-3">
                          <button onClick={() => setVerifying('none')} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs uppercase">Cancel</button>
                          <button 
                            onClick={handleSendOTP} 
                            disabled={apiStatus === 'loading'}
                            className="flex-[2] py-3 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase shadow-xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {apiStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                            Send OTP
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Attempt warning */}
                        {attemptsRemaining < 3 && (
                          <div className="flex items-center justify-center gap-2 text-amber-600">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className={`w-2 h-2 rounded-full ${i < attemptsRemaining ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            ))}
                            <span className="text-[10px] font-black uppercase tracking-widest ml-1">{attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} left</span>
                          </div>
                        )}

                        <p className="text-sm font-black text-slate-900">Enter 6-Digit OTP</p>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full text-center text-3xl font-black tracking-[0.8em] p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-600 transition-all"
                          placeholder="——————"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          disabled={apiStatus === 'loading'}
                        />

                        {/* OTP expiry progress */}
                        <div className="w-full bg-slate-100 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all duration-1000 ${otpExpireSeconds > 120 ? 'bg-emerald-500' : otpExpireSeconds > 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${(otpExpireSeconds / 300) * 100}%` }}
                          />
                        </div>
                        {otpExpireSeconds === 0 && (
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">OTP has expired. Please resend.</p>
                        )}

                        <div className="flex gap-3">
                          {/* Resend with cooldown */}
                          <button 
                            onClick={handleSendOTP}
                            disabled={resendCooldown > 0 || apiStatus === 'loading'}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs uppercase transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                            {resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}
                          </button>
                          <button 
                            disabled={otp.length !== 6 || apiStatus === 'loading' || otpExpireSeconds === 0}
                            onClick={handleVerifyOTP} 
                            className="flex-[2] py-3 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase shadow-xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {apiStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            Authorize
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-20 rounded-[48px] flex flex-col items-center justify-center text-slate-300">
                <UsersIcon className="w-20 h-20 mb-6 opacity-30" />
                <p className="font-black text-sm uppercase tracking-widest text-center">Select beneficiary from <br /> list to begin verification</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
