import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../services/api';
import {
  Users,
  UserPlus,
  Search,
  Edit3,
  X,
  Trash2,
  CheckCircle2,
  CreditCard,
  Save
} from 'lucide-react';

export default function DealerUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Family Member Form State
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [editingFamilyID, setEditingFamilyID] = useState<any>(null);
  const [familyFormData, setFamilyFormData] = useState({ name: '', age: '', relation: 'Son' });

  // Main User Form State
  const [formData, setFormData] = useState({
    name: '',
    rationCardNumber: '',
    mobileNumber: '',
    email: '',
    password: '',
    cardType: 'PHH',
    riceTotal: 0,
    wheatTotal: 0,
    sugarTotal: 0,
    dalTotal: 0,
    familyMembers: [] as any[]
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/dealer/users');
      setUsers(res.data);
      if (editingUser) {
        const freshUser = res.data.find((u: any) => u._id === editingUser._id);
        if (freshUser) setEditingUser(freshUser);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.rationCardNumber.includes(searchQuery)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        // Strip __v and _id to avoid concurrency/version conflict errors
        const { __v, _id, ...cleanData } = formData as any;
        await API.put(`/users/${editingUser._id}`, cleanData);
      } else {
        await API.post('/users', formData);
      }
      setIsModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      alert(`Error updating beneficiary: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rationCardNumber: '',
      mobileNumber: '',
      email: '',
      password: '',
      cardType: 'PHH',
      riceTotal: 0,
      wheatTotal: 0,
      sugarTotal: 0,
      dalTotal: 0,
      familyMembers: []
    });
    setEditingUser(null);
    setEditingFamilyID(null);
    setShowFamilyForm(false);
  };

  const startEditFamilyMember = (member: any) => {
    setEditingFamilyID(member._id);
    setFamilyFormData({
        name: member.name,
        age: member.age.toString(),
        relation: member.relation
    });
    setShowFamilyForm(true);
  };

  const handleSaveFamilyMember = async (e?: any) => {
    if (e) e.preventDefault();
    if (!familyFormData.name || !familyFormData.age) return;
    
    setSubmitting(true);
    try {
      let updatedFamily;
      if (editingFamilyID) {
        // Edit existing
        updatedFamily = editingUser.familyMembers.map((m: any) => 
          m._id === editingFamilyID 
            ? { ...m, ...familyFormData, age: parseInt(familyFormData.age) }
            : m
        );
      } else {
        // Add new
        const currentFamily = editingUser.familyMembers || [];
        updatedFamily = [...currentFamily, {
          name: familyFormData.name,
          age: parseInt(familyFormData.age),
          relation: familyFormData.relation,
          // Removed manual _id to let MongoDB generate a valid ObjectId
        }];
      }

      await API.put(`/users/${editingUser._id}`, { familyMembers: updatedFamily });
      
      // Sync the main form state to prevent overwriting with old data on "Finalize Changes"
      setFormData(prev => ({ ...prev, familyMembers: updatedFamily }));
      
      setFamilyFormData({ name: '', age: '', relation: 'Son' });
      setEditingFamilyID(null);
      // Keep form open for rapid entry if not editing
      if (editingFamilyID) setShowFamilyForm(false);
      
      await fetchUsers();
    } catch (err: any) {
      alert(`Failed to save family member: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFamilyMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this family member?")) return;
    try {
      const updatedFamily = editingUser.familyMembers.filter((m: any) => m._id !== memberId);
      await API.put(`/users/${editingUser._id}`, { familyMembers: updatedFamily });
      setFormData(prev => ({ ...prev, familyMembers: updatedFamily }));
      await fetchUsers();
    } catch (err) {
      alert("Failed to remove member");
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-10 animate-fade-in-up">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                <Users className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Beneficiary Directory</h1>
                <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">Digital Audit Node</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll Beneficiary</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
           <input 
             type="text"
             placeholder="Search Name or Ration Card..."
             className="w-full pl-15 pr-6 py-5 bg-white rounded-[2rem] border-2 border-slate-100 shadow-lg shadow-slate-100/30 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {loading ? (
             <div className="col-span-full py-20 text-center text-slate-400 font-bold animate-pulse uppercase text-xs tracking-widest">Synchronizing...</div>
           ) : filteredUsers.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300 font-bold italic">No results found.</div>
           ) : (
             filteredUsers.map((u) => (
               <div key={u._id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/20 hover:shadow-2xl transition-all group">
                  <div className="flex items-start justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-50 text-slate-900 group-hover:bg-blue-600 group-hover:text-white rounded-xl flex items-center justify-center font-black text-lg transition-all">
                          {u.name[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">{u.name}</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">RC: {u.rationCardNumber}</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => { 
                         setEditingUser(u); 
                         setFormData({ 
                           ...u, 
                           familyMembers: u.familyMembers || [] 
                         }); 
                         setIsModalOpen(true); 
                       }}
                       className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                     >
                       <Edit3 className="w-5 h-5" />
                     </button>
                  </div>
                   {u.isCompleted ? (
                      <div className="flex items-center justify-between p-4 bg-emerald-600 text-white rounded-2xl animate-pulse">
                          <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Collection Complete
                          </p>
                          <p className="text-xs font-black">Fully Distributed</p>
                      </div>
                   ) : (
                      <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-2xl">
                          <p className="text-[9px] font-black uppercase tracking-widest">Family Strength</p>
                          <p className="text-xs font-black">{(u.familyMembers?.length || 0) + 1} Members</p>
                      </div>
                   )}
                </div>
             ))
           )}
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 md:p-4">
          <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden animate-scale-in flex flex-col">
             
             {/* Modal Header */}
             <div className="bg-slate-900 py-6 px-8 md:p-10 text-white shrink-0 relative">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <CreditCard className="w-6 h-6 md:w-7 md:h-7" />
                   </div>
                   <div>
                      <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none">{editingUser ? 'Update Profile' : 'New Beneficiary'}</h2>
                      <p className="text-slate-400 font-bold text-[10px] md:text-xs mt-1">Configure credentials and allocation limits</p>
                   </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="absolute top-1/2 -translate-y-1/2 right-6 md:right-10 text-slate-500 hover:text-white transition-all">
                   <X className="w-6 h-6 md:w-8 md:h-8" />
                </button>
             </div>

             <div className="flex-grow overflow-y-auto p-6 md:p-10 scrollbar-hide space-y-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                   <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Holder Name</label>
                         <input 
                           required
                           className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-800 transition-all text-base"
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                         />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ration Card #</label>
                           <input 
                             required
                             className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-800 transition-all"
                             value={formData.rationCardNumber}
                             onChange={(e) => setFormData({...formData, rationCardNumber: e.target.value})}
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile #</label>
                           <input 
                             required
                             className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-800 transition-all"
                             value={formData.mobileNumber}
                             onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                           />
                        </div>
                         <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address ✉️</label>
                            <input 
                              type="email"
                              required={!editingUser}
                              placeholder="beneficiary@example.com"
                              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-800 transition-all"
                              value={(formData as any).email || ''}
                              onChange={(e) => setFormData({...formData, email: e.target.value} as any)}
                            />
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password / Security PIN</label>
                           <input 
                             type="password"
                             required={!editingUser}
                             placeholder={editingUser ? "Leave blank to keep current" : "****"}
                             className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-slate-800 transition-all"
                             value={formData.password}
                             onChange={(e) => setFormData({...formData, password: e.target.value})}
                           />
                        </div>
                      </div>
                   </div>

                      <h4 className="text-[10px] font-black text-slate-950 uppercase tracking-[0.2em] mb-4 text-center mt-2">TN Quota Rules Applied</h4>
                      <p className="text-[9px] text-slate-400 font-bold text-center mb-6 px-10 leading-relaxed uppercase">
                         Allocations are derived from Card Type ({formData.cardType}) and Household Strength ({(formData.familyMembers?.length || 0) + 1} Members)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                         {['Rice', 'Wheat', 'Sugar', 'Dal'].map(k => {
                           const key = k.toLowerCase();
                           const familySize = (formData.familyMembers?.length || 0) + 1;
                           let calcVal = 0;
                           
                           if (formData.cardType === 'PHH') {
                             if (key === 'rice') calcVal = familySize * 5;
                             else if (key === 'wheat') calcVal = 5;
                             else calcVal = 1;
                           } else if (formData.cardType === 'AAY') {
                             if (key === 'rice') calcVal = 35;
                             else if (key === 'wheat') calcVal = 0;
                             else calcVal = 1;
                           } else { // NPHH
                             if (key === 'rice') calcVal = 0;
                             else if (key === 'wheat') calcVal = 5;
                             else calcVal = 1;
                           }

                           return (
                             <div key={k} className="space-y-1.5 opacity-60">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">{k}</label>
                               <div className="relative">
                                 <input 
                                   type="number"
                                   readOnly
                                   className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-black text-slate-600 outline-none text-xs cursor-not-allowed"
                                   value={calcVal}
                                 />
                                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">kg</span>
                               </div>
                             </div>
                           );
                         })}
                      </div>

                   <button 
                     disabled={submitting}
                     type="submit" 
                     className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:bg-slate-200"
                   >
                      {submitting ? 'Saving...' : <><Save className="w-4 h-4" /> {editingUser ? 'Finalize Changes' : 'Enroll Now'}</>}
                   </button>
                </form>

                {/* Family System */}
                {editingUser && (
                   <div className="pt-10 border-t border-slate-100 space-y-8">
                      <div className="flex items-center justify-between">
                         <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Family Inventory</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage Dependents</p>
                         </div>
                         {!showFamilyForm && (
                           <button 
                             onClick={() => setShowFamilyForm(true)}
                             className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg"
                           >
                              + Add Member
                           </button>
                         )}
                      </div>

                      {showFamilyForm && (
                         <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border-4 border-blue-500/10 space-y-6 animate-fade-in shadow-2xl">
                            <div className="flex items-center justify-between">
                               <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                  {editingFamilyID ? 'Edit Relationship' : 'Enroll New Dependent'}
                               </h4>
                               <button onClick={() => { setShowFamilyForm(false); setEditingFamilyID(null); }} className="text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                               <div className="space-y-1.5">
                                  <label className="text-[8px] font-black text-slate-500 uppercase">Legal Name</label>
                                  <input 
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white text-xs outline-none focus:border-blue-500"
                                    value={familyFormData.name}
                                    onChange={e => setFamilyFormData({...familyFormData, name: e.target.value})}
                                  />
                               </div>
                               <div className="space-y-1.5">
                                  <label className="text-[8px] font-black text-slate-500 uppercase">Age</label>
                                  <input 
                                    type="number"
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white text-xs outline-none focus:border-blue-500"
                                    value={familyFormData.age}
                                    onChange={e => setFamilyFormData({...familyFormData, age: e.target.value})}
                                  />
                               </div>
                               <div className="space-y-1.5">
                                  <label className="text-[8px] font-black text-slate-500 uppercase">Relation</label>
                                  <select 
                                     className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white text-xs outline-none focus:border-blue-500"
                                     value={familyFormData.relation}
                                     onChange={e => setFamilyFormData({...familyFormData, relation: e.target.value})}
                                  >
                                     <option>Head of Family</option>
                                     <option>Spouse</option>
                                     <option>Son</option>
                                     <option>Daughter</option>
                                     <option>Father</option>
                                     <option>Mother</option>
                                     <option>Other</option>
                                  </select>
                               </div>
                            </div>
                            <button 
                              onClick={handleSaveFamilyMember} 
                              disabled={submitting}
                              className="w-full py-3.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-blue-500/20 active:scale-95 disabled:bg-slate-800"
                            >
                              {editingFamilyID ? 'Confirm Changes' : 'Initialize Enrollment'}
                            </button>
                         </div>
                      )}

                      <div className="grid grid-cols-1 gap-3">
                         {(editingUser.familyMembers || []).map((m: any) => (
                           <div key={m._id} className="p-4 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:border-blue-200 transition-all shadow-sm">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                                   {m.name[0]}
                                 </div>
                                 <div className="overflow-hidden">
                                    <h4 className="font-black text-slate-900 tracking-tight leading-none text-sm truncate">{m.name}</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1 flex items-center gap-2">
                                       <span className="text-blue-500">{m.relation}</span>
                                       <span>•</span>
                                       <span>{m.age} Yrs</span>
                                    </p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => startEditFamilyMember(m)}
                                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                >
                                   <Edit3 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteFamilyMember(m._id)}
                                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                           </div>
                         ))}
                         {(!editingUser.familyMembers || editingUser.familyMembers.length === 0) && (
                            <div className="p-10 border-2 border-dashed border-slate-50 rounded-[2.5rem] text-center italic text-slate-200 font-bold text-xs uppercase tracking-widest">Empty Household Pool</div>
                         )}
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
