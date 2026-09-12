const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `                  {!isLifetimePlan && (
                    isCreditSubAllowed ? (`
const replacement1 = `                  {!isLifetimePlan && (
                    (isCreditSubAllowed && selectedTierForPurchase !== 'ULTRA') ? (`

const target2 = `                        <p className="text-[11px] text-slate-400 font-medium">
                          Admin ne credits dwara subscription purchase off kar rakha hai.
                        </p>`
const replacement2 = `                        <p className="text-[11px] text-slate-400 font-medium">
                          {selectedTierForPurchase === 'ULTRA' ? 'MAX (Ultra) membership sirf Cash ya Diamonds se khareedi ja sakti hai.' : 'Admin ne credits dwara subscription purchase off kar rakha hai.'}
                        </p>`

content = content.replace(target1, replacement1).replace(target2, replacement2);
fs.writeFileSync(file, content);
