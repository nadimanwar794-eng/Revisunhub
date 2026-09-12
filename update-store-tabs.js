const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

const t1 = `  const allTabs = [
    { id: 'SUBSCRIPTION' as const, label: 'VIP Plans',    emoji: '👑', color: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.35)', glow: 'rgba(192,132,252,0.25)' },
    { id: 'CREDITS'      as const, label: 'Credits',      emoji: '🪙', color: C.credit, bg: C.creditBg,                border: C.creditBorder,          glow: C.creditGlow },
    { id: 'DIAMONDS'     as const, label: 'Diamonds',     emoji: '💎', color: C.diamond,bg: C.diamondBg,               border: C.diamondBorder,         glow: C.diamondGlow },
  ];`;

const r1 = `  const allTabs = [
    { id: 'SUBSCRIPTION' as const, label: 'VIP Plans',    emoji: '👑', color: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.35)', glow: 'rgba(192,132,252,0.25)' },
    { id: 'CREDITS'      as const, label: 'Credits',      emoji: '🪙', color: C.credit, bg: C.creditBg,                border: C.creditBorder,          glow: C.creditGlow },
    { id: 'DIAMONDS'     as const, label: 'Diamonds',     emoji: '💎', color: C.diamond,bg: C.diamondBg,               border: C.diamondBorder,         glow: C.diamondGlow },
    { id: 'FREE'         as const, label: 'Free',         emoji: '🎯', color: '#94a3b8',bg: 'rgba(148,163,184,0.12)',border: 'rgba(148,163,184,0.3)',glow: 'rgba(148,163,184,0.18)' },
  ];`;

const t2 = `                {/* History tab — slim, no icon */}
                <button onClick={() => setTierType('HISTORY')}
                  className="py-1.5 px-0.5 sm:px-1 rounded-xl font-black transition-all flex items-center justify-center"
                  style={tierType === 'HISTORY'
                    ? { background: 'rgba(251,191,36,0.10)', border: \`2px solid rgba(251,191,36,0.35)\` }
                    : { background: pageTheme.cardSurfaceHigh, border: \`1.5px solid \${pageTheme.cardBorder}\` }}>
                  <span className="text-[9.5px] sm:text-[10px] truncate" style={{ color: tierType === 'HISTORY' ? C.gold : C.textMuted }}>History</span>
                </button>`;

const r2 = ``;

content = content.replace(t1, r1).replace(t2, r2);
fs.writeFileSync(file, content);
