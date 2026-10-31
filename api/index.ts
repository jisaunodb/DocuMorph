import app from '../server/src/app';

// Vercel Serverless Function entry point with fail-safe JSON response
export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Exception]', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          message: err?.message || 'Server error occurred during invocation.',
          code: 'FUNCTION_INVOCATION_RECOVERED',
        })
      );
    }
  }
}
