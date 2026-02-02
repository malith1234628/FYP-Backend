#!/bin/bash
# Test script for university forms endpoint

echo "=== Testing University Forms Endpoint ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: No authentication
echo "${YELLOW}Test 1: No authentication${NC}"
RESPONSE=$(curl -s -X POST http://localhost:5003/auth/agency/forms \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "Access denied"; then
  echo "${GREEN}✓ Test 1 PASSED: Authentication required${NC}"
else
  echo "${RED}✗ Test 1 FAILED${NC}"
fi
echo ""

# Test 2: Invalid token
echo "${YELLOW}Test 2: Invalid token${NC}"
RESPONSE=$(curl -s -X POST http://localhost:5003/auth/agency/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{}')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "Invalid token\|Access denied"; then
  echo "${GREEN}✓ Test 2 PASSED: Invalid token rejected${NC}"
else
  echo "${RED}✗ Test 2 FAILED${NC}"
fi
echo ""

# Test 3: Missing required fields
echo "${YELLOW}Test 3: Missing required fields${NC}"
echo "You need to provide a valid token for this test."
echo "After registration, run:"
echo ""
echo "TOKEN='your-token-here'"
echo "USER_ID='your-user-id-here'"
echo ""
echo "curl -X POST http://localhost:5003/auth/agency/forms \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -d '{\"user_id\": \"\$USER_ID\"}'"
echo ""

# Test 4: Sample valid request
echo "${YELLOW}Test 4: Sample valid request format${NC}"
cat << 'EOF'
curl -X POST http://localhost:5003/auth/agency/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "$USER_ID",
    "university_forms": {
      "University of Oxford": {
        "formTitle": "Oxford Application Form",
        "formDescription": "Please complete this form",
        "questions": [
          {
            "id": "q-1",
            "type": "short-answer",
            "title": "What is your full name?",
            "placeholder": "John Doe",
            "required": true
          },
          {
            "id": "q-2",
            "type": "multiple-choice",
            "title": "Degree Level",
            "required": true,
            "options": ["Undergraduate", "Graduate", "PhD"]
          },
          {
            "id": "q-3",
            "type": "date",
            "title": "Date of Birth",
            "required": true
          }
        ]
      }
    }
  }'
EOF

echo ""
echo "${YELLOW}=== Test Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Complete agency registration (Steps 1-3)"
echo "2. Get TOKEN and USER_ID from localStorage"
echo "3. Run the curl command above with your credentials"
echo "4. Check database: SELECT * FROM university_forms;"
