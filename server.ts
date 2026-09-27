import 'dotenv/config';

// Ensure tsx loader hook is registered when invoked via standard node
try {
  // @ts-ignore
  await import('tsx');
} catch {}

const { startServer } = await import('./server/serverApp.js');

startServer().catch((err: any) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
