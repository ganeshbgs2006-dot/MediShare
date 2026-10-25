/**
 * Sample Medical Equipment Demonstration Dataset
 * NOTE: For academic and demonstration purposes only.
 * No real user data, medical claims, or actual item availability is implied.
 */

export const SAMPLE_EQUIPMENT_CATEGORIES = [
  {
    id: 'mobility',
    name: 'Mobility Aids',
    description: 'Wheelchairs, motorized power chairs, walkers, rollators, and knee scooters.',
    iconName: 'Accessibility',
    itemCount: 28
  },
  {
    id: 'respiratory',
    name: 'Respiratory Support',
    description: 'Oxygen concentrators, BiPAP/CPAP systems, pulse oximeters, and nebulizers.',
    iconName: 'Wind',
    itemCount: 19
  },
  {
    id: 'beds',
    name: 'Hospital Beds & Mattresses',
    description: 'Manual and semi-electric adjustable hospital beds, alternating pressure mattresses.',
    iconName: 'Bed',
    itemCount: 14
  },
  {
    id: 'monitoring',
    name: 'Vital Monitoring',
    description: 'Multi-parameter patient monitors, digital blood pressure units, ECG monitors.',
    iconName: 'Activity',
    itemCount: 16
  },
  {
    id: 'rehab',
    name: 'Rehabilitation & Daily Care',
    description: 'Patient transfer lifts, shower chairs, commodes, and physical therapy aids.',
    iconName: 'HeartHandshake',
    itemCount: 22
  },
  {
    id: 'pediatric',
    name: 'Pediatric Care',
    description: 'Specialized youth wheelchairs, pediatric standing frames, and postural supports.',
    iconName: 'Baby',
    itemCount: 8
  }
];

