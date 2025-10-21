const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'password123'
};

const updatedProfile = {
  name: 'Updated Test User',
  email: 'updated@example.com',
  phone: '+91-9876543210',
  address: 'Test Address, Test City'
};

async function testAPIs() {
  try {
    console.log('🚀 Starting API Tests...\n');

    // 1. Register a test user
    console.log('1. Testing User Registration...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ Registration successful:', registerResponse.data.message);
      authToken = registerResponse.data.data.token;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already registered')) {
        console.log('ℹ️  User already exists, trying to login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        authToken = loginResponse.data.data.token;
        console.log('✅ Login successful');
      } else {
        throw error;
      }
    }

    // 2. Test Profile Update API
    console.log('\n2. Testing Profile Update API...');
    const profileUpdateResponse = await axios.put(
      `${BASE_URL}/auth/profile`,
      updatedProfile,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Profile update successful:', profileUpdateResponse.data.message);
    console.log('📋 Updated profile data:', JSON.stringify(profileUpdateResponse.data.data, null, 2));

    // 3. Test Get Profile API
    console.log('\n3. Testing Get Profile API...');
    const getProfileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Get profile successful:', getProfileResponse.data.message);
    console.log('📋 Profile data:', JSON.stringify(getProfileResponse.data.data, null, 2));

    // 4. Test Booking List API
    console.log('\n4. Testing Booking List API...');
    const bookingListResponse = await axios.get(`${BASE_URL}/bookings/list`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        page: 1,
        limit: 10
      }
    });
    console.log('✅ Booking list successful:', bookingListResponse.data.message);
    console.log('📋 Booking list data:', JSON.stringify(bookingListResponse.data.data, null, 2));

    // 5. Test Booking List with filters
    console.log('\n5. Testing Booking List with filters...');
    const filteredBookingResponse = await axios.get(`${BASE_URL}/bookings/list`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        page: 1,
        limit: 5,
        status: 'pending',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    });
    console.log('✅ Filtered booking list successful:', filteredBookingResponse.data.message);
    console.log('📋 Filtered booking data:', JSON.stringify(filteredBookingResponse.data.data, null, 2));

    console.log('\n🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the tests
testAPIs();
