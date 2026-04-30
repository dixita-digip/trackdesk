const fs = require('fs');
const p = 'd:/Projects/system-tracking-web/src/TasksPage.jsx';
let txt = fs.readFileSync(p, 'utf8');

const rx1 = /maxWidth="lg"[\s\S]*?width: \{\s*xs: '100%',\s*md: 1100,\s*lg: 1200\s*\},[\s\S]*?flexDirection: 'column',\s*\},[\s\S]*?\}\}/;
txt = txt.replace(rx1, `maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: { xs: '100vh', md: 'auto' },
            maxHeight: { xs: 'none', md: '90vh' },
            borderRadius: { xs: 0, md: '16px' },
            bgcolor: DIALOG_BG,
            color: TEXT_PRIMARY,
            border: \`1px solid \${BORDER_SUBTLE}\`,
            backgroundImage: 'none',
            boxShadow: '0 24px 64px rgba(30, 27, 75, 0.16), 0 0 0 1px rgba(124, 58, 237, 0.08)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}`);

const rx2 = /\{\s*editingId != null \? \([\s\S]*?\) : \(\s*<>/;
txt = txt.replace(rx2, '<>');

const rx3 = /\s*<\/>\s*\)\}\s*<\/Dialog>/;
txt = txt.replace(rx3, '\n        </>\n      </Dialog>');

fs.writeFileSync(p, txt, 'utf8');
console.log('done');
