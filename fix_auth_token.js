const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';

async function fixAuthToken() {
  try {
    console.log('🔐 Fixing Authentication Token Issue...\n');

    // Step 1: First, we need to login to get a token
    console.log('1. Logging in to get authentication token...');
    
    let authToken;
    try {
      // Try to login with your email
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'variyatushar876@gmail.com',
        password: 'password123' // You need to provide the correct password
      });
      
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful!');
      console.log('🔑 Token received:', authToken.substring(0, 20) + '...');
      
    } catch (loginError) {
      console.log('❌ Login failed, trying to register...');
      console.log('Error:', loginError.response?.data?.message || loginError.message);
      
      try {
        // Try to register if login fails
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
          name: 'Tushar',
          email: 'variyatushar876@gmail.com',
          password: 'password123'
        });
        
        authToken = registerResponse.data.data.token;
        console.log('✅ Registration successful!');
        console.log('🔑 Token received:', authToken.substring(0, 20) + '...');
        
      } catch (registerError) {
        console.log('❌ Both login and registration failed');
        console.log('Register Error:', registerError.response?.data || registerError.message);
        return;
      }
    }

    // Step 2: Test profile update WITH the token
    console.log('\n2. Testing profile update WITH authentication token...');
    
    const profileData = {
      name: 'Tushar',
      email: 'variyatushar876@gmail.com',
      phone: '8155980336'
    };

    try {
      const updateResponse = await axios.put(`${BASE_URL}/auth/profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${authToken}`, // ← This is the key!
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Profile update successful!');
      console.log('📊 Response:', JSON.stringify(updateResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Profile update failed');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      console.log('Full Error:', JSON.stringify(error.response?.data, null, 2));
    }

    // Step 3: Show correct frontend implementation
    console.log('\n3. Correct Frontend Implementation:');
    console.log('\n📝 Step 1: Login to get token');
    console.log(`
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Store token for future requests
      localStorage.setItem('authToken', result.data.token);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
    `);

    console.log('\n📝 Step 2: Update profile with token');
    console.log(`
const updateProfile = async (data) => {
  try {
    // Get token from storage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }
    
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': \`Bearer \${token}\`, // ← This is required!
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    return result;
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};
    `);

    console.log('\n📝 Step 3: Complete flow example');
    console.log(`
// Complete authentication and profile update flow
const handleProfileUpdate = async (profileData) => {
  try {
    // First, make sure user is logged in
    let token = localStorage.getItem('authToken');
    
    if (!token) {
      // If no token, login first
      const loginResult = await login('variyatushar876@gmail.com', 'your_password');
      token = loginResult.data.token;
    }
    
    // Now update profile with token
    const result = await updateProfile(profileData);
    console.log('Profile updated successfully:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Usage
const data = {
  name: "Tushar",
  email: "variyatushar876@gmail.com",
  phone: "8155980336"
};

handleProfileUpdate(data);
    `);

    console.log('\n🎯 Key Points:');
    console.log('✅ You MUST login first to get a token');
    console.log('✅ Store the token (localStorage, sessionStorage, etc.)');
    console.log('✅ Include token in Authorization header: "Bearer YOUR_TOKEN"');
    console.log('✅ Token is required for ALL protected routes');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixAuthToken();
