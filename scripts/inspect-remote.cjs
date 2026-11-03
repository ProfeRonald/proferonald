// Read-only inspection. Credentials stay in memory; existing rules are backed up locally.
const fs = require('node:fs');
const path = require('node:path');
async function main() {
  const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config/configstore/firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const cli = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
  const token = await cli.getAccessToken(config.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/firebase.database', 'https://www.googleapis.com/auth/userinfo.email']);
  const headers = { Authorization: `Bearer ${token.access_token}` };
  fs.mkdirSync('.local/remote-rules', { recursive: true });
  const requests = {
    database: 'https://proferonald-fb-default-rtdb.firebaseio.com/.settings/rules.json',
    storage: 'https://firebaserules.googleapis.com/v1/projects/proferonald-fb/releases/firebase.storage/proferonald-fb.appspot.com'
  };
  for (const [name, url] of Object.entries(requests)) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    console.log(`${name}: HTTP ${response.status}`);
    if (!response.ok) continue;
    const data = await response.json();
    if (name === 'database') {
      fs.writeFileSync('.local/remote-rules/database.json', JSON.stringify(data, null, 2));
      console.log('database: rules backed up; inspect the saved expressions before assessing access.');
    } else {
      const rules = await fetch(`https://firebaserules.googleapis.com/v1/${data.rulesetName}`, { headers, signal: AbortSignal.timeout(20000) });
      if (rules.ok) {
        const result = await rules.json();
        fs.writeFileSync('.local/remote-rules/storage.json', JSON.stringify(result, null, 2));
        console.log('storage: rules backed up');
      } else console.log(`storage ruleset: HTTP ${rules.status}`);
    }
  }
}
main().catch(() => { console.error('Remote inspection unavailable; no remote changes made.'); process.exitCode = 1; });
