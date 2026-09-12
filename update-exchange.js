const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

// Credit Sub Tab Exchange
const target1 = `              {/* SUBTAB 3: EXCHANGE DIAMONDS ➔ CREDITS (Strictly Diamonds to Credits: 1 💎 = 20 🪙) */}
              {creditSubTab === 'EXCHANGE' && (() => {
                const userDiamonds = (user.diamonds ?? 0);
                const creditsToReceive = creditExchangeDiamonds * 20;`;

const replacement1 = `              {/* SUBTAB 3: EXCHANGE DIAMONDS ➔ CREDITS (Strictly Diamonds to Credits: 1 💎 = 10 🪙) */}
              {creditSubTab === 'EXCHANGE' && (() => {
                const userDiamonds = (user.diamonds ?? 0);
                const creditsToReceive = creditExchangeDiamonds * 10;`;

content = content.replace(target1, replacement1);

const target2 = `                            1 💎 = 20 🪙
                          </span>`;
const replacement2 = `                            1 💎 = 10 🪙
                          </span>`;

content = content.replace(target2, replacement2);

// Diamond Sub Tab Exchange
const target3 = `            {/* SUBTAB 3: EXCHANGE 1💎 = 20 CREDITS */}
            {diamondSubTab === 'EXCHANGE' && (`;
const replacement3 = `            {/* SUBTAB 3: EXCHANGE 1💎 = 10 CREDITS */}
            {diamondSubTab === 'EXCHANGE' && (`;
content = content.replace(target3, replacement3);

const target4 = `                  const creditsToReceive = exchangeDiamondsCount * 20;`;
const replacement4 = `                  const creditsToReceive = exchangeDiamondsCount * 10;`;
content = content.replace(target4, replacement4);

const target5 = `                        1 💎 = 20 🪙`;
const replacement5 = `                        1 💎 = 10 🪙`;
content = content.replace(target5, replacement5);

fs.writeFileSync(file, content);
