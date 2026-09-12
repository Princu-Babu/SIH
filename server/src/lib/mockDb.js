const bcrypt = require('bcryptjs');

// Pre-computed bcrypt hashes
const adminHash = bcrypt.hashSync('Admin@123', 10);
const inspectorHash = bcrypt.hashSync('Inspector@123', 10);
const viewerHash = bcrypt.hashSync('Viewer@123', 10);

const users = [
  {
    id: 'usr-admin-01',
    name: 'Shri Rajesh Kumar',
    email: 'admin@nawi.gov.in',
    password: adminHash,
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'usr-officer-01',
    name: 'Shri Vikramaditya Sharma',
    email: 'inspector@nawi.gov.in',
    password: inspectorHash,
    role: 'INSPECTOR',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'usr-viewer-01',
    name: 'Smt. Ananya Sen',
    email: 'viewer@nawi.gov.in',
    password: viewerHash,
    role: 'VIEWER',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
];

const instruments = [
  {
    id: 'inst-wb-01',
    name: 'Khanna APMC Mandi Truck Weighbridge #1',
    type: 'WEIGHBRIDGE',
    manufacturer: 'Avery India Ltd',
    model: 'Weightronix E-1205',
    serialNumber: 'WB-2024-APMC-001',
    accuracyClass: 'CLASS_III',
    maxCapacity: 60000,
    minCapacity: 400,
    verificationInterval: 20,
    actualInterval: 20,
    unit: 'kg',
    location: 'Gate No. 2, Grain Market, Khanna, Punjab',
    isActive: true,
    createdAt: new Date('2026-01-15T09:30:00Z'),
    updatedAt: new Date('2026-01-15T09:30:00Z'),
  },
  {
    id: 'inst-es-01',
    name: 'Ludhiana Retail APMC Platform Scale',
    type: 'PLATFORM_SCALE',
    manufacturer: 'Essae-Teraoka Ltd',
    model: 'DS-215 High Precision',
    serialNumber: 'ES-2024-LDH-042',
    accuracyClass: 'CLASS_III',
    maxCapacity: 150,
    minCapacity: 1,
    verificationInterval: 0.05,
    actualInterval: 0.05,
    unit: 'kg',
    location: 'Shed 4, Subzi Mandi, Ludhiana, Punjab',
    isActive: true,
    createdAt: new Date('2026-02-01T10:15:00Z'),
    updatedAt: new Date('2026-02-01T10:15:00Z'),
  },
  {
    id: 'inst-lb-01',
    name: 'Metrology Lab Analytical Micro-Balance',
    type: 'LABORATORY_BALANCE',
    manufacturer: 'Mettler-Toledo',
    model: 'XPR205 Analytical',
    serialNumber: 'MT-2024-LAB-007',
    accuracyClass: 'CLASS_I',
    maxCapacity: 220,
    minCapacity: 0.01,
    verificationInterval: 0.001,
    actualInterval: 0.0001,
    unit: 'g',
    location: 'State Standards Metrology Laboratory, Chandigarh',
    isActive: true,
    createdAt: new Date('2026-02-10T14:00:00Z'),
    updatedAt: new Date('2026-02-10T14:00:00Z'),
  },
  {
    id: 'inst-ps-01',
    name: 'Jalandhar Food Grain Silo Heavy Platform Scale',
    type: 'PLATFORM_SCALE',
    manufacturer: 'CAS Corporation',
    model: 'DB-1H Industrial',
    serialNumber: 'CAS-2024-JAL-088',
    accuracyClass: 'CLASS_III',
    maxCapacity: 600,
    minCapacity: 4,
    verificationInterval: 0.2,
    actualInterval: 0.2,
    unit: 'kg',
    location: 'FCI Warehouse Complex, Jalandhar',
    isActive: true,
    createdAt: new Date('2026-02-15T11:20:00Z'),
    updatedAt: new Date('2026-02-15T11:20:00Z'),
  },
];

const testSessions = [
  {
    id: 'sess-01',
    certificateNo: 'NAWI-2026-000188',
    instrumentId: 'inst-wb-01',
    conductedById: 'usr-officer-01',
    status: 'COMPLETED',
    overallResult: 'PASS',
    temperature: 24.5,
    humidity: 55.0,
    remarks: 'Annual statutory reverification completed. All error bounds conform strictly to OIML R-76 Class III tolerances.',
    verificationSeal: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    sealedAt: new Date('2026-03-01T12:00:00Z'),
    startedAt: new Date('2026-03-01T10:00:00Z'),
    completedAt: new Date('2026-03-01T12:00:00Z'),
    createdAt: new Date('2026-03-01T10:00:00Z'),
    updatedAt: new Date('2026-03-01T12:00:00Z'),
  },
  {
    id: 'sess-02',
    certificateNo: 'NAWI-2026-000245',
    instrumentId: 'inst-es-01',
    conductedById: 'usr-officer-01',
    status: 'COMPLETED',
    overallResult: 'PASS',
    temperature: 22.0,
    humidity: 50.0,
    remarks: 'Initial verification before market deployment. Scale approved for commercial transactions.',
    verificationSeal: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    sealedAt: new Date('2026-03-05T14:30:00Z'),
    startedAt: new Date('2026-03-05T13:00:00Z'),
    completedAt: new Date('2026-03-05T14:30:00Z'),
    createdAt: new Date('2026-03-05T13:00:00Z'),
    updatedAt: new Date('2026-03-05T14:30:00Z'),
  },
  {
    id: 'sess-03',
    certificateNo: 'NAWI-2026-000312',
    instrumentId: 'inst-lb-01',
    conductedById: 'usr-officer-01',
    status: 'IN_PROGRESS',
    overallResult: null,
    temperature: 20.0,
    humidity: 45.0,
    remarks: 'Laboratory calibration session in progress.',
    verificationSeal: null,
    sealedAt: null,
    startedAt: new Date('2026-03-10T09:00:00Z'),
    completedAt: null,
    createdAt: new Date('2026-03-10T09:00:00Z'),
    updatedAt: new Date('2026-03-10T09:00:00Z'),
  },
];

const testResults = [
  {
    id: 'res-01',
    testSessionId: 'sess-01',
    testType: 'WEIGHING_PERFORMANCE',
    status: 'COMPLETED',
    result: 'PASS',
    data: {
      points: [
        { loadPoint: 'L1', appliedLoad: 0, indicatedInc: 0, errorInc: 0, indicatedDec: 0, errorDec: 0, mpe: 10, status: 'PASS' },
        { loadPoint: 'L2', appliedLoad: 400, indicatedInc: 400, errorInc: 0, indicatedDec: 400, errorDec: 0, mpe: 10, status: 'PASS' },
        { loadPoint: 'L3', appliedLoad: 6000, indicatedInc: 6005, errorInc: 5, indicatedDec: 6000, errorDec: 0, mpe: 10, status: 'PASS' },
        { loadPoint: 'L4', appliedLoad: 15000, indicatedInc: 15010, errorInc: 10, indicatedDec: 15005, errorDec: 5, mpe: 20, status: 'PASS' },
        { loadPoint: 'L5', appliedLoad: 30000, indicatedInc: 30015, errorInc: 15, indicatedDec: 30010, errorDec: 10, mpe: 30, status: 'PASS' },
        { loadPoint: 'L6', appliedLoad: 45000, indicatedInc: 45015, errorInc: 15, indicatedDec: 45010, errorDec: 10, mpe: 30, status: 'PASS' },
        { loadPoint: 'L7', appliedLoad: 60000, indicatedInc: 60020, errorInc: 20, indicatedDec: 60015, errorDec: 15, mpe: 30, status: 'PASS' },
      ],
    },
    calculations: { maxCorrectedError: 20, maxMpeAllowed: 30, overallVerdict: 'PASS' },
    remarks: 'Weighing performance test passed within MPE bounds.',
    createdAt: new Date('2026-03-01T10:30:00Z'),
    updatedAt: new Date('2026-03-01T10:30:00Z'),
  },
  {
    id: 'res-02',
    testSessionId: 'sess-01',
    testType: 'REPEATABILITY',
    status: 'COMPLETED',
    result: 'PASS',
    data: {
      series: [
        { run: 1, load: 30000, indicated: 30005, error: 5 },
        { run: 2, load: 30000, indicated: 30005, error: 5 },
        { run: 3, load: 30000, indicated: 30010, error: 10 },
      ],
    },
    calculations: { maxDifference: 5, allowableMpe: 20, overallVerdict: 'PASS' },
    remarks: 'Repeatability verified at 50% capacity.',
    createdAt: new Date('2026-03-01T11:00:00Z'),
    updatedAt: new Date('2026-03-01T11:00:00Z'),
  },
  {
    id: 'res-03',
    testSessionId: 'sess-01',
    testType: 'ECCENTRICITY',
    status: 'COMPLETED',
    result: 'PASS',
    data: {
      positions: [
        { position: 'Center', load: 20000, indicated: 20000, error: 0, mpe: 20, status: 'PASS' },
        { position: 'Front-Left', load: 20000, indicated: 20005, error: 5, mpe: 20, status: 'PASS' },
        { position: 'Front-Right', load: 20000, indicated: 20005, error: 5, mpe: 20, status: 'PASS' },
        { position: 'Back-Left', load: 20000, indicated: 20000, error: 0, mpe: 20, status: 'PASS' },
        { position: 'Back-Right', load: 20000, indicated: 20005, error: 5, mpe: 20, status: 'PASS' },
      ],
    },
    calculations: { maxError: 5, mpeAllowed: 20, overallVerdict: 'PASS' },
    remarks: 'Eccentricity test over all 4 quadrant load cells passed.',
    createdAt: new Date('2026-03-01T11:30:00Z'),
    updatedAt: new Date('2026-03-01T11:30:00Z'),
  },
];

const auditLogs = [
  {
    id: 'aud-01',
    userId: 'usr-admin-01',
    action: 'INITIALIZATION',
    entityType: 'System',
    entityId: 'SYSTEM-STARTUP',
    details: 'System initialized with OIML R-76 metrological rules engine',
    ipAddress: '127.0.0.1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'aud-02',
    userId: 'usr-officer-01',
    action: 'CREATE_SESSION',
    entityType: 'TestSession',
    entityId: 'sess-01',
    details: 'Inspection test session initiated for Weighbridge WB-2024-APMC-001',
    ipAddress: '192.168.1.100',
    createdAt: new Date('2026-03-01T10:00:00Z'),
  },
  {
    id: 'aud-03',
    userId: 'usr-officer-01',
    action: 'FINALIZE_SESSION',
    entityType: 'TestSession',
    entityId: 'sess-01',
    details: 'Test session finalized and cryptographically sealed under certificate NAWI-2026-000188',
    ipAddress: '192.168.1.100',
    createdAt: new Date('2026-03-01T12:00:00Z'),
  },
];

function matchesFilter(item, where = {}) {
  if (!where || Object.keys(where).length === 0) return true;
  for (const [k, v] of Object.entries(where)) {
    if (v === undefined) continue;
    if (k === 'isActive' && item.isActive !== v) return false;
    if (k === 'status' && item.status !== v) return false;
    if (k === 'overallResult' && item.overallResult !== v) return false;
    if (k === 'email' && item.email?.toLowerCase() !== String(v).toLowerCase()) return false;
    if (k === 'serialNumber' && item.serialNumber !== v) return false;
    if (k === 'certificateNo' && item.certificateNo !== v) return false;
    if (k === 'id' && item.id !== v) return false;
    if (k === 'testSessionId' && item.testSessionId !== v) return false;
    if (k === 'testType' && item.testType !== v) return false;
  }
  return true;
}

function hydrateSession(s) {
  const inst = instruments.find((i) => i.id === s.instrumentId);
  const officer = users.find((u) => u.id === s.conductedById);
  const results = testResults.filter((r) => r.testSessionId === s.id);
  return {
    ...s,
    instrument: inst || null,
    conductedBy: officer ? { id: officer.id, name: officer.name, email: officer.email, role: officer.role } : null,
    testResults: results,
  };
}

function hydrateResult(r) {
  const session = testSessions.find((s) => s.id === r.testSessionId);
  return {
    ...r,
    testSession: session ? hydrateSession(session) : null,
  };
}

function createModelHandler(collection, hydrator) {
  return {
    async findUnique(args = {}) {
      const { where = {} } = args;
      const item = collection.find((x) => matchesFilter(x, where));
      if (!item) return null;
      return hydrator ? hydrator(item) : { ...item };
    },
    async findFirst(args = {}) {
      const { where = {} } = args;
      const item = collection.find((x) => matchesFilter(x, where));
      if (!item) return null;
      return hydrator ? hydrator(item) : { ...item };
    },
    async findMany(args = {}) {
      const { where = {}, take, skip = 0, orderBy } = args;
      let list = collection.filter((x) => matchesFilter(x, where));
      if (hydrator) list = list.map(hydrator);
      if (orderBy && orderBy.createdAt === 'desc') {
        list = [...list].reverse();
      }
      if (typeof skip === 'number' && skip > 0) list = list.slice(skip);
      if (typeof take === 'number' && take > 0) list = list.slice(0, take);
      return list;
    },
    async count(args = {}) {
      const { where = {} } = args;
      return collection.filter((x) => matchesFilter(x, where)).length;
    },
    async create(args = {}) {
      const { data = {} } = args;
      const newItem = {
        id: data.id || `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      collection.unshift(newItem);
      return hydrator ? hydrator(newItem) : { ...newItem };
    },
    async update(args = {}) {
      const { where = {}, data = {} } = args;
      const idx = collection.findIndex((x) => matchesFilter(x, where));
      if (idx === -1) throw new Error('Record to update not found');
      collection[idx] = {
        ...collection[idx],
        ...data,
        updatedAt: new Date(),
      };
      return hydrator ? hydrator(collection[idx]) : { ...collection[idx] };
    },
    async upsert(args = {}) {
      const { where = {}, create = {}, update = {} } = args;
      const idx = collection.findIndex((x) => matchesFilter(x, where));
      if (idx !== -1) {
        collection[idx] = { ...collection[idx], ...update, updatedAt: new Date() };
        return hydrator ? hydrator(collection[idx]) : { ...collection[idx] };
      }
      return this.create({ data: create });
    },
    async delete(args = {}) {
      const { where = {} } = args;
      const idx = collection.findIndex((x) => matchesFilter(x, where));
      if (idx === -1) throw new Error('Record to delete not found');
      const [removed] = collection.splice(idx, 1);
      return hydrator ? hydrator(removed) : { ...removed };
    },
    async groupBy(args = {}) {
      const { by = [] } = args;
      const map = {};
      collection.forEach((item) => {
        const key = by.map((f) => item[f]).join('__');
        if (!map[key]) map[key] = { key, count: 0, sample: item };
        map[key].count++;
      });
      return Object.values(map).map((entry) => {
        const res = { _count: { _all: entry.count } };
        by.forEach((f) => {
          res[f] = entry.sample[f];
        });
        return res;
      });
    },
  };
}

const mockDb = {
  user: createModelHandler(users),
  instrument: createModelHandler(instruments),
  testSession: createModelHandler(testSessions, hydrateSession),
  testResult: createModelHandler(testResults, hydrateResult),
  auditLog: createModelHandler(auditLogs),
  async $transaction(fnOrArray) {
    if (Array.isArray(fnOrArray)) {
      return Promise.all(fnOrArray);
    }
    if (typeof fnOrArray === 'function') {
      return fnOrArray(mockDb);
    }
    return fnOrArray;
  },
};

module.exports = mockDb;
