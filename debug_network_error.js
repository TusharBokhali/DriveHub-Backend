const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';

async function debugNetworkError() {
  try {
    console.log('🔍 Debugging Network Error...\n');

    // Step 1: Check if server is running
    console.log('1. Checking if server is running...');
    try {
      const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}`);
      console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server is not running or not accessible');
      console.log('💡 Make sure to start your server with: npm start');
      return;
    }

    // Step 2: Test authentication
    console.log('\n2. Testing authentication...');
    let authToken;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'variyatushar876@gmail.com',
        password: 'password123' // You'll need to provide the correct password
      });
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful');
    } catch (loginError) {
      console.log('❌ Login failed, trying to register...');
      try {
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
          name: 'Tushar',
          email: 'variyatushar876@gmail.com',
          password: 'password123'
        });
        authToken = registerResponse.data.data.token;
        console.log('✅ Registration successful');
      } catch (registerError) {
        console.log('❌ Both login and registration failed');
        console.log('Error:', registerError.response?.data || registerError.message);
        return;
      }
    }

    // Step 3: Test profile update with your exact data
    console.log('\n3. Testing profile update with your data...');
    const profileData = {
      name: 'Tushar',
      email: 'variyatushar876@gmail.com',
      phone: '8155980336'
    };

    console.log('📤 Sending data:', JSON.stringify(profileData, null, 2));

    try {
      const updateResponse = await axios.put(`${BASE_URL}/auth/profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('✅ Profile update successful!');
      console.log('📊 Response:', JSON.stringify(updateResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Profile update failed');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      console.log('Full Error:', JSON.stringify(error.response?.data, null, 2));
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\n💡 SOLUTION: Server is not running');
        console.log('   Run: npm start');
      } else if (error.code === 'ENOTFOUND') {
        console.log('\n💡 SOLUTION: Check your API URL');
        console.log('   Make sure BASE_URL is correct');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('\n💡 SOLUTION: Request timed out');
        console.log('   Check server performance or increase timeout');
      }
    }

    // Step 4: Test with FormData (like your _parts format)
    console.log('\n4. Testing with FormData format...');
    try {
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('name', 'Tushar');
      form.append('email', 'variyatushar876@gmail.com');
      form.append('phone', '8155980336');
      
      const formResponse = await axios.put(`${BASE_URL}/auth/profile`, form, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        },
        timeout: 10000
      });
      
      console.log('✅ FormData update successful!');
      console.log('📊 Response:', JSON.stringify(formResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ FormData update failed');
      console.log('Error:', error.response?.data || error.message);
    }

    // Step 5: Show correct frontend implementation
    console.log('\n5. Correct Frontend Implementation:');
    console.log('\n📝 For JSON request:');
    console.log(`
const updateProfile = async (data) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone
      })
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};
    `);

    console.log('\n📝 For FormData request:');
    console.log(`
const updateProfileWithFormData = async (data) => {
  try {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': \`Bearer \${token}\`
        // Don't set Content-Type for FormData
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};
    `);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugNetworkError();
