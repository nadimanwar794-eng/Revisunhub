import React from 'react';
import { X, Check, Lock, AlertTriangle, Crown, List, Shield, Zap } from 'lucide-react';
import { SystemSettings } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings?: SystemSettings;
  discountActive?: boolean;
}

const DEFAULT_MATRIX = [
    {
        name: 'Core Features',
        features: [
            { name: 'PDF Notes Library', free: 'First 2 Chapters', basic: '✅ Unlimited', ultra: '✅ Unlimited' },
            { name: 'Video Lectures', free: 'First 2 Videos', basic: '✅ Unlimited', ultra: '✅ Unlimited' },
            { name: 'Topic-wise Notes', free: '🔒 Locked', basic: '✅ Full Access', ultra: '✅ Full Access' },
            { name: 'Audio / Podcast', free: '🔒 Locked', basic: '🔒 Locked', ultra: '✅ Premium Only' },
            { name: 'Search Capability', free: 'Basic', basic: 'Advanced', ultra: 'Advanced' },
        ]
    },
    {
        name: 'Revision Hub (USP)',
        features: [
            { name: 'Revision Hub Access', free: '🔒 Locked', basic: '⚠️ 1 Day/Week', ultra: '✅ Daily' },
            { name: 'Weak/Strong Sorting', free: '❌', basic: '❌', ultra: '✅ Yes' },
            { name: 'Mistake Analysis', free: '❌', basic: '❌', ultra: '✅ Yes' },
        ]
    },
    {
        name: 'MCQ System',
        features: [
            { name: 'Daily MCQ Limit', free: '30 Questions', basic: '50 Questions', ultra: '100 Questions' },
            { name: 'Detailed Solutions', free: 'Right/Wrong Only', basic: 'Text Solution', ultra: 'AI Explanation' },
        ]
    }
];

export const FeatureMatrixModal: React.FC<Props> = ({ isOpen, onClose, settings, discountActive }) => {
  if (!isOpen) return null;

  // Use default matrix if settings.planComparison is missing OR empty
  const matrix = (settings?.planComparison && settings.planComparison.length > 0)
                 ? settings.planComparison
                 : DEFAULT_MATRIX;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-center shrink-0 relative overflow-hidden">
            {discountActive && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-red-900 text-xs font-black px-4 py-1 transform rotate-45 translate-x-4 translate-y-2 shadow-lg animate-pulse">
                    FLAME SALE ACTIVE!
                </div>
            )}
            <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Crown className="text-yellow-400 fill-yellow-400" /> Premium Membership Tiers
                </h2>
                <p className="text-slate-400 text-sm">Compare features and choose the best plan for your success.</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {matrix.map((category, idx) => (
                <div key={idx} className="space-y-4">
                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-wide border-l-4 border-indigo-500 pl-3">
                        {category.name}
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4 w-1/3">Feature</th>
                                    <th className="p-4 text-center w-1/5 bg-slate-100/50">Free (Trial)</th>
                                    <th className="p-4 text-center w-1/5 bg-blue-50/50 text-blue-700">Basic (Reader)</th>
                                    <th className="p-4 text-center w-1/5 bg-purple-50/50 text-purple-700">Ultra (VIP)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {category.features.map((feat, fIdx) => (
                                    <tr key={fIdx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-bold text-slate-700">{feat.name}</td>
                                        <td className="p-4 text-center font-medium text-slate-600 bg-slate-50/30">
                                            {feat.free.includes('✅') ? <span className="text-green-600 font-bold">{feat.free}</span> :
                                             feat.free.includes('❌') || feat.free.includes('🔒') ? <span className="text-slate-400">{feat.free}</span> :
                                             feat.free}
                                        </td>
                                        <td className="p-4 text-center font-bold text-blue-600 bg-blue-50/20">
                                            {feat.basic.includes('✅') ? <span className="text-blue-700">{feat.basic}</span> :
                                             feat.basic.includes('⚠️') ? <span className="text-orange-500">{feat.basic}</span> :
                                             feat.basic}
                                        </td>
                                        <td className="p-4 text-center font-black text-purple-600 bg-purple-50/20 relative overflow-hidden">
                                            {/* GLOW EFFECT FOR ULTRA */}
                                            {/* <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/20 to-transparent animate-shimmer"></div> */}
                                            {feat.ultra}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400 shrink-0">
            * Features and limits are subject to change by the administrator.
        </div>
      </div>
    </div>
  );
};
