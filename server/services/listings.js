const { generateId } = require('../utils/helpers');

const LISTER_EDITABLE_STATUSES = new Set(['active', 'paused']);
const ADMIN_EDITABLE_STATUSES = new Set(['active', 'paused', 'blocked', 'removed', 'draft']);

function normalizeImageUrls(images) {
  const values = Array.isArray(images) ? images : [];
  return [...new Set(values.map((url) => String(url || '').trim()).filter(Boolean))];
}

function normalizePricing(pricing = {}) {
  const hourly = Number(pricing.hourly || 0);
  const daily = Number(pricing.daily || 0);
  const weekly = Number(pricing.weekly || 0);

  if (hourly <= 0 && daily <= 0 && weekly <= 0) {
    throw new Error('At least one price must be greater than 0.');
  }

  return { hourly, daily, weekly };
}

function normalizeAvailability(availability = []) {
  return (Array.isArray(availability) ? availability : [])
    .filter((slot) => slot.start && slot.end)
    .map((slot) => {
      const start = new Date(slot.start);
      const end = new Date(slot.end);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error('Availability dates are invalid.');
      }

      if (end <= start) {
        throw new Error('Availability end must be after start.');
      }

      return {
        id: slot.id || generateId('avl'),
        start: start.toISOString(),
        end: end.toISOString()
      };
    });
}

function canPublicViewListing(listing, viewer) {
  if (listing.status === 'active') return true;
  if (!viewer) return false;
  return viewer.id === listing.ownerId || viewer.role === 'admin';
}

function bookingFitsAvailability(listing, startAt, endAt) {
  if (!listing.availability || listing.availability.length === 0) return true;

  const start = new Date(startAt);
  const end = new Date(endAt);

  return listing.availability.some((slot) => {
    return start >= new Date(slot.start) && end <= new Date(slot.end);
  });
}

module.exports = {
  normalizeImageUrls,
  normalizePricing,
  normalizeAvailability,
  canPublicViewListing,
  bookingFitsAvailability,
  LISTER_EDITABLE_STATUSES,
  ADMIN_EDITABLE_STATUSES
};