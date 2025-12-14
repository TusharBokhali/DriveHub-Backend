// Helper script to check your current IP address for MongoDB Atlas whitelist
const https = require('https');

console.log('🔍 Checking your current IP address for MongoDB Atlas whitelist...\n');

// Method 1: Check using ipify API
https.get('https://api.ipify.org?format=json', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const ipInfo = JSON.parse(data);
      console.log('✅ Your Current IP Address:', ipInfo.ip);
      console.log('\n📋 Next Steps:');
      console.log('1. Go to MongoDB Atlas: https://cloud.mongodb.com/');
      console.log('2. Select your cluster');
      console.log('3. Go to "Network Access" (left sidebar)');
      console.log('4. Click "Add IP Address"');
      console.log(`5. Enter: ${ipInfo.ip}`);
      console.log('6. Click "Confirm"');
      console.log('\n💡 OR for development, you can allow all IPs:');
      console.log('   Enter: 0.0.0.0/0 (NOT recommended for production)');
      console.log('\n⏳ Wait 1-2 minutes after adding IP, then restart your server.');
    } catch (err) {
      console.error('❌ Error parsing IP response:', err.message);
      showManualInstructions();
    }
  });
}).on('error', (err) => {
  console.error('❌ Error fetching IP:', err.message);
  showManualInstructions();
});

function showManualInstructions() {
  console.log('\n📋 Manual Instructions:');
  console.log('1. Go to: https://www.whatismyip.com/');
  console.log('2. Copy your IP address');
  console.log('3. Go to MongoDB Atlas → Network Access → Add IP Address');
  console.log('4. Paste your IP and confirm');
  console.log('\n💡 For development, you can use: 0.0.0.0/0 (allows all IPs)');
}

