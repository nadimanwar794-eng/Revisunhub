import React, { useState, useEffect, useRef } from 'react';
import { SystemSettings, User } from '../types';
import { FeatureMatrixModal } from './FeatureMatrixModal';
import { Crown, User as UserIcon, ShoppingBag, X, Zap, Menu, ChevronUp } from 'lucide-react';

interface Props {
    settings: SystemSettings;
    user: User;
    isFlashSaleActive?: boolean;
    onOpenProfile: () => void;
    onOpenStore: () => void;
}

export const FloatingActionMenu: React.FC<Props> = ({ settings, user, isFlashSaleActive, onOpenProfile, onOpenStore }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 200 });

    // Drag Refs
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLDivElement>(null);

    // Initial Position Fix
    useEffect(() => {
        const handleResize = () => {
            setPosition(p => ({
                x: Math.min(p.x, window.innerWidth - 80),
                y: Math.min(p.y, window.innerHeight - 200)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- GLOBAL GESTURE LISTENER (Swipe Up from Bottom) ---
    useEffect(() => {
        let touchStartY = 0;
        let touchStartX = 0;

        const handleGlobalTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
        };

        const handleGlobalTouchEnd = (e: TouchEvent) => {
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndX = e.changedTouches[0].clientX;

            const dy = touchEndY - touchStartY;
            const dx = touchEndX - touchStartX;

            // 1. Swipe Up from Bottom Edge (Bottom 100px)
            if (touchStartY > window.innerHeight - 100 && dy < -50 && Math.abs(dx) < 50) {
                setIsOpen(true);
            }
        };

        window.addEventListener('touchstart', handleGlobalTouchStart);
        window.addEventListener('touchend', handleGlobalTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleGlobalTouchStart);
            window.removeEventListener('touchend', handleGlobalTouchEnd);
        };
    }, []);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        isDraggingRef.current = false;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        dragStartRef.current = { x: clientX, y: clientY };
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const dx = Math.abs(clientX - dragStartRef.current.x);
        const dy = Math.abs(clientY - dragStartRef.current.y);

        if (dx > 10 || dy > 10) {
            isDraggingRef.current = true;
        }

        if (isDraggingRef.current) {
            const newX = Math.max(10, Math.min(window.innerWidth - 74, clientX - 32));
            const newY = Math.max(10, Math.min(window.innerHeight - 74, clientY - 32));
            setPosition({ x: newX, y: newY });
        }
    };

    const handleTouchEnd = () => {
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);
    };

    const toggleMenu = () => {
        if (!isDraggingRef.current) {
            setIsOpen(prev => !prev);
        }
    };

    return (
        <>
            {/* MAIN FAB BUTTON (Draggable) */}
            <div
                ref={buttonRef}
                className="fixed z-[9990] flex flex-col items-center gap-3 touch-none select-none"
                style={{ left: position.x, top: position.y, transform: 'translate(0, 0)' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
            >
                <button
                    onClick={toggleMenu}
                    className={`relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border-4 border-white ${isFlashSaleActive ? 'bg-gradient-to-r from-red-500 to-pink-600 animate-pulse' : 'bg-slate-900'} ${isOpen ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`}
                >
                    {settings.appLogo ? (
                        <img src={settings.appLogo} alt="Menu" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <Menu size={32} className="text-white" />
                    )}

                    {/* Flash Sale Badge */}
                    {isFlashSaleActive && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white animate-bounce flex items-center justify-center">
                            <Zap size={10} className="text-red-900 fill-red-900" />
                        </div>
                    )}
                </button>
            </div>

            {/* BOTTOM SHEET MENU (Plan 2.0) */}
            <div className={`fixed inset-0 z-[9991] flex flex-col justify-end transition-visibility duration-300 ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>

                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsOpen(false)}
                ></div>

                {/* Sheet Content */}
                <div className={`bg-white w-full rounded-t-3xl shadow-2xl transform transition-transform duration-300 relative z-10 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>

                    {/* Pull Handle */}
                    <div className="flex justify-center p-2" onClick={() => setIsOpen(false)}>
                        <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                    </div>

                    <div className="p-6 pt-2 pb-10">
                        {/* Header: User Profile */}
                        <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200 flex items-center gap-1">
                                        <Crown size={10} className="fill-yellow-800" /> {user.credits} CR
                                    </span>
                                    <span>•</span>
                                    <span>{user.subscriptionTier || 'Free Plan'}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="ml-auto p-2 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-red-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Menu Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* PLAN */}
                            <button
                                onClick={() => { setIsOpen(false); setShowPlanModal(true); }}
                                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors group"
                            >
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-600 group-hover:scale-110 transition-transform">
                                    <Crown size={24} />
                                </div>
                                <span className="text-xs font-bold text-purple-900">View Plans</span>
                            </button>

                            {/* STORE */}
                            <button
                                onClick={() => { setIsOpen(false); onOpenStore(); }}
                                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group"
                            >
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                                    <ShoppingBag size={24} />
                                </div>
                                <span className="text-xs font-bold text-blue-900">Credit Store</span>
                            </button>

                            {/* PROFILE */}
                            <button
                                onClick={() => { setIsOpen(false); onOpenProfile(); }}
                                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors group"
                            >
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-600 group-hover:scale-110 transition-transform">
                                    <UserIcon size={24} />
                                </div>
                                <span className="text-xs font-bold text-slate-900">Profile</span>
                            </button>
                        </div>

                        {/* Footer / Tip */}
                        <div className="mt-6 text-center">
                            <p className="text-[10px] text-slate-400 font-medium">
                                Swipe up from bottom anytime to open this menu
                            </p>
                            <ChevronUp size={16} className="mx-auto text-slate-300 animate-bounce mt-1" />
                        </div>
                    </div>
                </div>
            </div>

            {/* PLAN MODAL */}
            <FeatureMatrixModal
                isOpen={showPlanModal}
                onClose={() => setShowPlanModal(false)}
                settings={settings}
                discountActive={isFlashSaleActive}
            />
        </>
    );
};
