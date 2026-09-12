const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const importTarget = `import { Trophy, Star, Sparkles, LogOut, Download, Lock, CheckCircle2, MoreVertical, Search, Zap, Check, Gift, Crown, Share2, Info, Moon, BookOpen, Clock, Settings, FileText, LayoutGrid, Home, Activity, PenTool, LayoutTemplate, Layers, Palette, ArrowLeft, Heart, Filter, MonitorPlay, MessageCircle, Mic, Users, Camera, PlayCircle, Eye, Trash2, StopCircle, RefreshCw, Smartphone, Monitor, SmartphoneCharging, Plus, Bell, EyeOff, Layout, List, Shield, ArrowUpRight, TrendingUp } from 'lucide-react';`;
const importReplacement = `import { Trophy, Star, Sparkles, LogOut, Download, Lock, CheckCircle2, MoreVertical, Search, Zap, Check, Gift, Crown, Share2, Info, Moon, BookOpen, Clock, Settings, FileText, LayoutGrid, Home, Activity, PenTool, LayoutTemplate, Layers, Palette, ArrowLeft, Heart, Filter, MonitorPlay, MessageCircle, Mic, Users, Camera, PlayCircle, Eye, Trash2, StopCircle, RefreshCw, Smartphone, Monitor, SmartphoneCharging, Plus, Bell, EyeOff, Layout, List, Shield, ArrowUpRight, TrendingUp, Store } from 'lucide-react';`;

content = content.replace(importTarget, importReplacement);

const target = `          {/* Right: Diamonds & Credits buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Diamond Balance with Plus (+) icon */}
            <button
              id="topbar-row2-diamonds-btn"
              onClick={() => {
                setStoreInitialTier('DIAMONDS');
                onTabChange("STORE");
              }}
              className="inline-flex items-center gap-0.5 sm:gap-1 px-1 py-0.5 active:scale-95 transition-all shrink-0 cursor-pointer group select-none relative"
              title="Aapke Diamonds — Tap karke Diamond Store kholein"
            >
              <span className="text-[12px] leading-none select-none">💎</span>
              <span className="font-black text-[11px] tabular-nums text-sky-200 group-hover:text-sky-100">
                {(user.diamonds ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="text-sky-300 group-hover:scale-110 transition-transform ml-0.5">
                <Plus size={11} strokeWidth={3.5} />
              </span>
              {canClaimDiamondSubToday(user) && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>

            {/* Credit Balance with Plus (+) icon - no background */}
            <button
              id="topbar-row2-credits-btn"
              onClick={() => {
                setStoreInitialTier('CREDITS');
                onTabChange("STORE");
              }}
              className="inline-flex items-center gap-0.5 sm:gap-1 px-1 py-0.5 active:scale-95 transition-all shrink-0 cursor-pointer group select-none"
              title="Aapke Credits — Tap karke Store se aur paayein"
            >
              <span className="text-[12px] leading-none select-none">🪙</span>
              <span className="font-black text-[11px] tabular-nums text-amber-300 group-hover:text-amber-200">
                {(user.credits || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-amber-400 group-hover:scale-110 transition-transform ml-0.5">
                <Plus size={11} strokeWidth={3.5} />
              </span>
            </button>
          </div>`;

const replacement = `          {/* Right: Unified Cycling Button */}
          <div className="flex items-center shrink-0">
            <TopBarCycler
              user={user}
              onTabChange={onTabChange}
              setStoreInitialTier={setStoreInitialTier}
            />
          </div>`;

content = content.replace(target, replacement);

const topBarCycler = `
const TopBarCycler = ({ user, onTabChange, setStoreInitialTier }: any) => {
  const [index, setIndex] = useState(0);

  const cycle = [
    { id: 'CREDITS', icon: '🪙', value: (user.credits || 0).toLocaleString('en-IN'), color: 'text-amber-300', bg: 'rgba(251,191,36,0.1)' },
    { id: 'DIAMONDS', icon: '💎', value: (user.diamonds || 0).toLocaleString('en-IN'), color: 'text-sky-300', bg: 'rgba(56,189,248,0.1)' },
    { id: 'STORE', icon: <Store size={12} className="text-emerald-400" />, value: 'Store', color: 'text-emerald-300', bg: 'rgba(16,185,129,0.1)' },
    { id: 'PRO', icon: '⭐', value: 'PRO Plan', color: 'text-cyan-300', bg: 'rgba(34,211,238,0.1)' },
    { id: 'MAX', icon: '👑', value: 'MAX VIP', color: 'text-purple-300', bg: 'rgba(192,132,252,0.1)' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % cycle.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const current = cycle[index];

  const handleClick = () => {
    if (current.id === 'CREDITS') setStoreInitialTier('CREDITS');
    else if (current.id === 'DIAMONDS') setStoreInitialTier('DIAMONDS');
    else setStoreInitialTier('SUBSCRIPTION'); // Go to sub page for Store/Pro/Max
    onTabChange('STORE');
  };

  return (
    <button
      onClick={handleClick}
      className="relative flex items-center justify-center overflow-hidden rounded-xl active:scale-95 transition-all shadow-sm h-7 min-w-[70px] border border-white/10"
      style={{ background: current.bg }}
    >
      <div
        key={current.id}
        className="animate-in slide-in-from-bottom-2 fade-in duration-300 flex items-center gap-1 px-2"
      >
        <span className="text-[12px] leading-none shrink-0 flex items-center justify-center">
          {current.icon}
        </span>
        <span className={\`font-black text-[10px] tabular-nums \${current.color}\`}>
          {current.value}
        </span>
      </div>
    </button>
  );
};
`;

content = content.replace(`const TopBarRow2XpBar`, topBarCycler + `\nconst TopBarRow2XpBar`);

fs.writeFileSync(file, content);
