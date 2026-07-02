const IORedis = require('ioredis');

const DEFAULT_REDIS_URL = 'redis://127.0.0.1:6379';

/**
 * Creates a dedicated Redis connection with retry behavior appropriate to its role.
 * HTTP producers fail quickly; background workers reconnect indefinitely.
 */
const createRedisConnection = ({ connectionName, worker = false }) => {
  let lastErrorLogAt = 0;
  const connection = new IORedis(process.env.REDIS_URL || DEFAULT_REDIS_URL, {
    connectionName,
    lazyConnect: true,
    maxRetriesPerRequest: worker ? null : 1,
  });

  connection.on('error', (error) => {
    // Reconnecting clients can emit rapidly; throttle logs without disabling retries.
    if (Date.now() - lastErrorLogAt >= 5000) {
      console.error(`Redis connection error (${connectionName}):`, error.message);
      lastErrorLogAt = Date.now();
    }
  });

  return connection;
};

module.exports = {
  createRedisConnection,
};
