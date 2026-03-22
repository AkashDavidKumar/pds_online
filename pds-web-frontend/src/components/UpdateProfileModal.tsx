import { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  X, 
  Plus, 
  Trash2, 
  Users, 
  Save, 
  User as UserIcon,
  Edit3
} from 'lucide-react';

interface UpdateProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdate: () => void;
}

export default function UpdateProfileModal({ user, onClose, onUpdate }: UpdateProfileModalProps) {
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [newMember, setNewMember] = useState({ name: '', age: '', relation: 'Son' });
  const [submitting, setSubmitting] = useState(false);

  // Load member into form if editing
  useEffect(() => {
    if (editingMember) {
      setNewMember({
        name: editingMember.name,
        age: editingMember.age.toString(),
        relation: editingMember.relation
      });
      setShowFamilyForm(true);
    }
  }, [editingMember]);

  const resetForm = () => {
    setShowFamilyForm(false);
    setEditingMember(null);
    setNewMember({ name: '', age: '', relation: 'Son' });
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.age) return;

    setSubmitting(true);
    try {
      if (editingMember) {
        // Update Action
        await API.put('/users/family', {
          memberId: editingMember._id,
          name: newMember.name,
          age: parseInt(newMember.age),
          relation: newMember.relation
        });
      } else {
        // Add Action
        await API.post('/users/family', {
          name: newMember.name,
          age: parseInt(newMember.age),
          relation: newMember.relation
        });
      }
      
      resetForm();
      onUpdate(); // Trigger refresh in parent
      
      // Dispatch event to sync FamilyList in dashboard
      window.dispatchEvent(new CustomEvent('familyUpdated'));
      
    } catch (error) {
      alert('Failed to save family member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Remove this family member?')) return;
    try {
      await API.delete(`/users/family/${id}`);
      onUpdate();
      window.dispatchEvent(new CustomEvent('familyUpdated'));
    } catch (error) {
      alert('Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in border border-white/20">
        
        {/* Header */}
        <div className="bg-[#1e293b] p-10 text-white relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
               <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Update Profile</h2>
              <p className="text-slate-400 font-bold text-sm tracking-wide">Configure household credentials and dependents</p>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-10 right-10 text-slate-400 hover:text-white transition-all hover:rotate-90">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="p-10 max-h-[65vh] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <div className="px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800">
                  {user?.name}
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ration Card #</label>
                  <div className="px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 text-xs text-center">
                    {user?.rationCardNumber}
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Mobile #</label>
                   <div className="px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 text-xs text-center">
                      {user?.mobileNumber}
                   </div>
                </div>
             </div>
          </div>

          {/* Family Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Family Members
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 uppercase font-black">
                  {user?.familyMembers?.length || 0} Registered
                </span>
              </h3>
              {!showFamilyForm && (
                <button 
                  onClick={() => setShowFamilyForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add Member
                </button>
              )}
            </div>

            {showFamilyForm && (
              <form onSubmit={handleSaveMember} className="bg-slate-50 p-6 rounded-[32px] border-2 border-blue-500/10 animate-fade-in space-y-4">
                <div className="flex items-center justify-between mb-2">
                   <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                     {editingMember ? 'Edit Dependent Profile' : 'New Dependent Enrollment'}
                   </h4>
                   <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <input 
                     placeholder="Name" 
                     className="px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-sm"
                     value={newMember.name}
                     onChange={e => setNewMember({...newMember, name: e.target.value})}
                   />
                   <input 
                     placeholder="Age" 
                     type="number"
                     className="px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-sm"
                     value={newMember.age}
                     onChange={e => setNewMember({...newMember, age: e.target.value})}
                   />
                   <select 
                     className="px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-sm bg-white"
                     value={newMember.relation}
                     onChange={e => setNewMember({...newMember, relation: e.target.value})}
                   >
                     <option>Son</option>
                     <option>Daughter</option>
                     <option>Spouse</option>
                     <option>Father</option>
                     <option>Mother</option>
                     <option>Other</option>
                   </select>
                </div>
                <button 
                  disabled={submitting}
                  className="w-full py-4 bg-slate-950 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? 'Registering...' : <><Save className="w-4 h-4" /> {editingMember ? 'Update Record' : 'Enroll Member'}</>}
                </button>
              </form>
            )}

            <div className="space-y-3">
              {(user?.familyMembers || []).map((m: any) => (
                <div key={m._id} className="group p-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-between hover:border-blue-200 hover:shadow-xl hover:shadow-slate-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 leading-none">{m.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1.5">{m.relation} • {m.age} Years</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingMember(m)}
                      className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteMember(m._id)}
                      className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {(!user?.familyMembers || user.familyMembers.length === 0) && !showFamilyForm && (
                <div className="py-20 border-4 border-dashed border-slate-50 rounded-[40px] text-center">
                  <UserIcon className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                  <p className="text-slate-300 font-black text-xs uppercase tracking-widest italic tracking-tighter">No Active Dependent Registry</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-100">
           <button onClick={onClose} className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-200 transition-all active:scale-95">
              Confirm All Changes
           </button>
        </div>
      </div>
    </div>
  );
}
