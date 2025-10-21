# API Request Examples - Profile Update & Booking List

## 1. Profile Update API Examples

### A. JSON Request (without file upload)

**Endpoint:** `PUT /api/auth/profile`  
**Content-Type:** `application/json`

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+91-9876543210",
  "address": "123 Main Street, Mumbai, Maharashtra 400001",
  "businessName": "Doe Enterprises",
  "businessAddress": "456 Business Park, Mumbai, Maharashtra 400002",
  "businessPhone": "+91-9876543211",
  "preferredLanguage": "hinglish"
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+91-9876543210",
    "address": "123 Main Street, Mumbai, Maharashtra 400001",
    "preferredLanguage": "hinglish"
  }'
```

**JavaScript/Fetch Example:**
```javascript
const updateProfile = async () => {
  const response = await fetch('http://localhost:3000/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+91-9876543210",
      address: "123 Main Street, Mumbai, Maharashtra 400001",
      preferredLanguage: "hinglish"
    })
  });
  
  const data = await response.json();
  console.log(data);
};
```

### B. Form-Data Request (with file upload)

**Endpoint:** `PUT /api/auth/profile`  
**Content-Type:** `multipart/form-data`

**Form Data Fields:**
```
name: John Doe
email: john.doe@example.com
phone: +91-9876543210
address: 123 Main Street, Mumbai, Maharashtra 400001
businessName: Doe Enterprises
businessAddress: 456 Business Park, Mumbai, Maharashtra 400002
businessPhone: +91-9876543211
preferredLanguage: hinglish
profileImage: [FILE] profile.jpg
```

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=John Doe" \
  -F "email=john.doe@example.com" \
  -F "phone=+91-9876543210" \
  -F "address=123 Main Street, Mumbai, Maharashtra 400001" \
  -F "preferredLanguage=hinglish" \
  -F "profileImage=@/path/to/profile.jpg"
```

**JavaScript/FormData Example:**
```javascript
const updateProfileWithImage = async () => {
  const formData = new FormData();
  formData.append('name', 'John Doe');
  formData.append('email', 'john.doe@example.com');
  formData.append('phone', '+91-9876543210');
  formData.append('address', '123 Main Street, Mumbai, Maharashtra 400001');
  formData.append('preferredLanguage', 'hinglish');
  
  // Add file if selected
  const fileInput = document.getElementById('profileImage');
  if (fileInput.files[0]) {
    formData.append('profileImage', fileInput.files[0]);
  }
  
  const response = await fetch('http://localhost:3000/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
      // Don't set Content-Type for FormData, browser sets it automatically
    },
    body: formData
  });
  
  const data = await response.json();
  console.log(data);
};
```

**React Example:**
```jsx
import React, { useState } from 'react';

const ProfileUpdate = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    preferredLanguage: 'hinglish'
  });
  const [profileImage, setProfileImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        submitData.append(key, formData[key]);
      }
    });
    
    if (profileImage) {
      submitData.append('profileImage', profileImage);
    }
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });
      
      const result = await response.json();
      console.log('Profile updated:', result);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      <input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
      />
      <textarea
        placeholder="Address"
        value={formData.address}
        onChange={(e) => setFormData({...formData, address: e.target.value})}
      />
      <select
        value={formData.preferredLanguage}
        onChange={(e) => setFormData({...formData, preferredLanguage: e.target.value})}
      >
        <option value="hindi">Hindi</option>
        <option value="english">English</option>
        <option value="hinglish">Hinglish</option>
      </select>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setProfileImage(e.target.files[0])}
      />
      <button type="submit">Update Profile</button>
    </form>
  );
};
```

---

## 2. Booking List API Examples

### A. Simple Booking List

**Endpoint:** `GET /api/bookings/me`

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/bookings/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript/Fetch Example:**
```javascript
const getUserBookings = async () => {
  const response = await fetch('http://localhost:3000/api/bookings/me', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  });
  
  const data = await response.json();
  console.log('User bookings:', data);
};
```

### B. Advanced Booking List with Filters

**Endpoint:** `GET /api/bookings/list`

#### Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (pending, confirmed, cancelled, completed, in_progress)
- `startDate` (string): Filter from date (ISO format: 2024-01-01)
- `endDate` (string): Filter to date (ISO format: 2024-01-31)
- `sortBy` (string): Sort field (createdAt, startAt, endAt, totalPrice)
- `sortOrder` (string): Sort order (asc, desc)

**cURL Examples:**

