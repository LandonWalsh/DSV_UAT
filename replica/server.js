const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// File upload config — memory storage (no disk writes, safe for Render free tier)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ===== Mock Data =====
const shipmentDB = {
  'SGVA0134084': {
    ref: 'SGVA0134084',
    containers: [{ number: 'HAMU1618600', consol: 'CCH437195' }],
    grossWeight: '7666.0',
    packages: '25',
    origin: 'Avenches, Switzerland',
    destination: 'Riverside, United states',
    eventTypes: [{ code: 'DLV', name: 'Delivery' }]
  },
  'SGVA0134072': {
    ref: 'SGVA0134072',
    containers: [
      { number: 'WBPU7087286', consol: 'CCH437190' },
      { number: 'CAIU4260517', consol: 'CCH437191' }
    ],
    grossWeight: '5200.0',
    packages: '18',
    origin: 'Geneva, Switzerland',
    destination: 'Los Angeles, United states',
    eventTypes: [{ code: 'DLV', name: 'Delivery' }]
  },
  'SGVA0134007': {
    ref: 'SGVA0134007',
    containers: [{ number: 'ONEU1324398', consol: 'CCH437180' }],
    grossWeight: '3400.0',
    packages: '12',
    origin: 'Zurich, Switzerland',
    destination: 'New York, United states',
    eventTypes: [{ code: 'DLV', name: 'Delivery' }]
  },
  'SGVA0134679': {
    ref: 'SGVA0134679',
    containers: [{ number: 'CMAU3467138', consol: 'CCH437200' }],
    grossWeight: '4100.0',
    packages: '15',
    origin: 'Basel, Switzerland',
    destination: 'Chicago, United states',
    eventTypes: [{ code: 'DLV', name: 'Delivery' }]
  },
  'SGVA0134691': {
    ref: 'SGVA0134691',
    containers: [{ number: 'TGBU5854707', consol: 'CCH437210' }],
    grossWeight: '6800.0',
    packages: '22',
    origin: 'Bern, Switzerland',
    destination: 'Houston, United states',
    eventTypes: [{ code: 'DLV', name: 'Delivery' }]
  },
  'SGVA0134021': {
    ref: 'SGVA0134021',
    containers: [{ number: 'ONEU0360451', consol: 'CCH437220' }],
    grossWeight: '2900.0',
    packages: '10',
    origin: 'Lausanne, Switzerland',
    destination: 'Miami, United states',
    eventTypes: [{ code: 'DLV', name: 'Delivery' }]
  }
};

// In-memory event log
const eventLog = [];

// Session-based selected references for multi-event
const sessionRefs = {};

// ===== Auth Routes =====

// Login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// SSO login endpoint (mock)
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  // Accept any credentials for testing
  res.json({ success: true, user: username || 'Dolphin' });
});

// Logout - shows "You just logged out" page (matches prod)
app.get('/auth/logout', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'loggedOut.html'));
});

// OAuth redirect path (matches prod)
app.get('/oauth2/authorization/keycloak', (req, res) => {
  res.redirect('/');
});

// ===== Page Routes (matching prod .do pattern) =====

app.get('/home.do', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get('/eventList.do', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'eventList.html'));
});

// initEvent - GET shows form, POST also shows form (prod behavior)
app.get('/initEvent.do', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'initEvent.html'));
});

app.post('/initEvent.do', (req, res) => {
  // Redirect to GET with ref param
  const ref = req.body.jobreference || req.body.searchNumber || '';
  res.redirect(`/initEvent.do?ref=${encodeURIComponent(ref)}`);
});

app.get('/multiEventStep1.do', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'multiEventStep1.html'));
});

app.get('/multiEventStep2.do', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'multiEventStep2.html'));
});

