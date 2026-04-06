# StayBoard Hotel PMS - Comprehensive Testing Checklist & Test Cases

**App Name**: StayBoard  
**Version**: v1.4  
**Last Updated**: 2026-04-06  
**Purpose**: Complete test coverage for boutique hotel, hostel, and vacation rental property management system

---

## 1. Dashboard & Analytics Testing

### 1.1 Global Search Functionality
- [ ] **Test**: Search for existing guest by full name
  - **Expected**: Guest record appears with booking details
  - **Actual**: 

- [ ] **Test**: Search for exis





ting guest by partial name
  - **Expected**: Partial matches return relevant guests
  - **Actual**: 

- [ ] **Test**: Search for room by room number
  - **Expected**: Room details displayed with current status
  - **Actual**: 

- [ ] **Test**: Search with special characters
  - **Expected**: Search handles special characters gracefully
  - **Actual**: 

- [ ] **Test**: Search with empty input
  - **Expected**: Either shows all records or displays placeholder message
  - **Actual**: 

- [ ] **Test**: Search returns no results
  - **Expected**: "No results found" message displayed
  - **Actual**: 

### 1.2 KPI Metrics Accuracy
- [ ] **Test**: Vacant rooms count matches actual vacant rooms in grid
  - **Expected**: Count = rooms with status 'Vacant'
  - **Actual**: 

- [ ] **Test**: Occupied rooms count is accurate
  - **Expected**: Count = rooms with status 'Occupied'
  - **Actual**: 

- [ ] **Test**: Arrivals today count matches today's check-in bookings
  - **Expected**: Count = bookings with check_in_date = today AND status = 'confirmed'
  - **Actual**: 

- [ ] **Test**: Departures today count matches today's check-out bookings
  - **Expected**: Count = bookings with check_out_date = today AND status = 'checked_in'
  - **Actual**: 

- [ ] **Test**: KPIs update in real-time after room status change
  - **Expected**: Counters refresh immediately
  - **Actual**: 

### 1.3 Revenue Overview Charts (Owner/Manager Role)
- [ ] **Test**: Occupancy percentage chart displays correctly
  - **Expected**: Calculation = (occupied_rooms / total_rooms) * 100
  - **Actual**: 

- [ ] **Test**: Revenue chart shows correct values
  - **Expected**: Sum of all invoices for selected period
  - **Actual**: 

- [ ] **Test**: Charts update when new booking created
  - **Expected**: Charts reflect new revenue immediately
  - **Actual**: 

- [ ] **Test**: Charts are role-restricted (hidden for Reception/Housekeeping)
  - **Expected**: Owner sees charts, others don't
  - **Actual**: 

### 1.4 Property Switcher
- [ ] **Test**: All managed properties display as cards
  - **Expected**: Shows BNB, Hostel, Airbnb properties
  - **Actual**: 

- [ ] **Test**: Clicking property switches to that property's dashboard
  - **Expected**: Dashboard updates to show selected property's data
  - **Actual**: 

- [ ] **Test**: Property data persists after switching back
  - **Expected**: Previous property data restored correctly
  - **Actual**: 

---

## 2. Property & Room Management Testing

### 2.1 Visual Grid Display
- [ ] **Test**: All rooms display in floor-wise layout
  - **Expected**: Rooms grouped by floor with correct ordering
  - **Actual**: 

- [ ] **Test**: Room status colors are correct and distinguishable
  - **Expected**: Vacant (green), Occupied (blue), Arriving (yellow), Checking Out (orange), Cleaning (gray), Maintenance (red)
  - **Actual**: 

- [ ] **Test**: Room grid is responsive on mobile
  - **Expected**: Scrollable grid on small screens
  - **Actual**: 

- [ ] **Test**: Room grid shows correct status for each room
  - **Expected**: Status matches database state
  - **Actual**: 

### 2.2 Room Statuses Workflow
- [ ] **Test**: Room starts in 'Vacant' status on creation
  - **Expected**: New room defaults to Vacant
  - **Actual**: 

