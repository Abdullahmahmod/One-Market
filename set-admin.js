/**
 * Set Admin Claims for Firebase User
 * ==================================
 * This script adds admin privileges to a Firebase user
 * 
 * Usage: node set-admin.js <email>
 * Example: node set-admin.js admin@one-market.com
 */

const admin = require('firebase-admin');
const path = require('path');

// Path to service account key
const serviceAccountPath = path.join(__dirname, 'admin', 'one-market-af394-firebase-adminsdk-fbsvc-d10aaf727b.json');
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://one-market-af394-default-rtdb.europe-west1.firebasedatabase.app'
  });
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  process.exit(1);
}

// Get email or UID from command line arguments
const emailOrUid = process.argv[2];

if (!emailOrUid) {
  console.error('❌ Please provide an email address or UID');
  console.log('Usage: node set-admin.js <email|uid>');
  console.log('Example: node set-admin.js admin@one-market.com');
  console.log('Or: node set-admin.js WDVTm2XplnSfuYvfbo3mH4TDM1t1');
  process.exit(1);
}

// Set custom claims
async function setAdminClaims() {
  try {
    console.log(`⏳ Setting admin claims for ${emailOrUid}...`);
    
    // Try as UID first, if it looks like an email, use getUser method
    let uid = emailOrUid;
    
    // If it contains @, it's an email - need to find the user first
    if (emailOrUid.includes('@')) {
      try {
        const userRecord = await admin.auth().getUserByEmail(emailOrUid);
        uid = userRecord.uid;
      } catch (error) {
        console.error(`❌ User not found by email: ${emailOrUid}`);
        process.exit(1);
      }
    }
    
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    
    console.log(`✅ Admin claims set successfully`);
    console.log(`   Email/UID: ${emailOrUid}`);
    console.log(`   UID: ${uid}`);
    console.log('');
    console.log('ℹ️  Next steps:');
    console.log('1. User should logout and login again');
    console.log('2. The ID token will now include admin: true claim');
    console.log('3. Access to dashboard will be granted');
    
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

setAdminClaims();
