#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "Testing Authentication Resource"
echo "=========================================="

echo -e "\n1. Testing registration..."
echo "Registering an Admin user..."
RESPONSE1=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "password": "password123",
    "role": "Admin"
  }')

echo "Response: $RESPONSE1"

# Extract tokens
ACCESS_TOKEN1=$(echo $RESPONSE1 | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN1=$(echo $RESPONSE1 | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)

echo "Access Token: ${ACCESS_TOKEN1:0:30}..."
echo "Refresh Token: ${REFRESH_TOKEN1:0:30}..."

echo -e "\n2. Testing login with same user..."
RESPONSE2=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }')

echo "Response: $RESPONSE2"

ACCESS_TOKEN2=$(echo $RESPONSE2 | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN2=$(echo $RESPONSE2 | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)

echo -e "\n3. Testing protected profile endpoint..."
curl -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN1"

echo -e "\n4. Testing without token (should fail)..."
curl -X GET $BASE_URL/auth/profile

echo -e "\n5. Testing with invalid token (should fail)..."
curl -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer invalid.token.here"

echo -e "\n6. Testing refresh token..."
RESPONSE3=$(curl -s -X POST $BASE_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN1\"
  }")

echo "Response: $RESPONSE3"

NEW_ACCESS_TOKEN=$(echo $RESPONSE3 | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo -e "\n7. Testing logout..."
curl -X POST $BASE_URL/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN1" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN1\"
  }"

echo -e "\n8. Testing logout-all..."
curl -X POST $BASE_URL/auth/logout-all \
  -H "Authorization: Bearer $ACCESS_TOKEN1"

echo -e "\n9. Testing registration validation errors..."
echo "Test 1: Missing required fields"
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test"
  }'

echo -e "\nTest 2: Invalid email"
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "invalid-email",
    "password": "123",
    "role": "Teacher"
  }'

echo -e "\nTest 3: Invalid role"
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "role": "InvalidRole"
  }'

echo -e "\n10. Testing role-based authorization..."
echo "Creating a Teacher user..."
TEACHER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Teacher",
    "lastName": "User",
    "email": "teacher@example.com",
    "password": "password123",
    "role": "Teacher"
  }')

TEACHER_TOKEN=$(echo $TEACHER_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo -e "\nTry to access admin-only endpoints with Teacher token..."
echo "GET /users (should fail for Teacher)..."
curl -X GET $BASE_URL/users \
  -H "Authorization: Bearer $TEACHER_TOKEN"

echo -e "\nGET /users (should work for Admin)..."
curl -X GET $BASE_URL/users \
  -H "Authorization: Bearer $ACCESS_TOKEN1"