- [ ] **Test**: Room transitions to 'Occupied' on check-in
  - **Expected**: Status updates from Arriving Today → Occupied
  - **Actual**: 

- [ ] **Test**: Room transitions to 'Checking Out Today' before departure
  - **Expected**: Correct status showing on departure date
  - **Actual**: 

- [ ] **Test**: Room transitions to 'Cleaning' after checkout
  - **Expected**: Status auto-updates to Cleaning
  - **Actual**: 

- [ ] **Test**: Room transitions to 'Vacant' after cleaning completion
  - **Expected**: Housekeeping marks complete → status becomes Vacant
  - **Actual**: 

- [ ] **Test**: Room can be manually marked as 'Maintenance'
  - **Expected**: Room unavailable for bookings while in maintenance
  - **Actual**: 

- [ ] **Test**: Room can transition out of 'Maintenance' back to 'Vacant'
  - **Expected**: Maintenance staff can mark room as ready
  - **Actual**: 

### 2.3 Room Drawer (Side-Panel)
- [ ] **Test**: Clicking room opens side drawer
  - **Expected**: Drawer slides in from right with room details
  - **Actual**: 

- [ ] **Test**: Room drawer displays room specs (number, type, floor, price)
  - **Expected**: All room information visible in drawer
  - **Actual**: 

- [ ] **Test**: Room drawer shows room history
  - **Expected**: Previous bookings/status changes listed
  - **Actual**: 

- [ ] **Test**: Edit room specs button works
  - **Expected**: Form opens to edit room properties
  - **Actual**: 

- [ ] **Test**: Assign tasks from room drawer
  - **Expected**: Can create cleaning/maintenance tasks
  - **Actual**: 

- [ ] **Test**: Closing drawer doesn't lose unsaved changes (with warning if applicable)
  - **Expected**: Warning shown if changes exist
  - **Actual**: 

- [ ] **Test**: Room drawer displays current guest info if occupied
  - **Expected**: Guest name, check-out date shown
  - **Actual**: 

---

## 3. Booking Engine & Inventory Testing

### 3.1 Smart Booking Modal - Multi-Step Flow
- [ ] **Test**: Booking modal opens with guest selection step
  - **Expected**: Step 1 shows guest lookup/creation form
  - **Actual**: 

- [ ] **Test**: Create new guest during booking
  - **Expected**: Guest added to database and linked to booking
  - **Actual**: 

- [ ] **Test**: Select existing guest for booking
  - **Expected**: Guest data pre-fills for booking
  - **Actual**: 

- [ ] **Test**: Move to Step 2 - Date Selection
  - **Expected**: Check-in and check-out dates can be selected
  - **Actual**: 

- [ ] **Test**: Check-out date cannot be before check-in date
  - **Expected**: Validation prevents invalid date range
  - **Actual**: 

- [ ] **Test**: Move to Step 3 - Room Selection
  - **Expected**: Available rooms for selected dates displayed
  - **Actual**: 

- [ ] **Test**: Room price calculation shows correctly
  - **Expected**: Base price + applicable pricing rules shown
  - **Actual**: 

- [ ] **Test**: Booking summary displays correct total
  - **Expected**: Total = (nightly_rate * num_nights) + taxes
  - **Actual**: 

- [ ] **Test**: Complete booking creates invoice automatically
  - **Expected**: Invoice generated on booking confirmation
  - **Actual**: 

### 3.2 Inventory Protection - Core Logic
- [ ] **Test**: Prevent overbooking of room type
  - **Scenario**: 5 Deluxe rooms exist, 4 already booked for dates
  - **Action**: Try to book 2 Deluxes for overlapping dates
  - **Expected**: System allows only 1 more Deluxe (total 5)
  - **Actual**: 

- [ ] **Test**: Prevent overbooking with multiple overlapping bookings
  - **Scenario**: 3 rooms of type 'Single' exist, bookings on: [Jan 1-3], [Jan 2-4], [Jan 3-5]
  - **Action**: Try to create 4th booking for Jan 2-3
  - **Expected**: Booking rejected - inventory exhausted
  - **Actual**: 

