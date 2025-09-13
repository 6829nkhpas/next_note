import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const app = express();

app.use(express.json());
app.use(cors({
  origin: '*',
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

// Schemas
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

app.get('/', (req, res) => {
  res.json({
    message: 'Simple Notes API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Auth route with simplified JWT handling
app.post('/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body?.email);
    
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
    console.log('User found:', !!user);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    // Use hardcoded expiration to avoid environment variable issues
    const token = jwt.sign(
      { 
        userId: user._id, 
        tenantId: user.tenantId._id,
        role: user.role 
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('Token created successfully');

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
    console.error('Login error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
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
