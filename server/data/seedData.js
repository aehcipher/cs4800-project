const { createEmptyDatabase } = require('./storage');
const { generateId, hashPassword, nowIso } = require('../utils/helpers');

function makeSeedDatabase() {
  const database = createEmptyDatabase();
  const createdAt = nowIso();
  const adminId = generateId('usr');
  const listerId = generateId('usr');
  const renterId = generateId('usr');

  database.users.push(
    { id: adminId, name: 'Avery Admin', email: 'admin@cpp.edu', campus: 'CPP', role: 'admin', emailVerified: true, mfaEnabled: true, mfaSecret: '123456', status: 'active', passwordHash: hashPassword('Password123!'), createdAt },
    { id: listerId, name: 'Lena Lister', email: 'lister@cpp.edu', campus: 'CPP', role: 'lister', emailVerified: true, mfaEnabled: false, mfaSecret: '', status: 'active', passwordHash: hashPassword('Password123!'), createdAt },
    { id: renterId, name: 'Riley Renter', email: 'renter@cpp.edu', campus: 'CPP', role: 'renter', emailVerified: true, mfaEnabled: false, mfaSecret: '', status: 'active', passwordHash: hashPassword('Password123!'), createdAt }
  );

  const listings = [
    { id: generateId('lst'), ownerId: listerId, title: 'Sony Mirrorless Camera Kit', description: 'Great for club events, graduation shoots, and campus media projects. Includes charger and memory card.', category: 'Electronics', campus: 'CPP', images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80'], pricing: { hourly: 8, daily: 28, weekly: 120 }, depositAmount: 60, pickupInstructions: 'Meet near the library circulation desk.', dropoffInstructions: 'Return in the same location during daylight hours.', availability: [{ start: '2026-04-10T09:00', end: '2026-05-30T19:00' }], status: 'active', createdAt, updatedAt: createdAt },
    { id: generateId('lst'), ownerId: listerId, title: 'Calculus II Textbook + Solutions Manual', description: 'Used but clean. Perfect for a quarter-long rental or exam prep.', category: 'Books', campus: 'CPP', images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80'], pricing: { hourly: 0, daily: 5, weekly: 18 }, depositAmount: 20, pickupInstructions: 'Pickup by the engineering building benches.', dropoffInstructions: 'Return before the final exam week.', availability: [{ start: '2026-04-05T08:00', end: '2026-06-10T18:00' }], status: 'active', createdAt, updatedAt: createdAt },
    { id: generateId('lst'), ownerId: listerId, title: 'Dorm Mini Projector', description: 'Compact projector for movie nights and presentations. HDMI included.', category: 'Appliances', campus: 'CPP', images: ['https://images.unsplash.com/photo-1528395874238-34ebe249b3f2?auto=format&fit=crop&w=1200&q=80'], pricing: { hourly: 4, daily: 15, weekly: 55 }, depositAmount: 35, pickupInstructions: 'Pickup from Vista Market patio.', dropoffInstructions: 'Return with all cables and remote.', availability: [{ start: '2026-04-04T10:00', end: '2026-05-20T21:00' }], status: 'active', createdAt, updatedAt: createdAt }
  ];

  database.listings.push(...listings);

  const bookingId = generateId('bok');
  const conversationId = generateId('con');
  const paidAt = nowIso();

  database.bookings.push({
    id: bookingId,
    listingId: listings[0].id,
    renterId,
    listerId,
    startAt: '2026-04-12T14:00',
    endAt: '2026-04-13T18:00',
    pricingUnit: 'daily',
    quantity: 2,
    subtotal: 56,
    serviceFee: 5.6,
    depositAmount: 60,
    totalAmount: 121.6,
    pickupWindow: 'Apr 12 · 1pm–3pm',
    dropoffWindow: 'Apr 13 · 5pm–6pm',
    status: 'paid',
    conversationId,
    createdAt,
    updatedAt: paidAt
  });

  database.payments.push({ id: generateId('pay'), bookingId, amount: 121.6, currency: 'usd', provider: 'mock', providerReference: 'mock_seed_payment', kind: 'charge', status: 'succeeded', createdAt: paidAt });
  database.escrows.push({ id: generateId('esc'), bookingId, depositAmount: 60, status: 'held', heldAt: paidAt, releasedAt: null, refundedAt: null });
  database.conversations.push({ id: conversationId, bookingId, participantIds: [renterId, listerId], createdAt });
  database.messages.push(
    { id: generateId('msg'), conversationId, senderId: renterId, body: 'Hi! Is the camera available for the media club event next weekend?', createdAt },
    { id: generateId('msg'), conversationId, senderId: listerId, body: 'Yes, it is. I already added pickup instructions in the booking details.', createdAt: nowIso() }
  );
  database.notifications.push(
    { id: generateId('not'), userId: listerId, type: 'booking', title: 'New booking payment received', message: 'A renter paid for the Sony Mirrorless Camera Kit rental and deposit.', readAt: null, createdAt: paidAt, metadata: { bookingId } },
    { id: generateId('not'), userId: renterId, type: 'booking', title: 'Booking confirmed', message: 'Your camera booking is paid. Submit a pre-rental condition report before pickup.', readAt: null, createdAt: paidAt, metadata: { bookingId } }
  );

  return database;
}

module.exports = { makeSeedDatabase };