- [ ] **Test**: Unassigned (online) bookings counted in inventory
  - **Scenario**: Online booking reserves room_type 'Double' but doesn't assign specific room_id
  - **Action**: Try walk-in booking for same room_type same dates
  - **Expected**: Walk-in sees reduced availability, accounting for unassigned booking
  - **Actual**: 

- [ ] **Test**: Inventory recalculates on booking cancellation
  - **Scenario**: Booking cancelled
  - **Action**: Try new booking for freed dates
  - **Expected**: New booking succeeds - room type capacity restored
  - **Actual**: 

- [ ] **Test**: Inventory accurate across date ranges
  - **Scenario**: Different room types, overlapping bookings
  - **Action**: Create multiple bookings across property
  - **Expected**: `getAvailableRoomTypeCount()` returns accurate available count
  - **Actual**: 

### 3.3 Walk-in Bookings vs Online Bookings
- [ ] **Test**: Walk-in booking assigns specific room immediately
  - **Expected**: room_id is populated at creation
  - **Actual**: 

- [ ] **Test**: Online booking has no specific room (room_id = null)
  - **Expected**: Only room_type is stored initially
  - **Actual**: 

- [ ] **Test**: Online booking can later be assigned specific room
  - **Expected**: room_id can be populated during check-in
  - **Actual**: 

---

## 4. Room Shifting Testing

### 4.1 Room Shifting Core Functionality
- [ ] **Test**: Guest can be shifted to different room same category
  - **Scenario**: Guest booked in Double Room 201, shift to Double Room 301
  - **Expected**: Booking updated, guest moved, history recorded
  - **Actual**: 

- [ ] **Test**: Guest shifted to different room type updates booking
  - **Scenario**: Guest in 'Deluxe' shifted to 'Standard'
  - **Expected**: booking.room_type updates to 'Standard', price adjustment calculated
  - **Actual**: 

- [ ] **Test**: Housekeeping tasks follow room shift
  - **Scenario**: Guest booked for cleaning in Room 201, shifted to 201
  - **Expected**: Tasks reassigned to new room
  - **Actual**: 

- [ ] **Test**: Cannot shift to maintenance room
  - **Expected**: System prevents shift to rooms with status 'Maintenance'
  - **Actual**: 

- [ ] **Test**: Cannot shift to occupied room (by different guest)
  - **Expected**: Shift prevented - target room unavailable
  - **Actual**: 

- [ ] **Test**: Room shift history is logged
  - **Expected**: Room shift recorded in room history/audit log
  - **Actual**: 

### 4.2 Inventory Impact of Room Shifts
- [ ] **Test**: Shift within same room type doesn't affect inventory
  - **Expected**: Available count for room_type unchanged
  - **Actual**: 

- [ ] **Test**: Shift between different room types updates inventory correctly
  - **Scenario**: Shift from 5-room 'Double' pool to 3-room 'Suite' pool
  - **Expected**: Double availability +1, Suite availability -1
  - **Actual**: 

---

## 5. Calendar (Availability Timeline) Testing

### 5.1 30-Day Timeline Display
- [ ] **Test**: Calendar displays 30 consecutive days
  - **Expected**: Scrollable horizontal timeline from today to +30 days
  - **Actual**: 

- [ ] **Test**: All rooms appear as rows in calendar
  - **Expected**: Each room has its own row showing availability
  - **Actual**: 

- [ ] **Test**: Booked dates show visual markers
  - **Expected**: Booked slots show 'confirmed' or 'checked_in' status color
  - **Actual**: 

- [ ] **Test**: Maintenance blocks show correctly in calendar
  - **Expected**: Maintenance slots marked distinctly
  - **Actual**: 

- [ ] **Test**: Calendar updates in real-time on booking creation
  - **Expected**: New booking immediately visible in timeline
  - **Actual**: 

