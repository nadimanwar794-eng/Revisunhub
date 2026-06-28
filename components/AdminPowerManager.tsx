import React, { useState } from 'react';
import { SystemSettings, SubscriptionPlan } from '../types';
import { Save, RefreshCw, Zap, CheckCircle, List, Trash2, Plus, Info, DollarSign, Eye, EyeOff, Package, CreditCard, LayoutGrid, X, Layout } from 'lucide-react';

interface Props {
    settings: SystemSettings;
    onUpdate: (s: SystemSettings) => void;
}

export const AdminPowerManager: React.FC<Props> = ({ settings, onUpdate }) => {
    const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
    const [activeTab, setActiveTab] = useState<'LIMITS' | 'PRICING' | 'VISIBILITY' | 'PLAN_MATRIX' | 'PACKAGES'>('LIMITS');

    const handleSave = () => {
        onUpdate(localSettings);
        alert("Settings Saved!");
    };

    const updateSetting = (key: string, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const togglePermission = (tier: 'FREE' | 'BASIC' | 'ULTRA', featureId: string) => {
        const current = localSettings.tierPermissions?.[tier] || [];
        const updated = current.includes(featureId)
            ? current.filter(id => id !== featureId)
            : [...current, featureId];

        setLocalSettings(prev => ({
            ...prev,
            tierPermissions: {
                ...prev.tierPermissions,
                [tier]: updated
            } as any
        }));
    };

    const toggleDashboardSection = (id: string) => {
        const currentLayout = localSettings.dashboardLayout || {};
        // @ts-ignore
        const currentConfig = currentLayout[id] || { id: id, visible: true };
        // @ts-ignore
        const isVisible = currentConfig.visible !== false;

        const newLayout = {
            ...currentLayout,
            [id]: { ...currentConfig, visible: !isVisible }
        };
        updateSetting('dashboardLayout', newLayout);
    };

    // Helper for "Spreadsheet Row"
    const GridRow = ({ label, free, basic, ultra, type = 'text', onChangeFree, onChangeBasic, onChangeUltra }: any) => (
        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
            <td className="p-3 font-bold text-slate-700 text-xs border-r border-slate-100">{label}</td>
            <td className="p-1 border-r border-slate-100">
                {type === 'checkbox' ? (
                    <div className="flex justify-center"><input type="checkbox" checked={free} onChange={e => onChangeFree(e.target.checked)} className="w-4 h-4 accent-slate-600" /></div>
                ) : (
                    <input type={type} className="w-full h-full bg-transparent text-center text-xs outline-none focus:bg-white focus:ring-1 ring-blue-200 rounded" value={free} onChange={e => onChangeFree(e.target.value)} />
                )}
            </td>
            <td className="p-1 border-r border-slate-100 bg-blue-50/10">
                {type === 'checkbox' ? (
                    <div className="flex justify-center"><input type="checkbox" checked={basic} onChange={e => onChangeBasic(e.target.checked)} className="w-4 h-4 accent-blue-600" /></div>
                ) : (
                     <input type={type} className="w-full h-full bg-transparent text-center text-xs font-bold text-blue-700 outline-none focus:bg-white focus:ring-1 ring-blue-200 rounded" value={basic} onChange={e => onChangeBasic(e.target.value)} />
                )}
            </td>
            <td className="p-1 bg-purple-50/10">
                 {type === 'checkbox' ? (
                    <div className="flex justify-center"><input type="checkbox" checked={ultra} onChange={e => onChangeUltra(e.target.checked)} className="w-4 h-4 accent-purple-600" /></div>
                ) : (
                    <input type={type} className="w-full h-full bg-transparent text-center text-xs font-black text-purple-700 outline-none focus:bg-white focus:ring-1 ring-purple-200 rounded" value={ultra} onChange={e => onChangeUltra(e.target.value)} />
                )}
            </td>
        </tr>
    );

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Zap className="text-amber-500" /> App Power Center
                </h3>
                <div className="ml-auto flex gap-2">
                    <button onClick={() => {
                        setLocalSettings({...localSettings, forceRefreshTimestamp: Date.now().toString()});
                        alert("Force Refresh Triggered! Users will reload on next sync.");
                    }} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-200 flex items-center gap-2">
                        <RefreshCw size={14} /> Force Update
                    </button>
                    <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-green-700 flex items-center gap-2">
                        <Save size={18} /> Save Config
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="flex flex-wrap gap-2 mb-6 bg-slate-100 p-1.5 rounded-xl w-fit">
                {[
                    { id: 'LIMITS', icon: LayoutGrid, label: 'Limits & Access' },
                    { id: 'PRICING', icon: DollarSign, label: 'Pricing & Costs' },
                    { id: 'VISIBILITY', icon: Eye, label: 'Visibility' },
                    { id: 'PLAN_MATRIX', icon: List, label: 'Plan Matrix' },
                    { id: 'PACKAGES', icon: Package, label: 'Credit Packages' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB 1: LIMITS (GRID VIEW) */}
            {activeTab === 'LIMITS' && (
                <div className="space-y-6">
                    <div className="border rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                            <h4 className="font-bold text-sm text-slate-700">Feature Access & Limits Grid</h4>
                            <span className="text-[10px] text-slate-400 font-mono bg-white px-2 py-1 rounded border">Live Config</span>
                        </div>
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3 w-1/3 border-r border-slate-200">Feature / Constraint</th>
                                    <th className="p-3 w-1/5 text-center border-r border-slate-200">Free Tier</th>
                                    <th className="p-3 w-1/5 text-center border-r border-slate-200 text-blue-600">Basic Tier</th>
                                    <th className="p-3 w-1/5 text-center text-purple-600">Ultra Tier</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {/* LIMITS */}
                                <GridRow
                                    label="Daily MCQ Limit (Count)"
                                    type="number"
                                    free={localSettings.mcqLimitFree ?? 30}
                                    basic={localSettings.mcqLimitBasic ?? 50}
                                    ultra={localSettings.mcqLimitUltra ?? 100}
                                    onChangeFree={(v: any) => updateSetting('mcqLimitFree', Number(v))}
                                    onChangeBasic={(v: any) => updateSetting('mcqLimitBasic', Number(v))}
                                    onChangeUltra={(v: any) => updateSetting('mcqLimitUltra', Number(v))}
                                />
                                <GridRow
                                    label="Daily Spin Limit (Count)"
                                    type="number"
                                    free={localSettings.spinLimitFree ?? 2}
                                    basic={localSettings.spinLimitBasic ?? 5}
                                    ultra={localSettings.spinLimitUltra ?? 10}
                                    onChangeFree={(v: any) => updateSetting('spinLimitFree', Number(v))}
                                    onChangeBasic={(v: any) => updateSetting('spinLimitBasic', Number(v))}
                                    onChangeUltra={(v: any) => updateSetting('spinLimitUltra', Number(v))}
                                />

                                {/* PERMISSIONS (CHECKBOXES) */}
                                {[
                                    { id: 'NOTES_ACCESS', label: 'PDF Notes Access' },
                                    { id: 'VIDEO_ACCESS', label: 'Video Lectures Access' },
                                    { id: 'AUDIO_ACCESS', label: 'Audio / Podcast Access' },
                                    { id: 'MCQ_PRACTICE', label: 'MCQ Practice Mode' },
                                    { id: 'MCQ_TEST', label: 'MCQ Test Mode' },
                                    { id: 'REVISION_HUB', label: 'Revision Hub Access' },
                                    { id: 'AI_CHAT', label: 'AI Tutor Chat' },
                                    { id: 'DOWNLOAD', label: 'Offline Downloads' },
                                    { id: 'NO_ADS', label: 'Ad-Free Experience' },
                                ].map(feat => (
                                    <GridRow
                                        key={feat.id}
                                        label={feat.label}
                                        type="checkbox"
                                        free={localSettings.tierPermissions?.FREE?.includes(feat.id)}
                                        basic={localSettings.tierPermissions?.BASIC?.includes(feat.id)}
                                        ultra={localSettings.tierPermissions?.ULTRA?.includes(feat.id)}
                                        onChangeFree={() => togglePermission('FREE', feat.id)}
                                        onChangeBasic={() => togglePermission('BASIC', feat.id)}
                                        onChangeUltra={() => togglePermission('ULTRA', feat.id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: PRICING */}
            {activeTab === 'PRICING' && (
                <div className="space-y-6">
                    {/* GLOBAL COSTS */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><DollarSign size={16} /> Content Credit Costs (0 = Free)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {[
                                { key: 'defaultPdfCost', label: 'PDF Access', default: 5 },
                                { key: 'defaultVideoCost', label: 'Video Access', default: 5 },
                                { key: 'mcqTestCost', label: 'MCQ Test Entry', default: 2 },
                                { key: 'mcqAnalysisCost', label: 'MCQ Analysis', default: 5 },
                                { key: 'mcqAnalysisCostUltra', label: 'Ultra Analysis', default: 20 },
                                { key: 'mcqHistoryCost', label: 'History View', default: 1 },
                                { key: 'chatCost', label: 'AI Chat Msg', default: 1 },
                                { key: 'gameCost', label: 'Spin Wheel', default: 0 },
                            ].map((item) => (
                                <div key={item.key} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{item.label}</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">🪙</span>
                                        <input
                                            type="number"
                                            // @ts-ignore
                                            value={localSettings[item.key] !== undefined ? localSettings[item.key] : item.default}
                                            onChange={(e) => updateSetting(item.key, Number(e.target.value))}
                                            className="w-full p-1.5 border rounded font-bold text-sm"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SUBSCRIPTION PLANS */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><CreditCard size={16} /> Subscription Plans</h4>
                         <div className="overflow-x-auto border rounded-xl shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b">
                                    <tr>
                                        <th className="p-3">Plan Name</th>
                                        <th className="p-3">Duration</th>
                                        <th className="p-3 text-blue-600">Basic Price (₹)</th>
                                        <th className="p-3 text-purple-600">Ultra Price (₹)</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {(localSettings.subscriptionPlans || []).map((plan, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="p-3">
                                                <input value={plan.name} onChange={e => {
                                                    const updated = [...localSettings.subscriptionPlans!];
                                                    updated[idx].name = e.target.value;
                                                    updateSetting('subscriptionPlans', updated);
                                                }} className="bg-transparent font-bold w-full outline-none" />
                                            </td>
                                            <td className="p-3">
                                                <input value={plan.duration} onChange={e => {
                                                    const updated = [...localSettings.subscriptionPlans!];
                                                    updated[idx].duration = e.target.value;
                                                    updateSetting('subscriptionPlans', updated);
                                                }} className="bg-transparent text-xs w-full outline-none" />
                                            </td>
                                            <td className="p-3">
                                                <input type="number" value={plan.basicPrice} onChange={e => {
                                                    const updated = [...localSettings.subscriptionPlans!];
                                                    updated[idx].basicPrice = Number(e.target.value);
                                                    updateSetting('subscriptionPlans', updated);
                                                }} className="bg-transparent font-bold text-blue-600 w-20 outline-none" />
                                            </td>
                                            <td className="p-3">
                                                 <input type="number" value={plan.ultraPrice} onChange={e => {
                                                    const updated = [...localSettings.subscriptionPlans!];
                                                    updated[idx].ultraPrice = Number(e.target.value);
                                                    updateSetting('subscriptionPlans', updated);
                                                }} className="bg-transparent font-bold text-purple-600 w-20 outline-none" />
                                            </td>
                                            <td className="p-3 text-center">
                                                 <button onClick={() => {
                                                    if(confirm("Delete Plan?")) {
                                                        const updated = localSettings.subscriptionPlans!.filter((_, i) => i !== idx);
                                                        updateSetting('subscriptionPlans', updated);
                                                    }
                                                }} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={() => {
                             const newPlan: SubscriptionPlan = {
                                id: `plan-${Date.now()}`,
                                name: 'New Plan',
                                duration: '30 days',
                                basicPrice: 99,
                                basicOriginalPrice: 199,
                                ultraPrice: 199,
                                ultraOriginalPrice: 399,
                                features: ['New Feature'],
                                popular: false
                            };
                            updateSetting('subscriptionPlans', [...(localSettings.subscriptionPlans || []), newPlan]);
                        }} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 font-bold hover:border-blue-300 hover:text-blue-500 text-xs">+ Add New Plan</button>
                    </div>
                </div>
            )}

            {/* TAB 3: VISIBILITY */}
            {activeTab === 'VISIBILITY' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* LAYOUT SECTIONS */}
                     <div className="p-4 border rounded-xl bg-slate-50 col-span-1 md:col-span-2">
                         <h4 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2"><Layout size={16}/> Home Screen Layout</h4>
                         <div className="flex flex-wrap gap-4">
                             {[
                                 {id: 'hero_slider', label: 'Hero Slider'},
                                 {id: 'live_challenges', label: 'Live Challenges'},
                                 {id: 'features_ticker', label: 'Features Ticker'},
                                 {id: 'promo_banner', label: 'Promo Banner'},
                                 {id: 'stats_header', label: 'Stats Header'},
                                 {id: 'request_content', label: 'Request Content'},
                                 {id: 'services_grid', label: 'Services Grid'}
                             ].map(item => {
                                 // @ts-ignore
                                 const isVisible = localSettings.dashboardLayout?.[item.id]?.visible !== false;
                                 return (
                                     <label key={item.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm cursor-pointer hover:bg-slate-50">
                                         <input
                                            type="checkbox"
                                            checked={isVisible}
                                            onChange={() => toggleDashboardSection(item.id)}
                                            className="accent-blue-600 w-4 h-4"
                                         />
                                         <span className="text-xs font-bold text-slate-700">{item.label}</span>
                                     </label>
                                 );
                             })}
                         </div>
                     </div>

                     {[
                         {key: 'hiddenSubjects', label: 'Hidden Subjects', type: 'list'},
                         {key: 'hiddenClasses', label: 'Hidden Classes', type: 'list'},
                     ].map((item, idx) => (
                         <div key={idx} className="p-4 border rounded-xl bg-slate-50">
                             <h4 className="font-bold text-slate-700 text-sm mb-2">{item.label}</h4>
                             <p className="text-[10px] text-slate-500 mb-2">IDs separated by comma</p>
                             <textarea
                                className="w-full h-24 p-2 border rounded-lg text-xs font-mono"
                                // @ts-ignore
                                value={localSettings[item.key]?.join(', ') || ''}
                                onChange={e => updateSetting(item.key, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                             />
                         </div>
                     ))}

                     <div className="p-4 border rounded-xl bg-slate-50 col-span-1 md:col-span-2">
                         <h4 className="font-bold text-slate-700 text-sm mb-4">Module Visibility</h4>
                         <div className="flex flex-wrap gap-4">
                             {[
                                 {key: 'isChatEnabled', label: 'Chat Module'},
                                 {key: 'isGameEnabled', label: 'Game Module'},
                                 {key: 'isPaymentEnabled', label: 'Payment Gateway'},
                                 {key: 'allowSignup', label: 'Allow Signups'},
                             ].map(mod => (
                                 <label key={mod.key} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm cursor-pointer hover:bg-slate-50">
                                     <input
                                        type="checkbox"
                                        // @ts-ignore
                                        checked={localSettings[mod.key] !== false}
                                        onChange={e => updateSetting(mod.key, e.target.checked)}
                                        className="accent-green-600 w-4 h-4"
                                     />
                                     <span className="text-xs font-bold text-slate-700">{mod.label}</span>
                                 </label>
                             ))}
                         </div>
                     </div>
                </div>
            )}

            {/* TAB 4: PLAN MATRIX (Visual Editor) */}
            {activeTab === 'PLAN_MATRIX' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-200 w-fit">
                        <span className="text-xs text-slate-400 font-bold mr-2">Quick Insert:</span>
                        {['✅', '❌', '⚠️', '🔒', '💎', '🆓'].map(s => (
                            <button key={s} onClick={() => navigator.clipboard.writeText(s).then(() => alert("Copied!"))} className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-sm border border-slate-200 shadow-sm">{s}</button>
                        ))}
                    </div>

                    <div className="space-y-6">
                        {(localSettings.planComparison || []).map((cat, cIdx) => (
                            <div key={cIdx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-200">
                                    <input
                                        value={cat.name}
                                        onChange={(e) => {
                                            const updated = [...(localSettings.planComparison || [])];
                                            updated[cIdx].name = e.target.value;
                                            setLocalSettings({...localSettings, planComparison: updated});
                                        }}
                                        className="bg-transparent text-slate-800 font-bold text-sm outline-none w-1/2"
                                        placeholder="Category Name"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => {
                                            const updated = [...(localSettings.planComparison || [])];
                                            updated[cIdx].features.push({name: 'New Feature', free: '❌', basic: '✅', ultra: '✅'});
                                            setLocalSettings({...localSettings, planComparison: updated});
                                        }} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100">+ Feature</button>
                                        <button onClick={() => {
                                            if(confirm("Delete Category?")) {
                                                const updated = (localSettings.planComparison || []).filter((_, i) => i !== cIdx);
                                                setLocalSettings({...localSettings, planComparison: updated});
                                            }
                                        }} className="text-xs text-red-400 px-2 py-1 rounded hover:text-red-600">Delete</button>
                                    </div>
                                </div>
                                <table className="w-full text-xs text-slate-600">
                                    <thead className="bg-white text-slate-400 font-bold uppercase border-b border-slate-100">
                                        <tr>
                                            <th className="p-2 text-left">Feature</th>
                                            <th className="p-2 text-center w-24">Free</th>
                                            <th className="p-2 text-center w-24 text-blue-600">Basic</th>
                                            <th className="p-2 text-center w-24 text-purple-600">Ultra</th>
                                            <th className="p-2 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {cat.features.map((feat, fIdx) => (
                                            <tr key={fIdx} className="hover:bg-slate-50 group">
                                                <td className="p-2"><input value={feat.name} onChange={(e) => {
                                                    const updated = [...(localSettings.planComparison || [])];
                                                    updated[cIdx].features[fIdx].name = e.target.value;
                                                    setLocalSettings({...localSettings, planComparison: updated});
                                                }} className="w-full bg-transparent outline-none focus:text-blue-600 font-medium" /></td>
                                                <td className="p-2 text-center"><input value={feat.free} onChange={(e) => {
                                                    const updated = [...(localSettings.planComparison || [])];
                                                    updated[cIdx].features[fIdx].free = e.target.value;
                                                    setLocalSettings({...localSettings, planComparison: updated});
                                                }} className="w-full bg-transparent outline-none text-center" /></td>
                                                <td className="p-2 text-center"><input value={feat.basic} onChange={(e) => {
                                                    const updated = [...(localSettings.planComparison || [])];
                                                    updated[cIdx].features[fIdx].basic = e.target.value;
                                                    setLocalSettings({...localSettings, planComparison: updated});
                                                }} className="w-full bg-transparent outline-none text-center" /></td>
                                                <td className="p-2 text-center"><input value={feat.ultra} onChange={(e) => {
                                                    const updated = [...(localSettings.planComparison || [])];
                                                    updated[cIdx].features[fIdx].ultra = e.target.value;
                                                    setLocalSettings({...localSettings, planComparison: updated});
                                                }} className="w-full bg-transparent outline-none text-center" /></td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => {
                                                        const updated = [...(localSettings.planComparison || [])];
                                                        updated[cIdx].features = updated[cIdx].features.filter((_, i) => i !== fIdx);
                                                        setLocalSettings({...localSettings, planComparison: updated});
                                                    }} className="text-red-300 opacity-0 group-hover:opacity-100 hover:text-red-500"><Trash2 size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                        <button onClick={() => setLocalSettings({...localSettings, planComparison: [...(localSettings.planComparison || []), {name: 'New Category', features: []}]})} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-colors">+ Add New Category</button>
                    </div>
                </div>
            )}

            {/* TAB 5: PACKAGES */}
            {activeTab === 'PACKAGES' && (
                <div className="space-y-4">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(localSettings.packages || []).map((pkg, idx) => (
                            <div key={pkg.id} className="border rounded-xl p-4 hover:shadow-md transition-all relative group bg-white">
                                <button onClick={() => {
                                    if(confirm("Delete Package?")) {
                                        const updated = localSettings.packages.filter((_, i) => i !== idx);
                                        updateSetting('packages', updated);
                                    }
                                }} className="absolute top-2 right-2 text-red-300 opacity-0 group-hover:opacity-100 hover:text-red-500"><X size={16} /></button>

                                <div className="space-y-2">
                                    <input value={pkg.name} onChange={e => {
                                        const updated = [...localSettings.packages];
                                        updated[idx].name = e.target.value;
                                        updateSetting('packages', updated);
                                    }} className="font-bold text-slate-800 text-sm w-full outline-none" placeholder="Name" />

                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-slate-400 font-bold">CR:</span>
                                        <input type="number" value={pkg.credits} onChange={e => {
                                            const updated = [...localSettings.packages];
                                            updated[idx].credits = Number(e.target.value);
                                            updateSetting('packages', updated);
                                        }} className="font-bold text-blue-600 text-sm w-full outline-none" />
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-slate-400 font-bold">₹</span>
                                        <input type="number" value={pkg.price} onChange={e => {
                                            const updated = [...localSettings.packages];
                                            updated[idx].price = Number(e.target.value);
                                            updateSetting('packages', updated);
                                        }} className="font-black text-slate-800 text-lg w-full outline-none" />
                                    </div>
                                </div>
                            </div>
                        ))}
                         <button onClick={() => {
                            updateSetting('packages', [...(localSettings.packages || []), {id: `pkg-${Date.now()}`, name: 'New Pack', credits: 100, price: 99}]);
                        }} className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-4 text-slate-400 hover:text-blue-500 hover:border-blue-400">
                            <Plus size={24} />
                            <span className="text-xs font-bold mt-1">Add Package</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
