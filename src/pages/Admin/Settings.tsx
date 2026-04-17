import React from 'react';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">System Settings</h1>
        <p className="text-gray-500 font-medium">Core configuration and security management.</p>
      </header>

      <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-50 font-black text-gray-900 text-sm flex items-center gap-2 uppercase tracking-widest">
          <Shield size={18} className="text-primary" /> Authentication Schema
        </div>
        <div className="p-10 space-y-6">
          <div className="flex items-center gap-4 p-6 bg-green-50/50 rounded-2xl border border-green-100">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <div className="text-sm font-black text-gray-900 uppercase tracking-tighter">Firebase Federated Auth Active</div>
              <p className="text-xs text-gray-500 font-medium">관리자 인증이 Google OAuth 2.0 및 Firebase Federated Auth로 통합되었습니다.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Authorized Administrator</div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-mono text-sm text-gray-700">
              luganopizza@gmail.com
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed font-medium">
            비밀번호 기반의 레거시 인증 방식은 보안 강화를 위해 비활성화되었습니다. 관리자 권한 변경이 필요한 경우 서버 측의 화이트리스트 설정을 수정해야 합니다.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-[24px] p-6 flex gap-4">
        <AlertCircle className="text-primary flex-shrink-0" size={24} />
        <div>
          <div className="text-sm font-black text-gray-900 uppercase tracking-tighter mb-1">Operational Notice</div>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            현재 인스턴스는 'luganopizza@gmail.com' 이메일 소유자에게만 모든 관리 권한을 허용하도록 설계되었습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
