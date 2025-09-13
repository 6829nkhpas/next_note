# 🚀 Multi-Tenant SaaS Notes Application

A modern, production-ready SaaS Notes application supporting multiple tenants with role-based access control and subscription management. Built with Node.js, Express, Next.js, and MongoDB.

## ✨ Features

- **🏢 Multi-Tenancy**: Support for multiple companies (Acme, Globex) with strict data isolation
- **🔐 Authentication**: JWT-based authentication with role-based access control
- **👑 Admin Panel**: User management, plan upgrades, and tenant administration
- **📝 Notes Management**: Full CRUD operations with subscription limits
- **💎 Subscription Plans**: Free (3 notes) and Pro (unlimited) per-user plans
- **🎨 Modern UI**: Beautiful, responsive design with glassmorphism effects
- **☁️ Cloud Ready**: Optimized for Vercel deployment

## 🏗️ Architecture

### Multi-Tenancy Approach
**Shared Schema with Tenant ID**: All data is isolated using a `tenantId` column, ensuring strict tenant separation while maintaining simplicity and scalability.

### Tech Stack
- **Backend**: Node.js + Express.js
- **Frontend**: Next.js + React
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Deployment**: Vercel (Serverless)
- **Styling**: Modern CSS with gradients and animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd notes
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd api
   npm install
   
   # Frontend
   cd ../web
   npm install
   ```

3. **Environment Setup**
   
   **Backend** (`api/.env`):
   ```env
   PORT=8000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   MONGODB_URI=mongodb://localhost:27017/notesapp
   CORS_ORIGIN=http://localhost:3000
   ```
   
   **Frontend** (`web/.env.local`):
   ```env
   NEXT_PUBLIC_API_BASE=http://localhost:8000
   ```

4. **Seed the database**
   ```bash
   cd api
   npm run seed
   ```

5. **Start the applications**
   ```bash
   # Terminal 1 - Backend
   cd api
   npm run dev
   
   # Terminal 2 - Frontend
   cd web
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## 🧪 Test Accounts

The application comes with pre-configured test accounts:

| Email | Password | Role | Tenant |
|-------|----------|------|--------|
| admin@acme.test | password | Admin | Acme |
| user@acme.test | password | Member | Acme |
| admin@globex.test | password | Admin | Globex |
| user@globex.test | password | Member | Globex |

## ☁️ Production Deployment

### Vercel Deployment

1. **Deploy Backend API**
   ```bash
   cd api
   vercel --prod
   ```
   
   Set environment variables in Vercel dashboard:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-production-jwt-secret`
   - `JWT_EXPIRES_IN=7d`
   - `MONGODB_URI=your-mongodb-atlas-uri`
   - `CORS_ORIGIN=https://your-frontend.vercel.app`

2. **Deploy Frontend**
   ```bash
   cd web
   vercel --prod
   ```
   
   Set environment variables:
   - `NEXT_PUBLIC_API_BASE=https://your-api.vercel.app`

3. **Update CORS Settings**
   Update the `CORS_ORIGIN` in your backend environment to include your frontend domain.

### Environment Variables

**Production Backend** (`api/.env`):
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-production-jwt-secret
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notesapp
CORS_ORIGIN=https://your-frontend.vercel.app
```

**Production Frontend** (`web/.env.local`):
```env
NEXT_PUBLIC_API_BASE=https://your-api.vercel.app
```

## 📊 API Endpoints

### Authentication
- `POST /auth/login` - User login

### Notes
- `POST /notes` - Create note (with plan limits)
- `GET /notes` - List user's notes
- `GET /notes/:id` - Get specific note
- `PUT /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note

### Admin Operations
- `POST /tenants/:slug/invite` - Invite new user
- `GET /tenants/:slug/users` - List tenant users
- `POST /tenants/:slug/users/:userId/toggle-plan` - Toggle user plan
- `DELETE /tenants/:slug/users/:userId` - Delete user

### Health Check
- `GET /health` - API health status

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Tenant Isolation**: Strict data separation between tenants
- **Role-Based Access**: Admin and Member role enforcement
- **Rate Limiting**: Login attempt protection
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Protection**: Configurable cross-origin resource sharing

## 🎨 UI Features

- **Modern Design**: Gradient backgrounds and glassmorphism effects
- **Responsive Layout**: Mobile-first design
- **Interactive Elements**: Hover animations and smooth transitions
- **Emoji Icons**: Intuitive visual cues
- **Admin Dashboard**: Comprehensive user management interface
- **Plan Management**: Visual plan status and upgrade options

## 📁 Project Structure

```
notes/
├── api/                    # Backend API
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & validation
│   │   ├── utils/          # Utilities
│   │   ├── app.js          # Express app setup
│   │   ├── server.js       # Local server
│   │   └── index.js        # Vercel handler
│   ├── package.json
│   └── .env.example
├── web/                    # Frontend
│   ├── pages/              # Next.js pages
│   ├── services/           # API client
│   ├── styles.css          # Global styles
│   └── package.json
├── vercel.json             # Vercel configuration
├── README.md
└── SECURITY.md
```

## 🧪 Testing

### API Testing with cURL

**Login:**
```bash
curl -X POST https://your-api.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}'
```

**Create Note:**
```bash
curl -X POST https://your-api.vercel.app/notes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Note","content":"Hello World"}'
```

**Health Check:**
```bash
curl https://your-api.vercel.app/health
```

## 🔧 Development

### Available Scripts

**Backend:**
- `npm run dev` - Start development server
- `npm run seed` - Seed database with test data

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Database Schema

**Users:**
- `email` (unique)
- `passwordHash` (bcrypt)
- `role` (admin/member)
- `plan` (free/pro)
- `tenantId` (ObjectId)

**Notes:**
- `title` (string)
- `content` (string)
- `created_by` (ObjectId)
- `tenantId` (ObjectId)
- `created_at` (Date)
- `updated_at` (Date)

**Tenants:**
- `slug` (unique)
- `name` (string)
- `plan` (free/pro)
- `created_at` (Date)

## 🚨 Security Considerations

- Change default JWT secrets in production
- Use strong, unique passwords
- Enable MongoDB Atlas security features
- Regularly update dependencies
- Monitor API usage and implement rate limiting
- Use HTTPS in production (Vercel provides this automatically)

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.

---

**🎉 Ready for Production!** This application is fully configured and optimized for deployment on Vercel with all necessary security measures and modern UI/UX features.