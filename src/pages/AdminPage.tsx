import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, ExternalLink, LogOut, Activity } from 'lucide-react';
import { logout } from '../services/adminService';

export default function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <FileText size={18} />, label: 'Posts', path: '/admin/posts' },
    { icon: <Activity size={18} />, label: 'Global Signals', path: '/admin/signals' },
    { icon: <Settings size={18} />, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-[240px] bg-primary text-white flex flex-col fixed inset-y-0 z-50">
        <div className="p-6 border-b border-white/10">
          <div className="logo text-lg font-extrabold tracking-tight flex items-center gap-2">
            ADMIN <span className="bg-accent px-1.5 py-0.5 rounded text-[10px] font-bold">PANEL</span>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-1">
          {menuItems.map(item => (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname.startsWith(item.path) 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-white/50 hover:text-white transition-colors">
            <ExternalLink size={14} /> View Site
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[240px] p-8">
        <Outlet />
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col items-center gap-2">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">
            본 관리자 화면은 문서 관리 및 색인 상태 관리 목적이며,<br />
            자동 분석·자동 최적화 기능을 제공하지 않습니다.
          </p>
          <div className="flex gap-4">
             <div className="text-[9px] text-text-muted">© 2026 Admin Panel</div>
             <div className="text-[9px] text-text-muted">Build v1.0.4 - Isolated Mode</div>
          </div>
        </div>
      </main>
    </div>
  );
}
