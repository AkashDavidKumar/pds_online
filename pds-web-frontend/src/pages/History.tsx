import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../services/api';

export default function History() {
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Transaction History</h1>
          <p className="text-slate-500 mt-2">Comprehensive logs of your recent PDS shop purchases.</p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
             <div className="p-12 flex justify-center">
                 <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
             </div>
          ) : history.length === 0 ? (
            <div className="p-24 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <p className="text-xl font-bold text-slate-700">No transactions recorded</p>
              <p className="text-slate-500 mt-2">Any future shop visits will reflect here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-widest font-bold">
                    <th className="p-6">Trans. ID / Date</th>
                    <th className="p-6">Shop</th>
                    <th className="p-6">Items & Quantities</th>
                    <th className="p-6 text-right">Auth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((tx: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <div className="font-bold text-slate-800 text-sm">#{tx.transactionNumber}</div>
                        <div className="text-xs text-slate-500 mt-1">{new Date(tx.date).toLocaleString()}</div>
                      </td>
                      <td className="p-6 text-slate-700 font-medium">
                        {tx.shopId?.name || 'Local PFS'}
                      </td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-2">
                           {tx.items?.map((item: any, i: number) => (
                             <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                                {item.productId?.name}: {item.quantity} {item.productId?.unit}
                             </span>
                           ))}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {tx.authMethod}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