### 5.2 Quick Booking from Calendar
- [ ] **Test**: Click empty slot to create booking
  - **Expected**: Booking modal opens with date/room pre-filled
  - **Actual**: 

- [ ] **Test**: Quick booking respects inventory limits
  - **Expected**: Cannot book if no availability
  - **Actual**: 

- [ ] **Test**: Calendar slot updates after quick booking
  - **Expected**: Booked status visible immediately
  - **Actual**: 

### 5.3 Status Legends & Visual Indicators
- [ ] **Test**: Legend shows all status types
  - **Expected**: Confirmed, Checked-in, Maintenance states visible
  - **Actual**: 

- [ ] **Test**: Colors are high-contrast and distinguishable
  - **Expected**: All status colors easily differentiable
  - **Actual**: 

---

## 6. Financials & Invoicing Testing

### 6.1 Automated Invoice Generation
- [ ] **Test**: Invoice created on booking creation
  - **Expected**: Invoice generated immediately when booking confirmed
  - **Actual**: 

- [ ] **Test**: Invoice contains all required fields
  - **Expected**: Guest name, dates, room type, rates, taxes, total present
  - **Actual**: 

- [ ] **Test**: Invoice amount matches booking calculation
  - **Expected**: Invoice total = booking total_amount
  - **Actual**: 

### 6.2 Tax Calculation (GST/VAT)
- [ ] **Test**: GST applied correctly (assume 18%)
  - **Scenario**: Base rate $100, 2 nights
  - **Expected**: Tax = (100 * 2) * 0.18 = $36, Total = $236
  - **Actual**: 

- [ ] **Test**: Tax calculation with pricing rules applied
  - **Scenario**: Base $100 + 20% surge pricing, 2 nights, 18% GST
  - **Expected**: Subtotal = $120 * 2 = $240, Tax = $240 * 0.18 = $43.20, Total = $283.20
  - **Actual**: 

- [ ] **Test**: Tax exempt rooms (if applicable)
  - **Expected**: Tax not applied to exempt room types
  - **Actual**: 

### 6.3 Payment Tracking
- [ ] **Test**: Invoice shows full amount owed initially
  - **Expected**: Invoice status = 'Not Paid', amount_due = total
  - **Actual**: 

- [ ] **Test**: Partial payment reduces amount due
  - **Scenario**: Total $1000, payment $600 received
  - **Expected**: amount_due = $400, status = 'Partially Paid'
  - **Actual**: 

- [ ] **Test**: Full payment marks invoice as paid
  - **Expected**: Invoice status = 'Paid', amount_due = 0
  - **Actual**: 

- [ ] **Test**: Dashboard highlights rooms with 'Balance Due'
  - **Expected**: Rooms with unpaid invoices marked/flagged
  - **Actual**: 

- [ ] **Test**: Payment history recorded in invoice
  - **Expected**: All payment transactions logged with dates/amounts
  - **Actual**: 

---

## 7. Pricing & Rates Testing

### 7.1 Dynamic Pricing Rules
- [ ] **Test**: Create 'Surge' pricing rule
  - **Scenario**: 20% increase for all room types, specific dates
  - **Expected**: Pricing rule saved and applied to bookings in date range
  - **Actual**: 

- [ ] **Test**: Create 'Season' pricing rule
  - **Scenario**: 30% increase for 'Deluxe' rooms only, date range
  - **Expected**: Rule applies only to specified room type
  - **Actual**: 

- [ ] **Test**: Fixed amount pricing adjustment
  - **Scenario**: +$50 per night, specific dates
  - **Expected**: Base rate + $50 = new rate
  - **Actual**: 

- [ ] **Test**: Percentage pricing adjustment
  - **Scenario**: -15% discount, date range
  - **Expected**: New rate = base_rate * 0.85
  - **Actual**: 

- [ ] **Test**: Multiple overlapping pricing rules
  - **Scenario**: Surge rule (20%) + Season rule (15%) on same dates
  - **Expected**: Rules stack correctly (or highest wins, depending on logic)
  - **Actual**: 

