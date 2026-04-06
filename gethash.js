const cp = require('child_process');
try {
  const t = new Date('2026-04-06T16:00:00+05:30'); 
  // Get git log with dates for parsing
  const log = cp.execSync('git log --pretty=format:"%H|%cd|%s" --date=iso').toString();
  const lines = log.split('\n');
  let restoreHash = '';
  let restoreLine = '';
  for(const line of lines) {
    const parts = line.split('|');
    if (parts.length >= 2) {
      const commitDate = new Date(parts[1]);
      if (commitDate <= t) {
        restoreHash = parts[0];
        restoreLine = line;
        break;
      }
    }
  }
  console.log('HASH_TO_RESTORE:', restoreHash);
  console.log('INFO:', restoreLine);
} catch (e) {
  console.error(e);
}
