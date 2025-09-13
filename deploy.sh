#!/bin/bash

# 🚀 Multi-Tenant Notes App Deployment Script

set -e

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "api" ] && [ ! -d "web" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Choose deployment option:"
echo "1) Deploy Backend API only"
echo "2) Deploy Frontend only"
echo "3) Deploy both (separate projects)"
echo "4) Deploy as monorepo (single project)"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🔧 Deploying Backend API..."
        cd api
        vercel --prod
        echo "✅ Backend deployed! Don't forget to set environment variables in Vercel dashboard."
        ;;
    2)
        echo "🎨 Deploying Frontend..."
        cd web
        vercel --prod
        echo "✅ Frontend deployed! Don't forget to set NEXT_PUBLIC_API_BASE in Vercel dashboard."
        ;;
    3)
        echo "🔧 Deploying Backend API..."
        cd api
        vercel --prod
        echo "✅ Backend deployed!"
        
        echo "🎨 Deploying Frontend..."
        cd ../web
        vercel --prod
        echo "✅ Frontend deployed!"
        
        echo "📝 Remember to:"
        echo "   - Set environment variables in both Vercel projects"
        echo "   - Update CORS_ORIGIN in backend with frontend URL"
        echo "   - Update NEXT_PUBLIC_API_BASE in frontend with backend URL"
        ;;
    4)
        echo "🏗️ Deploying as monorepo..."
        vercel --prod
        echo "✅ Monorepo deployed! Set all environment variables in Vercel dashboard."
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo "🎉 Deployment process completed!"
echo "📚 Check DEPLOYMENT.md for detailed instructions and troubleshooting."
