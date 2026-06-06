import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../api';
import { useAuthStore } from '../../store';
import { Button } from '../../components/forms/Button';
import { Input } from '../../components/forms/Input';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const loginMutation = useMutation({
    mutationFn: () => api.login(username, password),
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate('/');
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

  const handleQuickLogin = async (userStr: string, passStr: string) => {
    setError('');
    try {
      const data = await api.login(userStr, passStr);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError('Quick login failed');
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-card border border-border/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold text-xl mb-6 mx-auto">
        VQ
      </div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
        <p className="text-sm text-muted-foreground mt-1">Access VQ Leads CRM Portal</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-lg mb-5 text-xs text-left">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-semibold text-foreground">Username</label>
          <Input 
            type="text" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-semibold text-foreground">Password</label>
          <Input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
        </div>
        <Button type="submit" className="w-full mt-2" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-8 border-t border-border/40 pt-6">
        <div className="text-left text-[11px] font-bold text-foreground uppercase tracking-wider mb-3">
          Quick Demo Login
        </div>
        <div className="flex flex-col gap-2">
          <button 
            type="button"
            className="flex justify-between items-center text-left text-xs bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40 hover:border-border p-2.5 rounded-lg transition-all"
            onClick={() => handleQuickLogin('admin', 'admin123')}
          >
            <span className="font-semibold text-foreground">Sarah Conner (Admin)</span>
            <span className="opacity-60 font-mono">admin</span>
          </button>
          <button 
            type="button"
            className="flex justify-between items-center text-left text-xs bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40 hover:border-border p-2.5 rounded-lg transition-all"
            onClick={() => handleQuickLogin('agent1', 'agent123')}
          >
            <span className="font-semibold text-foreground">Alice Smith (Agent - 8.5%)</span>
            <span className="opacity-60 font-mono">agent1</span>
          </button>
          <button 
            type="button"
            className="flex justify-between items-center text-left text-xs bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40 hover:border-border p-2.5 rounded-lg transition-all"
            onClick={() => handleQuickLogin('agent2', 'agent123')}
          >
            <span className="font-semibold text-foreground">Bob Jones (Agent - 12.0%)</span>
            <span className="opacity-60 font-mono">agent2</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Login;
