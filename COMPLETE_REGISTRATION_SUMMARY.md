# Complete Agency Registration Flow - Summary

## 🎉 All 4 Steps Integrated Successfully!

This document summarizes the complete agency registration flow with all backend endpoints and frontend integration.

---

## Registration Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENCY REGISTRATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

Step 1: Basic Information
├─ User fills agency details (name, email, phone, address, etc.)
├─ Click "Next Step" → POST /auth/register/agency
├─ Backend: Creates user account + agency record
├─ Frontend: Stores JWT token + user data in localStorage
└─ Advances to Step 2 ✅

Step 2: Services Configuration
├─ User selects countries & universities
├─ Adds processing times
├─ Click "Next Step" → POST /auth/agency/services
├─ Backend: Saves services & university associations
└─ Advances to Step 3 ✅

Step 3: Performance Information
├─ User enters total students handled
├─ User enters total visas approved
├─ System calculates approval rate
├─ Click "Next Step" → POST /auth/agency/statistics
├─ Backend: Updates agency statistics
└─ Advances to Step 4 ✅

Step 4: Form Builder
├─ User creates custom forms for each university
├─ Can save individual forms (optional)
├─ Click "Complete Registration" → POST /auth/agency/forms
├─ Backend: Saves all university forms
└─ Redirects to Dashboard ✅
```

---

## Backend Endpoints Summary

### 1. **Register Agency** (Step 1)
- **Endpoint:** `POST /auth/register/agency`
- **Authentication:** No
- **Saves:** User account + Agency record
- **Returns:** JWT token + user data

### 2. **Save Services** (Step 2)
- **Endpoint:** `POST /auth/agency/services`
- **Authentication:** Required
- **Saves:** Countries, universities, processing times
- **Returns:** Success confirmation

### 3. **Save Statistics** (Step 3)
- **Endpoint:** `POST /auth/agency/statistics`
- **Authentication:** Required
- **Saves:** Total students, total visas, approval rate
- **Returns:** Calculated approval rate

### 4. **Save Forms** (Step 4)
- **Endpoint:** `POST /auth/agency/forms`
- **Authentication:** Required
- **Saves:** Custom application forms for each university
- **Returns:** List of saved forms with IDs

---

## Database Tables Updated

```sql
┌──────────────────────────────────────────────────────────────┐
│                     DATABASE CHANGES                          │
└──────────────────────────────────────────────────────────────┘

Step 1: users + agencies tables
├─ users: id, email, password_hash, user_type
└─ agencies: user_id, agency_name, contact_phone, address, etc.

Step 2: agency_services + agency_universities tables
├─ agency_services: user_id, country, processing_time
└─ agency_universities: service_id, university_name

Step 3: agencies table (update)
├─ total_students_handled
├─ total_visas_approved
└─ approval_rate (calculated)

Step 4: university_forms table
├─ agency_id, agency_university_id
├─ form_title, form_description
└─ questions (JSON)
```

---

## Quick Reference

### API Endpoints

| Step | Endpoint | Method | Auth | Purpose |
|------|----------|--------|------|---------|
| 1 | `/auth/register/agency` | POST | No | Register agency account |
| 2 | `/auth/agency/services` | POST | Yes | Save countries & universities |
| 3 | `/auth/agency/statistics` | POST | Yes | Save performance stats |
| 4 | `/auth/agency/forms` | POST | Yes | Save custom forms |

### Frontend Files

| File | Lines | Changes |
|------|-------|---------|
| `AgencyRegistrationPage.tsx` | ~1350 | Complete registration flow |

### Backend Files

| File | Purpose |
|------|---------|
| `controllers/authController.js` | All registration logic |
| `routes/authRoutes.js` | Route definitions |
| `middleware/auth.js` | JWT authentication |

---

## Testing the Complete Flow

### 1. **Prepare Environment**

```bash
# Start Backend (Terminal 1)
cd Backend
npm start
# Should run on http://localhost:5003

