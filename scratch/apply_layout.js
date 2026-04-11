
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const PEACE_ID = '010';
const STARRY_ID = '011';

async function applyLayout() {
  console.log('Applying new layout...');

  // 1. The Peace Layout
  const peaceRooms = [
    { number: '101', floor: '1' }, { number: '102', floor: '1' },
    { number: '201', floor: '2' }, { number: '202', floor: '2' },
    { number: '301', floor: '3' }, { number: '302', floor: '3' },
    { number: '401', floor: '4' }, { number: '402', floor: '4' }
  ];

  // 2. Starry Nights Layout
  const starryRooms = [
    { number: '1', floor: '1' }, { number: '2', floor: '1' },
    { number: '3', floor: '2' }, { number: '4', floor: '2' },
    { number: '5', floor: '3' }, { number: '6', floor: '3' },
    { number: '7', floor: '4' },
    { number: 'Bed 1', floor: 'Dorm' }, { number: 'Bed 2', floor: 'Dorm' },
    { number: 'Bed 3', floor: 'Dorm' }, { number: 'Bed 4', floor: 'Dorm' },
    { number: 'Bed 5', floor: 'Dorm' }, { number: 'Bed 6', floor: 'Dorm' },
    { number: 'Bed 7', floor: 'Dorm' }, { number: 'Bed 8', floor: 'Dorm' }
  ];

  async function processProperty(propertyId, layouts) {
    console.log(`Processing property ${propertyId}...`);
    // Get existing rooms
    const { data: existing } = await supabase.from('rooms').select('*').eq('property_id', propertyId);
    
    // We will update existing ones as much as possible, then add/delete
    const toUpdate = [];
    const toInsert = [];
    
    layouts.forEach((layout, index) => {
      if (existing[index]) {
        toUpdate.push({
          id: existing[index].id,
          room_number: layout.number,
          floor: layout.floor,
          type: layout.number.toLowerCase().includes('bed') ? 'dorm' : 'deluxe',
          status: 'vacant'
        });
      } else {
        toInsert.push({
          property_id: propertyId,
          room_number: layout.number,
          floor: layout.floor,
          type: layout.number.toLowerCase().includes('bed') ? 'dorm' : 'deluxe',
          status: 'vacant',
          base_price: layout.number.toLowerCase().includes('bed') ? 500 : 1500,
          owner_id: '00000000-0000-0000-0000-000000000000'
        });
      }
    });

    // Update
    for (const room of toUpdate) {
      await supabase.from('rooms').update(room).eq('id', room.id);
    }
    // Insert
    if (toInsert.length > 0) {
      await supabase.from('rooms').insert(toInsert);
    }

    // Delete leftovers if no bookings exist (safe approach)
    if (existing.length > layouts.length) {
      const leftoverIds = existing.slice(layouts.length).map(r => r.id);
      console.log(`Checking for bookings in leftover rooms: ${leftoverIds.join(', ')}`);
      const { data: bks } = await supabase.from('bookings').select('room_id').in('room_id', leftoverIds);
      const roomsWithBookings = new Set(bks?.map(b => b.room_id) || []);
      const toDelete = leftoverIds.filter(id => !roomsWithBookings.has(id));
      
      if (toDelete.length > 0) {
        await supabase.from('rooms').delete().in('id', toDelete);
        console.log(`Deleted ${toDelete.length} unused rooms.`);
      }
    }
  }

  await processProperty(PEACE_ID, peaceRooms);
  await processProperty(STARRY_ID, starryRooms);
  
  // Update total_rooms in properties table
  await supabase.from('properties').update({ total_rooms: peaceRooms.length }).eq('id', PEACE_ID);
  await supabase.from('properties').update({ total_rooms: starryRooms.length }).eq('id', STARRY_ID);

  console.log('Layout applied successfully.');
}

applyLayout();
