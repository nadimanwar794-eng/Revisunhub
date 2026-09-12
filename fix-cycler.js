const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const topBarCycler = `const TopBarCycler = ({ user, onTabChange, setStoreInitialTier }: any) => {
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

content = content.replace(`export const StudentDashboard: React.FC<Props> = ({`, topBarCycler + `\nexport const StudentDashboard: React.FC<Props> = ({`);

fs.writeFileSync(file, content);
