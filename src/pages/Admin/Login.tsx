import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/adminService';
import { Shield, Key, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await login(password);
    if (success) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid password. Access denied.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6 shadow-2xl">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase">Restricted Access</h1>
          <p className="text-gray-500 font-medium tracking-tight">System authentication required to proceed.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="System Password"
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-all font-medium"
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-3 rounded-lg text-center uppercase tracking-widest">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-950 font-black py-4 rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS DASHBOARD'} 
            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-12 flex flex-col items-center gap-2">
           <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">ROBO-ADVISOR CORE</div>
           <div className="text-[9px] text-gray-700">v1.0.4 - Secure Instance</div>
        </div>
      </div>
    </div>
  );
}
