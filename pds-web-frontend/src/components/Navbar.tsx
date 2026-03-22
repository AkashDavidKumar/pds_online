import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  History, 
  Calendar, 
  LogOut, 
  Building2,
  Phone,
  Menu,
  X,
  Users,
  MessageSquare
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userInitials = user?.headOfFamily
    ? user.headOfFamily.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'R';

  const navLinks = user?.role === 'dealer' 
    ? [
        { name: 'Dashboard', path: '/dealer/dashboard', icon: LayoutDashboard },
        { name: 'Verify', path: '/dealer/verify', icon: Building2 },
        { name: 'Beneficiaries', path: '/dealer/users', icon: Users },
        { name: 'Inventory', path: '/dealer/inventory', icon: History },
        { name: 'Messages', path: '/dealer/messages', icon: MessageSquare },
      ]
    : [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'History', path: '/transactions', icon: History },
        { name: 'Book Slot', path: '/book-slot', icon: Calendar },
        { name: 'Contact', path: '/contact', icon: Phone },
      ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-10">
            <Link to={user?.role === 'dealer' ? '/dealer/dashboard' : '/dashboard'} className="flex items-center gap-2 group transition-transform active:scale-95">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                 <h1 className="text-lg font-black text-slate-900 leading-none">TNPDS</h1>
                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                   {user?.role === 'dealer' ? 'Dealer Portal' : 'Digital Services'}
                 </p>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive(link.path)
                      ? 'bg-blue-50 text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User Profile & Hamburger */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-100">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Authenticated</p>
                  <p className="text-xs font-bold text-slate-900">System #{user?.rationCardNumber?.slice(-4)}</p>
               </div>
               <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-xs shadow-md">
                 {userInitials}
               </div>
            </div>

            <button
              onClick={logout}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

            {/* Hamburger Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 border-t border-slate-100' : 'max-h-0'}`}>
        <div className="bg-white px-4 py-6 space-y-2 shadow-inner">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 p-4 rounded-2xl text-base font-black transition-all ${
                isActive(link.path)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-50">
            <button
              onClick={() => {
                logout();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 p-4 text-red-500 font-black hover:bg-red-50 rounded-2xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout from System</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
