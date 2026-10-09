import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DEMO_PERSONAS } from '../../lib/constants.ts';
import { ShieldCheck, HardHat, ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoPersonaSwitcher: React.FC = () => {
  const { role, profile, switchDemoPersona } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelectRole = (targetRole: 'admin_inspector' | 'contractor') => {
    switchDemoPersona(targetRole);
    setIsOpen(false);
    if (targetRole === 'admin_inspector') {
      navigate('/admin/dashboard');
    } else {
      navigate('/contractor/dashboard');
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 text-slate-200 transition-all shadow-sm"
        title="Toggle Demo Persona"
      >
        <span className="flex items-center gap-1.5">
          {role === 'admin_inspector' ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Inspector
            </span>
          ) : (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <HardHat className="w-3.5 h-3.5" />
              Contractor
            </span>
          )}
          <span className="hidden md:inline text-slate-300 font-medium truncate max-w-[140px]">
            {profile?.full_name?.split(' ')[0] || 'User'}
          </span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 focus:outline-none">
            <div className="px-3 py-2 border-b border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Switch Demo Persona
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Instant role testing for hackathon review
              </p>
            </div>

            <div className="mt-1 space-y-1">
              <button
                onClick={() => handleSelectRole('admin_inspector')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                  role === 'admin_inspector'
                    ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200'
                    : 'hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      {DEMO_PERSONAS.admin_inspector.full_name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Inspector / Admin Role
                    </div>
                  </div>
                </div>
                {role === 'admin_inspector' && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </button>

              <button
                onClick={() => handleSelectRole('contractor')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                  role === 'contractor'
                    ? 'bg-amber-600/20 border border-amber-500/40 text-amber-200'
                    : 'hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
                    <HardHat className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      {DEMO_PERSONAS.contractor.full_name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Contractor / Site Manager
                    </div>
                  </div>
                </div>
                {role === 'contractor' && (
                  <Check className="w-4 h-4 text-amber-400" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
