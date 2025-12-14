const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api'; // Adjust port if needed

async function testAxiosRegister() {
  try {
    console.log('🧪 Testing Axios Register Request...\n');
    
    // Test data matching your exact request
    const testData = {
      email: "bhai@gmail.com",
      name: "tushar",
      password: "12345678",
      preferredLanguage: "hinglish",
      role: "user",
      phone: "+91-8155980336",
      address: "India"
    };

    console.log('📤 Sending request with data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n📡 Request headers will be:');
    console.log('Content-Type: application/json (auto-set by axios)');
    
    const response = await axios.post(`${BASE_URL}/auth/register`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Success! Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ Error occurred:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      if (error.response.data.errors) {
        console.log('\n📋 Detailed validation errors:');
        error.response.data.errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.path}: ${err.msg}`);
        });
      }
    } else {
      console.log('Error message:', error.message);
    }
  }
}

testAxiosRegister();

