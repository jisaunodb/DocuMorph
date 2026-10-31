import app from '../server/src/app';

/**
 * Vercel Serverless Function entry point.
 * By exporting the Express app directly, @vercel/node wraps the request listener
 * and manages asynchronous stream execution, preventing premature exit and
 * FUNCTION_INVOCATION_FAILED errors on Vercel deployments.
 */
export default app;
