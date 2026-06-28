import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../../types';
import { ALL_FEATURES, FEATURE_CATEGORIES } from '../../utils/featureRegistry';
import { Save, Plus, Trash2, Check, X, ChevronDown, ChevronUp, Lock, Unlock, Settings } from 'lucide-react';

interface Props {
    settings: SystemSettings;
    onUpdateSettings: (s: SystemSettings) => void;
}

export const AdminLevelManager: React.FC<Props> = ({ settings, onUpdateSettings }) => {
    const [localConfig, setLocalConfig] = useState<{ level: number; unlockedFeatures: string[] }[]>([]);
    const [isEnabled, setIsEnabled] = useState(false);
    const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

    useEffect(() => {
        setLocalConfig(settings.levelConfig || []);
        setIsEnabled(settings.isLevelSystemEnabled || false);
    }, [settings]);

    const handleSave = () => {
        onUpdateSettings({
            ...settings,
            isLevelSystemEnabled: isEnabled,
            levelConfig: localConfig
        });
        alert('Level settings saved successfully!');
    };

    const addLevel = () => {
        const nextLevel = localConfig.length > 0 ? Math.max(...localConfig.map(c => c.level)) + 1 : 1;
        setLocalConfig([...localConfig, { level: nextLevel, unlockedFeatures: [] }]);
        setExpandedLevel(nextLevel);
    };

    const removeLevel = (level: number) => {
        setLocalConfig(localConfig.filter(c => c.level !== level));
    };

    const toggleFeature = (level: number, featureId: string) => {
        setLocalConfig(prev => prev.map(c => {
            if (c.level === level) {
                const features = c.unlockedFeatures || [];
                if (features.includes(featureId)) {
                    return { ...c, unlockedFeatures: features.filter(f => f !== featureId) };
                } else {
                    return { ...c, unlockedFeatures: [...features, featureId] };
                }
            }
            return c;
        }));
    };

    // Auto-fill levels 1-50 if empty (Helper)
    const autoFillLevels = () => {
        if (!confirm("This will reset current levels to 1-50 empty slots. Continue?")) return;
        const newConfig = [];
        for (let i = 1; i <= 50; i++) {
            newConfig.push({ level: i, unlockedFeatures: [] });
        }
        setLocalConfig(newConfig);
    };

    return (
        <div className="space-y-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Settings className="text-blue-600" /> Level System Manager
                    </h2>
                    <p className="text-sm text-slate-500">Configure feature unlocks per level (Level 1 to 50+)</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-sm font-bold text-slate-700">System Status:</span>
                        <button
                            onClick={() => setIsEnabled(!isEnabled)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${isEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                            {isEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>

            {localConfig.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold mb-4">No levels configured.</p>
                    <button onClick={autoFillLevels} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm">
                        Auto-Create Levels 1-50
                    </button>
                </div>
            )}

            <div className="grid gap-4">
                {localConfig.sort((a, b) => a.level - b.level).map((config) => (
                    <div key={config.level} className={`bg-white rounded-xl border transition-all ${expandedLevel === config.level ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-slate-200'}`}>
                        <div
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 rounded-t-xl"
                            onClick={() => setExpandedLevel(expandedLevel === config.level ? null : config.level)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700 border border-slate-200">
                                    {config.level}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Level {config.level}</h3>
                                    <p className="text-xs text-slate-500">
                                        {config.unlockedFeatures.length > 0
                                            ? `Unlocks: ${config.unlockedFeatures.map(fid => ALL_FEATURES.find(f => f.id === fid)?.label).join(', ')}`
                                            : 'No features assigned'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {expandedLevel === config.level ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                            </div>
                        </div>

                        {expandedLevel === config.level && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {FEATURE_CATEGORIES.map(category => (
                                        <div key={category} className="bg-white p-3 rounded-lg border border-slate-200">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{category}</h4>
                                            <div className="space-y-1">
                                                {ALL_FEATURES.filter(f => f.category === category).map(feature => (
                                                    <label key={feature.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer group">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${config.unlockedFeatures.includes(feature.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                                            {config.unlockedFeatures.includes(feature.id) && <Check size={10} className="text-white" />}
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={config.unlockedFeatures.includes(feature.id)}
                                                                onChange={() => toggleFeature(config.level, feature.id)}
                                                            />
                                                        </div>
                                                        <span className={`text-xs font-medium ${config.unlockedFeatures.includes(feature.id) ? 'text-blue-700 font-bold' : 'text-slate-600'}`}>
                                                            {feature.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeLevel(config.level); }}
                                        className="text-red-500 text-xs font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 size={14} /> Remove Level
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={addLevel}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
                <Plus size={20} /> Add Next Level
            </button>
        </div>
    );
};
