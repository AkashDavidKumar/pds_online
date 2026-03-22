import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../services/api';
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  CheckCircle2, 
  X,
  Mail,
  Loader2
} from 'lucide-react';

export default function DealerMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await API.get('/contact/dealer');
      setMessages(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    try {
      await API.post(`/contact/reply/${selectedMsg._id}`, { replyText });
      setSelectedMsg(null);
      setReplyText('');
      fetchMessages();
    } catch (error) {
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <MessageSquare className="w-7 h-7 text-blue-600" />
              Community Support
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage beneficiary inquiries & responses</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {messages.map((msg) => (
              <div 
                key={msg._id} 
                className={`bg-white p-6 rounded-[32px] border transition-all ${
                  msg.status === 'unread' ? 'border-blue-200 shadow-xl shadow-blue-50 bg-blue-50/10' : 'border-slate-100 shadow-lg'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">
                    {msg.name[0]}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    msg.status === 'replied' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {msg.status}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="font-black text-slate-900 leading-tight">{msg.subject}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> {msg.name} • {msg.userId?.rationCardNumber || 'N/A'}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl mb-6">
                  <p className="text-xs text-slate-600 line-clamp-3 italic">"{msg.message}"</p>
                </div>

                {msg.status === 'replied' ? (
                  <div className="p-4 border border-emerald-100 bg-emerald-50/50 rounded-2xl mt-4">
                    <p className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3 h-3" /> Reponse Sent
                    </p>
                    <p className="text-xs text-slate-700 font-medium italic">"{msg.replyText}"</p>
                  </div>
                ) : (
                  <button 
                    onClick={() => setSelectedMsg(msg)}
                    className="w-full py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Compose Reply
                  </button>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                   <p className="text-[9px] font-bold text-slate-300 flex items-center gap-1">
                     <Clock className="w-3 h-3" /> {new Date(msg.createdAt).toLocaleDateString()}
                   </p>
                   <p className="text-[9px] font-bold text-slate-300">{msg.email}</p>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="col-span-full py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                <MessageSquare className="w-12 h-12 mb-4" />
                <p className="font-black text-xs uppercase tracking-widest">No Active Support Requests</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* REPLY MODAL */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black tracking-tight">Support Reply</h2>
                <p className="text-blue-100 text-[10px] font-black uppercase mt-1">Email will be sent to beneficiary</p>
              </div>
              <button 
                onClick={() => setSelectedMsg(null)}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReply} className="p-8">
              <div className="mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Original Inquiry</p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <p className="text-[11px] font-bold text-slate-500 mb-1">From: {selectedMsg.name} ({selectedMsg.email})</p>
                   <p className="text-xs text-slate-700 italic">"{selectedMsg.message}"</p>
                </div>
              </div>

              <div className="mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Your Response</label>
                <textarea 
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 outline-none transition-all text-sm font-medium h-32 resize-none"
                />
              </div>

              <button 
                disabled={sending}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                <span className="text-[10px] uppercase tracking-widest">Deliver Response</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