export const SAMPLE_FEATURED_EQUIPMENT = [
  {
    id: 'eq-001',
    title: 'Drive Medical Lightweight Wheelchair (18" Seat)',
    category: 'Mobility Aids',
    categoryId: 'mobility',
    sharingType: 'free', // 'free' | 'rental' | 'donation'
    sharingLabel: 'Free Community Lending',
    pricePerDay: 0,
    condition: 'Excellent',
    conditionScore: 9.6,
    location: 'North Campus District, Metro',
    availabilityStatus: 'available',
    owner: {
      name: 'St. Jude Community Health Cell',
      isVerified: true,
      rating: 4.9,
      reviewCount: 38
    },
    imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
    description: 'Foldable lightweight steel wheelchair with swing-away footrests, puncture-proof wheels, and padded armrests. Sanitized and ready for post-surgery rehabilitation.',
    features: ['Foldable Frame (31 lbs)', 'Swing-away Footrests', 'Dual Handbrakes', 'Max weight: 250 lbs']
  },
  {
    id: 'eq-002',
    title: 'Philips Respironics EverFlo 5L Oxygen Concentrator',
    category: 'Respiratory Support',
    categoryId: 'respiratory',
    sharingType: 'rental',
    sharingLabel: 'Care Rental (Non-Profit)',
    pricePerDay: 120, // nominal maintenance fee in INR/currency
    condition: 'Good (Checked)',
    conditionScore: 9.1,
    location: 'Civil Hospital Zone, Central',
    availabilityStatus: 'available',
    owner: {
      name: 'Dr. Aris Thorne (Care Partner)',
      isVerified: true,
      rating: 5.0,
      reviewCount: 24
    },
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    description: 'Continuous flow 0.5 to 5.0 LPM oxygen concentrator. Equipped with oxygen percentage indicator, low power consumption, and ultra-quiet motor. Sanitized filters installed.',
    features: ['Continuous Flow (0.5-5 LPM)', 'Integrated OPI Alarm', 'Sound Level < 45 dBA', 'Dual Bacterial Filters']
  },
  {
    id: 'eq-003',
    title: 'Semi-Fowler 2-Function Electric Hospital Bed',
    category: 'Hospital Beds & Mattresses',
    categoryId: 'beds',
    sharingType: 'free',
    sharingLabel: 'Free Community Lending',
    pricePerDay: 0,
    condition: 'Excellent',
    conditionScore: 9.8,
    location: 'Greenwood South Clinic',
    availabilityStatus: 'available',
    owner: {
      name: 'Hope Elder Care Foundation',
      isVerified: true,
      rating: 4.8,
      reviewCount: 42
    },
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    description: 'Adjustable backrest and knee elevations with handheld wired remote control. Includes collapsible aluminum safety side rails and IV pole attachment.',
    features: ['Backrest & Knee Tilt', 'Collapsible Safety Rails', 'Lockable Swivel Castors', 'Medical Grade Mattress']
  },
  {
    id: 'eq-004',
    title: 'Contec Multi-Parameter Vital Signs Patient Monitor',
    category: 'Vital Monitoring',
    categoryId: 'monitoring',
    sharingType: 'donation',
    sharingLabel: 'Permanent Donation',
    pricePerDay: 0,
    condition: 'Good',
    conditionScore: 8.8,
    location: 'Westside Community Center',
    availabilityStatus: 'available',
    owner: {
      name: 'Rotary Community Outreach',
      isVerified: true,
      rating: 4.9,
      reviewCount: 19
    },
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
    description: '12.1" high-resolution color TFT display. Monitored parameters: ECG, SpO2, NIBP, Respiration, and Temperature. Ideal for home ICU step-down monitoring.',
    features: ['5-Lead ECG Cable', 'Adult & Pediatric SpO2 Sensor', 'Blood Pressure Cuff', 'Audible & Visual Alarms']
  },
  {
    id: 'eq-005',
    title: 'All-Terrain Steerable Knee Walker Scooter',
    category: 'Mobility Aids',
    categoryId: 'mobility',
    sharingType: 'free',
    sharingLabel: 'Free Community Lending',
    pricePerDay: 0,
    condition: 'Excellent',
    conditionScore: 9.4,
    location: 'East Park Healthcare Hub',
    availabilityStatus: 'borrowed', // sample item in active booking
    owner: {
      name: 'Anita Verma (Equipment Owner)',
      isVerified: true,
      rating: 4.7,
      reviewCount: 15
    },
    imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80',
    description: 'Crutch alternative for foot, ankle, or lower leg injury rehabilitation. Tool-free height adjustments, padded knee platform, and basket for personal belongings.',
    features: ['Steerable Tie-Rod Mechanism', 'Dual Rear Disc Brakes', 'Detachable Wire Basket', 'Indoor/Outdoor Rubber Wheels']
  },
  {
    id: 'eq-006',
    title: 'Heavy Duty Alternating Air Pressure Mattress & Pump',
    category: 'Hospital Beds & Mattresses',
    categoryId: 'beds',
    sharingType: 'rental',
    sharingLabel: 'Care Rental (Non-Profit)',
    pricePerDay: 40,
    condition: 'Excellent',
    conditionScore: 9.5,
    location: 'North Campus District, Metro',
    availabilityStatus: 'available',
    owner: {
      name: 'St. Jude Community Health Cell',
      isVerified: true,
      rating: 4.9,
      reviewCount: 38
    },
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    description: 'Anti-decubitus bubble pad with ultra-quiet electric compressor. Distributes pressure periodically to prevent and manage bedsore stages I and II.',
    features: ['130 Bubble Air Cells', 'Ultra-Quiet < 30dB Pump', 'Waterproof PVC Material', 'End Flaps for Bed Securing']
  }
];

export const IMPACT_METRICS = [
  {
    id: 'accessible',
    tag: 'Community Access',
    title: 'Making Equipment More Accessible',
    description: 'Connecting recovering patients and families with essential recovery devices within their local neighborhoods.'
  },
  {
    id: 'sharing',
    tag: 'Peer-To-Peer Care',
    title: 'Supporting Community Sharing',
    description: 'Enabling local owners, clinics, and donors to share idle equipment safely without commercial barriers.'
  },
  {
    id: 'reuse',
    tag: 'Sustainability',
    title: 'Encouraging Responsible Reuse',
    description: 'Extending the functional lifecycle of durable healthcare equipment to minimize unnecessary waste.'
  },
  {
    id: 'condition',
    tag: 'Safety Checklists',
    title: 'Documenting Equipment Condition',
    description: 'Promoting dual-party handover and return inspection checklists to build trust across every exchange.'
  }
];

