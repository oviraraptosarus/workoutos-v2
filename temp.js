const fs = require('fs');
let content = fs.readFileSync('src/app/workout/components/modals/CreateWorkoutModal.tsx', 'utf8');

// Replacements to support light mode while keeping dark mode identical
content = content.replace(/bg-\[\#111\]/g, 'bg-surface-container-lowest dark:bg-[#111]');
content = content.replace(/border-white\/10/g, 'border-surface-variant dark:border-white/10');
content = content.replace(/border-white\/8/g, 'border-surface-variant dark:border-white/8');
content = content.replace(/border-white\/5/g, 'border-surface-variant dark:border-white/5');
content = content.replace(/bg-white\/5/g, 'bg-surface-container dark:bg-white/5');
content = content.replace(/bg-white\/10/g, 'bg-surface-container-high dark:bg-white/10');
content = content.replace(/text-white\/60/g, 'text-on-surface-variant dark:text-white/60');
content = content.replace(/text-white\/50/g, 'text-on-surface-variant dark:text-white/50');
content = content.replace(/text-white\/40/g, 'text-on-surface-variant dark:text-white/40');
content = content.replace(/text-white\/30/g, 'text-on-surface-variant dark:text-white/30');
content = content.replace(/placeholder-white\/30/g, 'placeholder-on-surface-variant/50 dark:placeholder-white/30');

// Careful with text-white, it might match the ones above if not careful, but we already replaced them.
// Wait, we need to replace text-white only if it's not followed by a slash.
content = content.replace(/text-white(?!\/)/g, 'text-on-surface dark:text-white');

// bg-white -> bg-primary dark:bg-white
content = content.replace(/bg-white(?!\/)/g, 'bg-primary dark:bg-white');

// text-black -> text-on-primary dark:text-black
content = content.replace(/text-black/g, 'text-on-primary dark:text-black');

fs.writeFileSync('src/app/workout/components/modals/CreateWorkoutModal.tsx', content);
console.log('Updated CreateWorkoutModal.tsx');
