// src/utils/listings.js
function makeSlot() {
  return { id: `slot_${Date.now()}_${Math.random().toString(16).slice(2)}`, start: '', end: '' };
}

export function isoToLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function localInputToIso(value) {
  return value ? new Date(value).toISOString() : '';
}

export function emptyListingForm() {
  return {
    title: '',
    description: '',
    category: 'Electronics',
    campus: 'CPP',
    images: [''],
    pricing: { hourly: '', daily: '', weekly: '' },
    depositAmount: '',
    pickupInstructions: '',
    dropoffInstructions: '',
    availability: [makeSlot()],
    status: 'active'
  };
}

export function listingToForm(listing) {
  return {
    title: listing.title ?? '',
    description: listing.description ?? '',
    category: listing.category ?? 'Electronics',
    campus: listing.campus ?? 'CPP',
    images: listing.images?.length ? listing.images : [''],
    pricing: {
      hourly: listing.pricing?.hourly ? String(listing.pricing.hourly) : '',
      daily: listing.pricing?.daily ? String(listing.pricing.daily) : '',
      weekly: listing.pricing?.weekly ? String(listing.pricing.weekly) : ''
    },
    depositAmount: listing.depositAmount != null ? String(listing.depositAmount) : '',
    pickupInstructions: listing.pickupInstructions ?? '',
    dropoffInstructions: listing.dropoffInstructions ?? '',
    availability: listing.availability?.length
      ? listing.availability.map((slot, index) => ({
          id: slot.id ?? `slot_${index}`,
          start: isoToLocalInput(slot.start),
          end: isoToLocalInput(slot.end)
        }))
      : [makeSlot()],
    status: listing.status ?? 'active'
  };
}

export function formToListingPayload(form) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category,
    campus: form.campus.trim(),
    images: form.images.map((url) => url.trim()).filter(Boolean),
    pricing: {
      hourly: Number(form.pricing.hourly || 0),
      daily: Number(form.pricing.daily || 0),
      weekly: Number(form.pricing.weekly || 0)
    },
    depositAmount: Number(form.depositAmount || 0),
    pickupInstructions: form.pickupInstructions.trim(),
    dropoffInstructions: form.dropoffInstructions.trim(),
    availability: form.availability
      .filter((slot) => slot.start && slot.end)
      .map((slot) => ({
        id: slot.id,
        start: localInputToIso(slot.start),
        end: localInputToIso(slot.end)
      })),
    status: form.status
  };
}