- [ ] **Test**: Pricing rules apply only to specified dates
  - **Expected**: Booking before/after rule dates uses base rate
  - **Actual**: 

- [ ] **Test**: Pricing rules update invoice calculations
  - **Expected**: Invoice total reflects applied pricing rules
  - **Actual**: 

### 7.2 Room Type Blocking & Overbook Settings
- [ ] **Test**: Mark room type as 'Blocked' prevents new bookings
  - **Expected**: Room type unavailable for booking during block period
  - **Actual**: 

- [ ] **Test**: Mark room type as 'Overbooked' (if applicable)
  - **Expected**: Prevents inventory from being exceeded
  - **Actual**: 

- [ ] **Test**: Unblock room type restores bookability
  - **Expected**: Room type available for new bookings again
  - **Actual**: 

---

## 8. Housekeeping & Maintenance Testing

### 8.1 Task Migration on Room Shift
- [ ] **Test**: Housekeeping task follows guest to new room
  - **Scenario**: Cleaning task created for Room 101, guest shifted to Room 201
  - **Expected**: Task room_id updated to 201, task content preserved
  - **Actual**: 

- [ ] **Test**: Multiple tasks follow room shift
  - **Scenario**: Cleaning + maintenance task both assigned to Room 101
  - **Expected**: Both tasks migrated to new room
  - **Actual**: 

- [ ] **Test**: Completed tasks not affected by shift
  - **Scenario**: Task marked complete, then guest shifted
  - **Expected**: Completed task remains as history, not migrated
  - **Actual**: 

### 8.2 Room Status Auto-Sync
- [ ] **Test**: Room auto-transitions to 'Cleaning' on checkout
  - **Scenario**: Guest checks out at 11am
  - **Expected**: Room status changes from 'Checking Out Today' → 'Cleaning'
  - **Actual**: 

- [ ] **Test**: Housekeeping task auto-created on checkout
  - **Expected**: New cleaning task created in task queue
  - **Actual**: 

- [ ] **Test**: Room status updates to 'Vacant' when housekeeping completes task
  - **Expected**: Status auto-transitions
  - **Actual**: 

- [ ] **Test**: Status does not change if housekeeping marks as incomplete
  - **Expected**: Task status = 'On Hold' or similar, room stays 'Cleaning'
  - **Actual**: 

### 8.3 Housekeeping Dashboard
- [ ] **Test**: Housekeeping sees only their assigned tasks
  - **Expected**: Task list filtered to rooms they manage
  - **Actual**: 

- [ ] **Test**: Task status workflow: Pending → In Progress → Completed
  - **Expected**: User can change status through all states
  - **Actual**: 

- [ ] **Test**: Housekeeping can toggle room between 'Cleaning' and 'Vacant'
  - **Expected**: Button to mark room as ready (Inspected/Vacant)
  - **Actual**: 

- [ ] **Test**: Completed tasks appear in history
  - **Expected**: Historical task records maintained
  - **Actual**: 

### 8.4 Maintenance Operations
- [ ] **Test**: Mark room as 'Under Maintenance'
  - **Expected**: Room unavailable for booking, status changed
  - **Actual**: 

- [ ] **Test**: Document maintenance reason/description
  - **Expected**: Maintenance notes saved with room
  - **Actual**: 

- [ ] **Test**: Mark room complete after maintenance
  - **Expected**: Room transitions back to 'Vacant'
  - **Actual**: 

- [ ] **Test**: Cannot check in guests to maintenance rooms
  - **Expected**: System prevents check-in for maintenance rooms
  - **Actual**: 

---

## 9. Check-in/Check-out Workflow Testing

### 9.1 Check-in Process
- [ ] **Test**: Reception can check in arriving guest
  - **Expected**: Booking status changes from 'confirmed' → 'checked_in'
  - **Actual**: 

