# React Native FormData Network Error - Complete Fix Guide

## 🔴 Problem
Postman में API काम कर रही है, लेकिन React Native frontend से **Network Error** आ रहा है।

## ✅ Solutions (क्रम से try करें)

### Solution 1: Axios Configuration Fix (सबसे common fix)

```javascript
const res = await axios.post(Api.AllVehical, formData, {
    headers: {
        Authorization: `Bearer ${AdminUser?.token}`,
        // ⚠️ CRITICAL: Content-Type मत set करो!
        // React Native automatically set करेगा
        Accept: "application/json",
    },
    timeout: 30000, // 30 seconds (default 10s too short)
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
});
```

**Key Points:**
- ❌ `Content-Type: multipart/form-data` मत set करो
- ✅ `timeout` बढ़ाओ (30 seconds minimum)
- ✅ `maxContentLength` और `maxBodyLength` Infinity set करो

### Solution 2: Image URI Format Fix

```javascript
// ❌ WRONG:
formData.append("images", {
    uri: uri.startsWith("file://") ? uri : `file://${uri}`,
    ...
});

// ✅ CORRECT:
formData.append("images", {
    uri: uri.replace("file://", ""), // Remove file:// prefix
    name: `vehicle_${Date.now()}_${index}.jpg`,
    type: "image/jpeg",
});
```

### Solution 3: Use Fetch API Instead (More Reliable)

```javascript
const response = await fetch(Api.AllVehical, {
    method: "POST",
    headers: {
        Authorization: `Bearer ${AdminUser?.token}`,
        // Don't set Content-Type
    },
    body: formData,
});

const data = await response.json();
```

### Solution 4: Check API URL

```javascript
// Make sure Api.AllVehical is correct
console.log("API URL:", Api.AllVehical);
// Should be: "http://YOUR_IP:PORT/api/admin/vehicles"
// NOT: "http://localhost:3000" (won't work on physical device)
```

**For Physical Device/Emulator:**
- ❌ `http://localhost:3000` - Won't work
- ✅ `http://10.0.2.2:3000` - Android Emulator
- ✅ `http://YOUR_COMPUTER_IP:3000` - Physical Device (e.g., `http://192.168.1.5:3000`)

### Solution 5: Add Network Security Config (Android)

**android/app/src/main/AndroidManifest.xml:**
```xml
<application
    android:usesCleartextTraffic="true"
    ...>
```

**android/app/src/main/res/xml/network_security_config.xml:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.1.0</domain>
    </domain-config>
</network-security-config>
```

### Solution 6: Check Token Validity

```javascript
// Debug token
console.log("Token:", AdminUser?.token);
console.log("Token Length:", AdminUser?.token?.length);

// Test token with a simple API call first
try {
    const testRes = await axios.get(`${Api.BaseUrl}/api/admin/vehicles`, {
        headers: {
            Authorization: `Bearer ${AdminUser?.token}`,
        },
    });
    console.log("Token is valid:", testRes.data);
} catch (error) {
    console.log("Token is invalid:", error.response?.data);
}
```

### Solution 7: Reduce Image Size/Count

```javascript
// Test with single image first
if (images.length > 0) {
    formData.append("images", {
        uri: images[0].replace("file://", ""),
        name: `vehicle_${Date.now()}.jpg`,
        type: "image/jpeg",
    });
}

// If works, gradually increase
```

## 🔍 Debugging Steps

### Step 1: Check Network Connection
```javascript
// Add before API call
console.log("API URL:", Api.AllVehical);
console.log("Token exists:", !!AdminUser?.token);
console.log("Images count:", images.length);
```

### Step 2: Test with Minimal Data
```javascript
// Test without images first
const testFormData = new FormData();
testFormData.append("title", "Test Vehicle");
testFormData.append("vehicleType", "rent");
testFormData.append("rentType", "daily");
testFormData.append("price", "1000");

// If this works, add images one by one
```

### Step 3: Check Server Logs
Backend console में check करो:
- Request आ रही है या नहीं
- Multer error तो नहीं
- Validation error तो नहीं

### Step 4: Check Error Details
```javascript
catch (error: any) {
    console.log("Error Code:", error.code);
    console.log("Error Message:", error.message);
    console.log("Error Response:", error.response?.data);
    console.log("Error Request:", error.request);
    
    // Network Error specific
    if (error.code === "ECONNABORTED") {
        console.log("Request timeout");
    } else if (error.message === "Network Error") {
        console.log("Network connection issue");
    }
}
```

## 📋 Common Causes & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Network Error | Content-Type manually set | Remove Content-Type header |
| Network Error | Wrong API URL | Use IP address, not localhost |
| Network Error | Timeout too short | Increase timeout to 30000 |
| Network Error | Image URI format wrong | Remove file:// prefix |
| Network Error | Token invalid/expired | Check and refresh token |
| Network Error | Server not running | Start backend server |
| Network Error | CORS issue | Check backend CORS settings |
| Network Error | Large file size | Reduce image size or count |

## 🎯 Quick Checklist

- [ ] Content-Type header removed
- [ ] Timeout increased to 30000
- [ ] Image URI format correct (no file://)
- [ ] API URL uses IP address (not localhost)
- [ ] Token is valid and not expired
- [ ] Backend server is running
- [ ] Network security config added (Android)
- [ ] Testing with minimal data first

## 💡 Pro Tips

1. **Always test without images first** - अगर images के बिना काम करे, तो image format issue है
2. **Use Fetch API for file uploads** - Sometimes more reliable than Axios
3. **Check network on device** - Make sure device can reach server
4. **Use Postman to verify** - If Postman works, issue is in frontend code
5. **Check backend logs** - Server logs में exact error दिखेगा

## 🔧 Complete Working Code

See `CORRECTED_VEHICLE_CREATE_CODE.js` for complete working solution.

