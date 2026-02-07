# Testing the Agency Statistics Endpoint

## Quick Test Guide

### Test the endpoint using the API_TEST.md file format:

Add this test case to your existing [Backend/API_TEST.md](Backend/API_TEST.md):

```markdown
### 4. Save Agency Statistics (Step 3 - Performance Information)
**Endpoint:** `POST /auth/agency/statistics`
**Description:** Saves agency performance statistics including total students handled and total visas approved. The approval rate is calculated automatically.
**Authentication:** Required (Bearer Token)

**Request:**
```bash
curl -X POST http://localhost:5003/auth/agency/statistics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "user_id": "YOUR_USER_ID_HERE",
    "total_students_handled": 500,
    "total_visas_approved": 475
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Agency statistics saved successfully",
  "data": {
    "total_students_handled": 500,
    "total_visas_approved": 475,
    "approval_rate": 95.0
  }
}
```

**Test Scenarios:**

1. ✅ **Valid Request:**
   - Students: 500, Visas: 475
   - Expected: Success with 95.0% approval rate

2. ❌ **Visas Exceed Students:**
   ```json
   {
     "user_id": "...",
     "total_students_handled": 100,
     "total_visas_approved": 150
   }
   ```
   - Expected: 400 Error - "Total visas approved cannot exceed total students handled"

3. ❌ **Missing Fields:**
   ```json
   {
     "user_id": "...",
     "total_students_handled": 100
   }
   ```
   - Expected: 400 Error - "user_id, total_students_handled, and total_visas_approved are required"

4. ❌ **Invalid Numbers:**
   ```json
   {
     "user_id": "...",
     "total_students_handled": -50,
     "total_visas_approved": 40
   }
   ```
   - Expected: 400 Error - "Invalid numbers provided for students or visas"

5. ❌ **No Authentication:**
   - Request without Authorization header
   - Expected: 401 Unauthorized

6. ✅ **Zero Values:**
   ```json
   {
     "user_id": "...",
     "total_students_handled": 0,
     "total_visas_approved": 0
   }
   ```
   - Expected: Success with 0.0% approval rate
```

## Manual Testing Steps

### 1. Start the Backend Server
```bash
cd Backend
npm start
```
Server should start on http://localhost:5003

### 2. Register a Test Agency (if not already done)
```bash
curl -X POST http://localhost:5003/auth/register/agency \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.agency@example.com",
    "password": "testpass123",
    "agency_name": "Test Visa Agency",
    "phone": "+94771234567",
    "address": "123 Test Street, Colombo",
    "country_of_operation": "Sri Lanka",
    "license_number": "TEST-12345"
  }'
```

**Save the returned `token` and `user.id` for the next steps!**

### 3. Test the Statistics Endpoint
Replace `YOUR_TOKEN_HERE` and `YOUR_USER_ID_HERE` with values from step 2:

```bash
curl -X POST http://localhost:5003/auth/agency/statistics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "user_id": "YOUR_USER_ID_HERE",
    "total_students_handled": 500,
    "total_visas_approved": 475
  }'
```

### 4. Verify in Database
```sql
USE visa_marketplace;

SELECT
    user_id,
    agency_name,
    total_students_handled,
    total_visas_approved,
    approval_rate,
    updated_at
FROM agencies
WHERE user_id = 'YOUR_USER_ID_HERE';
```

Expected output:
```
+--------------------------------------+-------------------+-------------------------+----------------------+---------------+---------------------+
| user_id                              | agency_name       | total_students_handled  | total_visas_approved | approval_rate | updated_at          |
+--------------------------------------+-------------------+-------------------------+----------------------+---------------+---------------------+
| YOUR_USER_ID_HERE                    | Test Visa Agency  | 500                     | 475                  | 95.00         | 2026-02-02 23:45:00 |
+--------------------------------------+-------------------+-------------------------+----------------------+---------------+---------------------+
```

## Frontend Testing

### 1. Start the Frontend
```bash
cd Frontend/frontend
npm run dev
```
Frontend should start on http://localhost:5173 (or the configured port)

### 2. Complete Registration Flow
1. Navigate to: http://localhost:5173/agency-registration
2. **Step 1 - Basic Information:**
   - Fill in agency details
   - Create password
   - Click "Next Step"
3. **Step 2 - Services Configuration:**
   - Select countries (e.g., United Kingdom, United States)
   - Add universities for each country
   - Set processing times
   - Add service description
   - Click "Next Step" (should show "Saving...")
4. **Step 3 - Performance Information:**
   - Enter Total Students Handled: `500`
   - Enter Total Visas Approved: `475`
   - Observe the auto-calculated success rate: `95.0%`
   - Click "Next Step" (should show "Saving...")
   - Should navigate to Step 4 (Form Builder)
5. **Verify in Database** (see SQL query above)

### 3. Test Error Scenarios

**Test 1: Visas exceed students**
- Total Students: 100
- Total Visas: 150
- Click "Next Step"
- Expected: Error message displayed at top of page

**Test 2: Try Step 3 without completing Step 1**
- Manually navigate to step 3 (if possible)
- Click "Next Step"
- Expected: "Authentication required" error

## Automated Testing (Optional)

Create a test file: `Backend/test/statistics.test.js`

```javascript
const request = require('supertest');
const app = require('../server'); // adjust path as needed

describe('POST /auth/agency/statistics', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Register and login to get token
    // ... setup code
  });

  test('should save valid statistics', async () => {
    const response = await request(app)
      .post('/auth/agency/statistics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        user_id: userId,
        total_students_handled: 500,
        total_visas_approved: 475
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.approval_rate).toBe(95.0);
  });

  test('should reject when visas exceed students', async () => {
    const response = await request(app)
      .post('/auth/agency/statistics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        user_id: userId,
        total_students_handled: 100,
        total_visas_approved: 150
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .post('/auth/agency/statistics')
      .send({
        user_id: userId,
        total_students_handled: 500,
        total_visas_approved: 475
      });

    expect(response.status).toBe(401);
  });
});
```

## Success Criteria

✅ All tests pass
✅ Data is correctly saved to database
✅ Approval rate is calculated accurately
✅ Error messages are clear and helpful
✅ Frontend shows loading states
✅ Frontend handles errors gracefully
✅ Backend validates all inputs
✅ Authentication is properly enforced

## Troubleshooting

### Issue: "Authentication required" error
**Solution:** Ensure Step 1 (Basic Information) is completed first to get the JWT token

### Issue: Database connection error
**Solution:** Check `.env` file has correct database credentials and MySQL is running

### Issue: "Agency not found" error
**Solution:** Ensure the user_id exists in the agencies table. The agency must be registered first (Step 1).

### Issue: Frontend shows old data
**Solution:** Clear browser cache and localStorage, then restart the registration flow

### Issue: Backend returns 500 error
**Solution:** Check backend console logs for detailed error messages. Verify database columns exist.
