const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/StudentDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// The display is around 28550 to 28650
// I will just use regex to replace specific tags for the popup rendering.

// 1. Single option
const singleOptTarget = `                      <span className="text-[34px] font-black text-indigo-700 leading-none">{cost}</span>
                      <span className="text-sm font-bold text-indigo-400">{displayCoin}</span>
                      {(isDisc50 || isDisc25) && <span className="text-xs text-slate-400 line-through font-bold">{originalCost}</span>}`;

const singleOptRep = `                      <span className="text-[34px] font-black text-indigo-700 leading-none">{_primary === 'DIAMONDS' ? Math.ceil(cost/10) : cost}</span>
                      <span className="text-sm font-bold text-indigo-400">{displayCoin}</span>
                      {(isDisc50 || isDisc25) && <span className="text-xs text-slate-400 line-through font-bold">{_primary === 'DIAMONDS' ? Math.ceil(originalCost/10) : originalCost}</span>}`;

content = content.replace(singleOptTarget, singleOptRep);

// 2. Yahi Page
const yahiPageTarget = `                        <span className="text-[22px] font-black leading-none" style={{ color: 'var(--nst-color-brand)' }}>{cost}</span>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--nst-color-brand-60, #818cf8)' }}>{displayCoin}</span>
                        {(isDisc50 || isDisc25) && <span className="text-[10px] text-slate-400 line-through">{originalCost}</span>}`;

const yahiPageRep = `                        <span className="text-[22px] font-black leading-none" style={{ color: 'var(--nst-color-brand)' }}>{_primary === 'DIAMONDS' ? Math.ceil(cost/10) : cost}</span>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--nst-color-brand-60, #818cf8)' }}>{displayCoin}</span>
                        {(isDisc50 || isDisc25) && <span className="text-[10px] text-slate-400 line-through">{_primary === 'DIAMONDS' ? Math.ceil(originalCost/10) : originalCost}</span>}`;

content = content.replace(yahiPageTarget, yahiPageRep);

// 3. Sabhi Pages
const sabhiPagesTarget = `                        <span className="text-[22px] font-black leading-none" style={{ color: 'var(--nst-color-brand)' }}>{bulkOption.totalCost}</span>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--nst-color-brand-60, #818cf8)' }}>{displayCoin}</span>
                        <span className="text-[10px] text-slate-400 line-through">{bulkOption.originalTotal}</span>`;

const sabhiPagesRep = `                        <span className="text-[22px] font-black leading-none" style={{ color: 'var(--nst-color-brand)' }}>{_primary === 'DIAMONDS' ? Math.ceil(bulkOption.totalCost/10) : bulkOption.totalCost}</span>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--nst-color-brand-60, #818cf8)' }}>{displayCoin}</span>
                        <span className="text-[10px] text-slate-400 line-through">{_primary === 'DIAMONDS' ? Math.ceil(bulkOption.originalTotal/10) : bulkOption.originalTotal}</span>`;

content = content.replace(sabhiPagesTarget, sabhiPagesRep);

// 4. Page-mode total
const pageModeTotalTarget = `                        <div className="flex items-baseline gap-1">
                          <span className="text-[22px] font-black leading-none" style={{ color: 'var(--nst-color-brand)' }}>{_bulkModeCostDiscounted}</span>
                          <span className="text-[11px] font-bold" style={{ color: 'var(--nst-color-brand-60, #818cf8)' }}>{displayCoin}</span>
                          <span className="text-[10px] text-slate-400 line-through">{_bulkModeCost}</span>
                        </div>`;

const pageModeTotalRep = `                        <div className="flex items-baseline gap-1">
                          <span className="text-[22px] font-black leading-none" style={{ color: 'var(--nst-color-brand)' }}>{_primary === 'DIAMONDS' ? Math.ceil(_bulkModeCostDiscounted/10) : _bulkModeCostDiscounted}</span>
                          <span className="text-[11px] font-bold" style={{ color: 'var(--nst-color-brand-60, #818cf8)' }}>{displayCoin}</span>
                          <span className="text-[10px] text-slate-400 line-through">{_primary === 'DIAMONDS' ? Math.ceil(_bulkModeCost/10) : _bulkModeCost}</span>
                        </div>`;

content = content.replace(pageModeTotalTarget, pageModeTotalRep);

fs.writeFileSync(file, content);