- [ ] **Test**: Check-in updates room status to 'Occupied'
  - **Expected**: Room status changes from 'Arriving Today' → 'Occupied'
  - **Actual**: 

- [ ] **Test**: Can collect outstanding balance at check-in
  - **Expected**: Payment can be recorded, invoice updated
  - **Actual**: 

- [ ] **Test**: Cannot check in without booking confirmation
  - **Expected**: System requires valid booking
  - **Actual**: 

- [ ] **Test**: Early check-in possible if room available
  - **Expected**: Guest can check in before scheduled date if room ready
  - **Actual**: 

### 9.2 Check-out Process
- [ ] **Test**: Reception can mark guest as checked out
  - **Expected**: Booking status changes from 'checked_in' → 'checked_out'
  - **Actual**: 

- [ ] **Test**: Check-out updates room status to 'Checking Out Today'
  - **Expected**: Intermediate status before cleaning
  - **Actual**: 

- [ ] **Test**: Finalize invoice on checkout
  - **Expected**: Any remaining balance calculated and presented
  - **Actual**: 

- [ ] **Test**: Housekeeping task created automatically on checkout
  - **Expected**: Cleaning task added to housekeeping queue
  - **Actual**: 

- [ ] **Test**: Late checkout possible with additional charge
  - **Expected**: System calculates late checkout fee if applicable
  - **Actual**: 

---

## 10. Role-Based Access Control Testing

### 10.1 Owner (Superadmin) Permissions
- [ ] **Test**: Owner can access all properties
  - **Expected**: All properties visible in property switcher
  - **Actual**: 

- [ ] **Test**: Owner can view financial reports
  - **Expected**: Revenue/occupancy charts visible
  - **Actual**: 

- [ ] **Test**: Owner can manage pricing rules
  - **Expected**: Can create/edit/delete pricing rules
  - **Actual**: 

- [ ] **Test**: Owner can access all user roles' features
  - **Expected**: Owner has superset of all permissions
  - **Actual**: 

### 10.2 Reception (Front Desk) Permissions
- [ ] **Test**: Reception can create bookings
  - **Expected**: Booking modal accessible
  - **Actual**: 

- [ ] **Test**: Reception can perform check-in/check-out
  - **Expected**: Check-in/checkout buttons available
  - **Actual**: 

- [ ] **Test**: Reception can view calendar/timeline
  - **Expected**: Availability view accessible
  - **Actual**: 

- [ ] **Test**: Reception cannot access financial reports
  - **Expected**: Revenue charts hidden/restricted
  - **Actual**: 

- [ ] **Test**: Reception cannot access pricing management
  - **Expected**: Pricing rule creation disabled
  - **Actual**: 

### 10.3 Housekeeping Permissions
- [ ] **Test**: Housekeeping can only see Housekeeping dashboard
  - **Expected**: Dashboard tab visible, other tabs restricted
  - **Actual**: 

- [ ] **Test**: Housekeeping can update task status
  - **Expected**: Task status buttons available
  - **Actual**: 

- [ ] **Test**: Housekeeping cannot create bookings
  - **Expected**: Booking functionality hidden
  - **Actual**: 

- [ ] **Test**: Housekeeping cannot access financial data
  - **Expected**: Invoices/payment info hidden
  - **Actual**: 

### 10.4 Maintenance Staff Permissions
- [ ] **Test**: Maintenance can mark rooms as 'Under Maintenance'
  - **Expected**: Maintenance controls available
  - **Actual**: 

- [ ] **Test**: Maintenance can document repair issues
  - **Expected**: Description/notes fields present
  - **Actual**: 

- [ ] **Test**: Maintenance cannot modify bookings
  - **Expected**: Booking edit restricted
  - **Actual**: 

---

## 11. Data Validation Testing

### 11.1 Guest Information Validation
- [ ] **Test**: Email validation on guest creation
  - **Expected**: Invalid emails rejected
  - **Actual**: 

- [ ] **Test**: Phone number validation
  - **Expected**: Valid phone format required
  - **Actual**: 

