import https from 'https';
import fs from 'fs';

const state = JSON.parse(fs.readFileSync('C:/Users/ytata/.expo/state.json', 'utf8'));
const EXPO_TOKEN = state.auth?.sessionSecret || '';
const WRONG_BUILD_CREDS_ID = '849f0f3b-12e1-43d8-bc93-ec2e804ef806';

function graphql(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    const req = https.request({
      hostname: 'api.expo.dev',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'expo-session': EXPO_TOKEN,
        'Content-Length': Buffer.byteLength(data)
      }
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
  console.log('Deleting wrong build credentials...');
  const result = await graphql(`
    mutation {
      iosAppBuildCredentials {
        deleteIosAppBuildCredentials(id: "${WRONG_BUILD_CREDS_ID}") {
          id
        }
      }
    }
  `);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
