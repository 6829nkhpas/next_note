# 🚀 Production Deployment Guide

## Vercel Deployment Steps

### 1. Backend API Deployment

```bash
# Navigate to API directory
cd api

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard:
# NODE_ENV=production
# JWT_SECRET=your-super-secure-production-jwt-secret
# JWT_EXPIRES_IN=7d
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notesapp
# CORS_ORIGIN=https://your-frontend.vercel.app
```

### 2. Frontend Deployment

```bash
# Navigate to web directory
cd web

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_BASE=https://your-api.vercel.app
```

### 3. Update CORS Settings

After both deployments, update the `CORS_ORIGIN` in your backend environment to include your actual frontend domain.

## Environment Variables

### Backend (API)
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-production-jwt-secret
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notesapp
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend (Web)
```env
NEXT_PUBLIC_API_BASE=https://your-api.vercel.app
```

## Post-Deployment Checklist

- [ ] Verify API health endpoint: `https://your-api.vercel.app/health`
- [ ] Test login with test accounts
- [ ] Verify tenant isolation
- [ ] Test admin functionality
- [ ] Test note creation and limits
- [ ] Verify CORS is working
- [ ] Check mobile responsiveness

## Security Checklist

- [ ] Change default JWT secret
- [ ] Use strong MongoDB credentials
- [ ] Enable MongoDB Atlas security features
- [ ] Verify HTTPS is enabled (Vercel provides this)
- [ ] Test rate limiting on login endpoint

## Monitoring

- Monitor API usage in Vercel dashboard
- Set up MongoDB Atlas monitoring
- Configure error tracking if needed
- Monitor response times and uptime

## Troubleshooting

### Common Issues

1. **CORS Errors**: Update `CORS_ORIGIN` with correct frontend URL
2. **Database Connection**: Verify MongoDB URI and network access
3. **JWT Issues**: Ensure JWT_SECRET is set correctly
4. **Build Failures**: Check Node.js version compatibility

### Support

For deployment issues, check:
- Vercel deployment logs
- MongoDB Atlas connection logs
- Browser console for frontend errors
- Network tab for API call failures
