import {
  DEMO_EQUIPMENT_DATA,
  EQUIPMENT_CATEGORIES,
  SHARING_TYPES,
  AVAILABILITY_STATUSES,
  CONDITION_OPTIONS,
  SORT_OPTIONS
} from '../data/equipmentData.js';

/**
 * Retrieve all demonstration equipment records
 */
export function getAllEquipment() {
  return [...DEMO_EQUIPMENT_DATA];
}

/**
 * Retrieve a curated list of featured equipment for homepage showcase
 */
export function getFeaturedEquipment(limit = 6) {
  return DEMO_EQUIPMENT_DATA.slice(0, limit);
}

/**
 * Find a specific equipment record by its unique ID
 */
export function getEquipmentById(id) {
  if (!id) return null;
  return DEMO_EQUIPMENT_DATA.find((item) => item.id.toLowerCase() === id.trim().toLowerCase()) || null;
}

/**
 * Retrieve category options
 */
export function getCategories() {
  return [...EQUIPMENT_CATEGORIES];
}

/**
 * Retrieve sharing type options
 */
export function getSharingTypes() {
  return [...SHARING_TYPES];
}

/**
 * Retrieve availability status options
 */
export function getAvailabilityStatuses() {
  return [...AVAILABILITY_STATUSES];
}

/**
 * Retrieve condition options
 */
export function getConditionOptions() {
  return [...CONDITION_OPTIONS];
}

/**
 * Retrieve sort options
 */
export function getSortOptions() {
  return [...SORT_OPTIONS];
}

/**
 * Filter and sort equipment demonstration records
 * Combines search keywords, category, sharing type, availability, and condition filters.
 */
export function filterAndSortEquipment({
  query = '',
  category = 'All Categories',
  sharingType = 'all',
  availability = 'all',
  condition = 'All Conditions',
  sort = 'default'
} = {}) {
  let results = [...DEMO_EQUIPMENT_DATA];

  // 1. Text Search across name, category, description, service area, condition notes, and accessories
  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery) {
    results = results.filter((item) => {
      const matchName = item.name.toLowerCase().includes(trimmedQuery);
      const matchCategory = item.category.toLowerCase().includes(trimmedQuery);
      const matchDesc = item.description.toLowerCase().includes(trimmedQuery);
      const matchArea = item.serviceArea.toLowerCase().includes(trimmedQuery);
      const matchCondition = item.conditionDetails?.toLowerCase().includes(trimmedQuery);
      const matchAccessories = item.includedAccessories?.some((acc) =>
        acc.toLowerCase().includes(trimmedQuery)
      );
      return matchName || matchCategory || matchDesc || matchArea || matchCondition || matchAccessories;
    });
  }

  // 2. Category Filter
  if (category && category !== 'All Categories') {
    results = results.filter((item) => {
      return item.category.toLowerCase() === category.toLowerCase();
    });
  }

  // 3. Sharing Type Filter ('free' | 'rental' | 'donation')
  if (sharingType && sharingType !== 'all') {
    results = results.filter((item) => {
      return item.sharingType.toLowerCase() === sharingType.toLowerCase();
    });
  }

  // 4. Availability Status Filter ('available' | 'unavailable')
  if (availability && availability !== 'all') {
    results = results.filter((item) => {
      return item.availabilityStatus.toLowerCase() === availability.toLowerCase();
    });
  }

  // 5. Condition Filter ('Good' | 'Fair' | 'Needs Inspection')
  if (condition && condition !== 'All Conditions') {
    results = results.filter((item) => {
      return item.condition.toLowerCase() === condition.toLowerCase();
    });
  }

  // 6. Sorting
  if (sort === 'name-asc') {
    results.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'name-desc') {
    results.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sort === 'date-desc') {
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'price-asc') {
    results.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    results.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating-desc') {
    results.sort((a, b) => (b.ownerRating || 0) - (a.ownerRating || 0));
  }
  // 'default' retains curated featured order

  return results;
}
