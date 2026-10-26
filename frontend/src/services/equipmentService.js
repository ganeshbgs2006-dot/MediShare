import {
  DEMO_EQUIPMENT_DATA,
  EQUIPMENT_CATEGORIES,
  SHARING_TYPES,
  AVAILABILITY_STATUSES,
  CONDITION_OPTIONS,
  SORT_OPTIONS
} from '../data/equipmentData.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Standardize backend SQL equipment record into unified frontend shape
 */
export function normalizeEquipment(raw) {
  if (!raw) return null;
  const sharingType = raw.sharing_type || raw.sharingType || 'free';
  const price = raw.price_per_day !== undefined ? Number(raw.price_per_day) : (raw.price !== undefined ? Number(raw.price) : 0);
  const condition = raw.condition_grade || raw.condition || 'Good';
  const availabilityStatus = raw.availability_status || raw.availabilityStatus || 'available';
  const serviceArea = raw.service_area || raw.serviceArea || '';
  const imageUrl = raw.image_url || raw.imageUrl || '';
  const videoUrl = raw.video_url || raw.videoUrl || '';
  const gallery = raw.gallery || raw.galleryImages || (imageUrl ? [imageUrl] : []);

  return {
    ...raw,
    id: String(raw.id),
    name: raw.name,
    category: raw.category,
    description: raw.description,
    sharingType,
    sharingLabel: sharingType === 'free' ? 'Free Lending' : sharingType === 'rental' ? 'Paid Rental' : 'Donation',
    price,
    pricePerDay: price,
    condition,
    conditionGrade: condition,
    conditionDetails: raw.condition_details || raw.conditionDetails || '',
    knownDamage: raw.known_damage || raw.knownDamage || '',
    availabilityStatus,
    availabilityLabel: availabilityStatus === 'available' ? 'Available' : 'Currently Unavailable',
    serviceArea,
    location: serviceArea,
    imageUrl,
    videoUrl,
    galleryImages: gallery,
    ownerId: raw.owner_id || (raw.owner && raw.owner.id),
    ownerName: raw.owner_name || (raw.owner && (typeof raw.owner === 'string' ? raw.owner : raw.owner.name)) || 'Equipment Partner',
    ownerOrganization: raw.owner_organization || (raw.owner && raw.owner.type) || 'Community Provider',
    owner: {
      id: raw.owner_id || (raw.owner && raw.owner.id),
      name: raw.owner_name || (raw.owner && (typeof raw.owner === 'string' ? raw.owner : raw.owner.name)) || 'Equipment Partner',
      type: raw.owner_organization || (raw.owner && raw.owner.type) || 'Verified Partner',
      rating: 4.9,
      completedLoans: 14
    }
  };
}

/**
 * Retrieve all demonstration equipment records normalized
 */
export function getAllEquipment() {
  return DEMO_EQUIPMENT_DATA.map(normalizeEquipment);
}

/**
 * Retrieve a curated list of featured equipment for homepage showcase
 */
export function getFeaturedEquipment(limit = 6) {
  return DEMO_EQUIPMENT_DATA.slice(0, limit).map(normalizeEquipment);
}

/**
 * Find a specific equipment record by its unique ID (sync demo fallback)
 */
export function getEquipmentById(id) {
  if (!id) return null;
  const match = DEMO_EQUIPMENT_DATA.find((item) => String(item.id).toLowerCase() === String(id).trim().toLowerCase());
  return match ? normalizeEquipment(match) : null;
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
 * Make an HTTP request to the MediShare backend API
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('medishare_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error(
        'Unable to connect to MediShare backend API server (http://localhost:5000). Please verify that the backend server is running on port 5000.'
      );
    }
    throw err;
  }
}

/**
 * Real API methods
 */