- [ ] **Test**: Required fields marked mandatory
  - **Expected**: Form prevents submission without required fields
  - **Actual**: 

- [ ] **Test**: Guest name allows special characters
  - **Expected**: Names like "O'Brien", "Müller" accepted
  - **Actual**: 

### 11.2 Booking Data Validation
- [ ] **Test**: Check-in date must be today or future
  - **Expected**: Past dates rejected
  - **Actual**: 

- [ ] **Test**: Check-out date must be after check-in
  - **Expected**: Same-day checkout rejected, validation message shown
  - **Actual**: 

- [ ] **Test**: Minimum stay requirement enforced (if applicable)
  - **Expected**: Bookings shorter than minimum rejected
  - **Actual**: 

- [ ] **Test**: Room selection required before booking confirmation
  - **Expected**: Booking cannot complete without room assignment
  - **Actual**: 

### 11.3 Room Data Validation
- [ ] **Test**: Room number must be unique per property
  - **Expected**: Duplicate room numbers rejected
  - **Actual**: 

- [ ] **Test**: Base price must be positive number
  - **Expected**: Zero/negative prices rejected
  - **Actual**: 

- [ ] **Test**: Room type selection required
  - **Expected**: Cannot create room without type
  - **Actual**: 

---

## 12. localStorage Persistence Testing

### 12.1 Data Persistence
- [ ] **Test**: Bookings persist after page refresh
  - **Expected**: Created bookings still present
  - **Actual**: 

- [ ] **Test**: Room status persists after refresh
  - **Expected**: Room states maintained
  - **Actual**: 

- [ ] **Test**: Pricing rules persist after refresh
  - **Expected**: Created rules still active
  - **Actual**: 

- [ ] **Test**: Clear browser cache clears all data
  - **Expected**: localStorage cleared, app reset
  - **Actual**: 

---

## 13. Performance & Load Testing

### 13.1 Large Dataset Handling
- [ ] **Test**: Display 50+ rooms without lag
  - **Expected**: Grid renders smoothly
  - **Actual**: 

- [ ] **Test**: Search with 1000+ guests in database
  - **Expected**: Search completes in < 500ms
  - **Actual**: 

- [ ] **Test**: Calendar with 100+ bookings
  - **Expected**: Timeline renders without delay
  - **Actual**: 

- [ ] **Test**: Generate invoice with complex pricing rules
  - **Expected**: Calculation completes instantly
  - **Actual**: 

### 13.2 Animation Performance
- [ ] **Test**: Room drawer animation smooth (Framer Motion)
  - **Expected**: 60fps, no jank
  - **Actual**: 

- [ ] **Test**: Status transition animations smooth
  - **Expected**: Color/status changes animated smoothly
  - **Actual**: 

---

## 14. Responsive Design Testing

### 14.1 Mobile (320px - 480px)
- [ ] **Test**: Dashboard accessible on mobile
  - **Expected**: KPI metrics stack vertically, readable
  - **Actual**: 

- [ ] **Test**: Room grid scrollable on mobile
  - **Expected**: Horizontal/vertical scrolling works
  - **Actual**: 

- [ ] **Test**: Booking modal functional on mobile
  - **Expected**: All steps accessible, buttons clickable
  - **Actual**: 

- [ ] **Test**: Touch interactions work (tap to open drawer)
  - **Expected**: Touch events register correctly
  - **Actual**: 

### 14.2 Tablet (768px - 1024px)
- [ ] **Test**: Layout adapts for tablet width
  - **Expected**: 2-column grid for rooms instead of 3
  - **Actual**: 

- [ ] **Test**: Calendar readable on tablet
  - **Expected**: Timeline scrollable but legible
  - **Actual**: 

### 14.3 Desktop (1024px+)
- [ ] **Test**: Optimal layout on widescreen
  - **Expected**: Max-width 1600px container centered
  - **Actual**: 

- [ ] **Test**: Charts fully visible on desktop
  - **Expected**: Full revenue/occupancy charts displayed
  - **Actual**: 

