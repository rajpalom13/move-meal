const jwt = require('jsonwebtoken');

const JWT_SECRET = 'movenmeal';

// Generate a test token
const token = jwt.sign(
  {
    userId: 'test-user-123',
    role: 'user' // can be 'user', 'vendor', or 'rider'
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Generated JWT Token:');
console.log('');
console.log(token);
console.log('');
console.log('Test WebSocket with:');
console.log(`node test-ws.js ${token}`);