# Start Frontend (Terminal 2)
cd Frontend/frontend
npm run dev
# Should run on http://localhost:5173
```

### 2. **Clear Previous Data**

**Browser:**
```javascript
// Open DevTools (F12) → Console
localStorage.clear()
```

**Database (Optional):**
```sql
USE visa_marketplace;
DELETE FROM university_forms WHERE agency_id IN (SELECT id FROM agencies WHERE agency_name LIKE '%test%');
DELETE FROM agency_universities WHERE service_id IN (SELECT id FROM agency_services WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%'));
DELETE FROM agency_services WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%');
DELETE FROM agencies WHERE agency_name LIKE '%test%';
DELETE FROM users WHERE email LIKE '%test%';
```

### 3. **Complete Registration**

#### **Step 1: Basic Information**
Navigate to: http://localhost:5173/agency-registration

Fill in:
- Agency Name: `TestAgency2026`
- Business Registration: `REG-2026-001`
- Country: `Sri Lanka`
- Email: `testagency2026@example.com`
- Phone: `0771234567`
- Address: `123 Test St, Colombo`
- Password: `testpass123`

Click "Next Step" → Should show "Registering..." → Advances to Step 2

**Verify:**
```sql
SELECT user_id, agency_name, contact_phone FROM agencies
WHERE agency_name = 'TestAgency2026';
```

#### **Step 2: Services Configuration**
Add services:
- Country: United Kingdom
  - Universities: University of Oxford, University of Cambridge
  - Processing Time: 4-6 weeks
- Country: United States
  - Universities: Harvard University, MIT
  - Processing Time: 6-8 weeks
- Service Description: "We provide comprehensive visa services..."

Click "Next Step" → Should show "Saving..." → Advances to Step 3

**Verify:**
```sql
SELECT s.country, u.university_name, s.processing_time
FROM agency_services s
JOIN agency_universities u ON s.id = u.service_id
WHERE s.user_id = (SELECT id FROM users WHERE email = 'testagency2026@example.com');
```

#### **Step 3: Performance Information**
Fill in:
- Total Students Handled: `1000`
- Total Visas Approved: `900`
- Observe calculated rate: `90.0%`

Click "Next Step" → Should show "Saving..." → Advances to Step 4

**Verify:**
```sql
SELECT agency_name, total_students_handled, total_visas_approved, approval_rate
FROM agencies
WHERE agency_name = 'TestAgency2026';
```
Expected: `1000, 900, 90.00`

#### **Step 4: Form Builder**
For each university (Oxford, Cambridge, Harvard, MIT):

1. Select university from dropdown
2. Edit form title (optional)
3. Add questions:
   - Click "Short Answer" → Title: "Full Name" → Mark Required
   - Click "Multiple Choice" → Title: "Degree Level" → Add options: "Undergraduate", "Graduate", "PhD"
   - Click "Date" → Title: "Date of Birth"
4. Click "Save" (green button) → Shows "Form for [University] saved successfully!"
5. Switch to next university

Preview forms using "Preview" button

Click "Complete Registration" → Saves all forms → Redirects to Dashboard

**Verify:**
```sql
SELECT
  a.agency_name,
  au.university_name,
  uf.form_title,
  JSON_LENGTH(uf.questions) as question_count
FROM university_forms uf
JOIN agencies a ON uf.agency_id = a.id
LEFT JOIN agency_universities au ON uf.agency_university_id = au.id
WHERE a.agency_name = 'TestAgency2026';
```

Expected: 4 rows (one for each university)

---

## Expected Database State After Registration

### Users Table
```
id: uuid
email: testagency2026@example.com
user_type: agency
```

### Agencies Table
```
user_id: [uuid from users]
agency_name: TestAgency2026
contact_phone: 0771234567
head_office_address: 123 Test St, Colombo
total_students_handled: 1000
total_visas_approved: 900
approval_rate: 90.00
```

### Agency_Services Table
```
Row 1: UK, 4-6 weeks
Row 2: USA, 6-8 weeks
```

### Agency_Universities Table
```
Row 1: Oxford
Row 2: Cambridge
Row 3: Harvard
Row 4: MIT
```

### University_Forms Table
```
Row 1: Oxford form with questions
Row 2: Cambridge form with questions
Row 3: Harvard form with questions
Row 4: MIT form with questions
```

---

## Troubleshooting

### Issue: "Authentication required" error
**Solution:** Step 1 must complete successfully first. Check localStorage for `authToken` and `user`.

### Issue: "Agency not found" error
**Solution:** Ensure Step 1 completed. Query: `SELECT * FROM agencies WHERE user_id = 'your-user-id'`

### Issue: Forms not saving
**Solution:**
1. Check console for errors
2. Verify each form has at least 1 question
3. Check backend logs: `cd Backend && npm start` (view console)

### Issue: Backend returns 404
**Solution:** Restart backend server:
```bash
cd Backend
lsof -ti:5003 | xargs kill -9
npm start
```

---

## API Testing Examples

### Test Step 1 (Registration)
```bash
curl -X POST http://localhost:5003/auth/register/agency \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "testpass123",
    "agency_name": "API Test Agency",
    "phone": "0771234567",
    "address": "Test Address",
    "country_of_operation": "Sri Lanka",
    "license_number": "LIC-123"
  }'
```

### Test Step 2 (Services)
```bash
TOKEN="your-token-from-step1"
USER_ID="your-user-id-from-step1"

curl -X POST http://localhost:5003/auth/agency/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "'$USER_ID'",
    "services": [
      {
        "country": "United Kingdom",
        "processing_time": "4-6 weeks",
        "universities": ["University of Oxford"]
      }
    ]
  }'
```

### Test Step 3 (Statistics)
```bash
curl -X POST http://localhost:5003/auth/agency/statistics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "'$USER_ID'",
    "total_students_handled": 1000,
    "total_visas_approved": 900
  }'
```

### Test Step 4 (Forms)
```bash
curl -X POST http://localhost:5003/auth/agency/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "'$USER_ID'",
    "university_forms": {
      "University of Oxford": {
        "formTitle": "Oxford Application",
        "formDescription": "Custom form",
        "questions": [
          {
            "id": "q-1",
            "type": "short-answer",
            "title": "Full Name",
            "required": true
          }
        ]
      }
    }
  }'
```

---

## Documentation Files

| File | Description |
|------|-------------|
| `STEP3_STATISTICS_INTEGRATION.md` | Step 3 documentation |
| `STEP4_FORM_BUILDER_INTEGRATION.md` | Step 4 documentation |
| `FIX_USER_ID_ISSUE.md` | Fix for user_id bug |
| `API_TEST.md` | API testing guide |
| `test_forms_endpoint.sh` | Automated test script |
| `cleanup_test_agencies.sql` | Database cleanup script |

---

## Success Criteria

✅ **Step 1:** Agency registered, token stored in localStorage
✅ **Step 2:** Services and universities saved in database
✅ **Step 3:** Statistics saved with calculated approval rate
✅ **Step 4:** All forms saved to university_forms table
✅ **Navigation:** Redirects to dashboard after completion
✅ **Data Integrity:** All foreign keys properly linked
✅ **Error Handling:** Clear error messages displayed
✅ **Loading States:** Visual feedback during API calls

---

## Summary

🎉 **Complete agency registration flow implemented with:**
- ✅ 4 backend endpoints
- ✅ Full frontend integration
- ✅ Database schema updates
- ✅ Authentication & validation
- ✅ Error handling
- ✅ Loading states
- ✅ Data persistence
- ✅ Transaction safety

**Ready for production testing!** 🚀
