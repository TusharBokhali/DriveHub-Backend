# Booking API Frontend Fix - Network Error Solution

## ✅ Complete Fixed Frontend Code

```javascript
const VehicalBookingFun = async () => {
    if (Loading) return;

    try {
        setLoading(true);

        // ✅ Validation check
        if (!GlobalBooking?.Number || !GlobalBooking?.carData?._id) {
            throw new Error("Required booking details missing");
        }

        // ✅ Debug: Log all data before sending
        console.log("📤 Booking Data:", {
            phone: GlobalBooking.Number,
            email: GlobalBooking.Email,
            vehicleId: GlobalBooking.carData._id,
            startDate: GlobalBooking.selectStartDate,
            endDate: GlobalBooking.selectEndDate,
            driverIncluded: GlobalBooking.Driver,
            priceType: GlobalBooking.pricetype,
            documentsCount: [
                GlobalBooking.light_bill,
                GlobalBooking.pan_card,
                GlobalBooking.aadhar_card,
                GlobalBooking.bike_rc,
            ].filter(Boolean).length
        });

        const formData = new FormData();

        // ✅ Basic fields
        formData.append("phone", `91${GlobalBooking.Number}`);
        formData.append("email", GlobalBooking.Email ?? "");
        formData.append("description", GlobalBooking.des ?? "");
        formData.append("vehicleId", GlobalBooking.carData._id);
        formData.append("paymentMethod", GlobalBooking.payment_type ?? "online");

        // ✅ Fix 1: driverIncluded - send as string "true" or "false"
        formData.append("driverIncluded", GlobalBooking.Driver ? "true" : "false");

        // ✅ Fix 2: Dates - ensure ISO 8601 format
        let startDate = GlobalBooking.selectStartDate;
        let endDate = GlobalBooking.selectEndDate;
        
        // Convert Date objects to ISO string if needed
        if (startDate instanceof Date) {
            startDate = startDate.toISOString();
        } else if (typeof startDate === 'string') {
            // If it's a date string, ensure it's in ISO format
            const dateObj = new Date(startDate);
            if (!isNaN(dateObj.getTime())) {
                startDate = dateObj.toISOString();
            }
        }
        
        if (endDate instanceof Date) {
            endDate = endDate.toISOString();
        } else if (typeof endDate === 'string') {
            const dateObj = new Date(endDate);
            if (!isNaN(dateObj.getTime())) {
                endDate = dateObj.toISOString();
            }
        }
        
        formData.append("startDate", startDate);
        formData.append("endDate", endDate);

        // ✅ Fix 3: priceType - MUST be JSON stringified
        if (GlobalBooking.pricetype) {
            formData.append("priceType", JSON.stringify(GlobalBooking.pricetype));
        }

        // ✅ Fix 4: Documents - proper format for React Native (0-5 documents allowed)
        const documents = [
            GlobalBooking.light_bill,
            GlobalBooking.pan_card,
            GlobalBooking.aadhar_card,
            GlobalBooking.bike_rc,
        ].filter(Boolean); // Remove null/undefined values

        documents.forEach((doc, index) => {
            if (doc) {
                // ✅ Proper file format for React Native
                let fileUri = '';
                let fileName = '';
                let fileType = 'image/jpeg';

                if (typeof doc === 'string') {
                    // If it's a string URI
                    fileUri = doc.replace('file://', '');
                    fileName = `document_${index}_${Date.now()}.jpg`;
                } else if (doc.uri) {
                    // If it's an object with uri property
                    fileUri = doc.uri.replace('file://', '');
                    fileName = doc.name || `document_${index}_${Date.now()}.jpg`;
                    fileType = doc.type || 'image/jpeg';
                } else {
                    // Fallback
                    fileUri = doc;
                    fileName = `document_${index}_${Date.now()}.jpg`;
                }

                formData.append("documents", {
                    uri: fileUri,
                    name: fileName,
                    type: fileType,
                });
            }
        });

        console.log(`📎 Sending ${documents.length} document(s)`);

        // ✅ Fix 5: Proper axios configuration
        const res = await axios.post(
            Api.Vehical_booking,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${user?.token}`,
                    // ❌ DON'T set Content-Type - axios will set it automatically with boundary
                    Accept: "application/json",
                },
                timeout: 60000, // ✅ Increased timeout to 60 seconds for large files
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        if (res?.data?.success) {
            console.log("✅ Booking Successful", res.data);
            // Handle success (navigation, alert, etc.)
            return res.data;
        } else {
            throw new Error(res?.data?.message || "Booking failed");
        }
    } catch (error: any) {
        console.error("❌ Booking Error Details:", {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            status: error.response?.status,
            request: error.request ? 'Request sent but no response' : undefined,
        });

        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
                console.log("⏱️ Request timeout - server took too long to respond");
                throw new Error("Request timeout. Please try again.");
            } else if (error.message === "Network Error") {
                console.log("🌐 Network Error - Check:");
                console.log("1. API URL:", Api.Vehical_booking);
                console.log("2. Server running?", "Check backend console");
                console.log("3. Same network?", "Device and server on same network");
                console.log("4. IP address correct?", "Use IP not localhost");
                throw new Error("Network error. Please check your connection and try again.");
            } else if (error.response) {
                // Server responded with error
                const errorMsg = error.response.data?.message || "Server error occurred";
                console.log("Server Error:", error.response.data);
                throw new Error(errorMsg);
            } else if (error.request) {
                // Request made but no response
                console.log("No response from server");
                throw new Error("No response from server. Please check if server is running.");
            }
        }
        
        throw error;
    } finally {
        setLoading(false);
    }
};
```

## 🔧 Alternative: Using Fetch API (More Reliable for FormData)

```javascript
const VehicalBookingFun = async () => {
    if (Loading) return;

    try {
        setLoading(true);

        if (!GlobalBooking?.Number || !GlobalBooking?.carData?._id) {
            throw new Error("Required booking details missing");
        }

        const formData = new FormData();

        // Add all fields (same as above)
        formData.append("phone", `91${GlobalBooking.Number}`);
        formData.append("email", GlobalBooking.Email ?? "");
        formData.append("description", GlobalBooking.des ?? "");
        formData.append("vehicleId", GlobalBooking.carData._id);
        formData.append("paymentMethod", GlobalBooking.payment_type ?? "online");
        formData.append("driverIncluded", GlobalBooking.Driver ? "true" : "false");

        // Dates
        let startDate = GlobalBooking.selectStartDate;
        let endDate = GlobalBooking.selectEndDate;
        
        if (startDate instanceof Date) {
            startDate = startDate.toISOString();
        }
        if (endDate instanceof Date) {
            endDate = endDate.toISOString();
        }
        
        formData.append("startDate", startDate);
        formData.append("endDate", endDate);

        // PriceType
        if (GlobalBooking.pricetype) {
            formData.append("priceType", JSON.stringify(GlobalBooking.pricetype));
        }

        // Documents
        const documents = [
            GlobalBooking.light_bill,
            GlobalBooking.pan_card,
            GlobalBooking.aadhar_card,
            GlobalBooking.bike_rc,
        ].filter(Boolean);

        documents.forEach((doc, index) => {
            if (doc) {
                const fileUri = typeof doc === 'string' 
                    ? doc.replace('file://', '') 
                    : doc.uri?.replace('file://', '') || doc;
                
                formData.append("documents", {
                    uri: fileUri,
                    name: `document_${index}_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                });
            }
        });

        // ✅ Using Fetch API
        const response = await fetch(Api.Vehical_booking, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user?.token}`,
                // Don't set Content-Type - fetch will set it automatically
            },
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            console.log("✅ Booking Successful", data);
            return data;
        } else {
            throw new Error(data.message || "Booking failed");
        }
    } catch (error: any) {
        console.error("❌ Booking Error:", error);
        throw error;
    } finally {
        setLoading(false);
    }
};
```

## 📋 Important Points:

### 1. **Documents are Optional (0-5)**
   - ✅ 0 documents = Works
   - ✅ 1 document = Works
   - ✅ 5 documents = Works
   - ❌ More than 5 = Error

### 2. **API URL Check**
```javascript
// Make sure Api.Vehical_booking is correct
console.log("API URL:", Api.Vehical_booking);
// Should be: "http://YOUR_IP:5000/api/booking-flow/bookings"
// NOT: "http://localhost:5000" (won't work on physical device)

// For Android Emulator: "http://10.0.2.2:5000/api/booking-flow/bookings"
// For Physical Device: "http://192.168.1.X:5000/api/booking-flow/bookings"
```

### 3. **Data Format**
```javascript
// ✅ CORRECT:
{
  phone: "8155980336",
  email: "new@gmail.com",
  vehicleId: "693d9bf044dea173f8ecbd7a",
  startDate: "2025-12-24T16:33:36.954Z", // ISO string
  endDate: "2025-12-24T16:33:36.954Z",     // ISO string
  driverIncluded: "true",                  // String "true" or "false"
  priceType: '{"_id":"...","price":3000}', // JSON stringified
  paymentMethod: "online",
  description: "Optional description",
  documents: [file1, file2, ...]           // 0-5 files
}
```

### 4. **Network Error Checklist**
- [ ] API URL uses IP address (not `localhost`)
- [ ] `Content-Type` header नहीं set किया
- [ ] Timeout increased to 60000ms (60 seconds)
- [ ] `priceType` JSON stringified है
- [ ] Dates ISO 8601 format में हैं
- [ ] Documents proper format में हैं (uri, name, type)
- [ ] Backend server running है
- [ ] Token valid है
- [ ] Same network पर हैं (device और server)

## 🐛 Debugging Steps:

1. **Check Backend Logs**: Server console में देखें क्या request आ रही है
2. **Check Network**: Device और server same network पर हैं?
3. **Test Without Documents**: पहले documents के बिना test करें
4. **Check File Size**: हर file 10MB से कम होनी चाहिए
5. **Check Token**: Token valid और expired नहीं है?

## ✅ Backend Updates Made:

1. ✅ Better error handling
2. ✅ Documents are optional (0-5)
3. ✅ Better logging for debugging
4. ✅ FormData handling improved
5. ✅ CORS configuration updated
6. ✅ Request size limits increased

