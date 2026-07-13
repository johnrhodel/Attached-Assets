import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { createServer } from "http";
import { logger } from "./lib/logger";
import { registerRoutes } from "./routes/routes";
import healthRouter from "./routes/health";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.devnet.solana.com", "https://api.mainnet-beta.solana.com"],
        frameSrc: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(
  express.json({
    limit: "10mb",
  }),
);
app.use(express.urlencoded({ extended: false }));

// Health check endpoint (no session needed)
app.use("/api", healthRouter);

// Main app routes (includes session middleware)
const httpServer = createServer(app);
registerRoutes(httpServer, app);

export { httpServer };
export default app;