---

## 15. Error Handling & Edge Cases

### 15.1 Network/API Errors
- [ ] **Test**: Handle failed booking submission
  - **Expected**: Error message displayed, booking not saved
  - **Actual**: 

- [ ] **Test**: Retry mechanism for failed operations
  - **Expected**: User can retry failed action
  - **Actual**: 

### 15.2 Concurrent Operations
- [ ] **Test**: Two users booking same room simultaneously
  - **Expected**: Only first booking succeeds, second rejected
  - **Actual**: 

- [ ] **Test**: Room shift while guest checking in
  - **Expected**: Operations queued or conflict handled gracefully
  - **Actual**: 

### 15.3 Boundary Conditions
- [ ] **Test**: Booking for 365+ day stay
  - **Expected**: System handles extended stays
  - **Actual**: 

- [ ] **Test**: Property with single room
  - **Expected**: Inventory protection works with min room count
  - **Actual**: 

- [ ] **Test**: Pricing rule with 0% adjustment
  - **Expected**: No change to base rate
  - **Actual**: 

---

## 16. Browser Compatibility Testing

### 16.1 Chrome
- [ ] **Test**: All features work in Chrome
  - **Expected**: Full functionality
  - **Actual**: 

### 16.2 Firefox
- [ ] **Test**: All features work in Firefox
  - **Expected**: Full functionality
  - **Actual**: 

### 16.3 Safari
- [ ] **Test**: All features work in Safari
  - **Expected**: Full functionality
  - **Actual**: 

### 16.4 Edge
- [ ] **Test**: All features work in Edge
  - **Expected**: Full functionality
  - **Actual**: 

---

## 17. Accessibility Testing

### 17.1 Keyboard Navigation
- [ ] **Test**: Tab through all form fields
  - **Expected**: Logical tab order
  - **Actual**: 

- [ ] **Test**: Enter key submits forms
  - **Expected**: Forms submittable via keyboard
  - **Actual**: 

- [ ] **Test**: Escape key closes modals
  - **Expected**: Modal closes on ESC
  - **Actual**: 

### 17.2 Screen Reader Compatibility
- [ ] **Test**: Room status colors described in text
  - **Expected**: Aria labels for color-coded elements
  - **Actual**: 

- [ ] **Test**: Buttons labeled for screen readers
  - **Expected**: All buttons have descriptive text
  - **Actual**: 

### 17.3 Color Contrast
- [ ] **Test**: Status color contrast ratio >= 4.5:1
  - **Expected**: WCAG AA compliance
  - **Actual**: 

- [ ] **Test**: Text readable against backgrounds
  - **Expected**: High contrast maintained
  - **Actual**: 

---

## 18. Regression Testing Checklist

After each deployment, verify:
- [ ] Dashboard KPIs accurate
- [ ] Bookings creation works
- [ ] Room shifting functional
- [ ] Inventory protection active
- [ ] Invoicing automated
- [ ] Pricing rules apply correctly
- [ ] Housekeeping tasks migrate
- [ ] Check-in/out functional
- [ ] All roles access appropriate features
- [ ] Responsive design intact
- [ ] localStorage persistence working
- [ ] No console errors
- [ ] No performance degradation

---

## 19. Sign-Off

| Phase | Status | Tester | Date | Notes |
|-------|--------|--------|------|-------|
| Functional Testing | ⬜ Not Started | | | |
| Integration Testing | ⬜ Not Started | | | |
| Performance Testing | ⬜ Not Started | | | |
| Security Testing | ⬜ Not Started | | | |
| Accessibility Testing | ⬜ Not Started | | | |
| Browser Compatibility | ⬜ Not Started | | | |
| **FINAL APPROVAL** | ⬜ Pending | | | |

---

**Document Metadata**:  
*Generated for*: StayBoard v1.4  
*Total Test Cases*: 200+  
*Coverage Areas*: 19 categories  
*Last Updated*: 2026-04-06  
*Status*: Ready for Testing
