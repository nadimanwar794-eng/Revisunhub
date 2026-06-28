import React, { useState } from 'react';
import { User, SystemSettings, StudentTab } from '../types';
import { BannerCarousel } from './BannerCarousel';
import { Bot, Sparkles, BrainCircuit } from 'lucide-react';
import { CustomAlert } from './CustomDialogs';

interface Props {
    user: User;
    onTabChange: (tab: StudentTab) => void;
    settings?: SystemSettings;
}

export const AiHub: React.FC<Props> = ({ user, onTabChange, settings }) => {
    const [showAiModal, setShowAiModal] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, type: 'SUCCESS'|'ERROR'|'INFO', title?: string, message: string}>({isOpen: false, type: 'INFO', message: ''});

    const showAlert = (msg: string, type: 'SUCCESS'|'ERROR'|'INFO' = 'INFO', title?: string) => {
        setAlertConfig({ isOpen: true, type, title, message: msg });
    };

    const slides = [
        {
            id: 'ai_tutor',
            image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop',
            title: 'AI Personal Tutor',
            subtitle: 'Instant Doubt Solving',
            link: 'AI_CHAT'
        },
        {
            id: 'deep_analysis',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
            title: 'Deep Analysis',
            subtitle: 'Unlock Performance Insights',
            link: 'DEEP_ANALYSIS'
        },
        {
            id: 'video_lectures',
            image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop',
            title: 'Video Lectures',
            subtitle: 'Watch & Learn',
            link: 'VIDEO'
        },
        {
            id: 'pdf_notes',
            image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1973&auto=format&fit=crop',
            title: 'Premium Notes',
            subtitle: 'Read & Revise',
            link: 'PDF'
        },
        {
            id: 'mcq_practice',
            image: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=2070&auto=format&fit=crop',
            title: 'MCQ Tests',
            subtitle: 'Practice to Perfect',
            link: 'MCQ'
        },
        {
            id: 'audio_series',
            image: 'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?q=80&w=2066&auto=format&fit=crop',
            title: 'Audio Series',
            subtitle: 'Listen & Learn',
            link: 'AUDIO'
        },
        {
            id: 'store_premium',
            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2070&auto=format&fit=crop',
            title: 'Upgrade Plan',
            subtitle: 'Unlock Everything',
            link: 'STORE'
        }
    ];

    if (settings?.specialDiscountEvent?.enabled) {
        slides.unshift({
            id: 'discount_offer',
            image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop',
            title: settings.specialDiscountEvent.eventName || 'Study Boost Offer',
            subtitle: `${settings.specialDiscountEvent.discountPercent}% OFF Premium Learning`,
            link: 'STORE'
        });
    }

    return (
        <div className="space-y-6 pb-24 p-4 animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <Sparkles className="text-indigo-600" /> AI Future Hub
                </h2>
                <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                    Smart Learning
                </div>
            </div>

            {/* BANNERS */}
            <div className="h-40 rounded-2xl overflow-hidden shadow-lg relative border-2 border-slate-900 mb-6">
                <BannerCarousel
                    onBannerClick={(link) => {
                        if (['STORE', 'CUSTOM_PAGE', 'VIDEO', 'PDF', 'MCQ', 'AUDIO', 'AI_CHAT', 'DEEP_ANALYSIS', 'AI_HISTORY'].includes(link)) {
                            onTabChange(link as any);
                        }
                    }}
                    slides={slides}
                    interval={4000}
                    autoPlay={true}
                    showDots={true}
                    showArrows={false}
                />
            </div>

            {/* AI TOOLS GRID */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => onTabChange('AI_CHAT')}
                    className="bg-white p-6 rounded-3xl shadow-md border border-indigo-100 flex flex-col items-center gap-3 hover:shadow-xl transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-2 right-2">
                        <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full">BASIC</span>
                    </div>
                    <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <Bot size={28} />
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-slate-800">AI Chat Tutor</h3>
                        <p className="text-xs text-slate-500 mt-1">Ask doubts instantly</p>
                    </div>
                </button>

                <button
                    onClick={() => onTabChange('DEEP_ANALYSIS')}
                    className="bg-white p-6 rounded-3xl shadow-md border border-pink-100 flex flex-col items-center gap-3 hover:shadow-xl transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-2 right-2">
                         <span className="bg-purple-600 text-white text-[9px] px-2 py-0.5 rounded-full">ULTRA</span>
                    </div>
                    <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                        <Sparkles size={28} />
                    </div>
                     <div className="text-center">
                        <h3 className="font-bold text-slate-800">Deep Analysis</h3>
                        <p className="text-xs text-slate-500 mt-1">Performance Insights</p>
                    </div>
                </button>

                <button
                    onClick={() => onTabChange('AI_HISTORY')}
                    className="col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-3xl shadow-md border border-slate-700 flex items-center justify-between gap-3 hover:shadow-xl transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <BrainCircuit size={24} />
                        </div>
                        <div className="text-left">
                             <h3 className="font-bold text-white">History & Logs</h3>
                             <p className="text-xs text-slate-400 mt-1">View past interactions</p>
                        </div>
                    </div>
                    <div className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold">View</div>
                </button>
            </div>

            <CustomAlert
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig(prev => ({...prev, isOpen: false}))}
            />
        </div>
    );
};