export const equipmentService = {
  /**
   * Fetch equipment catalog from backend database
   */
  async fetchEquipment({
    category = null,
    sharingType = null,
    availability = null,
    search = '',
    page = 1,
    limit = 50
  } = {}) {
    const params = new URLSearchParams();
    if (category && category !== 'All Categories') params.append('category', category);
    if (sharingType && sharingType !== 'all') params.append('sharingType', sharingType);
    if (availability && availability !== 'all') params.append('availability', availability);
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', page);
    params.append('limit', limit);

    try {
      const data = await request(`/equipment?${params.toString()}`);
      if (data.success && Array.isArray(data.equipment)) {
        return {
          success: true,
          equipment: data.equipment.map(normalizeEquipment),
          total: data.total || data.equipment.length,
          isFallback: false
        };
      }
      return { success: true, equipment: [], total: 0, isFallback: false };
    } catch (err) {
      console.warn('[EquipmentService] Backend fetch failed, falling back to local dataset:', err.message);
      // Resilient fallback
      let localItems = getAllEquipment();
      return {
        success: true,
        equipment: localItems,
        total: localItems.length,
        isFallback: true
      };
    }
  },

  /**
   * Fetch single equipment details by ID
   */
  async fetchEquipmentById(id) {
    try {
      const data = await request(`/equipment/${id}`);
      if (data.success && data.equipment) {
        return normalizeEquipment(data.equipment);
      }
      return null;
    } catch (err) {
      console.warn('[EquipmentService] Backend fetchById failed, falling back to local dataset:', err.message);
      return getEquipmentById(id);
    }
  },

  /**
   * Fetch equipment belonging to logged-in owner
   */
  async fetchOwnerEquipment() {
    const data = await request('/equipment/my/owner');
    if (data.success && Array.isArray(data.equipment)) {
      return data.equipment.map(normalizeEquipment);
    }
    return [];
  },

  /**
   * Create new equipment listing (Approved Owner only)
   */
  async createEquipment(payload) {
    return request('/equipment', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update existing equipment listing
   */
  async updateEquipment(id, payload) {
    return request(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Delete equipment listing
   */
  async deleteEquipment(id) {
    return request(`/equipment/${id}`, {
      method: 'DELETE'
    });
  }
};

/**
 * Filter and sort equipment items in-memory
 */
export function filterAndSortEquipment({
  items = null,
  query = '',
  category = 'All Categories',
  sharingType = 'all',
  availability = 'all',
  condition = 'All Conditions',
  sort = 'default'
} = {}) {
  let results = items ? [...items] : getAllEquipment();

  // 1. Text Search across name, category, description, service area, condition notes
  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery) {
    results = results.filter((item) => {
      const matchName = (item.name || '').toLowerCase().includes(trimmedQuery);
      const matchCategory = (item.category || '').toLowerCase().includes(trimmedQuery);
      const matchDesc = (item.description || '').toLowerCase().includes(trimmedQuery);
      const matchArea = (item.serviceArea || item.location || '').toLowerCase().includes(trimmedQuery);
      const matchCondition = (item.conditionDetails || '').toLowerCase().includes(trimmedQuery);
      return matchName || matchCategory || matchDesc || matchArea || matchCondition;
    });
  }

  // 2. Category Filter
  if (category && category !== 'All Categories') {
    results = results.filter((item) => {
      return (item.category || '').toLowerCase() === category.toLowerCase();
    });
  }

  // 3. Sharing Type Filter ('free' | 'rental' | 'donation')
  if (sharingType && sharingType !== 'all') {
    results = results.filter((item) => {
      return (item.sharingType || '').toLowerCase() === sharingType.toLowerCase();
    });
  }

  // 4. Availability Status Filter ('available' | 'unavailable')
  if (availability && availability !== 'all') {
    results = results.filter((item) => {
      return (item.availabilityStatus || '').toLowerCase() === availability.toLowerCase();
    });
  }

  // 5. Condition Filter ('Good' | 'Fair' | 'Needs Inspection')
  if (condition && condition !== 'All Conditions') {
    results = results.filter((item) => {
      return (item.condition || item.conditionGrade || '').toLowerCase() === condition.toLowerCase();
    });
  }

  // 6. Sorting
  if (sort === 'name-asc') {
    results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sort === 'name-desc') {
    results.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  } else if (sort === 'date-desc') {
    results.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
  } else if (sort === 'price-asc') {
    results.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sort === 'price-desc') {
    results.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sort === 'rating-desc') {
    results.sort((a, b) => ((b.owner && b.owner.rating) || 0) - ((a.owner && a.owner.rating) || 0));
  }

  return results;
}

export default equipmentService;
