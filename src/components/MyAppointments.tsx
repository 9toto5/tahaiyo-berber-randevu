import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Clock3, LogIn, Plus, Scissors, UserRound, X } from 'lucide-react';
import { dateLabel, formatMoney, localDate, useSalon } from '../store';
import './booking.css';

type MyAppointmentsProps = { onBook: () => void; onRequireLogin: () => void };

export function MyAppointments({ onBook, onRequireLogin }: MyAppointmentsProps) {
  const { state, user, cancelAppointment } = useSalon();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const cancelDialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cancelId) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelDialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCancelId(null);
      if (event.key === 'Tab') {
        const buttons = cancelDialog.current?.querySelectorAll('button');
        if (!buttons?.length) return;
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; previous?.focus(); };
  }, [cancelId]);
  if (!user || user.role !== 'customer') return <section className="booking-page account-empty-page"><span className="booking-success-icon"><UserRound size={30} /></span><p className="eyebrow">SANA ÖZEL ALANIN</p><h1>Randevuların bir arada.</h1><p>Yaklaşan randevularını görmek ve yönetmek için müşteri hesabınla giriş yap.</p><button className="button button-dark" onClick={onRequireLogin}><LogIn size={17} />Müşteri girişi</button></section>;

  const now = new Date();
  const nowKey = `${localDate(now)}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const own = state.appointments.filter((item) => item.customerId === user.id);
  const upcoming = own.filter((item) => item.status === 'confirmed' && `${item.date}T${item.time}` >= nowKey).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const past = own.filter((item) => !upcoming.some((entry) => entry.id === item.id)).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  const displayed = tab === 'upcoming' ? upcoming : past;

  return <section className="booking-page account-page" aria-labelledby="account-title">
    <div className="booking-heading"><div><p className="eyebrow">SANA ÖZEL ALANIN</p><h1 id="account-title">Merhaba, {user.name.split(' ')[0]}.</h1><p>İyi görünmek için ayırdığın tüm zamanlar burada.</p></div><button className="button button-dark" onClick={onBook}><Plus size={17} />Yeni randevu</button></div>
    <div className="account-profile"><span className="booking-avatar">{user.name.split(' ').map((item) => item[0]).slice(0, 2).join('')}</span><div><strong>{user.name}</strong><span>{user.email}</span></div><span className="badge">Müşteri hesabı</span></div>
    <div className="account-tabs" role="tablist" aria-label="Randevu türü"><button role="tab" aria-selected={tab === 'upcoming'} className={tab === 'upcoming' ? 'is-selected' : ''} onClick={() => setTab('upcoming')}>Yaklaşan randevular <span>{upcoming.length}</span></button><button role="tab" aria-selected={tab === 'past'} className={tab === 'past' ? 'is-selected' : ''} onClick={() => setTab('past')}>Geçmiş & iptal edilen <span>{past.length}</span></button></div>
    {notice && <div className="account-notice" role="status"><Check size={17} />{notice}<button aria-label="Bildirimi kapat" onClick={() => setNotice('')}><X size={15} /></button></div>}
    {!displayed.length ? <div className="account-empty"><CalendarDays size={33} strokeWidth={1.4} /><h2>{tab === 'upcoming' ? 'Takviminde yeni bir stil için yer var.' : 'Henüz geçmiş randevun yok.'}</h2><p>{tab === 'upcoming' ? 'Kendine biraz zaman ayır. Bir sonraki randevunu hemen planla.' : 'Tamamlanan ve iptal edilen randevuların burada görünür.'}</p>{tab === 'upcoming' && <button className="button button-dark" onClick={onBook}>Randevu al <ArrowRight size={16} /></button>}</div> : <div className="account-appointments">{displayed.map((appointment) => {
      const service = state.services.find((item) => item.id === appointment.serviceId);
      const member = state.staff.find((item) => item.id === appointment.staffId);
      return <article className="account-appointment" key={appointment.id}>
        <div className="account-appointment-date"><strong>{new Date(`${appointment.date}T12:00:00`).getDate()}</strong><span>{dateLabel(appointment.date, { month: 'short' })}</span><small>{dateLabel(appointment.date, { weekday: 'short' })}</small></div>
        <div className="account-appointment-body"><div className="account-appointment-title"><h2>{service?.name}</h2><span className={`account-status account-status-${appointment.status}`}>{appointment.status === 'confirmed' ? 'Onaylandı' : appointment.status === 'completed' ? 'Tamamlandı' : 'İptal edildi'}</span></div><div className="account-appointment-meta"><span><UserRound size={15} />{member?.name}</span><span><Clock3 size={15} />{appointment.time} · {appointment.duration} dk</span></div>{appointment.note && <p className="account-appointment-note">{appointment.note}</p>}</div>
        <div className="account-appointment-actions"><strong>{formatMoney(appointment.price)}</strong>{appointment.status === 'confirmed' && <button className="account-cancel" onClick={() => setCancelId(appointment.id)}>Randevuyu iptal et</button>}</div>
      </article>;
    })}</div>}
    <div className="account-demo-note"><Scissors size={17} /><p>Bu hesap ve randevular örnek verilerdir. Değişiklikler yalnızca kullandığın tarayıcıda saklanır.</p></div>
    {cancelId && <div className="account-modal-backdrop" onClick={() => setCancelId(null)}><div ref={cancelDialog} role="dialog" aria-modal="true" aria-labelledby="cancel-title" className="account-cancel-dialog" onClick={(event) => event.stopPropagation()}><button autoFocus className="account-dialog-close" aria-label="Pencereyi kapat" onClick={() => setCancelId(null)}><X size={19} /></button><span className="booking-success-icon"><CalendarDays size={25} /></span><h2 id="cancel-title">Randevunu iptal edelim mi?</h2><p>Bu saat yeniden rezervasyona açılacak. Dilediğin zaman yeni bir randevu oluşturabilirsin.</p><div><button className="button button-ghost" onClick={() => setCancelId(null)}>Vazgeç</button><button className="button button-dark" onClick={() => { cancelAppointment(cancelId); setCancelId(null); setNotice('Randevun iptal edildi. Yeni bir gün için seni bekleriz.'); }}>Evet, iptal et</button></div></div></div>}
  </section>;
}

export default MyAppointments;
