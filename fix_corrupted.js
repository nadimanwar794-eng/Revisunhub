const fs = require('fs');
const file = 'artifacts/iic-study-app-replit/src/components/Store.tsx';
let content = fs.readFileSync(file, 'utf8');

const badLine = "{isCreditSubAllowed {isCreditSubAllowed && !activeDetails.isLifetimePlan && ({isCreditSubAllowed && !activeDetails.isLifetimePlan && ( !activeDetails.isLifetimePlan {isCreditSubAllowed && !activeDetails.isLifetimePlan && ({isCreditSubAllowed && !activeDetails.isLifetimePlan && ( isProTier {isCreditSubAllowed && !activeDetails.isLifetimePlan && ({isCreditSubAllowed && !activeDetails.isLifetimePlan && ( (";
const goodLine = "{isCreditSubAllowed && !activeDetails.isLifetimePlan && isProTier && (";

if (content.includes(badLine)) {
  content = content.replace(badLine, goodLine);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Fixed corrupted line!");
} else {
  console.log("Bad line not found.");
}
