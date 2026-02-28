import { parseArgs } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';

const TEMPLATES = ['utility', 'lifestyle', 'game'] as const;
type Template = (typeof TEMPLATES)[number];

const PRESETS = [
  'warm-orange',
  'monochrome',
  'ocean-blue',
  'forest-green',
  'sunset-purple',
  'sakura-pink',
  'midnight-navy',
  'earth-brown',
  'neon-cyber',
  'pastel-dream',
  'mint-fresh',
  'coral-reef',
] as const;

const PRESET_IMPORT_MAP: Record<string, string> = {
  'warm-orange': 'presetWarmOrange',
  monochrome: 'presetMonochrome',
  'ocean-blue': 'presetOceanBlue',
  'forest-green': 'presetForestGreen',
  'sunset-purple': 'presetSunsetPurple',
  'sakura-pink': 'presetSakuraPink',
  'midnight-navy': 'presetMidnightNavy',
  'earth-brown': 'presetEarthBrown',
  'neon-cyber': 'presetNeonCyber',
  'pastel-dream': 'presetPastelDream',
  'mint-fresh': 'presetMintFresh',
  'coral-reef': 'presetCoralReef',
};

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    name: { type: 'string', short: 'n' },
    template: { type: 'string', short: 't', default: 'utility' },
    theme: { type: 'string', default: 'ocean-blue' },
    bundleId: { type: 'string', short: 'b' },
    displayName: { type: 'string', short: 'd' },
  },
  strict: false,
});

// Validate inputs
if (!values.name) {
  console.error('Error: --name is required');
  console.error(
    'Usage: pnpm run create-app -- --name my-app --template utility --theme ocean-blue --displayName "My App" --bundleId com.massapp.myapp'
  );
  process.exit(1);
}

const appName = values.name;
const template = values.template as Template;
const themeName = values.theme!;
const displayName = values.displayName || appName;
const bundleId = values.bundleId || `com.massapp.${appName.replace(/-/g, '')}`;

if (!TEMPLATES.includes(template)) {
  console.error(`Error: Invalid template "${template}". Available: ${TEMPLATES.join(', ')}`);
  process.exit(1);
}

if (!PRESETS.includes(themeName as any)) {
  console.error(`Error: Invalid theme "${themeName}". Available: ${PRESETS.join(', ')}`);
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const templateDir = path.join(ROOT, 'templates', `template-${template}`);
const appDir = path.join(ROOT, 'apps', appName);

if (fs.existsSync(appDir)) {
  console.error(`Error: App directory already exists: ${appDir}`);
  process.exit(1);
}

if (!fs.existsSync(templateDir)) {
  console.error(`Error: Template directory not found: ${templateDir}`);
  process.exit(1);
}

// Copy template directory recursively
function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and .expo
      if (entry.name === 'node_modules' || entry.name === '.expo') continue;
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log(`\nCreating app "${appName}" from template "${template}"...`);
copyDir(templateDir, appDir);

// Replace placeholders in all text files
const PLACEHOLDERS: Record<string, string> = {
  __APP_NAME__: appName,
  __APP_DISPLAY_NAME__: displayName,
  __BUNDLE_ID__: bundleId,
};

const TEXT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];

function processFile(filePath: string) {
  const ext = path.extname(filePath);
  if (!TEXT_EXTENSIONS.includes(ext)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  for (const [placeholder, replacement] of Object.entries(PLACEHOLDERS)) {
    if (content.includes(placeholder)) {
      content = content.replaceAll(placeholder, replacement);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

function processDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

processDir(appDir);

// Update theme.ts with the selected preset
const presetImport = PRESET_IMPORT_MAP[themeName];
const themePath = path.join(appDir, 'src', 'theme.ts');
if (fs.existsSync(themePath)) {
  const themeContent = `import { ${presetImport} } from '@massapp/ui';
import type { ThemeConfig } from '@massapp/ui';

// Change preset or customize to give your app a unique look
export const theme: ThemeConfig = {
  ...${presetImport},
  name: '${appName}',
};
`;
  fs.writeFileSync(themePath, themeContent, 'utf-8');
}

// Create placeholder asset files (1x1 transparent PNG)
const assetsDir = path.join(appDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Valid 1x1 white PNG (placeholder)
const PLACEHOLDER_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c626000000002000198e195b70000000049454e44ae426082',
  'hex'
);

const assetFiles = ['icon.png', 'splash-icon.png', 'adaptive-icon.png', 'favicon.png'];
for (const file of assetFiles) {
  const assetPath = path.join(assetsDir, file);
  if (!fs.existsSync(assetPath)) {
    fs.writeFileSync(assetPath, PLACEHOLDER_PNG);
  }
}

// Create eas.json
const easJson = {
  cli: {
    version: '>= 15.0.0',
  },
  build: {
    development: {
      developmentClient: true,
      distribution: 'internal',
      ios: {
        simulator: true,
      },
    },
    preview: {
      distribution: 'internal',
      android: {
        buildType: 'apk',
      },
    },
    production: {
      autoIncrement: true,
    },
  },
  submit: {
    production: {},
  },
};

fs.writeFileSync(path.join(appDir, 'eas.json'), JSON.stringify(easJson, null, 2) + '\n', 'utf-8');

console.log(`
App created successfully!

  Location: apps/${appName}/
  Template: ${template}
  Theme:    ${themeName} (${presetImport})
  Bundle:   ${bundleId}

Next steps:
  1. Update ad unit IDs in apps/${appName}/src/ads.config.ts
  2. Customize theme in apps/${appName}/src/theme.ts
  3. Replace placeholder icons in apps/${appName}/assets/
  4. Start developing:
     pnpm --filter @massapp/${appName} start
`);
