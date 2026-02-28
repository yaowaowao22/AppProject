import { parseArgs } from 'node:util';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const { values } = parseArgs({
  options: {
    apps: { type: 'string', short: 'a' },
    all: { type: 'boolean', default: false },
    platform: { type: 'string', short: 'p', default: 'all' },
    profile: { type: 'string', default: 'production' },
  },
  strict: true,
});

const ROOT = path.resolve(__dirname, '..');
const appsDir = path.join(ROOT, 'apps');

let appNames: string[];

if (values.all) {
  appNames = fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
} else if (values.apps) {
  appNames = values.apps.split(',').map((s) => s.trim());
} else {
  console.error('Error: Specify --apps "app1,app2" or --all');
  process.exit(1);
}

const platform = values.platform!;
const profile = values.profile!;

console.log(`\nBatch build starting...`);
console.log(`  Apps:     ${appNames.join(', ')}`);
console.log(`  Platform: ${platform}`);
console.log(`  Profile:  ${profile}\n`);

interface BuildResult {
  app: string;
  status: 'success' | 'failed';
  error?: string;
}

const results: BuildResult[] = [];

for (const appName of appNames) {
  const appPath = path.join(appsDir, appName);

  if (!fs.existsSync(appPath)) {
    console.log(`[SKIP] ${appName} - directory not found`);
    results.push({ app: appName, status: 'failed', error: 'Directory not found' });
    continue;
  }

  console.log(`[BUILD] ${appName} (${platform}/${profile})...`);

  try {
    execSync(`npx eas build --platform ${platform} --profile ${profile} --non-interactive`, {
      cwd: appPath,
      stdio: 'inherit',
      timeout: 600000, // 10 minutes timeout
    });
    results.push({ app: appName, status: 'success' });
    console.log(`[DONE] ${appName}\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ app: appName, status: 'failed', error: message });
    console.error(`[FAIL] ${appName}: ${message}\n`);
  }
}

// Summary
console.log('\n=== Build Summary ===');
const succeeded = results.filter((r) => r.status === 'success');
const failed = results.filter((r) => r.status === 'failed');

console.log(`  Total:     ${results.length}`);
console.log(`  Succeeded: ${succeeded.length}`);
console.log(`  Failed:    ${failed.length}`);

if (failed.length > 0) {
  console.log('\nFailed apps:');
  for (const f of failed) {
    console.log(`  - ${f.app}: ${f.error}`);
  }
}

process.exit(failed.length > 0 ? 1 : 0);
