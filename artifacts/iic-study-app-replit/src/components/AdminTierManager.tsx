import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { SystemSettings } from '../types';
import { DEFAULT_TIER_FEATURES, TierFeature } from '../utils/tierConfig';

interface Props {
  settings: SystemSettings;
  onUpdateSettings: (s: SystemSettings) => void;
  onBack: () => void;
}

export const AdminTierManager: React.FC<Props> = ({ settings, onUpdateSettings, onBack }) => {
  const [features, setFeatures] = useState<TierFeature[]>(() => settings.tierFeatures || DEFAULT_TIER_FEATURES);
  
  const handleSave = () => {
    onUpdateSettings({ ...settings, tierFeatures: features });
    alert('Tier features updated successfully!');
  };

  const handleReset = () => {
    if(window.confirm('Reset to default features?')) {
      setFeatures(DEFAULT_TIER_FEATURES);
    }
  };

  const updateFeature = (id: string, field: keyof TierFeature, value: any) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const addNew = () => {
    const newId = `custom_${Date.now()}`;
    setFeatures([...features, { id: newId, category: 'Custom', label: 'New Feature', free: '✗', basic: '✓', ultra: '✓' }]);
  };

  const removeFeature = (id: string) => {
    setFeatures(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200">
            <ArrowLeft size={20} />
          </button>
          <h3 className="text-xl font-black text-slate-800">Tier Manager</h3>
        </div>
        <div className="flex gap-2">
            <button onClick={handleReset} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-sm">Reset Defaults</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm"><Save size={16}/> Save Changes</button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                <th className="p-3 border-b">Category</th>
                <th className="p-3 border-b min-w-[200px]">Feature Label</th>
                <th className="p-3 border-b text-center">Free</th>
                <th className="p-3 border-b text-center">Basic</th>
                <th className="p-3 border-b text-center">Ultra</th>
                <th className="p-3 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, idx) => (
                <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-2"><input value={f.category} onChange={e => updateFeature(f.id, 'category', e.target.value)} className="w-full p-2 border rounded text-xs bg-transparent" /></td>
                  <td className="p-2 flex items-center gap-1">
                    <input type="checkbox" checked={f.isSubItem || false} onChange={e => updateFeature(f.id, 'isIndent', e.target.checked)} title="Indent row" />
                    <input value={f.name} onChange={e => updateFeature(f.id, 'label', e.target.value)} className="w-full p-2 border rounded text-xs bg-transparent font-bold" />
                  </td>
                  <td className="p-2"><input value={f.free} onChange={e => updateFeature(f.id, 'free', e.target.value)} className="w-full p-2 border rounded text-xs bg-transparent text-center" /></td>
                  <td className="p-2"><input value={f.basic} onChange={e => updateFeature(f.id, 'basic', e.target.value)} className="w-full p-2 border rounded text-xs bg-transparent text-center" /></td>
                  <td className="p-2"><input value={f.ultra} onChange={e => updateFeature(f.id, 'ultra', e.target.value)} className="w-full p-2 border rounded text-xs bg-transparent text-center" /></td>
                  <td className="p-2 text-center">
                    <button onClick={() => removeFeature(f.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-center">
          <button onClick={addNew} className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100">
            <Plus size={16}/> Add Custom Feature Row
          </button>
        </div>
      </div>
    </div>
  );
};
