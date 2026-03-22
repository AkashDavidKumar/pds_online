import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import API, { downloadReceipt } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function BookSlot() {
  const [quota, setQuota] = useState<any>(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch remaining quota to show "Pending Items"
    API.get('/v2/quota')
      .then(res => setQuota(res.data))
      .catch(console.error)
      .finally(() => setLoadingQuota(false));
  }, []);

  const hasAnyEntitlement = quota ? (
    quota.rice > 0 ||
    quota.wheat > 0 ||
    quota.sugar > 0 ||
    quota.dal > 0
  ) : false;

  const isFullyCollected = quota ? (
    (quota.rice === 0 || quota.remaining.rice === 0) &&
    (quota.wheat === 0 || quota.remaining.wheat === 0) &&
    (quota.sugar === 0 || quota.remaining.sugar === 0) &&
    (quota.dal === 0 || quota.remaining.dal === 0)
  ) : false;

  const bookingDisabled = hasAnyEntitlement && isFullyCollected;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingDisabled) {
      setMessage({ type: 'error', text: 'All entitlements have been collected for this month.' });
      return;
    }
    if (!hasAnyEntitlement) {
      setMessage({ type: 'error', text: 'You have no grocery entitlements this month.' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await API.post('/slots/book', { date, timeSlot });
      
      setMessage({ type: 'success', text: 'Slot booked! Your receipt is downloading...' });
      
      // Auto-download receipt
      try {
        await downloadReceipt(data._id);
      } catch (receiptErr) {
        console.error('Receipt download failed', receiptErr);
      }

      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to book slot. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = [
    '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM',
    '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM',
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
        
        {/* Step 1: Pending Items Display */}
        <section className="mb-10">
           <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">1</span>
              Pending Grocery Items
           </h2>
           {loadingQuota ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-xl"></div>)}
              </div>
           ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { name: 'Rice', val: quota?.remaining?.rice, unit: 'kg', color: 'text-blue-600' },
                   { name: 'Wheat', val: quota?.remaining?.wheat, unit: 'kg', color: 'text-amber-600' },
                   { name: 'Sugar', val: quota?.remaining?.sugar, unit: 'kg', color: 'text-emerald-600' },
                   { name: 'Dal', val: quota?.remaining?.dal, unit: 'kg', color: 'text-indigo-600' }
                 ].map(item => (
                   <div key={item.name} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">{item.name}</p>
                      <p className={`text-xl font-black ${item.color}`}>{item.val} <span className="text-xs">{item.unit}</span></p>
                   </div>
                 ))}
              </div>
           )}
            {!loadingQuota && bookingDisabled && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
                 ⚠️ All your monthly entitlements have been collected already. Booking is disabled.
              </div>
            )}
            {!loadingQuota && !hasAnyEntitlement && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                 ⚠️ You have no entitlements assigned to your card. Please contact FPS helpdesk.
              </div>
            )}
        </section>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Schedule Your Visit</h1>
              <p className="text-slate-400 text-sm mt-1">Select your preferred time for token collection.</p>
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold px-3 py-1 bg-white/10 rounded-full text-white/40 uppercase tracking-widest border border-white/10">Official TN Receipt Ready</div>
            </div>
          </div>

          <form onSubmit={handleBooking} className="p-8 space-y-8">
            {message.text && (
              <div className={`p-4 rounded-xl text-center text-sm font-semibold border ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">2. Choose Date</label>
                <input
                  type="date"
                  required
                  disabled={bookingDisabled || !hasAnyEntitlement}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700 disabled:opacity-50"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">3. Choose Time Slot</label>
                <div className="grid grid-cols-1 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      disabled={bookingDisabled || !hasAnyEntitlement}
                      onClick={() => setTimeSlot(slot)}
                      className={`p-4 rounded-xl border-2 text-xs font-bold transition-all text-left flex justify-between items-center ${
                        timeSlot === slot
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                          : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200 disabled:opacity-30'
                      }`}
                    >
                      {slot}
                      {timeSlot === slot && <span>✓ Selected</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !date || !timeSlot || bookingDisabled || !hasAnyEntitlement}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all text-lg flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Processing...
                </>
              ) : 'Confirm Appointment & Download Receipt'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
