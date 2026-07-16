require('dotenv').config();
const app = require('./app');
const config = require('./config');

const PORT = config.port;

app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  🏥  LunarHealth Self-Screening Platform');
  console.log('  ─────────────────────────────────');
  console.log(`  🌐  Server:     http://localhost:${PORT}`);
  console.log(`  📡  API:        http://localhost:${PORT}/api/health`);
  console.log(`  🔧  Environment: ${config.nodeEnv}`);
  console.log('');
  console.log('  📋  Pages:');
  console.log(`      Landing:    http://localhost:${PORT}`);
  console.log(`      Login:      http://localhost:${PORT}/login.html`);
  console.log(`      Register:   http://localhost:${PORT}/register.html`);
  console.log(`      Dashboard:  http://localhost:${PORT}/dashboard/`);
  console.log(`      Admin:      http://localhost:${PORT}/admin/`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});
