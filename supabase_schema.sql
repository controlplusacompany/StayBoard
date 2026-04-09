-- CREATE TABLES FOR STAYBOARD PMS

-- 1. Owners Table
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  business_name TEXT,
  plan TEXT DEFAULT 'free',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Properties Table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  total_rooms INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rooms Table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  floor INTEGER DEFAULT 1,
  max_occupancy INTEGER DEFAULT 2,
  base_price NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'vacant',
  staff_notes TEXT,
  last_status_change TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, room_number)
);

-- 4. Guests Table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_type TEXT,
  id_number TEXT,
  total_stays INTEGER DEFAULT 1,
  total_spent NUMERIC(10, 2) DEFAULT 0,
  last_stay_date TIMESTAMPTZ,
  notes TEXT,
  is_vip BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, phone)
);

-- 5. Bookings Table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_id_type TEXT,
  guest_id_number TEXT,
  check_in_date TIMESTAMPTZ NOT NULL,
  check_out_date TIMESTAMPTZ NOT NULL,
  num_guests INTEGER DEFAULT 1,
  price_per_night NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  payment_method TEXT,
  upi_ref TEXT,
  booking_source TEXT DEFAULT 'walk_in',
  status TEXT DEFAULT 'confirmed',
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Housekeeping Tasks Table
CREATE TABLE housekeeping_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  assigned_to TEXT,
  task_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  due_by TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Invoices Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount_total NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'issued',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  method TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Rate Rules Table
CREATE TABLE rate_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  room_type TEXT,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'room_only',
  include_tax BOOLEAN DEFAULT FALSE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  adjustment_type TEXT, -- percentage, fixed
  adjustment_value NUMERIC(10, 2),
  days_of_week INTEGER[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_rules ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES (Users can only see/edit their own data)
CREATE POLICY "Users can view their own profile" ON owners FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON owners FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Owners can view their own properties" ON properties FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owners can view their own rooms" ON rooms FOR ALL USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = rooms.property_id AND properties.owner_id = auth.uid()));
CREATE POLICY "Owners can view their own guests" ON guests FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owners can view their own bookings" ON bookings FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owners can view their own tasks" ON housekeeping_tasks FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owners can view their own invoices" ON invoices FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owners can view their own payments" ON payments FOR ALL USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = payments.invoice_id AND invoices.owner_id = auth.uid()));
CREATE POLICY "Owners can view their own rate rules" ON rate_rules FOR ALL USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = rate_rules.property_id AND properties.owner_id = auth.uid()));
