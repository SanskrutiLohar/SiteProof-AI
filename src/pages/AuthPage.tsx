import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { DEMO_PERSONAS } from '../lib/constants.ts';
import { UserRole } from '../types/index.ts';
import { 
  ShieldCheck, 
  HardHat, 
  ArrowRight, 
  Sparkles,
  Lock,
  Mail,
  User,
  Building,
  Camera,
  FileSpreadsheet,
  CheckCircle2,
  Cpu,
  FileCheck2,
  Printer
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

  const { profile, role, signIn, signUp, switchDemoPersona } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to corresponding dashboard
  if (profile) {
    return <Navigate to={role === 'admin_inspector' ? '/admin/dashboard' : '/contractor/dashboard'} replace />;
  }

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
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden bg-slate-950">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-6xl z-10 space-y-10 my-auto">
        {/* Top Header & Platform Tagline */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-bold shadow-glow-brand">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>SiteProof AI • Next-Gen Infrastructure Audit Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            AI-Assisted Construction Milestone <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400 bg-clip-text text-transparent">
              Verification & Discrepancy Auditing
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate ghost billing, verify physical construction progress with Multimodal Vision AI, extract challans & invoices via OCR, and enforce cryptographic data integrity.
          </p>
        </div>

        {/* 2-Column Showcase & Login Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Platform Overview & Beginner Workflow Guide (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Core Workflow Steps */}
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  How SiteProof AI Works
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  Beginner Guide
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    Site Capture
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Contractors capture live site photos stamped with GPS & timestamp, uploading delivery challans.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Gemini 3.8 VLM
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Multimodal Vision AI inspects rebar & staging; OCR reconciles bills 3-way against BOQ.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Certified Sign-off
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Lead Inspectors review discrepancy flags, execute digital signatures, and generate PDF certificates.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Feature Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Live Viewfinder</h4>
                  <p className="text-[10px] text-slate-400">GPS & timestamp watermark</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">BOQ OCR Intake</h4>
                  <p className="text-[10px] text-slate-400">Auto-parse quotations</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Duplicate Shield</h4>
                  <p className="text-[10px] text-slate-400">SHA-256 & dHash checks</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Gemini 3.8 VLM</h4>
                  <p className="text-[10px] text-slate-400">Structural stage detection</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">3-Way Matching</h4>
                  <p className="text-[10px] text-slate-400">BOQ vs Challan vs Bill</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">PDF Certificates</h4>
                  <p className="text-[10px] text-slate-400">Official audit reports</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 1-Click Role Sandbox & Sign In Form (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Quick Demo Role Switcher */}
            <div className="p-5 rounded-2xl glass-panel border border-blue-500/30 bg-blue-950/20 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  1-Click Role Sandbox
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                  Instant Test
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Choose a role to test the platform instantly:
              </p>

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

            {/* Standard Authentication Form */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex border-b border-slate-800 pb-3">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition-all ${
                    isLogin
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In with Password
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition-all ${
                    !isLogin
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Register Account
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. David Vance"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Organization
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="e.g. National Infrastructure Board"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Account Role
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRole('admin_inspector')}
                          className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            selectedRole === 'admin_inspector'
                              ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Inspector
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('contractor')}
                          className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            selectedRole === 'contractor'
                              ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <HardHat className="w-3.5 h-3.5" /> Contractor
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'admin_inspector' ? 'inspector@siteproof.ai' : 'sitelead@buildcorp.com'}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-400 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 hover:scale-101 disabled:opacity-50"
                >
                  {submitting ? 'Authenticating...' : isLogin ? 'Sign In to Workspace' : 'Create & Launch Account'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
