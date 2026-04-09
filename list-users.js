/**
 * List All Firebase Users
 * ========================
 * Shows all admin users in the Firebase project
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
  console.log('✅ Firebase Admin SDK initialized\n');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  process.exit(1);
}

// List all users
async function listAllUsers() {
  try {
    console.log('📋 Firebase Users:\n');
    let userCount = 0;
    
    const listUsersResult = await admin.auth().listUsers(100);
    
    listUsersResult.users.forEach((user) => {
      userCount++;
      console.log(`${userCount}. Email: ${user.email}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Disabled: ${user.disabled}`);
      console.log(`   Custom Claims: ${JSON.stringify(user.customClaims)}\n`);
    });
    
    if (userCount === 0) {
      console.log('❌ No users found in Firebase\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    process.exit(1);
  }
}

listAllUsers();
