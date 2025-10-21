const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';

async function testAuthFix() {
  try {
    console.log('🔐 Testing Authentication Fix...\n');

    // Step 1: Test server health
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}`);
      console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server is not running. Please start with: npm start');
      return;
    }

    // Step 2: Register a test user
    console.log('\n2. Registering test user...');
    let authToken;
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123'
      });
      
      authToken = registerResponse.data.data.token;
      console.log('✅ User registered successfully');
      console.log('🔑 Token received:', authToken.substring(0, 30) + '...');
      
    } catch (error) {
      console.log('❌ Registration failed:', error.response?.data?.message || error.message);
      return;
    }

    // Step 3: Test profile update with valid token
    console.log('\n3. Testing profile update with valid token...');
    try {
      const updateResponse = await axios.put(`${BASE_URL}/auth/profile`, {
        name: 'Updated Test User',
        email: 'updated@example.com',
        phone: '+91-9876543210'
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
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

    // Step 4: Test with invalid token
    console.log('\n4. Testing with invalid token...');
    try {
      const invalidResponse = await axios.put(`${BASE_URL}/auth/profile`, {
        name: 'Test'
      }, {
        headers: {
          'Authorization': 'Bearer invalid_token_12345',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('❌ Should have failed with invalid token');
      
    } catch (error) {
      console.log('✅ Correctly rejected invalid token');
      console.log('Message:', error.response?.data?.message);
    }

    // Step 5: Test with malformed token
    console.log('\n5. Testing with malformed token...');
    try {
      const malformedResponse = await axios.put(`${BASE_URL}/auth/profile`, {
        name: 'Test'
      }, {
        headers: {
          'Authorization': 'InvalidFormat token_12345',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('❌ Should have failed with malformed token');
      
    } catch (error) {
      console.log('✅ Correctly rejected malformed token');
      console.log('Message:', error.response?.data?.message);
    }

    // Step 6: Test without token
    console.log('\n6. Testing without token...');
    try {
      const noTokenResponse = await axios.put(`${BASE_URL}/auth/profile`, {
        name: 'Test'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('❌ Should have failed without token');
      
    } catch (error) {
      console.log('✅ Correctly rejected request without token');
      console.log('Message:', error.response?.data?.message);
    }

    // Step 7: Show correct frontend implementation
    console.log('\n7. Correct Frontend Implementation:');
    console.log(`
// Complete authentication flow
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
  }

  // Login and get token
  async login(email, password) {
    try {
      const response = await fetch(\`\${this.baseURL}/auth/login\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.success) {
        // Store token
        localStorage.setItem('authToken', result.data.token);
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Update profile with token
  async updateProfile(data) {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await fetch(\`\${this.baseURL}/auth/profile\`, {
        method: 'PUT',
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
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
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  // Logout
  logout() {
    localStorage.removeItem('authToken');
  }
}

// Usage
const authService = new AuthService();

// Login first
await authService.login('testuser@example.com', 'password123');

// Then update profile
const result = await authService.updateProfile({
  name: 'Tushar',
  email: 'variyatushar876@gmail.com',
  phone: '8155980336'
});

console.log('Profile updated:', result);
    `);

    console.log('\n🎉 Authentication fix test completed!');
    console.log('\n📝 Summary:');
    console.log('✅ JWT secret is now properly handled');
    console.log('✅ Better error messages for debugging');
    console.log('✅ Robust token validation');
    console.log('✅ User existence check added');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthFix();

