import serverless from "serverless-http";
import dotenv from "dotenv";
import { connectToDatabase } from "./src/utils/db.js";
import { createApp } from "./src/app.js";

dotenv.config();

let cachedHandler;
let cachedApp;

export const handler = async (event, context) => {
  // Prevent timeout by setting a reasonable execution time limit
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    if (!cachedHandler) {
      console.log('🚀 Initializing serverless function...');
      
      // Create app first (without database connection)
      if (!cachedApp) {
        cachedApp = createApp();
        console.log('📱 App created successfully');
      }
      
      cachedHandler = serverless(cachedApp);
      console.log('⚡ Serverless handler created');
      
      // Connect to database in background if URI exists and for routes that need it
      if (process.env.MONGODB_URI) {
        console.log('🔗 Attempting database connection...');
        try {
          const dbConnectionPromise = connectToDatabase(process.env.MONGODB_URI);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database connection timeout')), 8000)
          );
          
          await Promise.race([dbConnectionPromise, timeoutPromise]);
          console.log('✅ Database connected successfully');
        } catch (dbError) {
          console.error('⚠️  Database connection failed:', dbError.message);
          // Don't fail the entire function - let it work without DB for health checks
        }
      } else {
        console.log('⚠️  MONGODB_URI not found in environment variables');
      }
      
      console.log('✅ Serverless function initialized successfully');
    }
    
    return await cachedHandler(event, context);
  } catch (error) {
    console.error('❌ Serverless function error:', error.message);
    
    // Return a proper error response instead of throwing
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

export default handler;


