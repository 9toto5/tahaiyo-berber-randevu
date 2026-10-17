export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'staff' | 'customer';
  staffId?: string;
};

export type StaffService = {
  serviceId: string;
  price: number;
  duration: number;
  enabled: boolean;
};

export type WorkingHours = {
  day: number;
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
};

export type Leave = { id: string; date: string; endDate: string; reason: string };

export type Staff = {
  id: string;
  name: string;
  title: string;
  initials: string;
  color: string;
  bio: string;
  services: StaffService[];
  hours: WorkingHours[];
  leaves: Leave[];
};

export type Service = {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  basePrice: number;
};

export type Appointment = {
  id: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  date: string;
  time: string;
  price: number;
  duration: number;
  status: 'confirmed' | 'completed' | 'cancelled';
  note?: string;
};

export type SalonState = {
  users: User[];
  staff: Staff[];
  services: Service[];
  appointments: Appointment[];
};

export type BookingInput = {
  staffId: string;
  serviceId: string;
  date: string;
  time: string;
  note?: string;
};
