import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ rationCardNumber: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rationCardNumber || !form.password) {
      setError('Please fill in both fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    const res = await login(form.rationCardNumber, form.password);
    
    setIsSubmitting(false);
    
    if (res.success) {
      // res.user is what I'll add to the login return
      if (res.user?.role === 'dealer' || res.user?.role === 'admin') {
        navigate('/dealer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-blue-500">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Digital PDS</h2>
        <p className="text-slate-400 text-center mb-8">Access your ration quotas & history</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Ration Card Number</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 outline-none transition-all placeholder-slate-500"
              placeholder="Enter card number"
              value={form.rationCardNumber}
              onChange={(e) => setForm({ ...form, rationCardNumber: e.target.value })}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 outline-none transition-all placeholder-slate-500"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 text-white font-semibold rounded-xl transition-all shadow-lg flex justify-center items-center"
          >
            {isSubmitting ? (
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : "Secure Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
