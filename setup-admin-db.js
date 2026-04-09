/**
 * Set up Admin Users in Firebase Database
 * ========================================
 * Creates admin user entries in the database so rules recognize them as admins
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

// Set up admin users
async function setupAdminUsers() {
  try {
    console.log('⏳ Setting up admin users in Realtime Database...\n');
    
    const db = admin.database();
    const adminEmails = ['admin@one-market.com', 'abdullahmahmoud402@gmail.com'];
    
    const listUsersResult = await admin.auth().listUsers(100);
    
    for (const user of listUsersResult.users) {
      if (adminEmails.includes(user.email)) {
        // Create admin user entry in database
        await db.ref(`users/${user.uid}`).set({
          email: user.email,
          isAdmin: true,
          role: 'admin',
          createdAt: admin.database.ServerValue.TIMESTAMP
        });
        
        console.log(`✅ Admin user registered: ${user.email}`);
        console.log(`   UID: ${user.uid}\n`);
      }
    }
    
    console.log('✅ Admin setup complete!\n');
    console.log('📋 Next: Apply database security rules\n');
    console.log('Option 1 - Using Firebase CLI (Recommended):');
    console.log('   firebase deploy --only database\n');
    console.log('Option 2 - Manual update:');
    console.log('   1. Go to: https://console.firebase.google.com/project/one-market-af394/database/rules');
    console.log('   2. Copy the content from firebase-rules.json');
    console.log('   3. Paste and click "Publish"\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupAdminUsers();
