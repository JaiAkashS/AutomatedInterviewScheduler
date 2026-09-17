"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const config_1 = require("./config");
const db_1 = require("./config/db");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const swagger_json_1 = __importDefault(require("./swagger.json"));
const app = (0, express_1.default)();
// Enable CORS with credentials
app.use((0, cors_1.default)({
    origin: [config_1.config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Swagger Documentation Route
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api', routes_1.default);
// Serve frontend static build in production (or when client build exists)
const possibleClientPaths = [
    path_1.default.resolve(__dirname, '../../client/dist'),
    path_1.default.resolve(__dirname, '../client/dist'),
    path_1.default.resolve(process.cwd(), '../client/dist'),
    path_1.default.resolve(process.cwd(), 'client/dist'),
];
const clientBuildPath = possibleClientPaths.find((p) => fs_1.default.existsSync(p));
if (clientBuildPath) {
    // Serve static assets with explicit content-type headers
    app.use(express_1.default.static(clientBuildPath, {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
            }
            else if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css; charset=UTF-8');
            }
        },
    }));
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
        res.sendFile(path_1.default.join(clientBuildPath, 'index.html'));
    });
}
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Start server if not running in test mode
if (process.env.NODE_ENV !== 'test') {
    (0, db_1.connectDB)().then(() => {
        app.listen(config_1.config.port, () => {
            console.log(`🚀 Server running on http://localhost:${config_1.config.port}`);
            console.log(`📚 Swagger API Docs available at http://localhost:${config_1.config.port}/api-docs`);
        });
    });
}
exports.default = app;
