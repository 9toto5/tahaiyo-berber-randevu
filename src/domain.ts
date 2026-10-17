import type { BookingInput, SalonState, Service, Staff, User } from './types';

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
}

export function dateLabel(date: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', weekday: 'long' }): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('tr-TR', options);
}

export function minutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function toTime(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}

export function availableSlots(state: SalonState, staffId: string, serviceId: string, date: string, now = new Date()): string[] {
  if (!validDate(date) || date < localDate(now)) return [];
  const member = state.staff.find((item) => item.id === staffId);
  const service = member?.services.find((item) => item.serviceId === serviceId && item.enabled);
  if (!member || !service || !state.services.some((item) => item.id === serviceId) || service.duration <= 0) return [];
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const hours = member.hours.find((item) => item.day === weekday);
  if (!hours?.enabled || member.leaves.some((leave) => date >= leave.date && date <= (leave.endDate || leave.date))) return [];
  const start = minutes(hours.start);
  const end = minutes(hours.end);
  const breakStart = hours.breakStart ? minutes(hours.breakStart) : -1;
  const breakEnd = hours.breakEnd ? minutes(hours.breakEnd) : -1;
  const reservations = state.appointments.filter((appointment) => appointment.staffId === staffId && appointment.date === date && appointment.status !== 'cancelled');
  const slots: string[] = [];
  for (let candidate = start; candidate + service.duration <= end; candidate += 30) {
    const finish = candidate + service.duration;
    if (date === localDate(now) && candidate <= now.getHours() * 60 + now.getMinutes()) continue;
    if (breakEnd > breakStart && candidate < breakEnd && finish > breakStart) continue;
    if (reservations.some((appointment) => candidate < minutes(appointment.time) + appointment.duration && finish > minutes(appointment.time))) continue;
    slots.push(toTime(candidate));
  }
  return slots;
}

export function validateBooking(state: SalonState, user: User | null, input: BookingInput, now = new Date()): string | undefined {
  if (!user) return 'Randevunuzu oluşturmak için müşteri hesabınızla giriş yapın.';
  if (user.role !== 'customer') return 'Randevu almak için bir müşteri demo hesabına geçin.';
  if (!availableSlots(state, input.staffId, input.serviceId, input.date, now).includes(input.time)) return 'Bu saat artık uygun değil. Lütfen başka bir saat seçin.';
  const duration = state.staff.find((member) => member.id === input.staffId)!.services.find((service) => service.serviceId === input.serviceId)!.duration;
  const start = minutes(input.time);
  if (state.appointments.some((appointment) => appointment.customerId === user.id && appointment.date === input.date && appointment.status !== 'cancelled' && start < minutes(appointment.time) + appointment.duration && start + duration > minutes(appointment.time))) {
    return 'Bu saatte başka bir randevunuz var. Lütfen farklı bir saat seçin.';
  }
  return undefined;
}

export function createInitialState(now = new Date()): SalonState {
  const services: Service[] = [
    { id: 'haircut', name: 'Saç kesimi', description: 'Yüz hatlarınıza uygun kesim, yıkama ve şekillendirme.', category: 'Saç', duration: 30, basePrice: 400 },
    { id: 'beard', name: 'Sakal tasarımı', description: 'Sıcak havlu, ustura ve özenli son dokunuşlar.', category: 'Sakal', duration: 30, basePrice: 250 },
    { id: 'combo', name: 'Saç & sakal', description: 'Baştan sona yenilenmek için en sevilen ikili.', category: 'Paket', duration: 60, basePrice: 600 },
    { id: 'child', name: 'Çocuk saç kesimi', description: 'Küçük beyler için rahat ve keyifli bir deneyim.', category: 'Saç', duration: 30, basePrice: 300 },
    { id: 'skin', name: 'Cilt bakımı', description: 'Maske, temizleme ve canlandırıcı yüz bakımı.', category: 'Bakım', duration: 30, basePrice: 350 },
    { id: 'color', name: 'Saç boyama', description: 'Doğal tonlar ve size özel renk danışmanlığı.', category: 'Bakım', duration: 90, basePrice: 900 },
  ];
  const staff: Staff[] = [
    { id: 'emre', name: 'Emre Yılmaz', title: 'Kurucu · Usta berber', initials: 'EY', color: '#cfea68', bio: 'Klasik ustalık, modern dokunuşlar. Her kesimde size özel bir stil.', services: [], hours: [], leaves: [] },
    { id: 'mert', name: 'Mert Kaya', title: 'Saç & sakal uzmanı', initials: 'MK', color: '#e1d4bd', bio: 'Kusursuz geçişler ve sakal tasarımı benim işim. Koltuğuma beklerim.', services: [], hours: [], leaves: [] },
    { id: 'can', name: 'Can Demir', title: 'Stil & bakım uzmanı', initials: 'CD', color: '#c4d9e0', bio: 'Yeni bir renk, yeni bir stil. Birlikte size en yakışanı bulalım.', services: [], hours: [], leaves: [] },
  ].map((member, index) => ({
    ...member,
    services: services.map((service) => ({ serviceId: service.id, price: service.basePrice + (index === 0 && service.id === 'haircut' ? 50 : 0), duration: service.duration, enabled: !(member.id === 'mert' && service.id === 'color') })),
    hours: Array.from({ length: 7 }, (_, day) => ({ day, enabled: day !== 0, start: index === 2 ? '10:00' : '09:00', end: '22:00', breakStart: '13:00', breakEnd: '14:00' })),
  }));
  const users: User[] = [
    ...staff.map((member, index) => ({ id: `user-${member.id}`, name: member.name, email: `${member.id}@boss.demo`, password: 'boss123', phone: `0555 000 00 0${index + 1}`, role: 'staff' as const, staffId: member.id })),
    { id: 'deniz', name: 'Deniz Yıldız', email: 'deniz@boss.demo', password: 'boss123', phone: '0555 000 10 01', role: 'customer' },
    { id: 'ayse', name: 'Ayşe Öz', email: 'ayse@boss.demo', password: 'boss123', phone: '0555 000 10 02', role: 'customer' },
    { id: 'arda', name: 'Arda Şahin', email: 'arda@boss.demo', password: 'boss123', phone: '0555 000 10 03', role: 'customer' },
  ];
  const state: SalonState = { users, staff, services, appointments: [] };
  const offsets = [0, 1, 2, 3, -1];
  for (const offset of offsets) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    if (day.getDay() === 0) continue;
    const date = localDate(day);
    const samples = [
      { staffId: 'emre', customerId: 'deniz', serviceId: 'combo', time: '10:00' },
      { staffId: 'emre', customerId: 'arda', serviceId: 'haircut', time: '11:30' },
      { staffId: 'mert', customerId: 'ayse', serviceId: 'child', time: '14:00' },
      { staffId: 'mert', customerId: 'arda', serviceId: 'beard', time: '16:30' },
      { staffId: 'can', customerId: 'deniz', serviceId: 'haircut', time: '18:00' },
    ];
    for (const [index, item] of samples.entries()) {
      const config = staff.find((member) => member.id === item.staffId)!.services.find((service) => service.serviceId === item.serviceId)!;
      const done = date < localDate(now) || (date === localDate(now) && minutes(item.time) + config.duration < now.getHours() * 60 + now.getMinutes());
      state.appointments.push({ id: `demo-${offset}-${index}`, ...item, date, price: config.price, duration: config.duration, status: done ? 'completed' : 'confirmed', note: index === 0 ? 'Demo randevu · Saçları çok kısa almayalım.' : undefined });
    }
  }
  return state;
}
