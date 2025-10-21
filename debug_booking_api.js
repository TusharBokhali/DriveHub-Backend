const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';

async function debugBookingAPI() {
  try {
    console.log('🐛 Debugging Booking API...\n');

    // Step 1: Get authentication token
    console.log('1. Getting authentication token...');
    let authToken;
    let userRole;
    
    try {
      // Try to login first
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      authToken = loginResponse.data.data.token;
      userRole = loginResponse.data.data.user.role;
      console.log('✅ Login successful');
      console.log('👤 User role:', userRole);
    } catch (loginError) {
      // If login fails, try to register
      console.log('Login failed, trying to register...');
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      authToken = registerResponse.data.data.token;
      userRole = registerResponse.data.data.user.role;
      console.log('✅ Registration successful');
      console.log('👤 User role:', userRole);
    }

    // Step 2: Test the exact endpoint you're using
    console.log('\n2. Testing booking list endpoint...');
    console.log('🔗 Endpoint: GET /api/bookings/list');
    console.log('🔑 Token:', authToken.substring(0, 20) + '...');
    console.log('👤 User role:', userRole);
    
    try {
      const response = await axios.get(`${BASE_URL}/bookings/list`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        params: {
          page: 1,
          limit: 5
        }
      });
      
      console.log('✅ SUCCESS!');
      console.log('📊 Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ ERROR!');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      console.log('Full Error:', JSON.stringify(error.response?.data, null, 2));
      
      // Check if it's a role issue
      if (error.response?.data?.message?.includes('client role required')) {
        console.log('\n🔍 DIAGNOSIS: You are hitting an endpoint that requires client role');
        console.log('💡 SOLUTION: Make sure you are using the correct endpoint:');
        console.log('   ✅ Correct: GET /api/bookings/list');
        console.log('   ❌ Wrong: GET /api/bookings/owner/requests');
      }
    }

    // Step 3: Test alternative endpoints
    console.log('\n3. Testing alternative endpoints...');
    
    const endpoints = [
      { url: '/bookings/me', name: 'Simple user bookings' },
      { url: '/bookings/list', name: 'Advanced booking list' },
      { url: '/bookings/owner/requests', name: 'Owner bookings (requires client role)' }
    ];

    for (const endpoint of endpoints) {
      console.log(`\n   Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      try {
        const response = await axios.get(`${BASE_URL}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        console.log(`   ✅ Success: ${response.data.message}`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

    // Step 4: Show correct usage
    console.log('\n4. Correct Usage Examples:');
    console.log('\n📝 For regular users (role: user):');
    console.log('   GET /api/bookings/me - Simple booking list');
    console.log('   GET /api/bookings/list - Advanced booking list with filters');
    console.log('   GET /api/bookings/:id - Get specific booking');
    
    console.log('\n📝 For clients (role: client):');
    console.log('   GET /api/bookings/me - Simple booking list');
    console.log('   GET /api/bookings/list - Advanced booking list with filters');
    console.log('   GET /api/bookings/owner/requests - Owner-specific bookings');
    console.log('   GET /api/bookings/:id - Get specific booking');

    console.log('\n🎉 Debug completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the debug
debugBookingAPI();
