
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const PEACE_ID = '010';
const STARRY_ID = '011';

async function applyLayoutStrict() {
  console.log('Applying strict layout (fixed v3 with UUIDs)...');

  const layouts = {
    [PEACE_ID]: [
      { number: '101', floor: 1 }, { number: '102', floor: 1 },
      { number: '201', floor: 2 }, { number: '202', floor: 2 },
      { number: '301', floor: 3 }, { number: '302', floor: 3 },
      { number: '401', floor: 4 }, { number: '402', floor: 4 }
    ],
    [STARRY_ID]: [
      { number: '1', floor: 1 }, { number: '2', floor: 1 },
      { number: '3', floor: 2 }, { number: '4', floor: 2 },
      { number: '5', floor: 3 }, { number: '6', floor: 3 },
      { number: '7', floor: 4 },
      { number: 'Bed 1', floor: 0 }, { number: 'Bed 2', floor: 0 },
      { number: 'Bed 3', floor: 0 }, { number: 'Bed 4', floor: 0 },
      { number: 'Bed 5', floor: 0 }, { number: 'Bed 6', floor: 0 },
      { number: 'Bed 7', floor: 0 }, { number: 'Bed 8', floor: 0 }
    ]
  };

  for (const [propId, rooms] of Object.entries(layouts)) {
    console.log(`Clearing and resetting property ${propId}...`);
    
    // 1. Get current rooms
    const { data: existing } = await supabase.from('rooms').select('id, room_number').eq('property_id', propId);
    const existingMap = {};
    if (existing) {
      existing.forEach(r => { existingMap[r.room_number] = r.id; });
    }

    // 2. Prepare operations
    for (const r of rooms) {
      const roomData = {
        property_id: propId,
        room_number: r.number,
        floor: r.floor,
        room_type: r.number.toLowerCase().includes('bed') ? 'dorm' : 'deluxe',
        status: 'vacant',
        base_price: r.number.toLowerCase().includes('bed') ? 500 : 1500,
        max_occupancy: r.number.toLowerCase().includes('bed') ? 1 : 2
      };

      if (existingMap[r.number]) {
        // Update
        const { error } = await supabase.from('rooms').update(roomData).eq('id', existingMap[r.number]);
        if (error) console.error(`Error updating room ${r.number}:`, error.message);
      } else {
        // Insert with new UUID
        roomData.id = crypto.randomUUID();
        const { error } = await supabase.from('rooms').insert([roomData]);
        if (error) console.error(`Error inserting room ${r.number}:`, error.message);
      }
    }
    
    console.log(`Synchronized ${rooms.length} rooms for ${propId}`);
    
    // 3. Update property total count
    await supabase.from('properties').update({ total_rooms: rooms.length }).eq('id', propId);
  }

  console.log('Done.');
}

applyLayoutStrict();
