const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Remove JSX comments {/* ... */}
    content = content.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');

    // Remove block comments /* ... */
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single line comments // ...
    // Regex explanation:
    // (?:^|[^:]|\b) -> Matches start of line, or character that is not a colon (to avoid http://), or word boundary
    // \/\/.* -> Matches // followed by rest of line
    // We use a state machine or simpler regex to be safe
    const lines = content.split('\n');
    const newLines = lines.map(line => {
        // Find // that is not preceded by :
        const idx = line.indexOf('//');
        if (idx !== -1) {
            // check if it's part of http:// or https://
            if (idx > 0 && line[idx - 1] === ':') {
                return line;
            }
            // check if it's inside quotes? We'll just assume it's a comment
            return line.substring(0, idx).trimEnd();
        }
        return line;
    });

    content = newLines.filter(line => line.trim() !== '' || line === '').join('\n'); // keep empty lines? Maybe clean up double empty lines.
    content = content.replace(/\n{3,}/g, '\n\n'); // replace 3+ newlines with 2

    fs.writeFileSync(file, content);
}

console.log('Comments removed from all .ts and .tsx files in src/');
