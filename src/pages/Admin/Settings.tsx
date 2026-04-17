import React, { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { updatePassword as updatePassService } from '../../services/adminService';

export default function AdminSettings() {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwords.new.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    const success = await updatePassService(passwords.current, passwords.new);
    if (success) {
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswords({ current: '', new: '', confirm: '' });
    } else {
      setMessage({ type: 'error', text: 'Failed to update password. Current password may be incorrect.' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-text-main">Settings</h1>

      <div className="bg-white border border-border rounded-lg shadow-sm">
        <div className="p-4 border-b border-border font-bold text-text-main text-sm flex items-center gap-2">
          <Shield size={16} className="text-accent" /> System Authentication
        </div>
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Current System Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg outline-none focus:border-accent"
              value={passwords.current}
              onChange={(e) => setPasswords({...passwords, current: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">New Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg outline-none focus:border-accent"
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Confirm New Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 bg-gray-50 border border-border rounded-lg outline-none focus:border-accent"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                required
              />
            </div>
          </div>

          {message.text && (
            <div className={`p-3 rounded-lg text-xs font-bold uppercase tracking-wider ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message.text}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'UPDATING...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-gray-400 flex-shrink-0" size={20} />
        <div>
          <div className="text-sm font-bold text-gray-800">Operational Notice</div>
          <p className="text-xs text-gray-500 leading-relaxed">
            비밀번호 변경 시 즉시 서버 DB에 반영되며, 다음 로그인부터 새로운 비밀번호가 적용됩니다. 분실 시 서버 환경변수 리셋이 필요합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
