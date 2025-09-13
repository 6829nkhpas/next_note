#!/bin/bash

# Test script for the deployed Notes API
API_BASE="https://notes-api-fixed-ri38e76w2-namans-projects-194ade92.vercel.app"

echo "🧪 Testing Notes API Deployment"
echo "================================"

echo "1. Testing health endpoint..."
curl -X GET "$API_BASE/health" -w "\nStatus: %{http_code}\n\n"

echo "2. Testing login with test account..."
TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
  echo "✅ Login successful!"
  echo "Token: ${TOKEN:0:20}..."
  
  echo "3. Testing notes creation..."
  curl -X POST "$API_BASE/notes" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Test Note","content":"This is a test note from the deployed API"}' \
    -w "\nStatus: %{http_code}\n\n"
    
  echo "4. Testing notes retrieval..."
  curl -X GET "$API_BASE/notes" \
    -H "Authorization: Bearer $TOKEN" \
    -w "\nStatus: %{http_code}\n\n"
else
  echo "❌ Login failed - check backend deployment and database connection"
fi
