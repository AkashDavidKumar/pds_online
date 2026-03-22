import { useState, useEffect } from 'react';
import API from '../services/api';
import { Users, User as UserIcon, RefreshCw, ChevronRight } from 'lucide-react';

export default function FamilyList() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Fetch user profile to get fresh family array (Unified SSOT)
      const { data } = await API.get('/users/profile');
      setMembers(data.familyMembers || []);
    } catch (err) {
      console.error("Failed to fetch family members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    
    // Custom event listener for refreshing family list when modal updates data
    const refreshHandler = () => fetchMembers();
    window.addEventListener('familyUpdated', refreshHandler);
    return () => window.removeEventListener('familyUpdated', refreshHandler);
  }, []);

  return (
    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[38px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Family Tree</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Verified Household Members</p>
          </div>
        </div>
        <button 
          onClick={fetchMembers}
          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
        >
          <RefreshCw className={`w-5 h-5 ${loading && 'animate-spin'}`} />
        </button>
      </div>

      {loading && members.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
           <div className="animate-spin h-10 w-10 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Accessing Ledger...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px] group hover:border-indigo-100 transition-colors">
          <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 mb-6 group-hover:scale-110 transition-transform">
             <UserIcon className="w-10 h-10" />
          </div>
          <p className="text-slate-800 font-black text-lg">No Members Registered</p>
          <p className="text-sm text-slate-400 font-medium max-w-[200px] mt-1 mx-auto">Update your profile to add dependents to your ration card.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member, idx) => (
            <div key={idx} className="flex items-center justify-between p-5 rounded-[28px] border border-slate-50 bg-slate-50/50 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white text-indigo-600 font-black text-xl rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg leading-none mb-1.5">{member.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-lg">
                      {member.relation}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {member.age} Yrs
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
