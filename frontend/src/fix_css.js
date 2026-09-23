const fs = require('fs');
let css = fs.readFileSync('index.css', 'utf8');

// Replace ~=" with *=" to catch opacity/hover variants globally!
css = css.replace(/\[class~="/g, '[class*="');

// Add specific explicit :hover rules for all colors in THEME_COLORS to prevent light-theme hover bleeding
const colors = ['slate', 'rose', 'orange', 'amber', 'emerald', 'teal', 'cyan', 'blue', 'indigo', 'purple', 'fuchsia'];
let hoverRules = "\n/* FIX HOVER BLEEDING SELECTION */\n";
for (const color of colors) {
    if (color === 'emerald') {
        hoverRules += `html.dark-theme [class*="hover:bg-emerald-50"]:hover { background-color: #022c22 !important; }\n`;
        hoverRules += `html.dark-theme [class*="hover:text-emerald-600"]:hover { color: #10b981 !important; }\n`;
    } else if (color === 'rose') {
        hoverRules += `html.dark-theme [class*="hover:bg-rose-50"]:hover { background-color: #4c0519 !important; }\n`;
        hoverRules += `html.dark-theme [class*="hover:text-rose-600"]:hover { color: #f43f5e !important; }\n`;
    } else if (color === 'slate') {
        hoverRules += `html.dark-theme [class*="hover:bg-slate-50"]:hover { background-color: #1e293b !important; }\n`;
        hoverRules += `html.dark-theme [class*="hover:text-slate-600"]:hover { color: #cbd5e1 !important; }\n`;
    } else {
        // generic dark mode for 50/lightBg mapping (indigo and others)
        hoverRules += `html.dark-theme [class*="hover:bg-${color}-50"]:hover { background-color: #1e1b4b !important; }\n`;
        hoverRules += `html.dark-theme [class*="hover:text-${color}-600"]:hover { color: #818cf8 !important; }\n`;
    }
}

css += hoverRules;

fs.writeFileSync('index.css', css);
console.log("CSS Updated successfully!");
