import https from 'https';
import fs from 'fs';

const state = JSON.parse(fs.readFileSync('C:/Users/ytata/.expo/state.json', 'utf8'));
const EXPO_TOKEN = state.auth?.sessionSecret || '';

const ACCOUNT_ID = 'bf3bb3b4-0e22-4101-91c8-c5f9225fd441';
const APPLE_TEAM_ID = '93591229-e4fd-43eb-b960-d2f9b74909eb'; // Expo internal ID
const PUSH_APP_ID = '6bb9b696-be28-40e8-a06b-dda93652e07c'; // push-notify project
const AIMENSETU_APP_ID = '98f0ca5f-197c-4c1a-92a3-98aa4dce2bd3'; // AImensetu project

// Already created
const PUSH_APPLE_APP_IDENTIFIER_ID = 'b43931f4-7e0b-4fd1-bc16-c2d92c64cdee';
const PUSH_IOS_APP_CREDENTIALS_ID = 'c68eccc6-d217-4cbe-a272-6df88b76d9da';
const DIST_CERT_ID = 'ccd9890e-12ca-4a9e-879b-aad466b1d4af'; // shared

function graphql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
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
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch(e) {
          reject(new Error(body));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== Step 1: Get AImensetu build credentials (including provisioning profile) ===');

  // Query AImensetu's full credentials to understand structure
  const aimensetuCreds = await graphql(`
    query {
      app {
        byId(appId: "${AIMENSETU_APP_ID}") {
          id
          slug
          iosAppCredentials {
            id
            iosAppBuildCredentialsList {
              id
              iosDistributionType
              distributionCertificate {
                id
                certificateP12
                certificatePassword
                serialNumber
                validityNotAfter
              }
              provisioningProfile {
                id
                provisioningProfile
                developerPortalIdentifier
                status
                expiration
              }
            }
          }
        }
      }
    }
  `);

  console.log(JSON.stringify(aimensetuCreds, null, 2));

  if (aimensetuCreds.errors) {
    console.error('Error getting AImensetu creds:', aimensetuCreds.errors);
    return;
  }

  const buildCreds = aimensetuCreds?.data?.app?.byId?.iosAppCredentials?.[0]?.iosAppBuildCredentialsList;
  if (!buildCreds || buildCreds.length === 0) {
    console.error('No build credentials found for AImensetu');
    return;
  }

  // Find the ad-hoc (internal) build credentials
  const adHocCreds = buildCreds.find(c => c.iosDistributionType === 'AD_HOC') || buildCreds[0];
  console.log('\n=== AImensetu Ad-Hoc credentials ===');
  console.log('Distribution type:', adHocCreds.iosDistributionType);
  console.log('Dist cert ID:', adHocCreds.distributionCertificate?.id);
  console.log('Provisioning profile ID:', adHocCreds.provisioningProfile?.id);
  console.log('Provisioning profile status:', adHocCreds.provisioningProfile?.status);

  const distCert = adHocCreds.distributionCertificate;
  const provProfile = adHocCreds.provisioningProfile;

  if (!distCert || !provProfile) {
    console.error('Missing certificate or provisioning profile');
    return;
  }

  // Step 2: Create provisioning profile for push-notify using same cert
  console.log('\n=== Step 2: Create provisioning profile for push-notify ===');

  const createProvProfile = await graphql(`
    mutation CreateIosProvisioningProfile($input: CreateIosProvisioningProfileInput!) {
      iosProvisioningProfile {
        createIosProvisioningProfile(iosProvisioningProfileInput: $input) {
          id
          status
          expiration
        }
      }
    }
  `, {
    input: {
      accountId: ACCOUNT_ID,
      appleProvisioningProfile: provProfile.provisioningProfile,
      appleAppIdentifierId: PUSH_APPLE_APP_IDENTIFIER_ID
    }
  });

  console.log('Create provisioning profile result:', JSON.stringify(createProvProfile, null, 2));

  let provProfileId;
  if (createProvProfile.errors) {
    console.log('Trying alternative approach...');

    // Try creating directly with the profile data
    const altCreate = await graphql(`
      mutation {
        iosProvisioningProfile {
          createIosProvisioningProfile(iosProvisioningProfileInput: {
            accountId: "${ACCOUNT_ID}"
            appleProvisioningProfile: "${provProfile.provisioningProfile}"
          }) {
            id
          }
        }
      }
    `);
    console.log('Alt result:', JSON.stringify(altCreate, null, 2));
    provProfileId = altCreate?.data?.iosProvisioningProfile?.createIosProvisioningProfile?.id;
  } else {
    provProfileId = createProvProfile?.data?.iosProvisioningProfile?.createIosProvisioningProfile?.id;
  }

  if (!provProfileId) {
    console.log('\n=== Trying Step 2b: Reuse existing provisioning profile ID directly ===');
    provProfileId = provProfile.id;
    console.log('Using AImensetu provisioning profile ID:', provProfileId);
  }

  // Step 3: Create IosAppBuildCredentials for push-notify
  console.log('\n=== Step 3: Create IosAppBuildCredentials ===');

  const createBuildCreds = await graphql(`
    mutation CreateIosAppBuildCredentials($input: IosAppBuildCredentialsInput!) {
      iosAppBuildCredentials {
        createIosAppBuildCredentials(
          iosAppCredentialsId: "${PUSH_IOS_APP_CREDENTIALS_ID}"
          iosAppBuildCredentialsInput: $input
        ) {
          id
          iosDistributionType
          distributionCertificate {
            id
          }
          provisioningProfile {
            id
          }
        }
      }
    }
  `, {
    input: {
      iosDistributionType: 'AD_HOC',
      distributionCertificateId: distCert.id,
      provisioningProfileId: provProfileId
    }
  });

  console.log('Create build credentials result:', JSON.stringify(createBuildCreds, null, 2));

  if (createBuildCreds.data) {
    console.log('\n=== SUCCESS! Build credentials created ===');
    console.log('Now try: npx eas build --platform ios --profile preview --non-interactive');
  }

  // Step 4: Verify push-notify credentials
  console.log('\n=== Step 4: Verify push-notify credentials ===');
  const verify = await graphql(`
    query {
      app {
        byId(appId: "${PUSH_APP_ID}") {
          id
          slug
          iosAppCredentials {
            id
            iosAppBuildCredentialsList {
              id
              iosDistributionType
              distributionCertificate {
                id
                serialNumber
              }
              provisioningProfile {
                id
                status
              }
            }
          }
        }
      }
    }
  `);

  console.log(JSON.stringify(verify, null, 2));
}

main().catch(console.error);
