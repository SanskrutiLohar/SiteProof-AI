import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { DemoPersonaSwitcher } from './DemoPersonaSwitcher.tsx';
import { 
  Building2, 
  LayoutDashboard, 
  FileCheck2, 
  LogOut,
  FolderGit2,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isAdmin = role === 'admin_inspector';

  // Do not show top dashboard navigation on landing / login routes or when unauthenticated
  if (!profile || location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-brand group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">
                  SiteProof
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI AUDIT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Milestone Verification Platform
              </p>
            </div>
          </Link>

          {/* Nav links */}
          {profile && (
            <nav className="hidden md:flex items-center gap-1">
              {isAdmin ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Inspector Cockpit
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/contractor/dashboard"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      location.pathname.startsWith('/contractor')
                        ? 'bg-amber-600/15 text-amber-400 border border-amber-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <FolderGit2 className="w-4 h-4" />
                    Assigned Projects
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-3">
          {profile ? (
            <>
              {/* Demo Persona Switcher */}
              <DemoPersonaSwitcher />

              {/* User profile dropdown / sign out */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {profile.full_name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {profile.organization || (isAdmin ? 'Auditor' : 'Contractor')}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-glow-brand transition-all flex items-center gap-1.5"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
