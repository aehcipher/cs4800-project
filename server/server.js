const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const { databasePath, ensureDatabase, readDatabase, writeDatabase } = require('./data/storage');
const { makeSeedDatabase } = require('./data/seedData');
const { average, calculateQuantity, generateId, hashPassword, nowIso, sanitizeUser, verifyPassword } = require('./utils/helpers');

ensureDatabase();

const app = express();
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

function createNotification(database, { userId, type, title, message, metadata = {} }) {
  const notification = { id: generateId('not'), userId, type, title, message, metadata, readAt: null, createdAt: nowIso() };
  database.notifications.unshift(notification);
  return notification;
}

async function sendEmail({ to, subject, text }) {
  if (config.emailProvider === 'sendgrid' && config.sendgridApiKey) {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: config.sendgridFromEmail },
        subject,
        content: [{ type: 'text/plain', value: text }]
      })
    });
    return;
  }
}

async function sendPush() {
  return true;
}

async function notifyUser(database, { userId, type, title, message, metadata = {} }) {
  const notification = createNotification(database, { userId, type, title, message, metadata });
  const user = database.users.find((item) => item.id === userId);
  if (user) {
    await sendEmail({ to: user.email, subject: title, text: message });
    await sendPush({ userId, title, body: message });
  }
  return notification;
}

function verifyStudentEmail(email) {
  const normalized = String(email || '').toLowerCase();
  return config.allowedStudentDomains.some((domain) => normalized.endsWith(domain));
}

async function createCharge({ amount, description }) {
  if (config.paymentProvider === 'stripe' && config.stripeSecretKey) {
    const params = new URLSearchParams();
    params.set('amount', String(Math.round(amount * 100)));
    params.set('currency', config.stripeCurrency);
    params.set('description', description);
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    const data = await response.json();
    return { provider: 'stripe', providerReference: data.id, status: data.status || 'requires_payment_method' };
  }
  return { provider: 'mock', providerReference: generateId('mockpay'), status: 'succeeded' };
}

function getSessionFromHeader(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function requireAuth(req, res, next) {
  const token = getSessionFromHeader(req);
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  const database = readDatabase();
  const session = database.sessions.find((item) => item.token === token);
  if (!session) return res.status(401).json({ error: 'Session not found or expired.' });
  const user = database.users.find((item) => item.id === session.userId);
  if (!user || user.status !== 'active') return res.status(401).json({ error: 'User is not active.' });
  req.auth = { token, user, safeUser: sanitizeUser(user) };
  next();
}

function requireAdmin(req, res, next) {
  if (req.auth?.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
  next();
}

function attachListingOwner(database, listing) {
  const owner = database.users.find((user) => user.id === listing.ownerId);
  const ownerReviews = database.reviews.filter((review) => review.revieweeId === listing.ownerId);
  return { ...listing, owner: owner ? { id: owner.id, name: owner.name, campus: owner.campus } : null, ownerRating: Number(average(ownerReviews.map((r) => Number(r.rating || 0))).toFixed(1)) };
}

function getBookingView(database, booking) {
  const listing = database.listings.find((item) => item.id === booking.listingId);
  return { ...booking, listingTitle: listing?.title || 'Listing', conditionReports: database.conditionReports.filter((item) => item.bookingId === booking.id), reviews: database.reviews.filter((item) => item.bookingId === booking.id) };
}

function overlaps(startA, endA, startB, endB) {
  return new Date(startA).getTime() < new Date(endB).getTime() && new Date(endA).getTime() > new Date(startB).getTime();
}

function validatePassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password || '');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', databasePath });
});

