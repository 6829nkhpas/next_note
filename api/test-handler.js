export default function handler(req, res) {
  console.log('✅ Simple handler called:', req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.url === '/health') {
    res.status(200).json({
      status: 'ok',
      message: 'Simple handler working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
    return;
  }
  
  res.status(200).json({
    message: 'Simple Notes API',
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
