import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../api';
import { useAuthStore } from '../../store';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';
import { Shield, Users, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [roleTab, setRoleTab] = useState<'agent' | 'admin'>('agent');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [agentUsername, setAgentUsername] = useState('agent1');
  const [agentPassword, setAgentPassword] = useState('agent123');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showAgentPassword, setShowAgentPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  // Clear error on tab switch
  useEffect(() => {
    setError('');
  }, [roleTab]);

  // Get active credentials based on current tab
  const getCredentials = () => {
    if (roleTab === 'admin') {
      return { username: adminUsername, password: adminPassword };
    }
    return { username: agentUsername, password: agentPassword };
  };

  const loginMutation = useMutation({
    mutationFn: () => {
      const { username, password } = getCredentials();
      return api.login(username, password);
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate('/dashboard');
    },
    onError: (err: any) => {
      setError(err.message || 'Invalid credentials');
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  };

  const handleForgotPassword = () => {
    alert('Please contact your administrator to reset your password.');
  };

  return (
    <div className="relative w-full max-w-[920px] mx-auto z-10 p-2">
      {/* Floating Ambient Glowing Blobs in Background */}
      <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-primary/15 blur-3xl animate-float-slow -z-10 pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl animate-float-slower -z-10 pointer-events-none" />

      {/* Main Split-Pane Login Container */}
      <div className="w-full bg-card/90 border border-border/50 rounded-3xl min-h-[580px] overflow-hidden shadow-2xl backdrop-blur-xl animate-fade-in-up flex relative">
        
        {/* ==================== SLIDING OVERLAY PANEL (Vibrant Model) ==================== */}
        <div 
          className="hidden md:flex absolute top-0 bottom-0 w-[48%] bg-gradient-to-tr from-primary to-indigo-600 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] z-20 flex-col justify-center items-center text-center p-12 overflow-hidden select-none text-white"
          style={{
            left: roleTab === 'agent' ? '0%' : '52%'
          }}
        >
          {/* Subtle overlay elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white font-black text-xl backdrop-blur-md border border-white/20">
              ❖
            </div>

            {roleTab === 'agent' ? (
              <div key="agent-welcome" className="animate-fade-in flex flex-col items-center gap-3">
                <h2 className="text-3xl font-extrabold tracking-tight">Hello Admin!</h2>
                <p className="text-sm text-white/80 leading-relaxed">Access configurations, team boards, form builders, and audit logs.</p>
                <button
                  type="button"
                  onClick={() => setRoleTab('admin')}
                  className="mt-6 px-8 py-3 rounded-full border-2 border-white/60 hover:border-white bg-transparent hover:bg-white hover:text-primary font-bold text-xs tracking-wider uppercase transition-all duration-300 active:scale-95 cursor-pointer shadow-md"
                >
                  Admin Console
                </button>
              </div>
            ) : (
              <div key="admin-welcome" className="animate-fade-in flex flex-col items-center gap-3">
                <h2 className="text-3xl font-extrabold tracking-tight">Hello Agent!</h2>
                <p className="text-sm text-white/80 leading-relaxed">Sign in to view your leads pipeline, log calls, and claim new leads.</p>
                <button
                  type="button"
                  onClick={() => setRoleTab('agent')}
                  className="mt-6 px-8 py-3 rounded-full border-2 border-white/60 hover:border-white bg-transparent hover:bg-white hover:text-primary font-bold text-xs tracking-wider uppercase transition-all duration-300 active:scale-95 cursor-pointer shadow-md"
                >
                  Agent Portal
                </button>
              </div>
            )}
          </div>
        </div>


        {/* ==================== LEFT COLUMN: ADMIN LOGIN FORM ==================== */}
        <div 
          className={`w-full md:w-[52%] flex flex-col justify-center p-8 md:p-10 transition-opacity duration-300 ${
            roleTab === 'admin' ? 'opacity-100 z-10 animate-fade-in' : 'opacity-0 md:opacity-20 z-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col items-center md:items-start text-center md:text-left mb-6">
            <Shield className="text-primary mb-2" size={32} />
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Admin Sign In</h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Log in with system administrator credentials</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Username</label>
              <Input 
                type="text" 
                value={adminUsername} 
                onChange={e => setAdminUsername(e.target.value)} 
                required 
                className="bg-card/50 focus:bg-card hover:border-border/80 transition-all text-sm h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  required
                  className="bg-card/50 focus:bg-card hover:border-border/80 transition-all text-sm h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                >
                  {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-xs text-left font-semibold">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full mt-2 h-11 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/35 active:scale-[0.98] transition-all" 
              disabled={loginMutation.isPending}
            >
              <span>{loginMutation.isPending ? 'Authenticating...' : 'Sign In Admin'}</span>
              <ArrowRight size={15} />
            </Button>
          </form>

          {/* Footer actions */}
          <div className="mt-6 border-t border-border/40 pt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-primary font-bold hover:underline text-left cursor-pointer"
            >
              Forgot Password?
            </button>
            <button 
              type="button"
              className="md:hidden text-xs text-primary font-bold hover:underline text-center mt-2 cursor-pointer"
              onClick={() => setRoleTab('agent')}
            >
              ← Back to Agent Portal Login
            </button>
          </div>
        </div>


        {/* ==================== RIGHT COLUMN: AGENT LOGIN FORM ==================== */}
        <div 
          className={`w-full md:w-[52%] ml-auto flex flex-col justify-center p-8 md:p-10 transition-opacity duration-300 ${
            roleTab === 'agent' ? 'opacity-100 z-10 animate-fade-in' : 'opacity-0 md:opacity-20 z-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col items-center md:items-start text-center md:text-left mb-6">
            <Users className="text-primary mb-2" size={32} />
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Agent Sign In</h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Log in with sales representative credentials</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Username</label>
              <Input 
                type="text" 
                value={agentUsername} 
                onChange={e => setAgentUsername(e.target.value)} 
                required 
                className="bg-card/50 focus:bg-card hover:border-border/80 transition-all text-sm h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showAgentPassword ? 'text' : 'password'}
                  value={agentPassword}
                  onChange={e => setAgentPassword(e.target.value)}
                  required
                  className="bg-card/50 focus:bg-card hover:border-border/80 transition-all text-sm h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAgentPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showAgentPassword ? 'Hide password' : 'Show password'}
                >
                  {showAgentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-xs text-left font-semibold">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full mt-2 h-11 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/35 active:scale-[0.98] transition-all" 
              disabled={loginMutation.isPending}
            >
              <span>{loginMutation.isPending ? 'Authenticating...' : 'Sign In Agent'}</span>
              <ArrowRight size={15} />
            </Button>
          </form>

          {/* Footer actions */}
          <div className="mt-6 border-t border-border/40 pt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-primary font-bold hover:underline text-left cursor-pointer"
            >
              Forgot Password?
            </button>
            <button 
              type="button"
              className="md:hidden text-xs text-primary font-bold hover:underline text-center mt-3 cursor-pointer"
              onClick={() => setRoleTab('admin')}
            >
              Access Admin Console Portal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
