# Security & Tenant Isolation

## Multi-Tenancy Approach

**Chosen approach:** Shared schema with a `tenantId` column.

This approach provides:

- Simpler implementation than schema-per-tenant or database-per-tenant
- Strict tenant isolation enforced at the application layer
- Easier scaling and maintenance
- Cost-effective for small to medium SaaS applications

## Tenant Isolation Implementation

### 1. Database Schema

All data models include `tenantId` as a required field:

- `Tenant`: Has unique `slug` and `plan` fields
- `User`: References `tenantId`, users belong to exactly one tenant
- `Note`: References `tenantId`, notes are scoped to tenant

### 2. Authentication & Authorization

- JWT tokens include `tenantId` in payload
- All API endpoints require authentication
- `tenantId` is extracted from JWT and used for all database queries
- Role-based access control (admin/member) within tenant scope

### 3. Query Scoping

Every database query is scoped by `tenantId`:

```javascript
// Notes queries
await Note.find({ tenantId }).lean();
await Note.findOne({ _id: noteId, tenantId }).lean();

// User queries
await User.find({ tenantId }).lean();
await User.findOne({ _id: userId, tenantId }).lean();

// Tenant queries
await Tenant.findOne({ _id: tenantId, slug }).lean();
```

### 4. Middleware Protection

- `requireAuth`: Validates JWT and extracts `tenantId`
- `requireTenantIsolation`: Validates `tenantId` format and presence
- `requireRole`: Enforces role-based permissions within tenant

### 5. API Endpoint Security

All protected endpoints:

1. Require valid JWT with `tenantId`
2. Validate `tenantId` format (MongoDB ObjectId)
3. Scope all queries by `tenantId`
4. Never trust user input for tenant identification

### 6. Data Access Patterns

- **Notes**: Users can only access notes from their tenant
- **Users**: Admins can only manage users within their tenant
- **Tenants**: Users can only access their own tenant data
- **Cross-tenant access**: Impossible due to `tenantId` scoping

## Security Guarantees

✅ **Strict Isolation**: Data from one tenant is never accessible to another
✅ **Authentication Required**: All data access requires valid JWT
✅ **Tenant Scoping**: All queries filtered by `tenantId`
✅ **Role-based Access**: Admin/member permissions within tenant scope
✅ **Input Validation**: JWT `tenantId` validated before use
✅ **No Cross-tenant Leaks**: Impossible to access other tenant data

## Testing Tenant Isolation

To verify isolation works:

1. Login as `admin@acme.test` → get Acme tenant data
2. Login as `admin@globex.test` → get Globex tenant data
3. Attempt to access other tenant's data → should fail
4. Check database queries include `tenantId` filter
5. Verify JWT contains correct `tenantId`

## Deployment Security

- Use HTTPS in production (Vercel provides TLS)
- Set strong `JWT_SECRET` environment variable
- Configure CORS to allow only frontend domains
- Rate limit authentication endpoints
- Monitor for suspicious access patterns

