import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

export const EQUIPMENT_SEED_DATA = [
  {
    name: 'Drive Medical Lightweight Folding Wheelchair (18" Seat)',
    category: 'Wheelchairs',
    description: 'Foldable lightweight steel wheelchair with swing-away footrests, smooth-rolling 24-inch rear wheels, and padded armrests. Sanitized and ready for post-surgery rehabilitation or elderly mobility assistance.',
    imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
    serviceArea: 'North Campus District, Metro',
    sharingType: 'free',
    price: 0,
    availabilityStatus: 'available',
    condition: 'Good',
    conditionDetails: 'Frame is structurally sound with no cracks or welds. Push rims and spokes are aligned. Dual parking handbrakes hold firmly.',
    knownDamage: 'Minor superficial cosmetic scratches on the outer hand-rims; structural integrity is fully intact.',
    gallery: [
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Invacare Heavy-Duty Standard Wheelchair',
    category: 'Wheelchairs',
    description: 'Durable chrome-plated carbon steel wheelchair built for long-term reliability. Features embossed vinyl upholstery for easy cleaning, solid rubber puncture-proof tires, and rear wheel locks.',
    imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80',
    serviceArea: 'Central Hospital Zone, Metro',
    sharingType: 'rental',
    price: 60,
    availabilityStatus: 'available',
    condition: 'Good',
    conditionDetails: 'Solid tires show normal minimal tread wear. Dual crossbrace frame operates smoothly without resistance. Upholstery sanitized with hospital-grade disinfectant.',
    knownDamage: 'None documented.',
    gallery: [
      'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Pediatric Lightweight Tilt-in-Space Wheelchair',
    category: 'Wheelchairs',
    description: 'Specialized pediatric mobility chair offering adjustable tilt angles (up to 45 degrees) for pressure redistribution and postural support. Fully adjustable pelvic positioning belt and lateral head supports included.',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    serviceArea: 'West Suburbs Community Care, Metro',
    sharingType: 'donation',
    price: 0,
    availabilityStatus: 'available',
    condition: 'Good',
    conditionDetails: 'Gas-spring tilt mechanism functions smoothly with secure lock. Headrest and pelvic support pads inspected and sanitized.',
    knownDamage: 'None documented.',
    gallery: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Folding Aluminum Four-Wheel Rollator Walker with Seat',
    category: 'Mobility Aids & Walkers',
    description: 'High-grade anodized aluminum rollator with 7.5-inch non-marring wheels, ergonomic loop-lock handbrakes, padded fold-up backrest, and under-seat storage pouch.',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    serviceArea: 'North Campus District, Metro',
    sharingType: 'free',
    price: 0,
    availabilityStatus: 'available',
    condition: 'Good',
    conditionDetails: 'Brake cables adjusted and tension tested. Wheels turn freely without wobble. Locking mechanism holds firmly in unfolded position.',
    knownDamage: 'Slight discoloration on the lower crossbar from gentle outdoor use.',
    gallery: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Standard Dual-Release Folding Walker',
    category: 'Mobility Aids & Walkers',
    description: 'Sturdy 1-inch aluminum tubular walker with dual-button release mechanism for easy one-finger folding. Features non-slip rubber grip handles and durable rubber tips.',
    imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80',
    serviceArea: 'South Metro Extension',
    sharingType: 'free',
    price: 0,
    availabilityStatus: 'available',
    condition: 'Good',
    conditionDetails: 'Rubber tips show even contact with floor. Push buttons click securely into place at all height adjustment settings.',
    knownDamage: 'None documented.',
    gallery: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Steerable All-Terrain Knee Walker / Scooter',
    category: 'Mobility Aids & Walkers',
    description: 'Ergonomic alternative to crutches for individuals recovering from foot, ankle, or Achilles tendon surgery. Features steerable handlebars, dual braking system, and contoured contoured knee cushion.',
    imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
    serviceArea: 'East Industrial Corridor, Metro',
    sharingType: 'rental',
    price: 45,
    availabilityStatus: 'available',
    condition: 'Good',
    conditionDetails: 'Tie-rod steering mechanism operates with precision. Knee platform vinyl is unpunctured and hygienic. Handbrakes calibrated.',
    knownDamage: 'Minor scratches on the front bumper plate.',
    gallery: [
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Aluminum Underarm Crutches (Pair - Adult Medium)',
    category: 'Mobility Aids & Walkers',
    description: 'Lightweight extruded aluminum underarm crutches with push-button height and handgrip adjustments. Fitted with high-traction jumbo rubber tips and shock-absorbing underarm pads.',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    serviceArea: 'North Campus District, Metro',
    sharingType: 'free',
    price: 0,
    availabilityStatus: 'available',
    condition: 'Good',
    conditionDetails: 'Height pins lock tightly without slip. Pads are clean with no cracks in rubber. Ideal for post-fracture recovery.',
    knownDamage: 'Slight adhesive residue from an earlier identification label; completely cleaned and disinfected.',
    gallery: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Semi-Fowler 2-Function Adjustable Hospital Bed',
    category: 'Hospital Beds',
    description: 'Two-function manual medical bed with smooth screw-crank mechanism for backrest elevation (0-75 degrees) and knee-break elevation (0-45 degrees). Includes collapsible aluminum alloy side safety rails.',
    imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
    serviceArea: 'Central Hospital Zone, Metro',
    sharingType: 'rental',
    price: 120,
    availabilityStatus: 'available',
    condition: 'Good',
    conditionDetails: 'Crank spindles greased and turn with smooth resistance. Fold-down side rails lock securely in the upright position. 5-inch medical casters lock firmly.',
    knownDamage: 'None documented.',
    gallery: [
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Philips Respironics EverFlo 5L Oxygen Concentrator',
    category: 'Respiratory Equipment',
    description: 'Compact 5-liter per minute continuous flow stationary oxygen concentrator for home respiratory support. Quiet operation (<45 dBA) with integrated purity sensor indicator.',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    serviceArea: 'Central Hospital Zone, Metro',
    sharingType: 'rental',
    price: 150,
    availabilityStatus: 'available',
    condition: 'Good',
    conditionDetails: 'Intake filter replaced fresh. Flow meter valve turns smoothly and holds steady at 0.5-5.0 L/min. Oxygen purity light indicates nominal output.',
    knownDamage: 'None documented.',
    gallery: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    name: 'Contec Multi-Parameter Patient Monitor (CMS8000)',
    category: 'Monitoring Devices',
    description: '12.1-inch color TFT display monitoring ECG, HR, SpO2, NIBP, Respiration, and dual temperature. Suitable for intensive home monitoring under physician guidance.',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    serviceArea: 'Central Hospital Zone, Metro',
    sharingType: 'rental',
    price: 110,
    availabilityStatus: 'available',
    condition: 'Good',
    conditionDetails: 'Display backlight bright and free of dead pixels. Audible and visual alarm thresholds verified. NIBP pump inflates cuff correctly without pressure leakage.',
    knownDamage: 'None documented.',
    gallery: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

export async function seedEquipment() {
  console.log('[SEED EQUIPMENT] Checking equipment catalog in database...');
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database
  });

  try {
    const [countRes] = await conn.query('SELECT COUNT(*) as cnt FROM equipment');
    if (countRes[0].cnt > 0) {
      console.log(`[SEED EQUIPMENT] Equipment catalog already populated (${countRes[0].cnt} items). Skipping seed.`);
      return;
    }

    // Find the owner user ID (St. Jude partner)
    const [owners] = await conn.query("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
    if (owners.length === 0) {
      console.warn('[SEED EQUIPMENT] No owner user found to associate equipment with. Skipping.');
      return;
    }
    const ownerId = owners[0].id;

    for (const item of EQUIPMENT_SEED_DATA) {
      const [insertRes] = await conn.query(
        `INSERT INTO equipment (
          owner_id, name, category, description, condition_grade,
          condition_details, known_damage, sharing_type, price_per_day,
          availability_status, service_area, image_url, moderation_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ownerId,
          item.name,
          item.category,
          item.description,
          item.condition,
          item.conditionDetails,
          item.knownDamage,
          item.sharingType,
          item.price,
          item.availabilityStatus,
          item.serviceArea,
          item.imageUrl,
          'approved'
        ]
      );

      const equipmentId = insertRes.insertId;

      // Seed gallery media
      if (item.gallery && item.gallery.length > 0) {
        for (const photoUrl of item.gallery) {
          await conn.query(
            `INSERT INTO equipment_media (equipment_id, media_type, file_url, stage)
             VALUES (?, 'image', ?, 'gallery')`,
            [equipmentId, photoUrl]
          );
        }
      }
      console.log(`[SEED EQUIPMENT] Inserted: ${item.name} (ID: ${equipmentId})`);
    }

    console.log('[SEED EQUIPMENT] Equipment catalog successfully populated.');
  } finally {
    await conn.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seedEquipment.js')) {
  seedEquipment()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
