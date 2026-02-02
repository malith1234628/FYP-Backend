# Agency Registration Step 3 - Statistics Integration

## Overview
This document describes the implementation of Step 3 (Performance Information) in the agency registration flow, which saves total students handled, total visas approved, and calculates the approval rate.

## Backend Implementation

### Endpoint
**POST** `/auth/agency/statistics`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "user_id": "uuid-string",
  "total_students_handled": 500,
  "total_visas_approved": 475
}
```

**Response (Success):**
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

**Response (Error):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

### Controller Function
Location: [Backend/controllers/authController.js](Backend/controllers/authController.js)

Function: `saveAgencyStatistics`

**Features:**
- Validates user authentication
- Validates input data (numbers, non-negative, visas <= students)
- Automatically calculates approval_rate as a percentage
- Updates the agencies table with the statistics
- Returns calculated approval rate in response

### Route
Location: [Backend/routes/authRoutes.js](Backend/routes/authRoutes.js)

```javascript
router.post('/agency/statistics', authenticate, saveAgencyStatistics);
```

## Database Schema Requirements

The `agencies` table must have the following columns:

```sql
ALTER TABLE agencies
ADD COLUMN IF NOT EXISTS total_students_handled INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_visas_approved INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS approval_rate DECIMAL(5,2) DEFAULT 0.00;
```

**Column Definitions:**
- `total_students_handled`: INT - Total number of students the agency has handled
- `total_visas_approved`: INT - Total number of visas successfully approved
- `approval_rate`: DECIMAL(5,2) - Calculated percentage (0.00 to 100.00)

## Frontend Integration

### Location
File: [Frontend/frontend/src/app/pages/AgencyRegistrationPage.tsx](Frontend/frontend/src/app/pages/AgencyRegistrationPage.tsx)

### Implementation
The frontend calls the statistics endpoint when navigating from Step 3 to Step 4:

```typescript
// In handleNext function (around line 397)
if (currentStep === 3) {
  setIsLoading(true);
  setError("");

  try {
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const response = await fetch("http://localhost:5003/auth/agency/statistics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: user.id,
        total_students_handled: parseInt(totalStudents),
        total_visas_approved: parseInt(totalVisasApproved)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save statistics");
    }

    // Move to next step on success
    setCurrentStep(currentStep + 1);
    // ... initialize form builder
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to save performance statistics");
  } finally {
    setIsLoading(false);
  }
  return;
}
```

### User Experience
- Step 3 displays input fields for total students handled and total visas approved
- Approval rate is calculated and displayed in real-time on the frontend
- When clicking "Next Step", the data is saved to the database
- Loading state shows "Saving..." during the API call
- Error messages are displayed if validation fails
- Success leads to Step 4 (Form Builder)

## Testing the Endpoint

### Using cURL:
```bash
# Get authentication token first (from login or registration)
TOKEN="your-jwt-token-here"
USER_ID="your-user-id-here"

# Test the statistics endpoint
curl -X POST http://localhost:5003/auth/agency/statistics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "'$USER_ID'",
    "total_students_handled": 500,
    "total_visas_approved": 475
  }'
```

### Expected Response:
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

### Using the Frontend:
1. Start the backend server: `cd Backend && npm start`
2. Start the frontend: `cd Frontend/frontend && npm run dev`
3. Navigate to the agency registration page
4. Complete Step 1 (Basic Information)
5. Complete Step 2 (Services Configuration)
6. On Step 3, enter:
   - Total Students Handled: e.g., 500
   - Total Visas Approved: e.g., 475
7. Observe the auto-calculated approval rate (95.0%)
8. Click "Next Step" - data should be saved
9. Verify in database:
   ```sql
   SELECT user_id, agency_name, total_students_handled,
          total_visas_approved, approval_rate
   FROM agencies
   WHERE user_id = 'your-user-id';
   ```

## Validation Rules

1. **Required Fields:**
   - user_id
   - total_students_handled
   - total_visas_approved

2. **Data Types:**
   - All values must be valid integers
   - Numbers must be non-negative (≥ 0)

3. **Business Logic:**
   - total_visas_approved cannot exceed total_students_handled
   - approval_rate is automatically calculated: (visas_approved / students_handled) × 100

4. **Authentication:**
   - Valid JWT token required
   - User must be authenticated

## Error Handling

| Error | Status Code | Message |
|-------|-------------|---------|
| Missing required fields | 400 | "user_id, total_students_handled, and total_visas_approved are required" |
| Invalid numbers | 400 | "Invalid numbers provided for students or visas" |
| Visas > Students | 400 | "Total visas approved cannot exceed total students handled" |
| Agency not found | 404 | "Agency not found" |
| Not authenticated | 401 | "Authentication required" |
| Server error | 500 | "Failed to save agency statistics" |

## File Changes Summary

### Backend Files Modified:
1. ✅ `Backend/controllers/authController.js` - Added `saveAgencyStatistics` function
2. ✅ `Backend/routes/authRoutes.js` - Added POST route for `/agency/statistics`

### Frontend Files Modified:
1. ✅ `Frontend/frontend/src/app/pages/AgencyRegistrationPage.tsx` - Added API call in `handleNext()` function

### Database Changes Required:
- Ensure `agencies` table has columns: `total_students_handled`, `total_visas_approved`, `approval_rate`
- Run ALTER TABLE command if columns don't exist (see Database Schema Requirements section above)

## Next Steps

1. ✅ Backend endpoint created and configured
2. ✅ Frontend integration completed
3. ⏳ Test the complete flow end-to-end
4. ⏳ Verify database updates correctly
5. ⏳ (Optional) Add database migration script for column creation if needed

## Notes

- The approval_rate is stored as a DECIMAL(5,2), allowing values from 0.00 to 100.00
- The calculation is done on the backend to ensure consistency
- The frontend shows a preview of the calculated rate, but the final calculation happens server-side
- Transaction handling ensures data integrity
- All errors are caught and returned to the frontend with appropriate messages
