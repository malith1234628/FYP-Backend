# Fix: Statistics Saved to Wrong User

## Problem
When registering a new agency (`agencytest3`), the Step 3 statistics were being saved to a previously logged-in user (`malith`) instead of the new agency.

## Root Cause
The registration flow had a critical sequence issue:

**OLD (Broken) Flow:**
1. Step 1: Fill basic info → Just stored in state, NOT registered yet
2. Step 2: Save services → Used `user_id` from localStorage (had OLD user - malith)
3. Step 3: Save statistics → Used `user_id` from localStorage (still had OLD user - malith) ❌
4. Step 4: Complete → Only NOW did it register the agency

**Result:** Steps 2 and 3 were using the wrong `user_id` from localStorage!

## Solution
Changed the registration flow to register the agency immediately after Step 1:

**NEW (Fixed) Flow:**
1. Step 1: Fill basic info → **REGISTERS AGENCY IMMEDIATELY** → Stores NEW user data in localStorage ✅
2. Step 2: Save services → Uses CORRECT `user_id` from localStorage ✅
3. Step 3: Save statistics → Uses CORRECT `user_id` from localStorage ✅
4. Step 4: Form builder → Just completes the flow ✅

## Changes Made

### File: `Frontend/frontend/src/app/pages/AgencyRegistrationPage.tsx`

#### 1. Added Registration to Step 1 (Line ~341)
```typescript
const handleNext = async () => {
  // Register agency when moving from Step 1 to Step 2
  if (currentStep === 1) {
    setIsLoading(true);
    setError("");

    try {
      const payload = {
        email: contactEmail,
        password: password,
        agency_name: agencyName,
        phone: contactPhone,
        address: headOfficeAddress,
        country_of_operation: countryOfOperation,
        license_number: businessRegistration,
      };

      const response = await fetch("http://localhost:5003/auth/register/agency", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.errors
          ? data.errors.join(', ')
          : data.message || data.error || "Registration failed";
        throw new Error(errorMessage);
      }

      // Store NEW user token in localStorage
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Move to next step
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : "An error occurred during registration");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
    return;
  }

  // ... rest of the function (Step 2, 3, 4)
}
```

#### 2. Updated handleSubmit (Line ~518)
```typescript
const handleSubmit = async () => {
  // At this point, agency is already registered (in Step 1)
  // Services are saved (Step 2)
  // Statistics are saved (Step 3)
  // Forms are created (Step 4)
  // Just complete the registration flow

  try {
    alert("Agency registration completed successfully! 🎉");
    navigate("/agency-dashboard");
  } catch (err) {
    console.error('Completion error:', err);
    setError(err instanceof Error ? err.message : "An error occurred");
  }
};
```

#### 3. Updated Button Text (Line ~930)
```typescript
{isLoading && (currentStep === 1 || currentStep === 2 || currentStep === 3)
  ? currentStep === 1 ? "Registering..." : "Saving..."
  : "Next Step"}
```

## Testing the Fix

### Before Testing
1. **Clear old data from database** (optional but recommended):
```sql
USE visa_marketplace;

-- Remove test agencies if you want to start fresh
DELETE FROM agency_universities WHERE service_id IN (
  SELECT id FROM agency_services WHERE user_id IN (
    SELECT user_id FROM agencies WHERE agency_name IN ('agencytest3', 'malith')
  )
);

DELETE FROM agency_services WHERE user_id IN (
  SELECT user_id FROM agencies WHERE agency_name IN ('agencytest3', 'malith')
);

DELETE FROM agencies WHERE agency_name IN ('agencytest3', 'malith');

DELETE FROM users WHERE id IN (
  'cd1e84de-4e46-431f-8bdc-c2843a10dd7e',  -- agencytest3
  '6eb41c6d-d73a-4472-8b27-85d633cdc1ff'   -- malith
);
```

2. **Clear browser data:**
   - Open browser DevTools (F12)
   - Go to Application > Local Storage
   - Clear `authToken` and `user`
   - Or run: `localStorage.clear()`

### Test Steps

1. **Start fresh registration:**
   - Navigate to: http://localhost:5173/agency-registration
   - Should be on Step 1

2. **Complete Step 1:**
   - Agency Name: `NewAgency2026`
   - Business Registration: `REG-2026-001`
   - Country: `Sri Lanka`
   - Email: `newagency@test.com`
   - Phone: `0771234567`
   - Address: `123 New Street, Colombo`
   - Password: `testpass123`
   - Click "Next Step" → Should show "Registering..."
   - ✅ Check browser DevTools → localStorage should now have NEW `authToken` and `user`

3. **Verify Step 1 registration:**
```sql
SELECT user_id, agency_name, contact_phone
FROM agencies
WHERE agency_name = 'NewAgency2026';
```
Expected: Should see the new agency in database

4. **Complete Step 2:**
   - Add country: United Kingdom
   - Add university: University of Oxford
   - Processing time: 4-6 weeks
   - Service description: Test description
   - Click "Next Step" → Should show "Saving..."
   - ✅ Services should be saved to the NEW agency

5. **Verify Step 2:**
```sql
SELECT u.user_id, a.agency_name, s.country, s.processing_time, u.university_name
FROM agencies a
JOIN agency_services s ON a.user_id = s.user_id
JOIN agency_universities u ON s.id = u.service_id
WHERE a.agency_name = 'NewAgency2026';
```

6. **Complete Step 3:**
   - Total Students Handled: `1000`
   - Total Visas Approved: `900`
   - Observe calculated rate: `90.0%`
   - Click "Next Step" → Should show "Saving..."
   - ✅ Statistics should be saved to the NEW agency

7. **Verify Step 3 (THE CRITICAL TEST):**
```sql
SELECT user_id, agency_name,
       total_students_handled,
       total_visas_approved,
       approval_rate
FROM agencies
WHERE agency_name = 'NewAgency2026';
```

**Expected Result:**
```
+--------------------------------------+----------------+-------------------------+----------------------+---------------+
| user_id                              | agency_name    | total_students_handled  | total_visas_approved | approval_rate |
+--------------------------------------+----------------+-------------------------+----------------------+---------------+
| [NEW UUID]                           | NewAgency2026  | 1000                    | 900                  | 90.00         |
+--------------------------------------+----------------+-------------------------+----------------------+---------------+
```

✅ **SUCCESS:** The statistics are now saved to the CORRECT agency (NewAgency2026), not to a different user!

## Important Notes

1. **Email must be unique:** Each registration requires a unique email address

2. **Start fresh:** If you're testing multiple times, either:
   - Use a different email each time
   - Clear the previous test data from database
   - Clear browser localStorage before starting

3. **Backend must be restarted:** The backend server was restarted to pick up the route changes

4. **One-way flow:** After completing Step 1, you cannot go back and change the email/password as the agency is already registered

## Summary

✅ **Fixed:** Statistics now save to the correct user
✅ **Fixed:** Services now save to the correct user
✅ **Fixed:** Registration happens at the right time (Step 1)
✅ **Fixed:** localStorage is updated immediately after registration

The registration flow now works correctly, and each agency's data is properly isolated!
