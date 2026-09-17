import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { connectDB } from './config/db';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import swaggerDocument from './swagger.json';

const app: Express = express();

// Enable CORS with credentials
app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Serve frontend static build in production (or when client build exists)
const possibleClientPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
];
const clientBuildPath = possibleClientPaths.find((p) => fs.existsSync(p));

if (clientBuildPath) {
  // Serve static assets with explicit content-type headers
  app.use(
    express.static(clientBuildPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=UTF-8');
        }
      },
    })
  );

  // SPA fallback for frontend client routing
  app.get('*', (req, res, next) => {
    // Skip backend routes
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs') || req.path === '/health') {
      return next();
    }

    // Never serve index.html for static asset requests that were not found (prevents MIME errors)
    if (req.path.startsWith('/assets/') || req.path.includes('.')) {
      return res.status(404).type('text/plain').send(`Static asset '${req.path}' not found.`);
    }

    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}


// Error handling middleware
app.use(errorHandler);

// Start server if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📚 Swagger API Docs available at http://localhost:${config.port}/api-docs`);
    });
  });
}

export default app;
