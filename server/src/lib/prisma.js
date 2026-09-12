const { PrismaClient } = require('@prisma/client');
const mockDb = require('./mockDb');

const realPrisma = new PrismaClient({
  log: ['error'],
});

let isDbOffline = false;
let lastCheckTime = 0;
const RECHECK_INTERVAL_MS = 30000;

// Build stable model wrappers that vi.spyOn can attach to directly.
// Instead of using Proxy (which breaks vi.spyOn property descriptors),
// we create plain objects with writable method properties.
function createResilientModel(prop, realModel, mockModel) {
  const wrapper = {};

  // Get all method names from both real and mock models
  const methods = new Set([
    ...Object.keys(mockModel || {}),
    ...(realModel ? Object.getOwnPropertyNames(Object.getPrototypeOf(realModel) || {}) : []),
    'findUnique', 'findFirst', 'findMany', 'create', 'update', 'upsert', 'delete', 'count', 'groupBy', 'aggregate',
  ]);

  for (const method of methods) {
    if (method === 'constructor') continue;
    
    // Define as writable+configurable so vi.spyOn can replace it
    Object.defineProperty(wrapper, method, {
      value: async function (...args) {
        if (isDbOffline && Date.now() - lastCheckTime < RECHECK_INTERVAL_MS) {
          const fallbackFn = mockModel && mockModel[method];
          if (typeof fallbackFn === 'function') {
            console.warn(`⚠️  DATABASE OFFLINE — ${String(prop)}.${String(method)}() served from mock fallback`);
            return fallbackFn.apply(mockModel, args);
          }
        }

        try {
          if (realModel && typeof realModel[method] === 'function') {
            const res = await realModel[method].apply(realModel, args);
            isDbOffline = false;
            return res;
          }
          // No real method, try mock
          if (mockModel && typeof mockModel[method] === 'function') {
            return mockModel[method].apply(mockModel, args);
          }
        } catch (dbErr) {
          const isConnErr =
            dbErr.name === 'PrismaClientInitializationError' ||
            dbErr.message?.includes("Can't reach database server") ||
            dbErr.message?.includes('ECONNREFUSED') ||
            dbErr.code === 'P1001';

          if (isConnErr) {
            isDbOffline = true;
            lastCheckTime = Date.now();
            const fallbackFn = mockModel && mockModel[method];
            if (typeof fallbackFn === 'function') {
              console.warn(`⚠️  DATABASE OFFLINE — ${String(prop)}.${String(method)}() served from mock fallback`);
              return fallbackFn.apply(mockModel, args);
            }
          }
          throw dbErr;
        }
      },
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  return wrapper;
}

// Pre-build stable model wrappers for all known models
const modelNames = ['user', 'instrument', 'testSession', 'testResult', 'auditLog'];
const modelWrappers = {};
for (const name of modelNames) {
  const realModel = realPrisma[name];
  const mockModel = mockDb[name];
  if (realModel || mockModel) {
    modelWrappers[name] = createResilientModel(name, realModel, mockModel);
  }
}

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

    // Return pre-built stable wrapper if available
    if (modelWrappers[prop]) {
      return modelWrappers[prop];
    }

    return target[prop];
  },
});

module.exports = prisma;