app.post('/api/dev/reset-seed', async (req, res) => {
  const database = makeSeedDatabase();
  writeDatabase(database);
  res.json({ ok: true });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, campus, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name || !normalizedEmail || !campus || !password) throw new Error('Name, email, campus, and password are required.');
    if (!verifyStudentEmail(normalizedEmail)) throw new Error(`Only student email domains are allowed. Accepted domains: ${config.allowedStudentDomains.join(', ')}`);
    if (!validatePassword(password)) throw new Error('Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.');
    const database = readDatabase();
    if (database.users.some((user) => user.email === normalizedEmail)) throw new Error('An account with that email already exists.');
    const user = { id: generateId('usr'), name, email: normalizedEmail, campus, role: 'renter', emailVerified: false, mfaEnabled: false, mfaSecret: '', status: 'active', passwordHash: hashPassword(password), createdAt: nowIso() };
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    database.users.unshift(user);
    database.emailVerifications.unshift({ id: generateId('ver'), userId: user.id, email: normalizedEmail, code: verificationCode, expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), usedAt: null, createdAt: nowIso() });
    await notifyUser(database, { userId: user.id, type: 'verification', title: 'Verify your student email', message: `Use verification code ${verificationCode} to activate your account.` });
    writeDatabase(database);
    res.status(201).json({ user: sanitizeUser(user), verificationCode });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/verify-email', (req, res) => {
  try {
    const { email, code } = req.body || {};
    const database = readDatabase();
    const verification = database.emailVerifications.find((item) => item.email === String(email || '').trim().toLowerCase() && item.code === String(code || '').trim() && !item.usedAt);
    if (!verification) throw new Error('Verification code is invalid.');
    if (new Date(verification.expiresAt).getTime() < Date.now()) throw new Error('Verification code has expired.');
    const user = database.users.find((item) => item.id === verification.userId);
    if (!user) throw new Error('User not found.');
    user.emailVerified = true;
    verification.usedAt = nowIso();
    writeDatabase(database);
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, mfaCode } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const database = readDatabase();
    const user = database.users.find((item) => item.email === normalizedEmail);
    if (!user || !verifyPassword(String(password || ''), user.passwordHash)) throw new Error('Incorrect email or password.');
    if (user.status !== 'active') throw new Error('This account is not active.');
    if (!user.emailVerified) throw new Error('Verify your email before logging in.');
    if (user.mfaEnabled && String(mfaCode || '').trim() !== user.mfaSecret) return res.json({ requiresMfa: true, message: 'MFA required.' });
    const token = generateId('tok');
    database.sessions = database.sessions.filter((session) => session.userId !== user.id);
    database.sessions.push({ token, userId: user.id, expiresAt: new Date(Date.now() + config.sessionTtlHours * 60 * 60 * 1000).toISOString(), createdAt: nowIso() });
    writeDatabase(database);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const database = readDatabase();
  database.sessions = database.sessions.filter((session) => session.token !== req.auth.token);
  writeDatabase(database);
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.auth.safeUser });
});

app.get('/api/listings', (req, res) => {
  const database = readDatabase();
  let listings = database.listings.filter((listing) => listing.status === 'active');
  const { q, category, campus, minPrice, maxPrice, limit } = req.query;
  if (q) listings = listings.filter((listing) => `${listing.title} ${listing.description}`.toLowerCase().includes(String(q).toLowerCase()));
  if (category) listings = listings.filter((listing) => listing.category === category);
  if (campus) listings = listings.filter((listing) => listing.campus.toLowerCase().includes(String(campus).toLowerCase()));
  if (minPrice) listings = listings.filter((listing) => Number(listing.pricing.daily || listing.pricing.hourly || 0) >= Number(minPrice));
  if (maxPrice) listings = listings.filter((listing) => Number(listing.pricing.daily || listing.pricing.hourly || 0) <= Number(maxPrice));
  if (limit) listings = listings.slice(0, Number(limit));
  res.json({ listings: listings.map((listing) => attachListingOwner(database, listing)) });
});

app.get('/api/listings/mine', requireAuth, (req, res) => {
  const database = readDatabase();
  const listings = database.listings.filter((listing) => listing.ownerId === req.auth.user.id).map((listing) => attachListingOwner(database, listing));
  res.json({ listings });
});

