# Agency Registration Step 4 - Form Builder Integration

## Overview
This document describes the implementation of Step 4 (Form Builder) in the agency registration flow, which allows agencies to create custom application forms for each university they support.

## Database Schema

### Table: `university_forms`
Stores custom application forms created by agencies for specific universities.

```sql
CREATE TABLE university_forms (
  id CHAR(36) PRIMARY KEY,                    -- UUID for the form
  agency_id CHAR(36) NOT NULL,                -- Foreign key to agencies.id
  agency_university_id INT,                    -- Foreign key to agency_universities.id
  form_title VARCHAR(255) NOT NULL,           -- Title of the form
  form_description TEXT,                       -- Description of the form
  questions JSON NOT NULL,                     -- Array of questions in JSON format
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (agency_university_id) REFERENCES agency_universities(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_university (agency_id, agency_university_id)
);
```

### Question JSON Structure
Each question in the `questions` JSON array follows this structure:

```json
{
  "id": "q-1234567890",
  "type": "short-answer",
  "title": "What is your full name?",
  "description": "Please provide your legal name as shown on your passport",
  "placeholder": "John Doe",
  "required": true,
  "options": ["Option 1", "Option 2"]  // Only for multiple-choice, checkboxes, dropdown
}
```

**Supported Question Types:**
- `short-answer`: Brief text input
- `paragraph`: Long text input (textarea)
- `multiple-choice`: Single selection from radio buttons
- `checkboxes`: Multiple selections
- `dropdown`: Select from dropdown list
- `date`: Date picker
- `file-upload`: File upload field

## Backend Implementation

### Endpoint
**POST** `/auth/agency/forms`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "user_id": "uuid-string",
  "university_forms": {
    "University of Oxford": {
      "formTitle": "University of Oxford - Application Form",
      "formDescription": "Please fill out this form to apply through our agency",
      "questions": [
        {
          "id": "q-1234567890",
          "type": "short-answer",
          "title": "What is your full name?",
          "description": "Legal name as on passport",
          "placeholder": "John Doe",
          "required": true
        },
        {
          "id": "q-1234567891",
          "type": "multiple-choice",
          "title": "What is your highest qualification?",
          "required": true,
          "options": ["High School", "Bachelor's", "Master's", "PhD"]
        }
      ]
    },
    "University of Cambridge": {
      "formTitle": "Cambridge Application",
      "formDescription": "Custom form for Cambridge",
      "questions": [...]
    }
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "University forms saved successfully",
  "data": {
    "saved_forms": [
      {
        "university": "University of Oxford",
        "form_id": "uuid-string",
        "action": "created"
      },
      {
        "university": "University of Cambridge",
        "form_id": "uuid-string",
        "action": "updated"
      }
    ],
    "total_saved": 2,
    "errors": []
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Failed to save university forms",
  "error": "Detailed error message"
}
```

### Controller Function
Location: [Backend/controllers/authController.js](Backend/controllers/authController.js:500-650)

Function: `saveUniversityForms`

**Features:**
- Validates user authentication and input data
- Looks up agency_id from user_id
- For each university, finds the corresponding agency_university_id
- Inserts new forms or updates existing ones (upsert logic)
- Processes multiple forms in a single transaction
- Returns detailed results for each form saved
- Handles partial failures gracefully

**Key Logic:**
```javascript
// 1. Get agency_id from user_id
const [agencies] = await connection.execute(
  'SELECT id FROM agencies WHERE user_id = ?',
  [user_id]
);

// 2. Find agency_university_id for each university
const [universityRecords] = await connection.execute(
  `SELECT au.id
   FROM agency_universities au
   JOIN agency_services as2 ON au.service_id = as2.id
   WHERE as2.user_id = ? AND au.university_name = ?`,
  [user_id, universityName]
);

// 3. Insert or update form
if (existingForms.length > 0) {
  // UPDATE existing form
} else {
  // INSERT new form
}
```

### Route
Location: [Backend/routes/authRoutes.js](Backend/routes/authRoutes.js:21)

```javascript
router.post('/agency/forms', authenticate, saveUniversityForms);
```

## Frontend Integration

### Location
File: [Frontend/frontend/src/app/pages/AgencyRegistrationPage.tsx](Frontend/frontend/src/app/pages/AgencyRegistrationPage.tsx)

### State Management
```typescript
// Form builder state
const [universityForms, setUniversityForms] = useState<{[key: string]: UniversityForm}>({});
const [currentUniversity, setCurrentUniversity] = useState<string>("");
const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
const [isPreviewMode, setIsPreviewMode] = useState(false);

// Type definitions
type QuestionType = 'short-answer' | 'paragraph' | 'multiple-choice' |
                    'checkboxes' | 'dropdown' | 'date' | 'file-upload';

type FormQuestion = {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
};

type UniversityForm = {
  formTitle: string;
  formDescription: string;
  questions: FormQuestion[];
};
```

### Save Individual Form Function
```typescript
const saveCurrentForm = async () => {
  const token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const response = await fetch("http://localhost:5003/auth/agency/forms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id: user.id,
      university_forms: {
        [currentUniversity]: currentForm
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to save form");
  }
};
```

### Complete Registration Function
```typescript
const handleSubmit = async () => {
  // Save all university forms when completing registration
  const response = await fetch("http://localhost:5003/auth/agency/forms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      user_id: user.id,
      university_forms: universityForms  // All forms
    })
  });

  if (response.ok) {
    navigate("/agency-dashboard");
  }
};
```

### UI Features

1. **Form Builder Interface:**
   - Left sidebar with question type templates
   - Main canvas for building forms
   - Question editing with drag-and-drop (visual only)
   - Live preview mode

2. **Question Management:**
   - Add questions by clicking question type
   - Edit question title, description, placeholder
   - Add/remove options for choice-based questions
   - Mark questions as required
   - Duplicate or delete questions

3. **Save Options:**
   - **Individual Save:** Save current form using the "Save" button in the toolbar
   - **Complete Registration:** Save all forms when clicking "Complete Registration"

4. **Validation:**
   - At least one question required per form
   - All selected universities must have forms
   - Form title and description required

## Testing Guide

### 1. Start Services
```bash
# Backend
cd Backend
npm start

