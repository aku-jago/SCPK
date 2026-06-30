const API_URL = 'http://localhost:3000/api';
const email = 'admin@scpk.com';
const password = 'Admin@123456';

async function main() {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) {
      console.error('Login failed:', data);
      return;
    }
    const token = data.data.token;
    
    const analyticsRes = await fetch(`${API_URL}/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const analyticsText = await analyticsRes.text();
    console.log('Status:', analyticsRes.status);
    console.log('Response:', analyticsText);
  } catch (e) {
    console.error(e);
  }
}
main();
