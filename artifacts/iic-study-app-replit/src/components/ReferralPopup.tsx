import React, { useState } from 'react';
import { X, Gift, Check, ArrowRight, Share2, Copy, Users, Sparkles, Award } from 'lucide-react';
import { User } from '../types';
import { saveUserToLive } from '../firebase';
import { getUserDiamonds } from '../utils/diamondUtils';

interface Props {
  user: User;
  onClose: () => void;
  onUpdateUser: (u: User) => void;
}

export const ReferralPopup: React.FC<Props> = ({ user, onClose, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'INVITE' | 'ENTER_CODE'>('INVITE');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [claimedRewardText, setClaimedRewardText] = useState('');

  const myReferralCode = user.displayId || user.id;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myReferralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `🌟 Bhai IIC Study App download kar! Mere referral code "${myReferralCode}" se signup karega toh tujhe turant +10 Diamonds 💎 aur +100 Coins 🪙 free milenge! Download link: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleApply = async () => {
    if (!code.trim()) return;
    const cleanCode = code.trim().toUpperCase();

    if (cleanCode === (user.displayId || user.id).toUpperCase()) {
      setError("Aap apna hi referral code use nahi kar sakte.");
      return;
    }

    if (user.redeemedReferralCode) {
      setError("Aap pehle hi ek referral code claim kar chuke hain.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const stored = localStorage.getItem('nst_users');
      const allUsers: User[] = stored ? JSON.parse(stored) : [];
      const referrer = allUsers.find(
        u => (u.displayId && u.displayId.toUpperCase() === cleanCode) ||
             (u.id && u.id.toUpperCase() === cleanCode) ||
             u.mobile === cleanCode
      );

      // Friend receives +10 Diamonds 💎 and +100 Credits 🪙
      const friendDiamondReward = 10;
      const friendCoinReward = 100;

      const updatedUser: User = {
        ...user,
        diamonds: getUserDiamonds(user) + friendDiamondReward,
        credits: (user.credits || 0) + friendCoinReward,
        redeemedReferralCode: cleanCode,
      };

      if (referrer) {
        // Inviter receives +20 Diamonds 💎 and +50 Credits 🪙
        const inviterDiamondReward = 20;
        const inviterCoinReward = 50;
        const newReferralCount = (referrer.referralCount || 0) + 1;

        const referrerUpdates: Partial<User> = {
          diamonds: getUserDiamonds(referrer) + inviterDiamondReward,
          credits: (referrer.credits || 0) + inviterCoinReward,
          referralCount: newReferralCount,
        };

        const newUsersList = allUsers.map(u => {
          if (u.id === user.id) return updatedUser;
          if (u.id === referrer.id) return { ...u, ...referrerUpdates };
          return u;
        });
        localStorage.setItem('nst_users', JSON.stringify(newUsersList));
        saveUserToLive({ ...referrer, ...referrerUpdates });
      } else {
        // Even if referrer not cached locally, we grant the friend welcome bonus
        localStorage.setItem(`referral_code_claimed_${user.id}`, cleanCode);
      }

      await saveUserToLive(updatedUser);
      onUpdateUser(updatedUser);
      setClaimedRewardText(`+10 Diamonds 💎 & +100 Coins 🪙`);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Referral code verify karne me samasya aayi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center shadow-2xl relative overflow-hidden border border-emerald-500/30">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
            <Check size={36} strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Mubarak Ho! 🎉</h2>
          <p className="text-sm text-slate-400 mb-4">Referral code safalta-purvak apply ho gaya!</p>
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <p className="text-xs text-emerald-300 font-bold mb-1">Aapko Mila Hai:</p>
            <p className="text-xl font-black text-emerald-400">{claimedRewardText}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all text-sm"
          >
            Padhai Shuru Karein
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-950 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-white/10 relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header with Dual Currency Badges */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Gift size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-black text-white">Refer & Earn System</h2>
          <p className="text-xs text-slate-400 mt-1">Doston ko invite karein aur Diamonds 💎 & Coins 🪙 paayein!</p>
        </div>

        {/* Tab switch: Invite Friends VS Enter Code */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl mb-5 border border-white/5">
          <button
            onClick={() => setActiveTab('INVITE')}
            className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'INVITE'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={14} /> Dost Ko Bhejo
          </button>
          <button
            onClick={() => setActiveTab('ENTER_CODE')}
            className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ENTER_CODE'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} /> Code Daalo
          </button>
        </div>

        {activeTab === 'INVITE' ? (
          <div className="space-y-4">
            {/* Reward Breakdown Box */}
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2.5">
              <p className="text-[11px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <Award size={14} /> Dono Ka Fayda (Win-Win)
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <p className="text-[10px] text-slate-400 font-bold">Aapko Milega:</p>
                  <p className="font-black text-sky-300 text-sm mt-0.5">+20 💎 +50 🪙</p>
                  <p className="text-[9px] text-slate-500">Jab dost code use kare</p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <p className="text-[10px] text-slate-400 font-bold">Dost Ko Milega:</p>
                  <p className="font-black text-emerald-400 text-sm mt-0.5">+10 💎 +100 🪙</p>
                  <p className="text-[9px] text-slate-500">Welcome bonus turant</p>
                </div>
              </div>
            </div>

            {/* My Referral Code Box */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Aapka Unique Referral Code
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono font-black text-xl tracking-wider text-amber-300 select-all">
                  {myReferralCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1 active:scale-95 transition-all"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Total Referred: <span className="font-bold text-sky-400">{user.referralCount || 0} Doston ko</span>
              </p>
            </div>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
            >
              <Share2 size={16} /> WhatsApp Par Share Karein
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {user.redeemedReferralCode ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <Check size={28} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-black text-white">Code Already Redeemed!</p>
                <p className="text-xs text-slate-400 mt-1">
                  Aapne pehle hi code <span className="font-mono font-bold text-emerald-400">{user.redeemedReferralCode}</span> claim kar liya hai.
                </p>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300">
                  Kisi dost ka code daalein aur paayein <span className="text-sky-300 font-bold">+10 Diamonds 💎</span> aur <span className="text-amber-300 font-bold">+100 Coins 🪙</span> bilkul muft!
                </div>

                <div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Dost ka Code Daalein"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-mono text-center font-black tracking-widest text-white text-base outline-none uppercase focus:border-indigo-500 focus:bg-white/10 transition-all"
                  />
                  {error && <p className="text-red-400 text-xs font-bold mt-2 text-center">{error}</p>}
                </div>

                <button
                  onClick={handleApply}
                  disabled={loading || !code.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
                >
                  {loading ? 'Verifying...' : <><span>Reward Claim Karein</span> <ArrowRight size={16} /></>}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
