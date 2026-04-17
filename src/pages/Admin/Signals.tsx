import React, { useEffect, useState } from 'react';
import { MarketSignal } from '../../types';
import { fetchSignals, saveSignals } from '../../services/adminService';
import { Plus, Trash2, Save, MoveUp, MoveDown, AlertCircle } from 'lucide-react';

export default function AdminSignals() {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSignals()
      .then(setSignals)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const success = await saveSignals(signals);
      if (success) {
        setMessage({ type: 'success', text: '방향 신호가 성공적으로 저장되었습니다.' });
      } else {
        setMessage({ type: 'error', text: '저장에 실패했습니다.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const addSignal = () => {
    const newSignal: MarketSignal = {
      id: `signal-${Date.now()}`,
      title: '새로운 시장 신호',
      summary: '해석 내용을 입력하세요.',
      bullets: ['영향 변수 1'],
      linked_hub: '',
      linked_flow_step: 1,
      linked_slug: '',
      status: 'inactive',
      order: signals.length + 1
    };
    setSignals([...signals, newSignal]);
  };

  const removeSignal = (id: string) => {
    setSignals(signals.filter(s => s.id !== id));
  };

  const updateSignal = (id: string, updates: Partial<MarketSignal>) => {
    setSignals(signals.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const move = (index: number, direction: 'up' | 'down') => {
    const newSignals = [...signals];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= signals.length) return;
    
    [newSignals[index], newSignals[targetIndex]] = [newSignals[targetIndex], newSignals[index]];
    
    // Update orders
    const ordered = newSignals.map((s, i) => ({ ...s, order: i + 1 }));
    setSignals(ordered);
  };

  if (loading) return <div className="p-8">Loading signals...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Global Signals Management</h1>
          <p className="text-sm text-gray-500 font-medium">메인 페이지 HERO 섹션 하단에 노출되는 시장 판단 지표를 관리합니다.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={addSignal}
            className="bg-gray-100 text-gray-900 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <Plus size={16} /> 신규 추가
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white font-black px-6 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? '저장 중...' : '모두 저장'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          <AlertCircle size={20} />
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {signals.sort((a, b) => a.order - b.order).map((signal, index) => (
          <div key={signal.id} className={`bg-white border rounded-[24px] overflow-hidden shadow-sm transition-all ${signal.status === 'inactive' ? 'opacity-60 grayscale' : 'border-gray-100'}`}>
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-gray-400">#{signal.order}</span>
                <input 
                  type="text" 
                  value={signal.title}
                  onChange={(e) => updateSignal(signal.id, { title: e.target.value })}
                  className="bg-transparent border-none font-black text-gray-900 focus:ring-0 w-64 uppercase tracking-tight"
                  placeholder="신호 제목"
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => move(index, 'up')} className="p-1.5 text-gray-400 hover:text-gray-900"><MoveUp size={16} /></button>
                <button onClick={() => move(index, 'down')} className="p-1.5 text-gray-400 hover:text-gray-900"><MoveDown size={16} /></button>
                <div className="h-4 w-px bg-gray-200 mx-2"></div>
                <button onClick={() => removeSignal(signal.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">상세 해석 (Summary)</label>
                  <textarea 
                    value={signal.summary}
                    onChange={(e) => updateSignal(signal.id, { summary: e.target.value })}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm font-medium p-3 focus:ring-primary focus:border-primary"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">영향 변수 (Bullets, 줄바꿈으로 구분)</label>
                  <textarea 
                    value={signal.bullets.join('\n')}
                    onChange={(e) => updateSignal(signal.id, { bullets: e.target.value.split('\n').filter(b => b.trim()) })}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm font-bold p-3 focus:ring-primary focus:border-primary"
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Linked Hub</label>
                    <select 
                      value={signal.linked_hub}
                      onChange={(e) => updateSignal(signal.id, { linked_hub: e.target.value })}
                      className="w-full bg-white border-gray-100 rounded-xl text-xs font-bold p-2.5"
                    >
                      <option value="">HUB 선택</option>
                      <option value="exchange-rate">Exchange Rate (환율)</option>
                      <option value="interest-rate">Interest Rate (금리)</option>
                      <option value="etf">ETF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Linked Flow Step</label>
                    <input 
                      type="number" 
                      value={signal.linked_flow_step}
                      onChange={(e) => updateSignal(signal.id, { linked_flow_step: Number(e.target.value) })}
                      className="w-full bg-white border-gray-100 rounded-xl text-xs font-bold p-2.5"
                      min={1}
                      max={5}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Direct Slug Link (Optional)</label>
                  <input 
                    type="text" 
                    value={signal.linked_slug}
                    onChange={(e) => updateSignal(signal.id, { linked_slug: e.target.value })}
                    className="w-full bg-white border-gray-100 rounded-xl text-xs font-bold p-2.5"
                    placeholder="예: dollar-strength-logic"
                  />
                </div>

                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`active-${signal.id}`}
                      checked={signal.status === 'active'}
                      onChange={(e) => updateSignal(signal.id, { status: e.target.checked ? 'active' : 'inactive' })}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <label htmlFor={`active-${signal.id}`} className="text-xs font-black text-gray-700 uppercase">Active Status</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {signals.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-[32px]">
            <p className="text-gray-400 font-bold italic">등록된 시장 신호가 없습니다. 새 신호를 추가해 주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
