// =============================================================================
// NyayaSetu API — Entry Point
// =============================================================================
// Creates the Fastify server, registers plugins and route modules, and starts
// listening. Uses AWS infrastructure: DynamoDB for persistence, Nova via
// Bedrock for LLM and embeddings.
// =============================================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyJwt from '@fastify/jwt';

import { config } from './config/index.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { sahayakRoutes } from './routes/sahayak.js';
import { jagrutRoutes } from './routes/jagrut.js';
import { drishtiRoutes } from './routes/drishti.js';
import { shareRoutes } from './routes/share.js';
import { progressRoutes } from './routes/progress.js';
import { connectDynamo, disconnectDynamo } from './db/dynamodb.js';

// ---------------------------------------------------------------------------
// Server bootstrap
// ---------------------------------------------------------------------------

async function bootstrap(): Promise<void> {
  const server = Fastify({
    logger: {
      level: 'info',
      transport:
        process.env['NODE_ENV'] !== 'production'
          ? { target: 'pino-pretty' }
          : undefined,
    },
  });

  // -------------------------------------------------------------------------
  // Plugin registration
  // -------------------------------------------------------------------------

  await server.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  });

  await server.register(helmet, {
    contentSecurityPolicy: process.env['NODE_ENV'] === 'production',
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await server.register(multipart);

  // JWT authentication
  await server.register(fastifyJwt, {
    secret: config.jwt.secret,
    sign: { expiresIn: config.jwt.expiresIn },
  });

  // -------------------------------------------------------------------------
  // Optional persistence layer (DynamoDB)
  // -------------------------------------------------------------------------

  const dynamoConnected = await connectDynamo();
  if (dynamoConnected) {
    server.log.info('[dynamodb] Connected — Drishti history persistence enabled');
  } else {
    server.log.info('[persistence] DynamoDB not configured — running in stateless mode');
  }

  // -------------------------------------------------------------------------
  // Route registration
  // -------------------------------------------------------------------------

  await server.register(healthRoutes);
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(sahayakRoutes, { prefix: '/api/v1/sahayak' });
  await server.register(jagrutRoutes, { prefix: '/api/v1/jagrut' });
  await server.register(drishtiRoutes, { prefix: '/api/v1/drishti' });
  await server.register(shareRoutes, { prefix: '/api/v1/drishti' });
  await server.register(progressRoutes, { prefix: '/api/v1/progress' });

  // -------------------------------------------------------------------------
  // Start listening
  // -------------------------------------------------------------------------

  try {
    const address = await server.listen({
      port: config.port,
      host: config.host,
    });
    server.log.info(`NyayaSetu API listening at ${address}`);
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === 'EADDRINUSE') {
      server.log.error(
        {
          err,
          host: config.host,
          port: config.port,
        },
        'Port already in use. Stop the existing process or change API_PORT in .env.local.',
      );
    } else {
      server.log.error(err);
    }
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Graceful shutdown
  // -------------------------------------------------------------------------

  const shutdownSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  for (const signal of shutdownSignals) {
    process.on(signal, async () => {
      server.log.info(`Received ${signal}, shutting down gracefully...`);
      try {
        await server.close();
        await disconnectDynamo();
        server.log.info('Server closed successfully.');
        process.exit(0);
      } catch (err) {
        server.log.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });
  }
}

bootstrap();
