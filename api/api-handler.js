import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

// Database connection
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      bufferCommands: false,
    });

    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ Database error:', error.message);
    throw error;
  }
}

// Simple User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
});

const TenantSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  created_at: { type: Date, default: Date.now }
});

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

let User, Tenant, Note;

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    dbConnected: isConnected
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      corsOrigin: process.env.CORS_ORIGIN || 'not set'
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Notes API Server',
    version: '1.0.0',
    endpoints: ['/health', '/test', '/auth/login', '/notes', '/seed'],
    timestamp: new Date().toISOString()
  });
});

// Seed endpoint for initial data
app.post('/seed', async (req, res) => {
  try {
    await connectToDatabase();
    
    if (!User) {
      User = mongoose.model('User', UserSchema);
      Tenant = mongoose.model('Tenant', TenantSchema);
      Note = mongoose.model('Note', NoteSchema);
    }

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Tenant.deleteMany({}),
      Note.deleteMany({}) 
    ]);

    // Create tenants
    const acmeTenant = await new Tenant({
      slug: 'acme',
      name: 'Acme Corporation',
      plan: 'pro'
    }).save();

    const globexTenant = await new Tenant({
      slug: 'globex',
      name: 'Globex Corporation',
      plan: 'free'
    }).save();

    // Create users
    const users = [
      {
        email: 'admin@acme.test',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'admin',
        plan: 'pro',
        tenantId: acmeTenant._id
      },
      {
        email: 'user@acme.test',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'member',
        plan: 'free',
        tenantId: acmeTenant._id
      },
      {
        email: 'admin@globex.test',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'admin',
        plan: 'pro',
        tenantId: globexTenant._id
      },
      {
        email: 'user@globex.test',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'member',
        plan: 'free',
        tenantId: globexTenant._id
      }
    ];

    await User.insertMany(users);

    res.json({
      message: 'Database seeded successfully!',
      tenants: ['acme', 'globex'],
      users: ['admin@acme.test', 'user@acme.test', 'admin@globex.test', 'user@globex.test'],
      password: 'password'
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Seeding failed: ' + error.message });
  }
});

// Auth route
app.post('/auth/login', async (req, res) => {
  try {
    await connectToDatabase();
    
    if (!User) {
      User = mongoose.model('User', UserSchema);
      Tenant = mongoose.model('Tenant', TenantSchema);
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).populate('tenantId');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    let jwtExpires = process.env.JWT_EXPIRES_IN;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    // Clean the JWT_EXPIRES_IN value and provide fallback
    if (!jwtExpires || jwtExpires.trim() === '') {
      jwtExpires = '7d';
    } else {
      jwtExpires = jwtExpires.trim();
    }
    
    console.log('JWT config:', { hasSecret: !!jwtSecret, expiresIn: jwtExpires });
    
    const token = jwt.sign(
      { 
        userId: user._id, 
        tenantId: user.tenantId._id,
        role: user.role 
      },
      jwtSecret,
      { expiresIn: jwtExpires }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        plan: user.plan,
        tenant: {
          id: user.tenantId._id,
          slug: user.tenantId.slug,
          name: user.tenantId.name
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notes routes
app.get('/notes', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await connectToDatabase();
    
    if (!Note) {
      Note = mongoose.model('Note', NoteSchema);
    }

    const notes = await Note.find({ 
      tenantId: decoded.tenantId,
      created_by: decoded.userId 
    }).sort({ created_at: -1 });

    res.json(notes);
  } catch (error) {
    console.error('Notes fetch error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/notes', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await connectToDatabase();
    
    if (!Note) {
      Note = mongoose.model('Note', NoteSchema);
      User = mongoose.model('User', UserSchema);
    }

    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Check plan limits for free users
    const user = await User.findById(decoded.userId);
    if (user.plan === 'free') {
      const noteCount = await Note.countDocuments({ 
        tenantId: decoded.tenantId,
        created_by: decoded.userId 
      });
      
      if (noteCount >= 3) {
        return res.status(400).json({ 
          error: 'Free plan limit reached. Please upgrade to Pro plan.' 
        });
      }
    }

    const note = new Note({
      title,
      content,
      created_by: decoded.userId,
      tenantId: decoded.tenantId
    });

    await note.save();
    res.status(201).json(note);
  } catch (error) {
    console.error('Note creation error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
