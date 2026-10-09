import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { DEMO_PERSONAS } from '../lib/constants.ts';
import { UserRole } from '../types/index.ts';
import { 
  Building2, 
  ShieldCheck, 
  HardHat, 
  ArrowRight, 
  Sparkles,
  Lock,
  Mail,
  User,
  Building
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin_inspector');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { signIn, signUp, switchDemoPersona } = useAuth();
  const navigate = useNavigate();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email || 'inspector@siteproof.ai', password || 'Password123!', selectedRole);
      } else {
        await signUp(
          email, 
          password || 'Password123!',
          fullName || 'New User', 
          selectedRole, 
          organization || 'Construction Engineering'
        );
      }
      navigate(selectedRole === 'admin_inspector' ? '/admin/dashboard' : '/contractor/dashboard');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickPersona = (role: UserRole) => {
    switchDemoPersona(role);
    navigate(role === 'admin_inspector' ? '/admin/dashboard' : '/contractor/dashboard');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-glow-brand mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            SiteProof AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
            AI-Assisted Construction Milestone Verification & Discrepancy Audit Platform
          </p>
        </div>

        {/* Quick Demo Login Grid for Hackathon Review */}
        <div className="mb-6 p-4 rounded-2xl glass-panel border border-blue-500/30 bg-blue-950/20 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              1-Click Hackathon Demo Access
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
              Instant
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleQuickPersona('admin_inspector')}
              className="group p-3 rounded-xl bg-slate-900/90 hover:bg-blue-900/30 border border-slate-700/80 hover:border-blue-500/50 text-left transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-blue-200">
                  Inspector Cockpit
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {DEMO_PERSONAS.admin_inspector.full_name.split(' ')[0]}
                </div>
              </div>
            </button>

            <button
              onClick={() => handleQuickPersona('contractor')}
              className="group p-3 rounded-xl bg-slate-900/90 hover:bg-amber-900/30 border border-slate-700/80 hover:border-amber-500/50 text-left transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <HardHat className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-200">
                  Contractor Portal
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {DEMO_PERSONAS.contractor.full_name.split(' ')[0]}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Standard Auth Box */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                isLogin
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In with Password
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                !isLogin
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. David Vance"
                      className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Organization / Company
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. BuildCorp Ltd"
                      className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('admin_inspector')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        selectedRole === 'admin_inspector'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                          : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Inspector
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('contractor')}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        selectedRole === 'contractor'
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <HardHat className="w-3.5 h-3.5" />
                      Contractor
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isLogin ? 'inspector@siteproof.ai' : 'name@company.com'}
                  className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-brand transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {submitting ? 'Authenticating...' : isLogin ? 'Sign In to Workspace' : 'Complete Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
