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
  Building,
  CheckCircle2,
  LogOut,
  Layers,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin_inspector');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { profile, role, signIn, signUp, signOut, switchDemoPersona } = useAuth();
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

  const handleQuickPersona = (roleToSet: UserRole) => {
    switchDemoPersona(roleToSet);
    navigate(roleToSet === 'admin_inspector' ? '/admin/dashboard' : '/contractor/dashboard');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden bg-slate-950">
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-[30rem] h-[30rem] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main minimal container */}
      <div className="w-full max-w-4xl z-10 space-y-8 my-auto text-center">
        {/* Brand & Large Punchy Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gemini 3.8 Flash Engine Active</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-brand">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              SiteProof <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">AI</span>
            </h1>
          </div>

          <p className="text-base sm:text-xl font-medium text-slate-300 max-w-xl mx-auto">
            Construction Milestone Verification & AI Auditing
          </p>

          {/* Minimal 3-Pillar Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Multimodal VLM
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              BOQ Invoice OCR
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Cryptographic Audit
            </span>
          </div>
        </div>

        {/* Central Clean Card */}
        <div className="max-w-xl mx-auto space-y-5">
          {/* Active Session Card (If User Has Profile) */}
          {profile && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-xl text-left space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Active Session
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  {role === 'admin_inspector' ? 'Inspector' : 'Contractor'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                  role === 'admin_inspector' ? 'bg-blue-600 shadow-glow-brand' : 'bg-amber-600 shadow-amber-500/20'
                }`}>
                  {role === 'admin_inspector' ? <ShieldCheck className="w-5 h-5" /> : <HardHat className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {profile.full_name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {profile.organization || (role === 'admin_inspector' ? 'Auditor' : 'Contractor')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(role === 'admin_inspector' ? '/admin/dashboard' : '/contractor/dashboard')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01] ${
                    role === 'admin_inspector'
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                  }`}
                >
                  <span>Enter {role === 'admin_inspector' ? 'Inspector Cockpit' : 'Contractor Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => signOut()}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition-all text-xs"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 1-Click Role Sandbox */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Select Workspace Role
              </h2>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Instant Access
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickPersona('admin_inspector')}
                className="group p-4 rounded-xl bg-slate-950/70 hover:bg-blue-950/30 border border-slate-800 hover:border-blue-500/60 transition-all flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300">
                      Inspector
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {DEMO_PERSONAS.admin_inspector.full_name}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => handleQuickPersona('contractor')}
                className="group p-4 rounded-xl bg-slate-950/70 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-500/60 transition-all flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <HardHat className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300">
                      Contractor
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {DEMO_PERSONAS.contractor.full_name}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            {/* Quick Saved Credentials from Database / Local Ledger */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Saved Credentials:
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">1-Click Login</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setEmail('loharsanskruti1929@gmail.com');
                    setPassword('Password123!');
                    setSubmitting(true);
                    try {
                      await signIn('loharsanskruti1929@gmail.com', 'Password123!', 'admin_inspector');
                      navigate('/admin/dashboard');
                    } catch {
                      // Handled by fallback
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-left transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <strong className="text-xs text-white block truncate group-hover:text-blue-300">
                      loharsanskruti1929@gmail.com
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono">Lead Inspector • Saved</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setEmail('contractor@buildcorp.in');
                    setPassword('Password123!');
                    setSubmitting(true);
                    try {
                      await signIn('contractor@buildcorp.in', 'Password123!', 'contractor');
                      navigate('/contractor/dashboard');
                    } catch {
                      // Handled by fallback
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <strong className="text-xs text-white block truncate group-hover:text-amber-300">
                      contractor@buildcorp.in
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono">Project Contractor • Saved</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* Collapsible Email / Password Sign In */}
            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1"
              >
                <span>{showEmailForm ? 'Hide credentials form' : 'Or sign in with email & password'}</span>
              </button>

              {showEmailForm && (
                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-4 text-left animate-fadeIn">
                  <div className="flex border-b border-slate-800 pb-2">
                    <button
                      onClick={() => setIsLogin(true)}
                      className={`flex-1 pb-1.5 text-xs font-semibold border-b-2 transition-all ${
                        isLogin ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setIsLogin(false)}
                      className={`flex-1 pb-1.5 text-xs font-semibold border-b-2 transition-all ${
                        !isLogin ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500'
                      }`}
                    >
                      Register
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleAuthSubmit} className="space-y-3">
                    {!isLogin && (
                      <>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Full Name</label>
                          <div className="relative">
                            <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              required
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Your full name"
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-400"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Organization</label>
                          <div className="relative">
                            <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              required
                              value={organization}
                              onChange={(e) => setOrganization(e.target.value)}
                              placeholder="Organization name"
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Role</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedRole('admin_inspector')}
                              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                selectedRole === 'admin_inspector'
                                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}
                            >
                              <ShieldCheck className="w-3 h-3" /> Inspector
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedRole('contractor')}
                              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                selectedRole === 'contractor'
                                  ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}
                            >
                              <HardHat className="w-3 h-3" /> Contractor
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="user@siteproof.ai"
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-400 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Password</label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-400 font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                          <span className="flex items-center gap-1">
                            <span>Authenticating</span>
                            <span className="inline-flex gap-0.5 ml-0.5">
                              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                              <span className="w-1 h-1 rounded-full bg-white animate-pulse delay-150" />
                              <span className="w-1 h-1 rounded-full bg-white animate-pulse delay-300" />
                            </span>
                          </span>
                        </>
                      ) : isLogin ? (
                        'Sign In'
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
