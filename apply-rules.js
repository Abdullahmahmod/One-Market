/**
 * Apply Firebase Security Rules
 * ==============================
 * Deploys security rules to Firebase Realtime Database
 * 
 * Usage: node apply-rules.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

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

// Read local security rules file
const rulesPath = path.join(__dirname, 'firebase-rules.json');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');
const rules = JSON.parse(rulesContent);

// Set up initial admin users in database
async function setupAdminUsers() {
  try {
    console.log('⏳ Setting up admin users in database...');
    
    const db = admin.database();
    
    // Get the list of admin emails from Firebase Auth
    const listUsersResult = await admin.auth().listUsers(100);
    const adminEmails = ['admin@one-market.com', 'abdullahmahmoud402@gmail.com'];
    
    for (const user of listUsersResult.users) {
      if (adminEmails.includes(user.email)) {
        // Check if user has admin claim
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.admin === true) {
          // Set user as admin in database
          await db.ref(`users/${user.uid}`).update({
            email: user.email,
            isAdmin: true,
            lastUpdated: admin.database.ServerValue.TIMESTAMP
          });
          console.log(`✅ Set admin for: ${user.email}`);
        }
      }
    }
    
  } catch (error) {
    console.error('⚠️ Warning setting up admin users:', error.message);
  }
}

// Apply rules
async function applyRules() {
  try {
    console.log('⏳ Applying Firebase Security Rules...\n');
    
    // First set up admin users
    await setupAdminUsers();
    
    console.log('\n⏳ Updating database rules...');
    
    // In real Firebase, rules are deployed via firebase-tools CLI
    // This is just showing what rules would be applied
    console.log('📋 Security Rules to be applied:\n');
    console.log(JSON.stringify(rules, null, 2));
    
    console.log('\n✅ Rules configuration ready');
    console.log('⚠️  To apply these rules, use Firebase CLI:\n');
    console.log('   firebase deploy --only database\n');
    console.log('Or manually update them at:');
    console.log('   https://console.firebase.google.com/project/one-market-af394/database/rules\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyRules();
