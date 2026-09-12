const { PrismaClient } = require('@prisma/client');
const mockDb = require('./mockDb');

const realPrisma = new PrismaClient({
  log: ['error'],
});

let isDbOffline = false;
let lastCheckTime = 0;
const RECHECK_INTERVAL_MS = 30000;

// Resilient Proxy: forwards to real Prisma when PostgreSQL is reachable,
// falls back instantly to in-memory mockDb when database server is offline.
const prisma = new Proxy(realPrisma, {
  get(target, prop) {
    if (prop === '$transaction') {
      return async (fnOrArray) => {
        if (isDbOffline && Date.now() - lastCheckTime < RECHECK_INTERVAL_MS) {
          console.warn('\n⚠️  DATABASE OFFLINE — Running $transaction on in-memory mock fallback!\n');
          return mockDb.$transaction(fnOrArray);
        }
        try {
          const res = await target.$transaction(fnOrArray);
          isDbOffline = false;
          return res;
        } catch (err) {
          isDbOffline = true;
          lastCheckTime = Date.now();
          console.warn('\n⚠️  DATABASE OFFLINE — Running $transaction on in-memory mock fallback!\n');
          return mockDb.$transaction(fnOrArray);
        }
      };
    }

    const realModel = target[prop];
    const mockModel = mockDb[prop];

    if (!realModel && !mockModel) {
      return target[prop];
    }

    if (!realModel) return mockModel;
    if (!mockModel) return realModel;

    return new Proxy(realModel, {
      get(modelTarget, method) {
        const originalMethod = modelTarget[method];
        if (typeof originalMethod !== 'function') {
          return mockModel[method] !== undefined ? mockModel[method] : originalMethod;
        }

        return async (...args) => {
          if (isDbOffline && Date.now() - lastCheckTime < RECHECK_INTERVAL_MS) {
            const fallbackFn = mockModel[method];
            if (typeof fallbackFn === 'function') {
              console.warn(`⚠️  DATABASE OFFLINE — ${String(prop)}.${String(method)}() served from mock fallback`);
              return fallbackFn.apply(mockModel, args);
            }
          }

          try {
            const res = await originalMethod.apply(modelTarget, args);
            isDbOffline = false;
            return res;
          } catch (dbErr) {
            const isConnErr =
              dbErr.name === 'PrismaClientInitializationError' ||
              dbErr.message?.includes("Can't reach database server") ||
              dbErr.message?.includes('ECONNREFUSED') ||
              dbErr.code === 'P1001';

            if (isConnErr) {
              isDbOffline = true;
              lastCheckTime = Date.now();
              const fallbackFn = mockModel[method];
              if (typeof fallbackFn === 'function') {
                console.warn(`⚠️  DATABASE OFFLINE — ${String(prop)}.${String(method)}() served from mock fallback`);
                return fallbackFn.apply(mockModel, args);
              }
            }
            throw dbErr;
          }
        };
      },
    });
  },
});

module.exports = prisma;


