// ✅ CORRECT WAY - React Native me Axios Request
import axios from 'axios';

const BASE_URL = 'YOUR_BASE_URL'; // e.g., 'http://localhost:5000/api' or 'https://your-api.com/api'

const registerUser = async (userData) => {
  try {
    console.log('📤 Sending registration request...');
    console.log('Data:', JSON.stringify(userData, null, 2));
    
    const response = await axios.post(
      `${BASE_URL}/auth/register`,
      {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'user',
        phone: userData.phone,
        address: userData.address,
        preferredLanguage: userData.preferredLanguage || 'hinglish'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      }
    );
    
    console.log('✅ Success:', response.data);
    return {
      success: true,
      data: response.data
    };
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    
    // Detailed error logging
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.errors) {
        console.log('Validation errors:');
        error.response.data.errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.path}: ${err.msg}`);
        });
      }
    }
    
    return {
      success: false,
      error: error.response?.data || { message: error.message }
    };
  }
};

// Usage example:
const handleRegister = async () => {
  const result = await registerUser({
    name: "tushar",
    email: "bhai@gmail.com",
    password: "12345678",
    role: "user",
    phone: "+91-8155980336",
    address: "India",
    preferredLanguage: "hinglish"
  });
  
  if (result.success) {
    console.log('Registration successful!', result.data);
  } else {
    console.log('Registration failed!', result.error);
  }
};

// ============================================
// ❌ COMMON MISTAKES TO AVOID:
// ============================================

// 1. ❌ WRONG - FormData use mat karo JSON ke liye
// const formData = new FormData();
// formData.append('name', 'tushar');
// axios.post(url, formData) // ❌ Wrong!

// 2. ❌ WRONG - JSON.stringify manually mat karo body me
// axios.post(url, JSON.stringify(data)) // ❌ Wrong! Axios automatically karta hai

// 3. ✅ CORRECT - Direct object bhejo
// axios.post(url, { name: 'tushar', email: 'test@test.com' }) // ✅ Correct!

// 4. ❌ WRONG - Content-Type header mat bhulo
// axios.post(url, data) // ❌ Might work but not reliable

// 5. ✅ CORRECT - Always set headers explicitly
// axios.post(url, data, { headers: { 'Content-Type': 'application/json' } }) // ✅ Correct!

