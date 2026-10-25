/**
 * MediShare Equipment Dataset
 *
 * NOTE: Sample listings are shown for illustration and testing.
 * All records, service areas, availability states, and partner profiles are illustrative.
 * Condition records reflect physical visual checks and do not represent biomedical safety certifications.
 */

export const EQUIPMENT_CATEGORIES = [
  'All Categories',
  'Wheelchairs',
  'Mobility Aids & Walkers',
  'Hospital Beds',
  'Respiratory Equipment',
  'Monitoring Devices',
  'Other Assistive Equipment'
];

export const SHARING_TYPES = [
  { value: 'all', label: 'All Sharing Types' },
  { value: 'free', label: 'Free Lending' },
  { value: 'rental', label: 'Paid Rental' },
  { value: 'donation', label: 'Donation' }
];

export const AVAILABILITY_STATUSES = [
  { value: 'all', label: 'All Availability' },
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Currently Unavailable' }
];

export const CONDITION_OPTIONS = [
  'All Conditions',
  'Good',
  'Fair',
  'Needs Inspection'
];

export const SORT_OPTIONS = [
  { value: 'default', label: 'Default (Featured)' },
  { value: 'date-desc', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' }
];

export const DEMO_EQUIPMENT_DATA = [
  {
    id: 'eq-001',
    name: 'Drive Medical Lightweight Folding Wheelchair (18" Seat)',
    category: 'Wheelchairs',
    description: 'Foldable lightweight steel wheelchair with swing-away footrests, smooth-rolling 24-inch rear wheels, and padded armrests. Sanitized and ready for post-surgery rehabilitation or elderly mobility assistance.',
    imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'North Campus District, Metro',
    sharingType: 'free',
    sharingLabel: 'Free Lending',
    price: 0,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Good',
    conditionDetails: 'Frame is structurally sound with no cracks or welds. Push rims and spokes are aligned. Dual parking handbrakes hold firmly.',
    knownDamage: 'Minor superficial cosmetic scratches on the outer hand-rims; structural integrity is fully intact.',
    includedAccessories: [
      'Swing-away detachable footrests',
      'Padded armrests',
      'Adjustable safety lap belt',
      'Foldable frame carry handles'
    ],
    checklist: [
      { item: 'Structural Frame', status: 'Passed', notes: 'No cracks, bends, or weld fractures' },
      { item: 'Braking System', status: 'Passed', notes: 'Dual hand parking brakes engage firmly' },
      { item: 'Tires & Spokes', status: 'Passed', notes: '24-inch solid rubber tires with clean alignment' },
      { item: 'Upholstery & Hygiene', status: 'Passed', notes: 'Disinfected with medical-grade sanitizer' },
      { item: 'Footrest Latches', status: 'Passed', notes: 'Swing-away latches lock and release smoothly' }
    ],
    ownerName: 'St. Jude Community Health Cell (Care Partner)',
    ownerType: 'Community Health Clinic',
    ownerRating: 4.9,
    reviewCount: 38,
    isDemoRecord: true,
    createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 'eq-002',
    name: 'Invacare Heavy-Duty Standard Wheelchair',
    category: 'Wheelchairs',
    description: 'Durable chrome-plated carbon steel wheelchair built for long-term reliability. Features embossed vinyl upholstery for easy cleaning, solid rubber puncture-proof tires, and rear wheel locks.',
    imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'Central Hospital Zone, Metro',
    sharingType: 'rental',
    sharingLabel: 'Paid Rental',
    price: 60,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Good',
    conditionDetails: 'Solid tires show normal minimal tread wear. Dual crossbrace frame operates smoothly without resistance. Upholstery sanitized with hospital-grade disinfectant.',
    knownDamage: 'None documented.',
    includedAccessories: [
      'Elevating padded leg rests',
      'Washable padded seat cushion',
      'Spoke guard reflectors'
    ],
    checklist: [
      { item: 'Structural Crossbrace', status: 'Passed', notes: 'Smooth folding without binding' },
      { item: 'Wheel Bearings', status: 'Passed', notes: 'Free-rolling with zero wobble' },
      { item: 'Handbrakes', status: 'Passed', notes: 'Holds safely on 10-degree incline' },
      { item: 'Leg Rest Elevators', status: 'Passed', notes: 'Ratchets hold multiple angles firmly' }
    ],
    ownerName: 'Metro Health Outreach (Care Partner)',
    ownerType: 'Non-Profit Care Provider',
    ownerRating: 4.8,
    reviewCount: 22,
    isDemoRecord: true,
    createdAt: '2026-10-18T11:30:00Z'
  },
  {
    id: 'eq-003',
    name: 'Pediatric Lightweight Tilt-in-Space Wheelchair',
    category: 'Wheelchairs',
    description: 'Specialized youth wheelchair providing adjustable tilt-in-space postural positioning for children with neurological conditions or spinal support needs. Equipped with 5-point safety harness and contoured headrest.',
    imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'Westside Community Hub',
    sharingType: 'donation',
    sharingLabel: 'Donation',
    price: 0,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Fair',
    conditionDetails: 'Mechanical tilt mechanism locks securely into all four positions. Padding is intact and firm. Suitable for indoor and smooth outdoor paved pathways.',
    knownDamage: 'Slight fabric fraying on the lower edge of the left pelvic harness strap; buckle latches firmly.',
    includedAccessories: [
      'Contoured pediatric headrest',
      'Lateral trunk postural supports',
      'Padded 5-point chest harness',
      'Anti-tipper rear caster bars'
    ],
    checklist: [
      { item: 'Tilt Lock Mechanism', status: 'Passed', notes: '4 tilt positions lock securely' },
      { item: 'Safety Harness', status: 'Passed', notes: 'Buckles latch and unlatch properly' },
      { item: 'Anti-Tipper Wheels', status: 'Passed', notes: 'Rear anti-tippers properly positioned' }
    ],
    ownerName: 'Pediatric Rehabilitation Guild (Care Partner)',
    ownerType: 'Pediatric Clinic Circle',
    ownerRating: 4.9,
    reviewCount: 15,
    isDemoRecord: true,
    createdAt: '2026-10-02T11:00:00Z'
  },
  {
    id: 'eq-004',
    name: 'Folding Aluminum Four-Wheel Rollator with Padded Seat',
    category: 'Mobility Aids & Walkers',
    description: 'Lightweight four-wheel rolling walker featuring ergonomic height-adjustable handgrips, responsive loop handbrakes, a padded seat with curved backrest, and an under-seat storage pouch for medication and belongings.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'Greenwood South Sector',
    sharingType: 'free',
    sharingLabel: 'Free Lending',
    price: 0,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Good',
    conditionDetails: '7.5-inch non-marring rubber wheels roll smoothly. Cable brakes engage and park securely on both sides. Folding latch locks securely.',
    knownDamage: 'None documented.',
    includedAccessories: [
      'Removable under-seat zippered pouch',
      'Fold-down padded curved backrest',
      'Cane holder clip'
    ],
    checklist: [
      { item: 'Loop Handbrakes', status: 'Passed', notes: 'Locks wheels completely when parked' },
      { item: 'Handle Height Pins', status: 'Passed', notes: 'Buttons click cleanly into all holes' },
      { item: 'Seat Platform', status: 'Passed', notes: 'Holds body weight without flexion' }
    ],
    ownerName: 'Greenwood Senior Center (Care Partner)',
    ownerType: 'Senior Community Centre',
    ownerRating: 4.7,
    reviewCount: 29,
    isDemoRecord: true,
    createdAt: '2026-10-20T14:15:00Z'
  },
  {
    id: 'eq-005',
    name: 'Standard Dual-Release Folding Walker (Wheelless)',
    category: 'Mobility Aids & Walkers',
    description: 'Anodized 1-inch aluminum folding walker designed for maximum stability during early post-operative recovery or lower limb fractures. Two-button release mechanism allows independent side-folding.',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'East Park Community Circle',
    sharingType: 'donation',
    sharingLabel: 'Donation',
    price: 0,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Fair',
    conditionDetails: 'Frame is rigid and straight. Push-button height adjustments click securely across all 8 height settings. Vinyl contoured handgrips are clean.',
    knownDamage: 'Front bottom rubber caps show exterior scuff marks from outdoor pavement use; grip remains firm.',
    includedAccessories: [
      'Pre-installed non-skid rubber feet tips (set of 4)',
      'Side pouch attachment for water bottle'
    ],
    checklist: [
      { item: 'Aluminum Tubing', status: 'Passed', notes: 'Zero bends; rigid load support' },
      { item: 'Push-Button Release', status: 'Passed', notes: 'Folds easily for storage' },
      { item: 'Rubber Tips', status: 'Passed', notes: 'Minor wear; non-slip traction verified' }
    ],
    ownerName: 'Community Donor Rajesh K. (Care Partner)',
    ownerType: 'Individual Community Donor',
    ownerRating: 4.8,
    reviewCount: 9,
    isDemoRecord: true,
    createdAt: '2026-10-10T16:00:00Z'
  },
  {
    id: 'eq-006',
    name: 'Steerable All-Terrain Knee Walker Recovery Scooter',
    category: 'Mobility Aids & Walkers',
    description: 'Modern mobility scooter alternative to crutches for individuals recovering from foot, ankle, Achilles tendon, or lower leg injury. Features a contoured padded knee platform and dual rear brakes.',
    imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'Civil Hospital Zone, Central',
    sharingType: 'rental',
    sharingLabel: 'Paid Rental',
    price: 80,
    availabilityStatus: 'unavailable',
    availabilityLabel: 'Currently Unavailable',
    condition: 'Good',
    conditionDetails: 'Steering tie-rod linkage is tight and responsive. Contoured knee cushion retains shape without depression.',
    knownDamage: 'None documented.',
    includedAccessories: [
      'Detachable front wire basket',
      'Contoured memory foam knee platform cushion',
      'Tool-free height adjustment lock knobs'
    ],
    checklist: [
      { item: 'Steering Mechanism', status: 'Passed', notes: 'Smooth pivot without play' },
      { item: 'Rear Disc Brakes', status: 'Passed', notes: 'Instant stopping power' },
      { item: 'Knee Platform Pad', status: 'Passed', notes: 'Sanitized foam with secure bracket' }
    ],
    ownerName: 'City Recovery Aid Cell (Care Partner)',
    ownerType: 'Recovery Aid Organization',
    ownerRating: 4.7,
    reviewCount: 18,
    isDemoRecord: true,
    createdAt: '2026-10-05T10:00:00Z'
  },
  {
    id: 'eq-007',
    name: 'Aluminum Underarm Crutches (Pair — Adult Medium 5\'2" to 5\'10")',
    category: 'Mobility Aids & Walkers',
    description: 'Lightweight push-button adjustable underarm crutches constructed from durable anodized aluminum. Designed with cushioned underarm pads, ergonomic handgrips, and jumbo non-skid rubber tips.',
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'North Campus District, Metro',
    sharingType: 'free',
    sharingLabel: 'Free Lending',
    price: 0,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Good',
    conditionDetails: 'Independent push-pin adjustments for overall height and handgrip position work cleanly. Underarm foam cushions sanitized.',
    knownDamage: 'None documented.',
    includedAccessories: [
      'Shock-absorbing underarm foam pads (pair)',
      'Ergonomic handgrips (pair)',
      'Heavy-duty non-slip rubber tips (pair)'
    ],
    checklist: [
      { item: 'Height Pin Locks', status: 'Passed', notes: 'Positive latch on both crutches' },
      { item: 'Rubber Tips', status: 'Passed', notes: 'Full tread remaining; pliable grip' },
      { item: 'Underarm Cushions', status: 'Passed', notes: 'Sanitized and tear-free' }
    ],
    ownerName: 'Campus Sports Physical Clinic (Care Partner)',
    ownerType: 'Sports & Orthopedic Clinic',
    ownerRating: 4.9,
    reviewCount: 31,
    isDemoRecord: true,
    createdAt: '2026-10-22T08:30:00Z'
  },
  {
    id: 'eq-008',
    name: 'Ergonomic Forearm Crutches with Closed Cuff (Pair)',
    category: 'Mobility Aids & Walkers',
    description: 'European-style forearm crutches with contoured anatomical grips and flexible pivoting forearm cuffs. Provides superior wrist support and natural gait alignment for long-term rehabilitation.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'Westside Community Hub',
    sharingType: 'donation',
    sharingLabel: 'Donation',
    price: 0,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Fair',
    conditionDetails: 'Arm cuffs and handgrips are solid. Height-lock collets screw tightly without rattling.',
    knownDamage: 'Superficial paint scratches on lower telescoping shaft; no structural bending.',
    includedAccessories: [
      'Pivoting full forearm cuffs',
      'Heavy-duty shock-absorbing flex-rubber tips',
      'Built-in safety night reflectors'
    ],
    checklist: [
      { item: 'Forearm Cuff Hinges', status: 'Passed', notes: 'Pivots smoothly without play' },
      { item: 'Collet Nut Locks', status: 'Passed', notes: 'Tightens silent and secure' }
    ],
    ownerName: 'Rotary Care Volunteer Circle (Care Partner)',
    ownerType: 'Community Volunteer Group',
    ownerRating: 4.8,
    reviewCount: 14,
    isDemoRecord: true,
    createdAt: '2026-10-12T13:45:00Z'
  },
  {
    id: 'eq-009',
    name: 'Semi-Fowler 2-Function Adjustable Hospital Bed',
    category: 'Hospital Beds',
    description: 'Manual crank-adjustable medical hospital bed offering backrest elevation up to 75 degrees and knee rest elevation up to 40 degrees. Features collapsible aluminum protective side rails and lockable swivel casters.',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'Central Hospital Zone, Metro',
    sharingType: 'rental',
    sharingLabel: 'Paid Rental',
    price: 150,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Good',
    conditionDetails: 'Both mechanical screw handles rotate smoothly. Frame is welded epoxy powder-coated steel. Caster footbrakes engage firmly.',
    knownDamage: 'None documented.',
    includedAccessories: [
      'Waterproof multi-density medical mattress with zippered cover',
      'Collapsible aluminum alloy side guard rails (pair)',
      'Telescopic stainless steel IV infusion pole stand',
      'Four 5-inch swivel casters with independent diagonal brakes'
    ],
    checklist: [
      { item: 'Backrest Crank Mechanism', status: 'Passed', notes: 'Elevates to 75° smoothly' },
      { item: 'Knee-Rest Crank Mechanism', status: 'Passed', notes: 'Elevates to 40° with firm support' },
      { item: 'Side Safety Rails', status: 'Passed', notes: 'Drop and latch securely' },
      { item: 'Caster Diagonal Brakes', status: 'Passed', notes: 'Locks bed firmly against rolling' }
    ],
    ownerName: 'Hope Elder Foundation (Care Partner)',
    ownerType: 'Palliative & Elder Care Foundation',
    ownerRating: 5.0,
    reviewCount: 42,
    isDemoRecord: true,
    createdAt: '2026-10-14T09:20:00Z'
  },
  {
    id: 'eq-010',
    name: 'Heavy Duty Alternating Air Pressure Mattress & Compressor Pump',
    category: 'Hospital Beds',
    description: 'Anti-decubitus bubble air mattress with quiet electric compressor pump designed for the prevention and care of pressure ulcers (bedsores) in bed-bound patients. Cycles air pressure across 130 air cells every 6 minutes.',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'North Campus District, Metro',
    sharingType: 'rental',
    sharingLabel: 'Paid Rental',
    price: 40,
    availabilityStatus: 'unavailable',
    availabilityLabel: 'Currently Unavailable',
    condition: 'Needs Inspection',
    conditionDetails: 'Returned recently following a 4-week recovery loan. Mattress pad has been sanitized, but is undergoing scheduled 24-hour pressure-retention verification before next loan.',
    knownDamage: 'Minor surface discoloration on outer compressor housing; electrical cord is intact with grounded plug.',
    includedAccessories: [
      'Variable-pressure electric air pump (< 35 dB)',
      'Flexible silicone connecting hoses',
      'Emergency puncture patch and adhesive kit',
      'End flap extensions for mattress tuck-in'
    ],
    checklist: [
      { item: 'Electric Pump Cycle', status: 'Passed', notes: '6-minute cycle runs quietly' },
      { item: 'Air Hoses & Flaps', status: 'Passed', notes: 'No kinks or cracks' },
      { item: 'Pressure Retention Audit', status: 'Needs Inspection', notes: '24-hour scheduled holding check in progress' }
    ],
    ownerName: 'St. Jude Community Health Cell (Care Partner)',
    ownerType: 'Community Health Clinic',
    ownerRating: 4.9,
    reviewCount: 38,
    isDemoRecord: true,
    createdAt: '2026-10-08T15:10:00Z'
  },
  {
    id: 'eq-011',
    name: 'Philips Respironics EverFlo 5L Home Oxygen Concentrator',
    category: 'Respiratory Equipment',
    description: 'Compact continuous-flow oxygen concentrator producing 0.5 to 5.0 LPM oxygen for in-home respiratory support. Features an internal Oxygen Purity Indicator (OPI) alarm, low sound emission (< 45 dBA), and low energy consumption.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'Greenwood South Sector',
    sharingType: 'rental',
    sharingLabel: 'Paid Rental',
    price: 120,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Good',
    conditionDetails: 'Flowmeter ball adjusts smoothly across 0.5–5.0 LPM range. Internal sieve canisters and bacterial intake filter checked and sanitized.',
    knownDamage: 'None documented.',
    includedAccessories: [
      'Humidifier bottle attachment tubing',
      'Grounded AC power cable (10 ft)',
      'New sealed bacterial intake filter'
    ],
    checklist: [
      { item: 'Flowmeter Float Ball', status: 'Passed', notes: 'Calibrated across 0.5 - 5.0 LPM' },
      { item: 'OPI Purity Alarm', status: 'Passed', notes: 'Green LED active; purity > 93%' },
      { item: 'Intake Filter', status: 'Passed', notes: 'Fresh intake filter installed and sealed' },
      { item: 'Acoustic Sound Level', status: 'Passed', notes: 'Measured < 45 dBA at 1 meter' }
    ],
    ownerName: 'Dr. Aris Thorne Outreach (Care Partner)',
    ownerType: 'Physician Outreach Partner',
    ownerRating: 5.0,
    reviewCount: 26,
    isDemoRecord: true,
    createdAt: '2026-10-19T10:00:00Z'
  },
  {
    id: 'eq-012',
    name: 'ResMed AirSense 10 AutoSet CPAP Device',
    category: 'Respiratory Equipment',
    description: 'Auto-adjusting CPAP machine with integrated HumidAir heated humidifier and ClimateLineAir heated tube. Quiet Easy-Breathe motor ensures peaceful sleep therapy.',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'Central Hospital Zone, Metro',
    sharingType: 'rental',
    sharingLabel: 'Paid Rental',
    price: 90,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Good',
    conditionDetails: 'Motor run hours: 320 hrs. Water tub clean with no mineral buildup. Pressure response tested on clinical manometer.',
    knownDamage: 'None documented.',
    includedAccessories: [
      'Heated HumidAir water chamber tub',
      'SlimLine flexible tubing',
      'AC power adapter and travel bag'
    ],
    checklist: [
      { item: 'Pressure Calibration', status: 'Passed', notes: 'Auto-titrating pressure verified' },
      { item: 'Heated Humidifier Plate', status: 'Passed', notes: 'Warms correctly to set comfort levels' },
      { item: 'Water Chamber Cleanliness', status: 'Passed', notes: 'Sterilized and free of scaling' }
    ],
    ownerName: 'Respiratory Care Clinic (Care Partner)',
    ownerType: 'Pulmonary Care Clinic',
    ownerRating: 4.9,
    reviewCount: 19,
    isDemoRecord: true,
    createdAt: '2026-10-21T09:15:00Z'
  },
  {
    id: 'eq-013',
    name: 'Contec Multi-Parameter Patient Monitor (ECG, SpO2, NIBP)',
    category: 'Monitoring Devices',
    description: '12.1-inch color TFT display monitoring vital signs for step-down home recovery. Parameters: 5-lead ECG waveform, digital pulse oximetry (SpO2), non-invasive blood pressure (NIBP), and skin surface temperature.',
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'Westside Community Hub',
    sharingType: 'donation',
    sharingLabel: 'Donation',
    price: 0,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Fair',
    conditionDetails: 'Color TFT screen is crisp with no dead pixels. Internal rechargeable battery holds ~90 minutes runtime on full charge.',
    knownDamage: 'Minor scuffing on top carry handle molding; all connectors and display glass are pristine.',
    includedAccessories: [
      'Adult finger clip SpO2 optical sensor',
      '5-lead ECG snap cable leads',
      'Reusable adult NIBP arm cuff and hose',
      'Grounded hospital-grade power cable'
    ],
    checklist: [
      { item: 'Color Display & Waveforms', status: 'Passed', notes: 'Crisp sweep with zero artifacts' },
      { item: 'SpO2 Sensor Sensitivity', status: 'Passed', notes: 'Reads pulse and oxygen accurately' },
      { item: 'NIBP Inflation Pump', status: 'Passed', notes: 'Smooth cuff inflation and leak test passed' },
      { item: 'Alarm Audio & Flasher', status: 'Passed', notes: 'Audible and visual threshold warnings functional' }
    ],
    ownerName: 'Rotary Care Volunteer Circle (Care Partner)',
    ownerType: 'Community Volunteer Group',
    ownerRating: 4.8,
    reviewCount: 14,
    isDemoRecord: true,
    createdAt: '2026-10-16T14:00:00Z'
  },
  {
    id: 'eq-014',
    name: 'Medical Shower & Bath Transfer Chair with Back and Armrests',
    category: 'Other Assistive Equipment',
    description: 'Rust-proof anodized aluminum bathroom safety chair providing stable seating inside tubs or showers. Textured non-slip seat surface with drainage holes, padded removable arm supports, and large suction rubber feet.',
    imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
    ],
    serviceArea: 'East Park Community Circle',
    sharingType: 'free',
    sharingLabel: 'Free Lending',
    price: 0,
    availabilityStatus: 'available',
    availabilityLabel: 'Available',
    condition: 'Good',
    conditionDetails: 'Frame is corrosion-free. Suction feet adhere firmly to wet floor tiles. Removable armrests click in and out effortlessly.',
    knownDamage: 'None documented.',
    includedAccessories: [
      'Padded waterproof removable armrests',
      'Contoured backrest support bar',
      'Wide suction-cup anti-slip rubber feet'
    ],
    checklist: [
      { item: 'Frame Stability', status: 'Passed', notes: 'Rated up to 300 lbs; zero wobble' },
      { item: 'Suction Feet Traction', status: 'Passed', notes: 'Grips wet ceramic tiles securely' },
      { item: 'Hygiene & Cleanliness', status: 'Passed', notes: 'Sanitized seat with antimicrobial spray' }
    ],
    ownerName: 'Caregiver Cooperative (Care Partner)',
    ownerType: 'Caregiver Support Group',
    ownerRating: 4.9,
    reviewCount: 35,
    isDemoRecord: true,
    createdAt: '2026-10-21T12:00:00Z'
  }
];
