const BASE_URL = 'http://localhost:5000';

// Test function to check if server is running
async function testServer() {
  try {
    const response = await fetch(`${BASE_URL}/`);
    const data = await response.text();
    console.log('✅ Server is running:', data);
    return true;
  } catch (error) {
    console.log('❌ Server is not running:', error.message);
    return false;
  }
}

// Test function to get all sliders
async function testGetSliders() {
  try {
    const response = await fetch(`${BASE_URL}/api/sliders`);
    const data = await response.json();
    console.log('✅ Get Sliders API working:', data);
    return data;
  } catch (error) {
    console.log('❌ Get Sliders API failed:', error.message);
    return null;
  }
}

// Test function to get sliders by type
async function testGetSlidersByType() {
  try {
    const response = await fetch(`${BASE_URL}/api/sliders?type=featured`);
    const data = await response.json();
    console.log('✅ Get Sliders by Type API working:', data);
    return data;
  } catch (error) {
    console.log('❌ Get Sliders by Type API failed:', error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Testing Slider API...\n');
  
  // Test 1: Check if server is running
  const serverRunning = await testServer();
  if (!serverRunning) {
    console.log('❌ Cannot proceed with tests - server is not running');
    return;
  }
  
  console.log('\n');
  
  // Test 2: Get all sliders
  await testGetSliders();
  
  console.log('\n');
  
  // Test 3: Get sliders by type
  await testGetSlidersByType();
  
  console.log('\n✅ Basic API tests completed!');
  console.log('\n📝 Note: To test protected endpoints (POST, PUT, DELETE), you need to:');
  console.log('1. Register/Login to get an auth token');
  console.log('2. Use the token in Authorization header: Bearer <token>');
  console.log('3. Test with Postman collection: Slider_API_Test.postman_collection.json');
}

// Run the tests
runTests().catch(console.error);
