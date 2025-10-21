const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';

async function testBookingEndpoints() {
  try {
    console.log('🔍 Testing Booking Endpoints...\n');

    // First, let's register/login to get a token
    console.log('1. Getting authentication token...');
    let authToken;
    
    try {
      // Try to login first
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful');
    } catch (loginError) {
      // If login fails, try to register
      console.log('Login failed, trying to register...');
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      authToken = registerResponse.data.data.token;
      console.log('✅ Registration successful');
    }

    // Test different booking endpoints
    const endpoints = [
      { method: 'GET', url: '/bookings/me', name: 'Get User Bookings (simple)' },
      { method: 'GET', url: '/bookings/list', name: 'Get Booking List (advanced)' },
      { method: 'GET', url: '/bookings/owner/requests', name: 'Get Owner Bookings (requires client role)' }
    ];

    for (const endpoint of endpoints) {
      console.log(`\n2. Testing ${endpoint.name}...`);
      console.log(`   ${endpoint.method} ${endpoint.url}`);
      
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${BASE_URL}${endpoint.url}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          params: endpoint.method === 'GET' && endpoint.url === '/bookings/list' ? {
            page: 1,
            limit: 5
          } : {}
        });
        
        console.log(`   ✅ Success: ${response.data.message}`);
        console.log(`   📊 Data: ${JSON.stringify(response.data.data, null, 2)}`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
          console.log(`   📋 Full Error: ${JSON.stringify(error.response.data, null, 2)}`);
        }
      }
    }

    // Test with different query parameters
    console.log('\n3. Testing Booking List with different parameters...');
    
    const testParams = [
      { page: 1, limit: 10 },
      { page: 1, limit: 5, status: 'pending' },
      { page: 1, limit: 3, sortBy: 'createdAt', sortOrder: 'desc' }
    ];

    for (const params of testParams) {
      console.log(`\n   Testing with params: ${JSON.stringify(params)}`);
      
      try {
        const response = await axios.get(`${BASE_URL}/bookings/list`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          params: params
        });
        
        console.log(`   ✅ Success: Found ${response.data.data.bookings?.length || 0} bookings`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 Endpoint testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the tests
testBookingEndpoints();
