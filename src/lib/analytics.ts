import { Booking, Room, Invoice } from '@/types';
import { isWithinInterval, subDays, startOfDay, endOfDay, parseISO, isAfter, isBefore, format } from 'date-fns';

export interface RevenueMetrics {
  totalRevenue: number;
  adr: number;
  revpar: number;
  occupancy: number;
  bookingsCount: number;
  roomNights: number;
  comparison: {
    revenueGrowth: number;
    occupancyGrowth: number;
  };
}

export const calculateIndustrialMetrics = (
  bookings: Booking[],
  rooms: Room[],
  invoices: Invoice[],
  startDate: Date,
  endDate: Date
): RevenueMetrics => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const daysInPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  const totalAvailableRoomNights = rooms.length * daysInPeriod;

  // 1. Current Period Data
  const periodInvoices = invoices.filter(inv => {
    const date = parseISO(inv.created_at || '');
    return isWithinInterval(date, { start: startDate, end: endDate });
  });

  const periodBookings = bookings.filter(b => {
    const date = parseISO(b.check_in_date);
    return isWithinInterval(date, { start: startDate, end: endDate }) && b.status !== 'cancelled';
  });

  const totalRevenue = periodInvoices.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);
  const roomNights = periodBookings.length;
  
  const occupancy = totalAvailableRoomNights > 0 
    ? (roomNights / totalAvailableRoomNights) * 100 
    : 0;

  const adr = roomNights > 0 ? totalRevenue / roomNights : 0;
  
  const revpar = totalAvailableRoomNights > 0 
    ? totalRevenue / totalAvailableRoomNights 
    : 0;

  // 2. Comparison Period (Previous same duration)
  const prevStartDate = subDays(startDate, daysInPeriod);
  const prevEndDate = subDays(endDate, daysInPeriod);

  const prevInvoices = invoices.filter(inv => {
    const date = parseISO(inv.created_at || '');
    return isWithinInterval(date, { start: prevStartDate, end: prevEndDate });
  });

  const prevBookings = bookings.filter(b => {
    const date = parseISO(b.check_in_date);
    return isWithinInterval(date, { start: prevStartDate, end: prevEndDate }) && b.status !== 'cancelled';
  });

  const prevRevenue = prevInvoices.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);
  const prevRoomNights = prevBookings.length;
  const prevOccupancy = totalAvailableRoomNights > 0 
    ? (prevRoomNights / totalAvailableRoomNights) * 100 
    : 0;

  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const occupancyGrowth = prevOccupancy > 0 ? ((occupancy - prevOccupancy) / prevOccupancy) * 100 : 0;

  return {
    totalRevenue,
    adr,
    revpar,
    occupancy,
    bookingsCount: periodBookings.length,
    roomNights,
    comparison: {
      revenueGrowth,
      occupancyGrowth
    }
  };
};

export const getRevenueForecast = (bookings: Booking[], roomsCount: number) => {
  const today = startOfDay(new Date());
  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = endOfDay(subDays(today, -i));
    const activeOnDate = bookings.filter(b => {
      const checkIn = startOfDay(parseISO(b.check_in_date));
      const checkOut = startOfDay(parseISO(b.check_out_date));
      return isWithinInterval(date, { start: checkIn, end: checkOut }) && b.status !== 'cancelled';
    });

    const revenue = activeOnDate.reduce((sum, b) => sum + (Number(b.total_amount) / (Math.max(1, (new Date(b.check_out_date).getTime() - new Date(b.check_in_date).getTime()) / (1000 * 60 * 60 * 24)))), 0);

    return {
      date: format(date, 'MMM dd'),
      revenue,
      occupancy: (activeOnDate.length / Math.max(1, roomsCount)) * 100
    };
  });

  return next7Days;
};
