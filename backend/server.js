import app from './app.js';

const PORT = process.env.PORT || 5000;

// Start Server locally
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  console.log(`📡 Database provider: Supabase PostgreSQL`);
});
