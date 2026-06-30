const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const screeningRoutes = require('./routes/screeningRoutes');
const adminRoutes = require('./routes/adminRoutes');
const knowledgeBaseRoutes = require('./routes/knowledgeBaseRoutes');
const trackerRoutes = require('./routes/trackerRoutes');

const app = express();

// ============================================
// Middleware Stack
// ============================================

// Security headers (relaxed CSP for CDN usage)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// Static Files (Frontend)
// ============================================
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/screening', screeningRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/tracker', trackerRoutes);

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SCPK API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================
// SPA Fallback — serve index.html for non-API routes
// ============================================
app.get('*', (req, res) => {
  // If it's an API route, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint tidak ditemukan.',
    });
  }
  // Otherwise serve the requested HTML or fallback to index.html
  const requestedFile = path.join(__dirname, '..', 'public', req.path);
  res.sendFile(requestedFile, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    }
  });
});

// ============================================
// Global Error Handler
// ============================================
app.use(errorHandler);

module.exports = app;
