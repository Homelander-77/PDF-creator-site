import Fastify from 'fastify';

import { conf } from './config.js';
import { convertRoutes } from './routes/convert.js';

const app = Fastify({
    logger: true,
});

await app.register(convertRoutes);

await app.listen({
    port: conf.port,
    host: conf.host,
});
