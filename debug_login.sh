#!/bin/bash

API_BASE="https://api-mbmxbtx9y-namans-projects-194ade92.vercel.app"

echo "🔍 Debugging API Login Issue"
echo "=============================="

echo "1. Test basic connectivity..."
curl -X GET "$API_BASE/health" -w "\nStatus: %{http_code}\n\n" --max-time 10

echo "2. Test environment variables..."
curl -X GET "$API_BASE/test" -w "\nStatus: %{http_code}\n\n" --max-time 10

echo "3. Test login with verbose output..."
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}' \
  -v --max-time 15

echo -e "\n\n4. Test with user@acme.test..."
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@acme.test","password":"password"}' \
  -w "\nStatus: %{http_code}\n" --max-time 15
