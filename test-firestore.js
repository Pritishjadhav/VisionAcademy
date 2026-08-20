const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'demo-project' }); 
// Wait, we need actual credentials. The project uses process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