app.get('/api/listings/:listingId', (req, res) => {
  try {
    const database = readDatabase();
    const listing = database.listings.find((item) => item.id === req.params.listingId);
    if (!listing) throw new Error('Listing not found.');
    res.json({ listing: attachListingOwner(database, listing) });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/listings', requireAuth, (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.title || !payload.description || !payload.category || !payload.campus) throw new Error('Title, description, category, and campus are required.');
    const database = readDatabase();
    const timestamp = nowIso();
    const listing = { id: generateId('lst'), ownerId: req.auth.user.id, title: payload.title, description: payload.description, category: payload.category, campus: payload.campus, images: Array.isArray(payload.images) ? payload.images : [], pricing: { hourly: Number(payload.pricing?.hourly || 0), daily: Number(payload.pricing?.daily || 0), weekly: Number(payload.pricing?.weekly || 0) }, depositAmount: Number(payload.depositAmount || 0), pickupInstructions: payload.pickupInstructions || 'Coordinate pickup through in-app messaging.', dropoffInstructions: payload.dropoffInstructions || 'Return to the agreed campus meetup location.', availability: Array.isArray(payload.availability) ? payload.availability : [], status: 'active', createdAt: timestamp, updatedAt: timestamp };
    database.listings.unshift(listing);
    writeDatabase(database);
    res.status(201).json({ listing: attachListingOwner(database, listing) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/bookings', requireAuth, (req, res) => {
  const database = readDatabase();
  const bookings = database.bookings.filter((booking) => booking.renterId === req.auth.user.id || booking.listerId === req.auth.user.id || req.auth.user.role === 'admin').map((booking) => getBookingView(database, booking));
  res.json({ bookings });
});

app.get('/api/bookings/:bookingId', requireAuth, (req, res) => {
  try {
    const database = readDatabase();
    const booking = database.bookings.find((item) => item.id === req.params.bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.renterId !== req.auth.user.id && booking.listerId !== req.auth.user.id && req.auth.user.role !== 'admin') throw new Error('You do not have access to this booking.');
    res.json({ booking: getBookingView(database, booking) });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/bookings', requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    const database = readDatabase();
    const listing = database.listings.find((item) => item.id === payload.listingId && item.status === 'active');
    if (!listing) throw new Error('Listing not found or unavailable.');
    if (listing.ownerId === req.auth.user.id) throw new Error('You cannot book your own listing.');
    if (!payload.startAt || !payload.endAt) throw new Error('Start and end times are required.');
    if (new Date(payload.startAt).getTime() >= new Date(payload.endAt).getTime()) throw new Error('End time must be after start time.');
    const conflicting = database.bookings.find((booking) => booking.listingId === listing.id && ['requested', 'paid', 'active'].includes(booking.status) && overlaps(payload.startAt, payload.endAt, booking.startAt, booking.endAt));
    if (conflicting) throw new Error('This listing already has a booking in that time range.');
    const pricingUnit = payload.pricingUnit || 'daily';
    const quantity = calculateQuantity(payload.startAt, payload.endAt, pricingUnit);
    const rate = Number(listing.pricing?.[pricingUnit] || listing.pricing?.daily || listing.pricing?.hourly || 0);
    const subtotal = Number((quantity * rate).toFixed(2));
    const serviceFee = Number((subtotal * Number(database.settings.commissionRate || 0.1)).toFixed(2));
    const totalAmount = Number((subtotal + serviceFee + Number(listing.depositAmount || 0)).toFixed(2));
    const booking = { id: generateId('bok'), listingId: listing.id, renterId: req.auth.user.id, listerId: listing.ownerId, startAt: payload.startAt, endAt: payload.endAt, pricingUnit, quantity, subtotal, serviceFee, depositAmount: Number(listing.depositAmount || 0), totalAmount, pickupWindow: payload.pickupWindow || 'Coordinate pickup through chat.', dropoffWindow: payload.dropoffWindow || 'Coordinate drop-off through chat.', status: 'requested', conversationId: generateId('con'), createdAt: nowIso(), updatedAt: nowIso() };
    database.bookings.unshift(booking);
    database.conversations.unshift({ id: booking.conversationId, bookingId: booking.id, participantIds: [booking.renterId, booking.listerId], createdAt: nowIso() });
    await notifyUser(database, { userId: booking.listerId, type: 'booking', title: 'New booking request', message: `${req.auth.user.name} requested ${listing.title}.`, metadata: { bookingId: booking.id } });
    await notifyUser(database, { userId: booking.renterId, type: 'booking', title: 'Booking request created', message: `You created a booking request for ${listing.title}.`, metadata: { bookingId: booking.id } });
    writeDatabase(database);
    res.status(201).json({ booking: getBookingView(database, booking) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/payments/checkout/:bookingId', requireAuth, async (req, res) => {
  try {
    const database = readDatabase();
    const booking = database.bookings.find((item) => item.id === req.params.bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.renterId !== req.auth.user.id && req.auth.user.role !== 'admin') throw new Error('Only the renter can pay for this booking.');
    if (booking.status !== 'requested') throw new Error('This booking is already paid or no longer payable.');
    const listing = database.listings.find((item) => item.id === booking.listingId);
    const providerResult = await createCharge({ amount: booking.totalAmount, description: `Rental payment for ${listing?.title || booking.listingId}` });
    const payment = { id: generateId('pay'), bookingId: booking.id, amount: booking.totalAmount, currency: 'usd', provider: providerResult.provider, providerReference: providerResult.providerReference, kind: 'charge', status: providerResult.status === 'succeeded' ? 'succeeded' : 'pending', createdAt: nowIso() };
    booking.status = providerResult.status === 'succeeded' ? 'paid' : 'requested';
    booking.updatedAt = nowIso();
    database.payments.unshift(payment);
    database.escrows.unshift({ id: generateId('esc'), bookingId: booking.id, depositAmount: booking.depositAmount, status: 'held', heldAt: nowIso(), releasedAt: null, refundedAt: null });
    await notifyUser(database, { userId: booking.listerId, type: 'payment', title: 'Booking paid', message: 'A renter paid the rental amount and deposit.', metadata: { bookingId: booking.id } });
    await notifyUser(database, { userId: booking.renterId, type: 'payment', title: 'Payment receipt', message: `Your payment of ${booking.totalAmount.toFixed(2)} was recorded.`, metadata: { bookingId: booking.id } });
    writeDatabase(database);
    res.json({ booking: getBookingView(database, booking), payment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/bookings/:bookingId/complete', requireAuth, async (req, res) => {
  try {
    const database = readDatabase();
    const booking = database.bookings.find((item) => item.id === req.params.bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.renterId !== req.auth.user.id && booking.listerId !== req.auth.user.id && req.auth.user.role !== 'admin') throw new Error('You do not have permission to complete this booking.');
    if (!['paid', 'active', 'disputed'].includes(booking.status)) throw new Error('Only paid, active, or disputed bookings can be completed.');
    booking.status = 'completed';
    booking.updatedAt = nowIso();
    const escrow = database.escrows.find((item) => item.bookingId === booking.id && item.status === 'held');
    if (escrow) { escrow.status = 'released'; escrow.releasedAt = nowIso(); }
    await notifyUser(database, { userId: booking.renterId, type: 'booking', title: 'Booking completed', message: 'Your rental was marked complete.', metadata: { bookingId: booking.id } });
    await notifyUser(database, { userId: booking.listerId, type: 'booking', title: 'Booking completed', message: 'A rental was completed and escrow was updated.', metadata: { bookingId: booking.id } });
    writeDatabase(database);
    res.json({ booking: getBookingView(database, booking) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/condition-reports/:bookingId', requireAuth, async (req, res) => {
  try {
    const database = readDatabase();
    const booking = database.bookings.find((item) => item.id === req.params.bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.renterId !== req.auth.user.id && booking.listerId !== req.auth.user.id && req.auth.user.role !== 'admin') throw new Error('You do not have access to this booking.');
    const report = { id: generateId('cr'), bookingId: booking.id, submittedBy: req.auth.user.id, stage: req.body?.stage === 'post' ? 'post' : 'pre', notes: String(req.body?.notes || '').trim(), photoUrls: Array.isArray(req.body?.photoUrls) ? req.body.photoUrls : [], conditionRating: Number(req.body?.conditionRating || 5), createdAt: nowIso() };
    if (!report.notes) throw new Error('Condition notes are required.');
    database.conditionReports.unshift(report);
    const otherUserId = booking.renterId === req.auth.user.id ? booking.listerId : booking.renterId;
    await notifyUser(database, { userId: otherUserId, type: 'condition', title: 'Condition report submitted', message: `${req.auth.user.name} submitted a ${report.stage}-rental condition report.`, metadata: { bookingId: booking.id } });
    writeDatabase(database);
    res.status(201).json({ report });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/messages/conversations', requireAuth, (req, res) => {
  const database = readDatabase();
  const conversations = database.conversations.filter((conversation) => conversation.participantIds.includes(req.auth.user.id) || req.auth.user.role === 'admin').map((conversation) => {
    const booking = database.bookings.find((item) => item.id === conversation.bookingId);
    const listing = database.listings.find((item) => item.id === booking?.listingId);
    return { ...conversation, bookingId: conversation.bookingId, listingTitle: listing?.title || 'Listing' };
  });
  res.json({ conversations });
});

app.get('/api/messages/conversations/:conversationId', requireAuth, (req, res) => {
  try {
    const database = readDatabase();
    const conversation = database.conversations.find((item) => item.id === req.params.conversationId);
    if (!conversation) throw new Error('Conversation not found.');
    if (!conversation.participantIds.includes(req.auth.user.id) && req.auth.user.role !== 'admin') throw new Error('No access to this conversation.');
    const booking = database.bookings.find((item) => item.id === conversation.bookingId);
    const listing = database.listings.find((item) => item.id === booking?.listingId);
    const messages = database.messages.filter((item) => item.conversationId === conversation.id).map((message) => {
      const sender = database.users.find((item) => item.id === message.senderId);
      return { ...message, senderName: sender?.name || 'User' };
    });
    res.json({ conversation: { ...conversation, listingTitle: listing?.title || 'Listing', messages } });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/messages/conversations/:conversationId', requireAuth, async (req, res) => {
  try {
    const database = readDatabase();
    const conversation = database.conversations.find((item) => item.id === req.params.conversationId);
    if (!conversation) throw new Error('Conversation not found.');
    if (!conversation.participantIds.includes(req.auth.user.id) && req.auth.user.role !== 'admin') throw new Error('No access to this conversation.');
    const body = String(req.body?.body || '').trim();
    if (!body) throw new Error('Message cannot be empty.');
    const message = { id: generateId('msg'), conversationId: conversation.id, senderId: req.auth.user.id, body, createdAt: nowIso() };
    database.messages.push(message);
    for (const userId of conversation.participantIds.filter((participantId) => participantId !== req.auth.user.id)) {
      await notifyUser(database, { userId, type: 'message', title: 'New message', message: `${req.auth.user.name}: ${body}`, metadata: { conversationId: conversation.id } });
    }
    writeDatabase(database);
    res.status(201).json({ message });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/reviews', requireAuth, async (req, res) => {
  try {
    const { bookingId, revieweeId, rating, comment } = req.body || {};
    const database = readDatabase();
    const booking = database.bookings.find((item) => item.id === bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.renterId !== req.auth.user.id && booking.listerId !== req.auth.user.id) throw new Error('You did not participate in this booking.');
    if (booking.status !== 'completed') throw new Error('Reviews can only be left after a booking is completed.');
    if (database.reviews.some((item) => item.bookingId === bookingId && item.reviewerId === req.auth.user.id)) throw new Error('You already reviewed this booking.');
    const review = { id: generateId('rev'), bookingId, reviewerId: req.auth.user.id, revieweeId, rating: Number(rating || 5), comment: String(comment || '').trim(), createdAt: nowIso() };
    if (!review.comment) throw new Error('A review comment is required.');
    database.reviews.unshift(review);
    await notifyUser(database, { userId: review.revieweeId, type: 'review', title: 'New review received', message: `${req.auth.user.name} left you a ${review.rating}-star review.`, metadata: { bookingId } });
    writeDatabase(database);
    res.status(201).json({ review });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/disputes', requireAuth, (req, res) => {
  const database = readDatabase();
  const disputes = database.disputes.filter((dispute) => {
    if (req.auth.user.role === 'admin') return true;
    const booking = database.bookings.find((item) => item.id === dispute.bookingId);
    return booking && (booking.renterId === req.auth.user.id || booking.listerId === req.auth.user.id);
  });
  res.json({ disputes });
});

app.post('/api/disputes', requireAuth, async (req, res) => {
  try {
    const { bookingId, reason, details } = req.body || {};
    const database = readDatabase();
    const booking = database.bookings.find((item) => item.id === bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.renterId !== req.auth.user.id && booking.listerId !== req.auth.user.id) throw new Error('You did not participate in this booking.');
    const dispute = { id: generateId('dsp'), bookingId, raisedBy: req.auth.user.id, reason: String(reason || '').trim(), details: String(details || '').trim(), status: 'open', resolutionNotes: '', refundAmount: 0, createdAt: nowIso(), updatedAt: nowIso() };
    if (!dispute.reason || !dispute.details) throw new Error('Reason and details are required.');
    booking.status = 'disputed';
    booking.updatedAt = nowIso();
    database.disputes.unshift(dispute);
    for (const admin of database.users.filter((item) => item.role === 'admin')) {
      await notifyUser(database, { userId: admin.id, type: 'dispute', title: 'New dispute opened', message: `${req.auth.user.name} opened a dispute for booking ${bookingId.slice(0, 8)}.`, metadata: { disputeId: dispute.id } });
    }
    writeDatabase(database);
    res.status(201).json({ dispute });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/notifications', requireAuth, (req, res) => {
  const database = readDatabase();
  res.json({ notifications: database.notifications.filter((item) => item.userId === req.auth.user.id) });
});

app.post('/api/notifications/:notificationId/read', requireAuth, (req, res) => {
  try {
    const database = readDatabase();
    const notification = database.notifications.find((item) => item.id === req.params.notificationId && item.userId === req.auth.user.id);
    if (!notification) throw new Error('Notification not found.');
    notification.readAt = nowIso();
    writeDatabase(database);
    res.json({ notification });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.get('/api/dashboard/earnings', requireAuth, (req, res) => {
  const database = readDatabase();
  const ownedListings = database.listings.filter((listing) => listing.ownerId === req.auth.user.id);
  const listingIds = new Set(ownedListings.map((listing) => listing.id));
  const relatedBookings = database.bookings.filter((booking) => listingIds.has(booking.listingId));
  const completedBookings = relatedBookings.filter((booking) => booking.status === 'completed');
  const upcomingBookings = relatedBookings.filter((booking) => ['requested', 'paid', 'active', 'disputed'].includes(booking.status)).map((booking) => getBookingView(database, booking));
  const totalEarnings = completedBookings.reduce((sum, booking) => sum + Number(booking.subtotal || 0), 0);
  const escrowHeld = database.escrows.filter((escrow) => relatedBookings.some((booking) => booking.id === escrow.bookingId) && escrow.status === 'held').reduce((sum, escrow) => sum + Number(escrow.depositAmount || 0), 0);
  res.json({ dashboard: { totalEarnings, escrowHeld, upcomingBookings } });
});

app.get('/api/admin/summary', requireAuth, requireAdmin, (req, res) => {
  const database = readDatabase();
  res.json({ summary: { userCount: database.users.length, listingCount: database.listings.length, openDisputeCount: database.disputes.filter((item) => item.status !== 'resolved').length, totalProcessed: database.payments.filter((item) => item.kind === 'charge' && item.status === 'succeeded').reduce((sum, item) => sum + Number(item.amount || 0), 0) } });
});

app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  const database = readDatabase();
  res.json({ users: database.users.map(sanitizeUser) });
});

app.patch('/api/admin/users/:userId', requireAuth, requireAdmin, (req, res) => {
  try {
    const database = readDatabase();
    const user = database.users.find((item) => item.id === req.params.userId);
    if (!user) throw new Error('User not found.');
    user.status = req.body?.status || user.status;
    writeDatabase(database);
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.get('/api/admin/listings', requireAuth, requireAdmin, (req, res) => {
  const database = readDatabase();
  res.json({ listings: database.listings });
});

app.patch('/api/admin/listings/:listingId', requireAuth, requireAdmin, (req, res) => {
  try {
    const database = readDatabase();
    const listing = database.listings.find((item) => item.id === req.params.listingId);
    if (!listing) throw new Error('Listing not found.');
    listing.status = req.body?.status || listing.status;
    writeDatabase(database);
    res.json({ listing });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.get('/api/admin/disputes', requireAuth, requireAdmin, (req, res) => {
  const database = readDatabase();
  res.json({ disputes: database.disputes });
});

app.patch('/api/admin/disputes/:disputeId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const database = readDatabase();
    const dispute = database.disputes.find((item) => item.id === req.params.disputeId);
    if (!dispute) throw new Error('Dispute not found.');
    const booking = database.bookings.find((item) => item.id === dispute.bookingId);
    if (!booking) throw new Error('Booking not found.');
    dispute.status = req.body?.status || 'resolved';
    dispute.resolutionNotes = String(req.body?.resolutionNotes || '').trim();
    dispute.refundAmount = Number(req.body?.refundAmount || 0);
    dispute.updatedAt = nowIso();
    booking.status = 'completed';
    booking.updatedAt = nowIso();
    if (dispute.refundAmount > 0) {
      database.payments.unshift({ id: generateId('pay'), bookingId: booking.id, amount: dispute.refundAmount, currency: 'usd', provider: 'mock', providerReference: generateId('refund'), kind: 'refund', status: 'succeeded', createdAt: nowIso() });
      const escrow = database.escrows.find((item) => item.bookingId === booking.id && item.status === 'held');
      if (escrow) { escrow.status = 'refunded'; escrow.refundedAt = nowIso(); }
    }
    for (const userId of [booking.renterId, booking.listerId]) {
      await notifyUser(database, { userId, type: 'dispute', title: 'Dispute updated', message: `Admin ${req.auth.user.name} updated the dispute status to ${dispute.status}.`, metadata: { disputeId: dispute.id } });
    }
    writeDatabase(database);
    res.json({ dispute });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

const distPath = path.join(process.cwd(), 'dist');
const distIndexPath = path.join(distPath, 'index.html');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Endpoint not found.' });
  res.sendFile(fs.existsSync(distIndexPath) ? distIndexPath : path.join(process.cwd(), 'index.html'));
});

app.listen(config.port, () => {
  console.log(`Student rental API listening on http://localhost:${config.port}`);
});
