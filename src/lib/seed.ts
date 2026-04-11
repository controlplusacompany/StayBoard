import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cveorgfvnwipedxviwfq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2ZW9yZ2Z2bndpcGVkeHZpd2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDkyMzksImV4cCI6MjA5MTMyNTIzOX0.oGZDTg2ERs_Z0p16P-V85cCRP36OjW_m2UJ-i7IbXDA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEFAULT_PROPERTIES = [
  { id: '010', name: 'The Peace', type: 'bnb', address: 'Riverside Road' },
  { id: '011', name: 'Starry Nights', type: 'hostel', address: 'Mountain View' },
];

const DEFAULT_ROOMS = [
  // The Peace (010) - 8 Rooms
  { id: '010-101', property_id: '010', room_number: '101', status: 'vacant', base_price: 1500, floor: 1, max_occupancy: 2 },
  { id: '010-102', property_id: '010', room_number: '102', status: 'vacant', base_price: 1500, floor: 1, max_occupancy: 2 },
  { id: '010-201', property_id: '010', room_number: '201', status: 'vacant', base_price: 2500, floor: 2, max_occupancy: 2 },
  { id: '010-202', property_id: '010', room_number: '202', status: 'vacant', base_price: 2500, floor: 2, max_occupancy: 2 },
  { id: '010-203', property_id: '010', room_number: '203', status: 'vacant', base_price: 2500, floor: 2, max_occupancy: 2 },
  { id: '010-301', property_id: '010', room_number: '301', status: 'vacant', base_price: 3500, floor: 3, max_occupancy: 4 },
  { id: '010-302', property_id: '010', room_number: '302', status: 'vacant', base_price: 1500, floor: 3, max_occupancy: 2 },
  { id: '010-303', property_id: '010', room_number: '303', status: 'vacant', base_price: 1500, floor: 3, max_occupancy: 2 },

  // Starry Nights (011) - 6 Rooms
  { id: '011-1', property_id: '011', room_number: '1', status: 'vacant', base_price: 800, floor: 1, max_occupancy: 1 },
  { id: '011-2', property_id: '011', room_number: '2', status: 'vacant', base_price: 800, floor: 1, max_occupancy: 1 },
  { id: '011-3', property_id: '011', room_number: '3', status: 'vacant', base_price: 1800, floor: 2, max_occupancy: 2 },
  { id: '011-4', property_id: '011', room_number: '4', status: 'vacant', base_price: 1800, floor: 2, max_occupancy: 2 },
  { id: '011-5', property_id: '011', room_number: '5', status: 'vacant', base_price: 1800, floor: 2, max_occupancy: 2 },
  { id: '011-6', property_id: '011', room_number: '6', status: 'vacant', base_price: 1800, floor: 2, max_occupancy: 2 }
];

async function seed() {
  console.log('--- Starting Cloud Sync ---');

  // 1. Sync Properties
  const { data: existingProps } = await supabase.from('properties').select('id');
  const existingPropIds = new Set(existingProps?.map(p => p.id) || []);
  
  const propsToInsert = DEFAULT_PROPERTIES.filter(p => !existingPropIds.has(p.id));
  if (propsToInsert.length > 0) {
    console.log(`Inserting ${propsToInsert.length} properties...`);
    await supabase.from('properties').insert(propsToInsert);
  }

  // 2. Sync Rooms
  const { data: existingRooms } = await supabase.from('rooms').select('id');
  const existingRoomIds = new Set(existingRooms?.map(r => r.id) || []);
  
  const roomsToInsert = DEFAULT_ROOMS.filter(r => !existingRoomIds.has(r.id));
  if (roomsToInsert.length > 0) {
    console.log(`Inserting ${roomsToInsert.length} rooms...`);
    await supabase.from('rooms').insert(roomsToInsert);
  }

  console.log('--- Cloud Sync Complete ---');
}

seed();
