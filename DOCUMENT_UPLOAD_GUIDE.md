# Student Document Upload Feature

## Overview
This feature allows students to upload their passport and CV documents after registration. The files are stored directly in the database as binary data (BLOB) in their original format, preserving the exact file type uploaded by the user.

## Database Schema

### Students Table - New Columns
The following columns have been added to the `students` table:

```sql
-- Passport document columns
passport_file           LONGBLOB        -- Binary data of passport file
passport_filename       VARCHAR(255)    -- Original filename (e.g., "passport.pdf")
passport_mimetype       VARCHAR(100)    -- MIME type (e.g., "application/pdf")
passport_uploaded_at    TIMESTAMP       -- Upload timestamp

-- CV document columns
cv_file                 LONGBLOB        -- Binary data of CV file
cv_filename             VARCHAR(255)    -- Original filename (e.g., "resume.pdf")
cv_mimetype             VARCHAR(100)    -- MIME type (e.g., "application/pdf")
cv_uploaded_at          TIMESTAMP       -- Upload timestamp
```

## API Endpoints

### 1. Upload Documents
**Endpoint:** `POST /api/students/documents/upload`

**Content-Type:** `multipart/form-data`

**Request Body:**
- `userId` (string, required): The student's user ID
- `passport` (file, optional): Passport image file (JPG, PNG, GIF, PDF)
- `cv` (file, optional): CV document file (PDF, DOC, DOCX)

**Note:** At least one file (passport or CV) must be provided.

**File Size Limit:** 10MB per file

**Example using JavaScript Fetch:**
```javascript
const formData = new FormData();
formData.append("userId", userId);
formData.append("passport", passportFile);
formData.append("cv", cvFile);

const response = await fetch("http://localhost:5003/api/students/documents/upload", {
  method: "POST",
  body: formData,
});

const data = await response.json();
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Documents uploaded successfully",
  "uploaded": {
    "passport": "passport_scan.pdf",
    "cv": "john_doe_resume.pdf"
  }
}
```

**Error Responses:**
- `400`: Missing userId or no files uploaded
- `404`: Student not found
- `500`: Server error

### 2. Download Document
**Endpoint:** `GET /api/students/documents/:userId/:documentType`

**Parameters:**
- `userId` (string): The student's user ID
- `documentType` (string): Either "passport" or "cv"

**Example:**
```
GET http://localhost:5003/api/students/documents/abc123/passport
GET http://localhost:5003/api/students/documents/abc123/cv
```

**Success Response:**
Returns the file with appropriate headers:
- `Content-Type`: Original MIME type
- `Content-Disposition`: `attachment; filename="original_filename.ext"`

**Error Responses:**
- `400`: Invalid document type
- `404`: Student or document not found
- `500`: Server error

### 3. Get Document Status
**Endpoint:** `GET /api/students/documents/:userId/status`

**Parameters:**
- `userId` (string): The student's user ID

**Example:**
```
GET http://localhost:5003/api/students/documents/abc123/status
```

**Success Response (200):**
```json
{
  "success": true,
  "documents": {
    "passport": {
      "uploaded": true,
      "filename": "passport_scan.pdf",
      "mimetype": "application/pdf",
      "uploadedAt": "2025-02-03T10:30:00.000Z"
    },
    "cv": {
      "uploaded": true,
      "filename": "resume.docx",
      "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "uploadedAt": "2025-02-03T10:31:00.000Z"
    }
  }
}
```

## Frontend Integration

### Registration Flow
1. Student registers on `/register` page
2. Upon successful registration, JWT token is saved to localStorage
3. Student is redirected to `/onboarding` page
4. Onboarding page extracts user ID from JWT token
5. Student uploads passport and CV documents
6. Files are sent to backend API
7. Upon successful upload, student is redirected to `/dashboard`

### OnboardingPage Component
Located at: `Frontend/frontend/src/app/pages/OnboardingPage.tsx`

**Key Features:**
- File validation (size and type)
- Visual feedback (file name display after selection)
- Upload button disabled until both files are selected
- Loading state during upload
- Error handling and display

**Supported File Types:**
- **Passport:** JPG, JPEG, PNG, GIF, PDF
- **CV:** PDF, DOC, DOCX

**File Size Limit:** 10MB per file

## File Storage Strategy

### Why Store in Database?
Files are stored directly in the database as BLOB data because:
1. **Simplicity**: No file system management required
2. **Atomicity**: Database transactions ensure data consistency
3. **Backup**: Files are backed up with regular database backups
4. **Security**: Access controlled through database permissions
5. **Format Preservation**: Files are stored exactly as uploaded

### Advantages
- Original file format preserved (PDF remains PDF, DOCX remains DOCX)
- No file path dependencies
- Easy to implement download functionality
- Transactional integrity with other student data

### Considerations
- Database size will grow with file uploads
- Consider file size limits (currently 10MB per file)
- For very large scale, consider migrating to object storage (S3, etc.)

## Security Considerations

1. **File Type Validation**: Only allowed MIME types are accepted
2. **File Size Limits**: 10MB maximum per file to prevent abuse
3. **User Authentication**: User ID is validated before upload/download
4. **SQL Injection**: Using parameterized queries
5. **XSS Prevention**: File metadata properly escaped

## Testing

### Manual Testing Steps

1. **Test Registration and Token Storage:**
```bash
# Register a new student
curl -X POST http://localhost:5003/auth/register/student \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "full_name": "Test Student",
    "phone": "+1234567890"
  }'
```

2. **Test Document Upload:**
```bash
# Upload documents (replace USER_ID with actual user ID)
curl -X POST http://localhost:5003/api/students/documents/upload \
  -F "userId=USER_ID" \
  -F "passport=@/path/to/passport.pdf" \
  -F "cv=@/path/to/resume.pdf"
```

3. **Test Document Status:**
```bash
curl http://localhost:5003/api/students/documents/USER_ID/status
```

4. **Test Document Download:**
```bash
curl http://localhost:5003/api/students/documents/USER_ID/passport -o downloaded_passport.pdf
curl http://localhost:5003/api/students/documents/USER_ID/cv -o downloaded_cv.pdf
```

## Migration

### Running the Migration
The migration has already been applied. To reapply or apply to a new database:

```bash
cd Backend
node run_student_documents_migration.js
```

Or manually:
```bash
mysql -u root -p visa_marketplace < migrations/add_student_documents.sql
```

## Troubleshooting

### Common Issues

**1. Files not uploading**
- Check file size (must be < 10MB)
- Verify file type is supported
- Check browser console for errors

**2. User ID not found**
- Ensure JWT token is saved to localStorage after registration
- Check token format and expiration

**3. Database errors**
- Verify migration has been run
- Check MySQL `max_allowed_packet` setting for large files

**4. CORS issues**
- Ensure backend CORS is configured to allow frontend origin

## Future Enhancements

Potential improvements:
1. Add image compression for passport photos
2. Implement virus scanning for uploaded files
3. Add support for multiple passport pages
4. Migrate to object storage (S3) for larger scale
5. Add document verification status tracking
6. Implement document expiry notifications