```bash
# Basic pagination
curl -X GET "http://localhost:3000/api/bookings/list?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by status
curl -X GET "http://localhost:3000/api/bookings/list?status=confirmed&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Date range filter
curl -X GET "http://localhost:3000/api/bookings/list?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Sort by total price descending
curl -X GET "http://localhost:3000/api/bookings/list?sortBy=totalPrice&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Combined filters
curl -X GET "http://localhost:3000/api/bookings/list?page=2&limit=5&status=confirmed&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript/Fetch Examples:**

```javascript
// Basic booking list
const getBookingList = async (page = 1, limit = 10) => {
  const response = await fetch(`http://localhost:3000/api/bookings/list?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  });
  
  const data = await response.json();
  return data;
};

// Filtered booking list
const getFilteredBookings = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  
  const response = await fetch(`http://localhost:3000/api/bookings/list?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  });
  
  const data = await response.json();
  return data;
};

// Usage examples
const examples = async () => {
  // Get first page with 10 items
  const page1 = await getBookingList(1, 10);
  
  // Get confirmed bookings only
  const confirmed = await getFilteredBookings({
    status: 'confirmed',
    page: 1,
    limit: 5
  });
  
  // Get bookings from January 2024, sorted by creation date
  const januaryBookings = await getFilteredBookings({
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  console.log('Page 1:', page1);
  console.log('Confirmed bookings:', confirmed);
  console.log('January bookings:', januaryBookings);
};
```

**React Component Example:**
```jsx
import React, { useState, useEffect } from 'react';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [loading, setLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await fetch(`/api/bookings/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setBookings(data.data.bookings);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div>
      <h2>My Bookings</h2>
      
      {/* Filters */}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
        </select>
        
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          placeholder="Start Date"
        />
        
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          placeholder="End Date"
        />
        
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        >
          <option value="createdAt">Created Date</option>
          <option value="startAt">Start Date</option>
          <option value="endAt">End Date</option>
          <option value="totalPrice">Total Price</option>
        </select>
        
        <select
          value={filters.sortOrder}
          onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
      
      {/* Bookings List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {bookings.map(booking => (
            <div key={booking._id} className="booking-card">
              <h3>{booking.vehicle.title}</h3>
              <p>Status: {booking.status}</p>
              <p>Total Price: ₹{booking.totalPrice}</p>
              <p>Start: {new Date(booking.startAt).toLocaleDateString()}</p>
              <p>End: {new Date(booking.endAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={!pagination.hasPrevPage}
          onClick={() => handlePageChange(pagination.currentPage - 1)}
        >
          Previous
        </button>
        
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        
        <button
          disabled={!pagination.hasNextPage}
          onClick={() => handlePageChange(pagination.currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BookingList;
```

---

## 3. Complete API Testing Examples

### Postman Collection

**Profile Update (JSON):**
```json
{
  "method": "PUT",
  "url": "{{base_url}}/api/auth/profile",
  "headers": {
    "Authorization": "Bearer {{token}}",
    "Content-Type": "application/json"
  },
  "body": {
    "mode": "raw",
    "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john.doe@example.com\",\n  \"phone\": \"+91-9876543210\",\n  \"address\": \"123 Main Street, Mumbai\",\n  \"preferredLanguage\": \"hinglish\"\n}"
  }
}
```

**Profile Update (Form-Data):**
```json
{
  "method": "PUT",
  "url": "{{base_url}}/api/auth/profile",
  "headers": {
    "Authorization": "Bearer {{token}}"
  },
  "body": {
    "mode": "formdata",
    "formdata": [
      {"key": "name", "value": "John Doe", "type": "text"},
      {"key": "email", "value": "john.doe@example.com", "type": "text"},
      {"key": "phone", "value": "+91-9876543210", "type": "text"},
      {"key": "profileImage", "type": "file", "src": "/path/to/image.jpg"}
    ]
  }
}
```

**Booking List:**
```json
{
  "method": "GET",
  "url": "{{base_url}}/api/bookings/list?page=1&limit=10&status=confirmed",
  "headers": {
    "Authorization": "Bearer {{token}}"
  }
}
```

---

## 4. Response Examples

### Profile Update Response
```json
{
  "success": true,
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+91-9876543210",
    "address": "123 Main Street, Mumbai, Maharashtra 400001",
    "profileImage": "/uploads/1703123456789-profile.jpg",
    "businessName": "Doe Enterprises",
    "businessAddress": "456 Business Park, Mumbai, Maharashtra 400002",
    "businessPhone": "+91-9876543211",
    "preferredLanguage": "hinglish",
    "role": "user"
  },
  "message": "Profile updated successfully"
}
```

### Booking List Response
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "vehicle": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
          "title": "Honda City 2023",
          "category": "car",
          "images": ["honda_city_1.jpg", "honda_city_2.jpg"],
          "price": 2000,
          "rentType": "daily",
          "driverAvailable": true,
          "driverPrice": 800
        },
        "renter": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
          "name": "John Doe",
          "email": "john.doe@example.com",
          "phone": "+91-9876543210",
          "profileImage": "/uploads/profile.jpg"
        },
        "startAt": "2024-01-15T09:00:00.000Z",
        "endAt": "2024-01-17T18:00:00.000Z",
        "status": "confirmed",
        "totalPrice": 5600,
        "createdAt": "2024-01-14T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalBookings": 25,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "message": "Found 1 bookings"
}
```

These examples cover all the different ways you can make requests to the new APIs with proper data formats and error handling.
