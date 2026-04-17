import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/adminService';
import { signInWithGoogle } from '../../firebase';
import { Shield, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const user = await signInWithGoogle();
      const idToken = await user.getIdToken();
      
      console.log(`[CLIENT AUTH] UID: ${user.uid}, EMAIL: ${user.email}`);
      
      const success = await login(idToken);
      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Unauthorized email. Access denied.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-950 font-black py-4 rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
          >
            {loading ? (
              'AUTHENTICATING...'
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
                SIGN IN WITH GOOGLE
              </>
            )}
            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-3 rounded-lg text-center uppercase tracking-widest leading-relaxed">
              {error}
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-2">
           <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">ROBO-ADVISOR CORE</div>
           <div className="text-[9px] text-gray-700">v1.1.0 - Firebase Federated Instance</div>
        </div>
      </div>
    </div>
  );
}