app.get('/dashboard.do', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// ===== API Routes (matching prod endpoints) =====

// Search shipment (AJAX) - matches prod response schema exactly
app.get('/searchShipmentAndConsolShipment.do', (req, res) => {
  const ref = req.query.jobref || '';
  const ship = shipmentDB[ref];
  if (ship) {
    res.json({
      statusCode: 200,
      statusMessage: 'OK',
      serviceType: 'SHIPMENT',
      searchNumber: ref,
      containerStatus: ship.containers.length > 0,
      shipments: [ref],
      containers: ship.containers.map(c => c.number),
      noContainerShipments: null,
      eventTypes: ship.eventTypes || [{ code: 'DLV', name: 'Delivery' }],
      attachmentTypes: ['Damaged Report/Pictures', 'Interim Receipt', 'Photograph', 'Proof of Delivery', 'Proof of Pick Up'],
      searchType: 'SHIPMENT_REFERENCE'
    });
  } else {
    res.json({
      statusCode: 404,
      statusMessage: 'Shipment not found',
      serviceType: null,
      searchNumber: ref,
      containerStatus: false,
      shipments: null,
      containers: null,
      noContainerShipments: null,
      eventTypes: [],
      attachmentTypes: null,
      searchType: null
    });
  }
});

app.get('/searchShipment.do', (req, res) => {
  const ref = req.query.jobref || '';
  const ship = shipmentDB[ref];
  if (ship) {
    res.json({
      status: 200,
      text: ref,
      message: 'OK',
      serviceType: 'SHIPMENT',
      searchType: 'SHIPMENT_REFERENCE',
      containerStatus: ship.containers.length > 0,
      containers: ship.containers.map(c => ({
        number: c.number,
        consol: c.consol,
        ref: ref
      })),
      eventTypes: ship.eventTypes || [{ code: 'DLV', name: 'Delivery' }]
    });
  } else {
    res.json({ status: 500, text: '', message: 'Shipment not found' });
  }
});

// Reference selector (multi-event)
app.get('/ReferenceSelector.do', (req, res) => {
  const ref = req.query.searchNumber || '';
  const ship = shipmentDB[ref];
  if (ship) {
    res.json(ship);
  } else {
    res.json({ error: 'Not found' });
  }
});

// Add selected reference (multi-event)
app.get('/addSelectedReference.do', (req, res) => {
  const ref = req.query.ref || '';
  const sid = req.query.sid || 'default';
  if (!sessionRefs[sid]) sessionRefs[sid] = [];
  if (ref && !sessionRefs[sid].includes(ref)) sessionRefs[sid].push(ref);
  res.json({ success: true, refs: sessionRefs[sid] });
});

// Get selected references (multi-event polling)
app.get('/SelectedReferences.do', (req, res) => {
  const sid = req.query.sid || 'default';
  res.json({ refs: sessionRefs[sid] || [] });
});

// Shipment data API (for initEvent form population)
app.get('/api/shipment', (req, res) => {
  const ref = req.query.ref || '';
  const ship = shipmentDB[ref];
  if (ship) {
    res.json(ship);
  } else {
    res.json({ ref: ref || 'SGVA0134084', ...shipmentDB['SGVA0134084'] });
  }
});

// ===== Event Creation Endpoints =====

// Create single event
app.post('/createEvent.do', upload.array('file', 5), (req, res) => {
  const event = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    jobreference: req.body.jobreference || req.body.searchNumber,
    jobtype: req.body.jobtype,
    container: req.body.contno,
    eventType: req.body.eventtype,
    eventDate: req.body.eventdate,
    eventTime: req.body.eventtime,
    comments: req.body.comments,
    contact: req.body.contact,
    gmtOffset: req.body.gmtOffset,
    grossWeight: req.body.grossweight,
    packages: req.body.package,
    origin: req.body.origin,
    destination: req.body.destination,
    files: (req.files || []).map(f => ({ name: f.originalname, size: f.size }))
  };

  eventLog.push(event);
  console.log('[EVENT CREATED]', JSON.stringify(event, null, 2));

  res.json({ success: true, eventId: event.id, message: 'Event created successfully' });
});

// Create multi events
app.post('/createMultiEvents.do', upload.array('file', 5), (req, res) => {
  const refs = Array.isArray(req.body.selectedShipments)
    ? req.body.selectedShipments
    : [req.body.selectedShipments].filter(Boolean);

  const events = refs.map(ref => ({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    jobreference: ref,
    eventType: req.body.eventtype,
    eventDate: req.body.eventdate,
    eventTime: req.body.eventtime,
    comments: req.body.comments,
    contact: req.body.contact,
    gmtOffset: req.body.gmtOffset,
    files: (req.files || []).map(f => ({ name: f.originalname, size: f.size }))
  }));

  eventLog.push(...events);
  console.log('[MULTI-EVENT CREATED]', JSON.stringify(events, null, 2));

  res.json({ success: true, count: events.length, message: `${events.length} event(s) created` });
});

// QR/barcode upload
app.post('/uploadQR.do', upload.single('file'), (req, res) => {
  // Mock: return a random reference
  const refs = Object.keys(shipmentDB);
  const randomRef = refs[Math.floor(Math.random() * refs.length)];
  console.log('[QR UPLOAD]', req.file?.originalname, '-> resolved to', randomRef);
  res.json({ jobreference: randomRef });
});

// ===== Debug/Admin Endpoints =====

// View all created events (for testing)
app.get('/api/events', (req, res) => {
  res.json({ count: eventLog.length, events: eventLog });
});

// View all shipments in DB
app.get('/api/shipments', (req, res) => {
  res.json(shipmentDB);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '3.3.2', events: eventLog.length });
});

// ===== Start =====
app.listen(PORT, () => {
  console.log(`\n===================================`);
  console.log(`  DSV Air & Sea Mobile REPLICA`);
  console.log(`  Version: 3.3.2`);
  console.log(`  Running: http://localhost:${PORT}`);
  console.log(`  Login:   http://localhost:${PORT}/`);
  console.log(`  Home:    http://localhost:${PORT}/home.do`);
  console.log(`===================================\n`);
});