# Frontend
cd Frontend/frontend
npm run dev
```

### 2. Complete Registration Flow

**Step 1: Basic Information**
- Fill in agency details
- Click "Next Step" → Registers agency

**Step 2: Services Configuration**
- Select countries: UK, USA
- Add universities:
  - UK: University of Oxford, University of Cambridge
  - USA: Harvard University, MIT
- Click "Next Step" → Saves services

**Step 3: Performance Information**
- Total Students: 1000
- Total Visas Approved: 900
- Click "Next Step" → Saves statistics

**Step 4: Form Builder**
- You'll see 4 universities (Oxford, Cambridge, Harvard, MIT)
- For each university:
  1. Select university from dropdown
  2. Edit form title/description
  3. Add questions:
     - Click question type from left sidebar
     - Fill in question details
     - Mark as required if needed
  4. Click "Save" to save this form
  5. Switch to next university
- Preview forms using "Preview" button
- Click "Complete Registration" → Saves all remaining forms

### 3. Verify in Database

```sql
USE visa_marketplace;

-- View saved forms
SELECT
  uf.id,
  a.agency_name,
  au.university_name,
  uf.form_title,
  JSON_LENGTH(uf.questions) as question_count,
  uf.created_at,
  uf.updated_at
FROM university_forms uf
JOIN agencies a ON uf.agency_id = a.id
LEFT JOIN agency_universities au ON uf.agency_university_id = au.id
ORDER BY uf.created_at DESC;

-- View questions for a specific form
SELECT
  a.agency_name,
  au.university_name,
  uf.form_title,
  JSON_PRETTY(uf.questions) as questions
FROM university_forms uf
JOIN agencies a ON uf.agency_id = a.id
LEFT JOIN agency_universities au ON uf.agency_university_id = au.id
WHERE a.agency_name = 'YourAgencyName';
```

### 4. Test API Directly

```bash
# Get auth token from localStorage after completing Step 1
TOKEN="your-jwt-token"
USER_ID="your-user-id"

# Save a single form
curl -X POST http://localhost:5003/auth/agency/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "'$USER_ID'",
    "university_forms": {
      "University of Oxford": {
        "formTitle": "Oxford Application Form",
        "formDescription": "Custom form for Oxford applications",
        "questions": [
          {
            "id": "q-1",
            "type": "short-answer",
            "title": "Full Name",
            "placeholder": "Enter your full name",
            "required": true
          },
          {
            "id": "q-2",
            "type": "multiple-choice",
            "title": "Degree Level",
            "required": true,
            "options": ["Undergraduate", "Graduate", "PhD"]
          }
        ]
      }
    }
  }'
```

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Missing fields | 400 | "user_id and university_forms object are required" |
| Invalid form data | 400 | "Invalid form data" (in errors array) |
| Agency not found | 404 | "Agency not found for this user" |
| Not authenticated | 401 | "Access denied. No token provided." |
| Server error | 500 | "Failed to save university forms" |

## File Changes Summary

### Backend Files:
1. ✅ `Backend/controllers/authController.js` - Added `saveUniversityForms` function
2. ✅ `Backend/routes/authRoutes.js` - Added POST `/auth/agency/forms` route
3. ✅ `Backend/migrations/create_university_forms_table.sql` - Table already exists
4. ✅ `Backend/run_migration.js` - Helper script for migrations

### Frontend Files:
1. ✅ `Frontend/frontend/src/app/pages/AgencyRegistrationPage.tsx` - Added form save functionality

### Database:
- ✅ Table `university_forms` exists with correct schema
- ✅ Foreign keys properly set up
- ✅ JSON support for questions field

## Features

✅ **Google Forms-like interface** with drag-and-drop visual feedback
✅ **7 question types** supported
✅ **Live preview mode** to see student view
✅ **Individual form saving** with instant feedback
✅ **Bulk save** on registration completion
✅ **Update existing forms** (upsert logic)
✅ **Transaction-safe** database operations
✅ **Detailed error reporting** per form
✅ **Form validation** before saving
✅ **Multi-university support** in single request

## Next Steps

1. ✅ Backend endpoint created
2. ✅ Frontend integration completed
3. ⏳ Test complete registration flow
4. ⏳ Verify database records
5. 📋 (Future) Add form submission endpoint for students
6. 📋 (Future) Add form response storage
7. 📋 (Future) Add form analytics dashboard

## Notes

- Forms are saved as JSON in the database for flexibility
- Each agency can have one form per university
- Forms can be updated by re-saving (upsert)
- The frontend validates that all universities have forms before allowing completion
- Individual saves provide immediate feedback to users
- Final save on completion ensures all forms are persisted
- Transaction handling ensures data integrity across multiple form saves
