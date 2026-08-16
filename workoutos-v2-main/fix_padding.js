const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walk('d:\\Workout OS\\src\\app').filter(f => f.endsWith('.tsx'));
let count = 0;

files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    
    // Replace "p-6" with "p-4 sm:p-5" to make it more compact.
    // Also replace "p-5 sm:p-6" with "p-4 sm:p-5"
    let nc = c
        .replace(/p-5 sm:p-6/g, 'p-4 sm:p-5')
        .replace(/(?<=\s|["'`])p-6(?=\s|["'`])/g, 'p-4 sm:p-5')
        // Let's also compact rounded-[2rem] and rounded-3xl to rounded-2xl or xl
        .replace(/rounded-\[2rem\]/g, 'rounded-2xl')
        .replace(/rounded-3xl/g, 'rounded-2xl')
        // And space-y-6 to space-y-4
        .replace(/space-y-6/g, 'space-y-4');

    if(c !== nc) {
        fs.writeFileSync(f, nc);
        count++;
        console.log('Updated: ' + f);
    }
});

console.log('Total updated: ' + count);
