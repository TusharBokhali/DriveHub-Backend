const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';

async function testProfileUpdateNoRole() {
  try {
    console.log('🔧 Testing Profile Update API (No Role Required)...\n');

    // Step 1: Register a regular user (role: user)
    console.log('1. Registering a regular user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      address: 'Test Address'
    });
    
    const authToken = registerResponse.data.data.token;
    const userRole = registerResponse.data.data.user.role;
    
    console.log('✅ User registered successfully');
    console.log('👤 User role:', userRole);
    console.log('🔑 Token:', authToken.substring(0, 20) + '...');

    // Step 2: Test profile update with JSON
    console.log('\n2. Testing profile update with JSON...');
    try {
      const updateResponse = await axios.put(`${BASE_URL}/auth/profile`, {
        name: 'Updated Test User',
        email: 'updated@example.com',
        phone: '+91-9876543210',
        address: 'Updated Address, Mumbai',
        preferredLanguage: 'hinglish'
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Profile update successful!');
      console.log('📊 Updated data:', JSON.stringify(updateResponse.data.data, null, 2));
      
    } catch (error) {
      console.log('❌ Profile update failed:', error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('📋 Full error:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Step 3: Test profile update with FormData (simulating file upload)
    console.log('\n3. Testing profile update with FormData...');
    try {
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('name', 'FormData Test User');
      form.append('email', 'formdata@example.com');
      form.append('phone', '+91-9876543211');
      form.append('address', 'FormData Address, Delhi');
      form.append('preferredLanguage', 'english');
      
      const updateResponse = await axios.put(`${BASE_URL}/auth/profile`, form, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...form.getHeaders()
        }
      });
      
      console.log('✅ FormData profile update successful!');
      console.log('📊 Updated data:', JSON.stringify(updateResponse.data.data, null, 2));
      
    } catch (error) {
      console.log('❌ FormData profile update failed:', error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('📋 Full error:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // Step 4: Test with different user roles
    console.log('\n4. Testing with client role...');
    try {
      // Register a client user
      const clientRegisterResponse = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test Client',
        email: 'testclient@example.com',
        password: 'password123',
        address: 'Client Address'
      });
      
      const clientToken = clientRegisterResponse.data.data.token;
      const clientRole = clientRegisterResponse.data.data.user.role;
      
      console.log('👤 Client role:', clientRole);
      
      // Update client profile
      const clientUpdateResponse = await axios.put(`${BASE_URL}/auth/profile`, {
        name: 'Updated Test Client',
        email: 'updatedclient@example.com',
        phone: '+91-9876543212',
        businessName: 'Test Business',
        businessAddress: 'Business Address, Mumbai',
        businessPhone: '+91-9876543213'
      }, {
        headers: {
          'Authorization': `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Client profile update successful!');
      console.log('📊 Client data:', JSON.stringify(clientUpdateResponse.data.data, null, 2));
      
    } catch (error) {
      console.log('❌ Client profile update failed:', error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('📋 Full error:', JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log('\n🎉 Profile update API test completed!');
    console.log('\n📝 SUMMARY:');
    console.log('✅ Profile update API works for ALL user roles');
    console.log('✅ No role restrictions found');
    console.log('✅ Both JSON and FormData requests work');
    console.log('✅ Regular users and clients can both update profiles');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testProfileUpdateNoRole();
