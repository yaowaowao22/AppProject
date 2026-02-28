const fs = require('fs');
const https = require('https');
const path = require('path');

const TWO_FA_CODE = '515299';
const APPLE_ID = 'y.tata02020202@icloud.com';
const APPLE_PASSWORD = 'Takato0202';
const TEAM_ID = 'PVM8Q8HG54';
const BUNDLE_IDENTIFIER = 'com.massapp.pushnotify';

const state = JSON.parse(fs.readFileSync('C:/Users/ytata/.expo/state.json', 'utf8'));
const EXPO_TOKEN = state.auth?.sessionSecret || '';
const PUSH_IOS_APP_CREDENTIALS_ID = 'c68eccc6-d217-4cbe-a272-6df88b76d9da';
const DIST_CERT_ID = 'ccd9890e-12ca-4a9e-879b-aad466b1d4af';

// Force TTY
process.stdin.isTTY = true;
process.stdout.isTTY = true;
process.stderr.isTTY = true;

// Patch the prompts library BEFORE loading apple-utils
const EAS_DIR = 'C:/Users/ytata/AppData/Roaming/npm/node_modules/eas-cli';
const promptsPath = path.join(EAS_DIR, 'node_modules/prompts/index.js');

// Check if prompts exists at this path
let promptsModule;
try {
  promptsModule = require(promptsPath);
} catch(e) {
  // Try finding prompts elsewhere
  try {
    promptsModule = require(path.join(EAS_DIR, 'node_modules/@expo/apple-utils/node_modules/prompts/index.js'));
  } catch(e2) {
    console.log('Looking for prompts module...');
  }
}

// Override the prompts module in require cache
const promptsResolvedPath = require.resolve(promptsPath);
const autoPrompt = async function(questions, options) {
  if (!Array.isArray(questions)) questions = [questions];
  const answers = {};
  for (const q of questions) {
    const msg = typeof q.message === 'function' ? q.message(undefined, {}, q) : q.message || '';
    console.log('[auto]', q.type, ':', msg);

    if (q.type === 'toggle') {
      // "How do you want to validate your account?" -> false = device
      answers[q.name] = false;
      console.log('[answer] device (false)');
    } else if (q.type === 'text' || q.type === 'password' || q.type === 'number' || q.type === 'invisible') {
      if (msg.toLowerCase().includes('code') || msg.toLowerCase().includes('digit')) {
        answers[q.name] = TWO_FA_CODE;
        console.log('[answer] 2FA code');
      } else {
        answers[q.name] = q.initial || '';
        console.log('[answer] default:', q.initial || '');
      }
    } else if (q.type === 'confirm') {
      answers[q.name] = true;
      console.log('[answer] yes');
    } else if (q.type === 'select') {
      answers[q.name] = q.choices?.[0]?.value ?? 0;
      console.log('[answer] first option');
    } else {
      answers[q.name] = q.initial || true;
      console.log('[answer] default');
    }
  }
  return answers;
};

// Copy original prompts properties
if (promptsModule) {
  Object.keys(promptsModule).forEach(key => {
    if (key !== 'default' && typeof promptsModule[key] === 'function') {
      autoPrompt[key] = promptsModule[key];
    }
  });
}

// Replace in require cache
require.cache[promptsResolvedPath] = {
  id: promptsResolvedPath,
  filename: promptsResolvedPath,
  loaded: true,
  exports: autoPrompt
};

// Now load apple-utils (it will use our patched prompts)
const appleUtils = require(path.join(EAS_DIR, 'node_modules/@expo/apple-utils'));
const { Auth, Profile, ProfileType, BundleId, BundleIdPlatform, Certificate, CertificateType, Device } = appleUtils;

function graphql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: 'api.expo.dev', path: '/graphql', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'expo-session': EXPO_TOKEN, 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('=== Creating iOS Provisioning Profile ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in to Apple...');
    const context = await Auth.loginWithUserCredentialsAsync({
      username: APPLE_ID,
      password: APPLE_PASSWORD,
      teamId: TEAM_ID,
    });
    console.log('Login OK!\n');

    // Step 2: Bundle ID
    console.log('Step 2: Finding Bundle ID...');
    let bundleIds = [];
    try {
      bundleIds = await BundleId.getAsync(context, { query: { filter: { identifier: [BUNDLE_IDENTIFIER] } } });
    } catch(e) { console.log('Query error:', e.message); }

    let bundleId;
    if (bundleIds.length > 0) {
      bundleId = bundleIds[0];
      console.log('Found:', bundleId.id);
    } else {
      bundleId = await BundleId.createAsync(context, {
        name: 'Push Notify',
        identifier: BUNDLE_IDENTIFIER,
        platform: BundleIdPlatform.IOS,
      });
      console.log('Created:', bundleId.id);
    }

    // Step 3: Certificate
    console.log('\nStep 3: Getting certificate...');
    let certs = await Certificate.getAsync(context, {
      query: { filter: { certificateType: [CertificateType.IOS_DISTRIBUTION] } }
    });
    if (!certs.length) {
      certs = await Certificate.getAsync(context);
      certs = certs.filter(c => c.attributes?.certificateType?.includes('DISTRIBUTION'));
    }
    const cert = certs[0];
    console.log('Cert:', cert?.id, cert?.attributes?.certificateType);

    // Step 4: Devices
    console.log('\nStep 4: Getting devices...');
    const devices = await Device.getAsync(context);
    console.log('Devices:', devices.length);

    // Step 5: Profile
    console.log('\nStep 5: Creating provisioning profile...');
    const profile = await Profile.createAsync(context, {
      name: `*[expo] ${BUNDLE_IDENTIFIER} AdHoc ${Date.now()}`,
      profileType: ProfileType.IOS_APP_ADHOC,
      bundleIdId: bundleId.id,
      certificateIds: [cert.id],
      deviceIds: devices.map(d => d.id),
    });
    console.log('Profile:', profile.id);
    const content = profile.attributes?.profileContent;
    console.log('Content length:', content?.length || 0);

    if (!content) {
      const full = await Profile.infoAsync(context, { id: profile.id });
      console.log('Full content:', full.attributes?.profileContent?.length || 0);
    }

    if (!content) { console.error('No content!'); return; }

    // Step 6: Upload to Expo
    console.log('\nStep 6: Uploading to Expo...');
    const creds = await graphql(`mutation {
      iosAppBuildCredentials {
        createIosAppBuildCredentials(
          iosAppCredentialsId: "${PUSH_IOS_APP_CREDENTIALS_ID}"
          iosAppBuildCredentialsInput: { iosDistributionType: AD_HOC, distributionCertificateId: "${DIST_CERT_ID}" }
        ) { id }
      }
    }`);
    const credsId = creds?.data?.iosAppBuildCredentials?.createIosAppBuildCredentials?.id;
    console.log('Creds ID:', credsId);
    if (!credsId) { console.error(JSON.stringify(creds)); return; }

    const upload = await graphql(`mutation($input: AppleProvisioningProfileInput!) {
      iosAppBuildCredentials {
        setProvisioningProfile(iosAppBuildCredentialsId: "${credsId}", provisioningProfileInput: $input) {
          id provisioningProfile { id status }
        }
      }
    }`, { input: { appleProvisioningProfile: content, developerPortalIdentifier: profile.id } });

    console.log(JSON.stringify(upload, null, 2));
    if (upload.data) console.log('\n=== SUCCESS! ===');

  } catch (err) {
    console.error('\nERROR:', err.message);
    // Don't print full stack (it's huge minified code)
  }
}

main();
