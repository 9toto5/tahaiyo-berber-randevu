import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Scissors,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  getDaySlots,
  dateLabel,
  formatMoney,
  localDate,
  useSalon,
} from "../store";
import "./booking.css";

const slotLabels = {
  available: "Uygun",
  busy: "Dolu",
  break: "Mola",
  past: "Geçti",
  "outside-hours": "Süre yetmez",
};
const slotHints = {
  available: "Bu saat için randevu alabilirsin.",
  busy: "Seçtiğin hizmet bu saatte başka bir randevuyla çakışıyor.",
  break: "Seçtiğin hizmet mola saatine denk geliyor.",
  past: "Bu saat geçtiği için randevu alınamaz.",
  "outside-hours": "Seçtiğin hizmet mesai bitmeden tamamlanamıyor.",
};

type BookingProps = {
  initialServiceId?: string;
  initialStaffId?: string;
  selectionKey?: number;
  onRequireLogin: () => void;
};

export function Booking({
  initialServiceId,
  initialStaffId,
  selectionKey,
  onRequireLogin,
}: BookingProps) {
  const { state, user, bookAppointment } = useSalon();
  const [serviceId, setServiceId] = useState(
    initialServiceId || state.services[0]?.id || "",
  );
  const [staffId, setStaffId] = useState(state.staff[0]?.id || "");
  const [date, setDate] = useState(localDate());
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const successRef = useRef<HTMLElement>(null);
  const service = state.services.find((item) => item.id === serviceId);
  const staff = state.staff.find((item) => item.id === staffId);
  const config = staff?.services.find(
    (item) => item.serviceId === serviceId && item.enabled,
  );
  const slots = useMemo(
    () => getDaySlots(state, staffId, serviceId, date, now),
    [state, staffId, serviceId, date, now],
  );
  const dates = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() + index);
    return {
      value: localDate(day),
      day: day.toLocaleDateString("tr-TR", { weekday: "short" }),
      number: day.getDate(),
    };
  });

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    if (
      !confirmed &&
      time &&
      !slots.some((slot) => slot.time === time && slot.status === "available")
    )
      setTime("");
  }, [slots, time, confirmed]);

  useEffect(() => {
    if (initialServiceId || initialStaffId) {
      const nextStaffId = initialStaffId || staffId;
      const nextServiceId = initialServiceId || serviceId;
      const nextStaff = state.staff.find((member) => member.id === nextStaffId);
      if (initialStaffId) setStaffId(initialStaffId);
      if (
        nextStaff?.services.some(
          (item) => item.serviceId === nextServiceId && item.enabled,
        )
      ) {
        setServiceId(nextServiceId);
      } else if (initialStaffId) {
        setServiceId(
          nextStaff?.services.find((item) => item.enabled)?.serviceId || "",
        );
      } else {
        setServiceId(nextServiceId);
        setStaffId(
          state.staff.find((member) =>
            member.services.some(
              (item) => item.serviceId === nextServiceId && item.enabled,
            ),
          )?.id || "",
        );
      }
      setTime("");
      setConfirmed(false);
      setError("");
    }
  }, [initialServiceId, initialStaffId, selectionKey]);

  useEffect(() => {
    if (confirmed) {
      successRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      successRef.current?.focus({ preventScroll: true });
    }
  }, [confirmed]);

  function chooseService(id: string) {
    setServiceId(id);
    if (
      !state.staff
        .find((item) => item.id === staffId)
        ?.services.some((item) => item.serviceId === id && item.enabled)
    ) {
      setStaffId(
        state.staff.find((item) =>
          item.services.some(
            (entry) => entry.serviceId === id && entry.enabled,
          ),
        )?.id || "",
      );
    }
    setTime("");
    setError("");
  }

  function confirmBooking() {
    setError("");
    if (!user) {
      onRequireLogin();
      return;
    }
    if (!serviceId || !staffId || !date || !time) {
      setError("Devam etmek için hizmet, berber ve uygun bir saat seçin.");
      return;
    }
    const result = bookAppointment({ staffId, serviceId, date, time, note });
    if (!result.ok) {
      setError(result.error || "Randevu oluşturulamadı.");
      return;
    }
    setConfirmed(true);
  }

  if (confirmed)
    return (
      <section
        className="booking-page booking-success"
        aria-labelledby="booking-success-title"
        ref={successRef}
        tabIndex={-1}
      >
        <span className="booking-success-icon">
          <Check size={34} strokeWidth={1.8} />
        </span>
        <p className="eyebrow">GÖRÜŞMEK ÜZERE</p>
        <h2 id="booking-success-title">Randevun hazır.</h2>
        <p className="booking-success-intro">
          {user?.name.split(" ")[0]}, koltuğunu ayırdık. Kendine ayırdığın bu
          zamanın tadını çıkar.
        </p>
        <div className="booking-success-ticket">
          <div className="booking-success-ticket-top">
            <Scissors size={23} />
            <span>
              BOSS <small>ERKEK KUAFÖRÜ</small>
            </span>
            <CheckCircle2 size={23} />
          </div>
          <h2>{service?.name}</h2>
          <p>{staff?.name} ile</p>
          <div className="booking-ticket-details">
            <span>
              <CalendarDays size={17} />
              {dateLabel(date, { day: "numeric", month: "long" })}
            </span>
            <span>
              <Clock3 size={17} />
              {time} · {config?.duration} dk
            </span>
          </div>
          <div className="booking-ticket-total">
            <span>Toplam tutar</span>
            <strong>{formatMoney(config?.price || 0)}</strong>
          </div>
          <p className="booking-ticket-address">
            <MapPin size={16} />
            Hilmi Çakmakçı Cad. No: 194, Isparta
          </p>
        </div>
        <p className="booking-success-note">
          Bu bir demo randevudur. Gerçek bir rezervasyon veya bildirim
          oluşturulmaz. Randevunu “Randevularım” ekranında görebilirsin.
        </p>
        <div className="booking-success-actions">
          <a className="button button-dark" href="#randevularim">
            Randevularımı gör <ArrowRight size={17} />
          </a>
          <button
            className="button button-ghost"
            onClick={() => {
              setConfirmed(false);
              setTime("");
              setNote("");
            }}
          >
            Yeni randevu oluştur
          </button>
        </div>
      </section>
    );

  return (
    <section className="booking-page" aria-labelledby="booking-title">
      <div className="booking-heading">
        <div>
          <p className="eyebrow">BİRKAÇ ADIMDA RANDEVUN HAZIR</p>
          <h2 id="booking-title">Kendine bir saat ayır.</h2>
          <p>Hizmetini seç, berberini bul. Gerisini bize bırak.</p>
        </div>
        <span className="booking-heading-icon">
          <Scissors size={35} strokeWidth={1.4} />
        </span>
      </div>
      <div className="booking-layout">
        <div className="booking-options">
          <section className="booking-step" aria-labelledby="service-title">
            <div className="booking-step-title">
              <span>01</span>
              <h2 id="service-title">Nasıl bir dokunuş?</h2>
              <p>Hizmetini seç</p>
            </div>
            <div className="booking-services">
              {state.services.map((item) => (
                <button
                  key={item.id}
                  className={`booking-service ${serviceId === item.id ? "is-selected" : ""}`}
                  aria-pressed={serviceId === item.id}
                  onClick={() => chooseService(item.id)}
                >
                  <div className="booking-service-top">
                    <span>
                      {item.category === "Bakım" ? (
                        <Sparkles size={19} />
                      ) : (
                        <Scissors size={19} />
                      )}
                    </span>
                    <span className="booking-radio">
                      {serviceId === item.id && <Check size={12} />}
                    </span>
                  </div>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                  <div className="booking-service-meta">
                    <span>{item.duration} dk</span>
                    <b>
                      {formatMoney(item.basePrice)}
                      <small>’den</small>
                    </b>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="booking-step" aria-labelledby="staff-title">
            <div className="booking-step-title">
              <span>02</span>
              <h2 id="staff-title">Kimin koltuğuna?</h2>
              <p>Berberini seç</p>
            </div>
            <div className="booking-staff-list">
              {state.staff.map((member) => {
                const offered = member.services.find(
                  (item) => item.serviceId === serviceId && item.enabled,
                );
                return (
                  <button
                    key={member.id}
                    disabled={!offered}
                    aria-pressed={staffId === member.id}
                    className={`booking-staff ${staffId === member.id ? "is-selected" : ""}`}
                    onClick={() => {
                      setStaffId(member.id);
                      setTime("");
                      setError("");
                    }}
                  >
                    <span
                      className="booking-avatar"
                      style={{ background: member.color }}
                    >
                      {member.photoUrl ? (
                        <img
                          className="profile-photo"
                          src={member.photoUrl}
                          alt={`${member.name} profil fotoğrafı`}
                        />
                      ) : (
                        member.initials
                      )}
                    </span>
                    <span>
                      <strong>{member.name}</strong>
                      <small>
                        {offered ? member.title : "Bu hizmeti sunmuyor"}
                      </small>
                    </span>
                    <span className="booking-radio">
                      {staffId === member.id && <Check size={12} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="booking-step" aria-labelledby="date-title">
            <div className="booking-step-title">
              <span>03</span>
              <h2 id="date-title">Ne zaman görüşelim?</h2>
              <p>Tarih ve saat</p>
            </div>
            <div className="booking-date-header">
              <strong>
                {dateLabel(date, { month: "long", year: "numeric" })}
              </strong>
              <label className="booking-date-picker">
                <CalendarDays size={16} />
                Başka bir gün
                <input
                  aria-label="Randevu tarihi"
                  type="date"
                  min={localDate()}
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value || localDate());
                    setTime("");
                    setError("");
                  }}
                />
              </label>
            </div>
            <div className="booking-days">
              {dates.map((day) => (
                <button
                  key={day.value}
                  aria-pressed={date === day.value}
                  className={date === day.value ? "is-selected" : ""}
                  onClick={() => {
                    setDate(day.value);
                    setTime("");
                    setError("");
                  }}
                >
                  <span>{day.day}</span>
                  <strong>{day.number}</strong>
                  <i />
                </button>
              ))}
            </div>
            <div className="booking-slots-heading">
              <Clock3 size={15} />
              <span>Saatini seç</span>
              <small>
                {config?.duration || service?.duration} dakikalık seans
              </small>
            </div>
            {slots.length ? (
              <>
                <div className="booking-slot-legend">
                  <span>
                    <i />
                    Uygun
                  </span>
                  <span>
                    <i />
                    Dolu
                  </span>
                  <small>Uygun olmayan saatler seçilemez.</small>
                </div>
                <div className="booking-slots">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      aria-label={
                        slot.status === "available"
                          ? slot.time
                          : `${slot.time} · ${slotLabels[slot.status]}`
                      }
                      aria-pressed={
                        time === slot.time && slot.status === "available"
                      }
                      disabled={slot.status !== "available"}
                      title={slotHints[slot.status]}
                      className={`booking-slot is-${slot.status} ${time === slot.time && slot.status === "available" ? "is-selected" : ""}`}
                      onClick={() => {
                        setTime(slot.time);
                        setError("");
                      }}
                    >
                      <span>{slot.time}</span>
                      <small>{slotLabels[slot.status]}</small>
                      {time === slot.time && slot.status === "available" && (
                        <Check size={13} />
                      )}
                    </button>
                  ))}
                </div>
                {!slots.some((slot) => slot.status === "available") && (
                  <p className="booking-day-full" role="status">
                    Bu gün için uygun saat kalmadı. Başka bir gün veya berber
                    seçebilirsin.
                  </p>
                )}
              </>
            ) : (
              <div className="booking-no-slots">
                <CalendarDays size={24} />
                <strong>Bu gün için uygun saat bulunmuyor.</strong>
                <span>
                  Başka bir gün veya berber seçerek devam edebilirsin.
                </span>
              </div>
            )}
          </section>
          <section className="booking-step booking-notes">
            <label htmlFor="booking-note">
              <span className="booking-note-icon">
                <UserRound size={18} />
              </span>
              <strong>Bilmemizi istediğin bir şey var mı?</strong>
              <small>İsteğe bağlı</small>
            </label>
            <textarea
              id="booking-note"
              className="input"
              maxLength={500}
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Tercih ettiğin kesim, özel bir isteğin…"
            />
          </section>
        </div>
        <aside
          className="booking-summary"
          aria-labelledby="booking-summary-title"
        >
          <div className="booking-summary-top">
            <span className="eyebrow">SANA AYIRDIĞIMIZ ZAMAN</span>
            <h2 id="booking-summary-title">Randevu özeti</h2>
          </div>
          <div className="booking-summary-service">
            <span className="booking-summary-service-icon">
              <Scissors size={23} />
            </span>
            <div>
              <strong>{service?.name}</strong>
              <small>
                {config?.duration || service?.duration} dakika · Özenle, sana
                özel
              </small>
            </div>
          </div>
          <dl className="booking-summary-details">
            <div>
              <dt>
                <UserRound size={16} />
                Berberin
              </dt>
              <dd>{staff?.name || "Seçilmedi"}</dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={16} />
                Tarih
              </dt>
              <dd>{dateLabel(date, { day: "numeric", month: "long" })}</dd>
            </div>
            <div>
              <dt>
                <Clock3 size={16} />
                Saat
              </dt>
              <dd>
                {time || <span className="booking-pending">Saat seç</span>}
              </dd>
            </div>
          </dl>
          <div className="booking-summary-total">
            <div>
              <span>Toplam</span>
              <small>Ödeme salonda yapılır</small>
            </div>
            <strong>
              {formatMoney(config?.price ?? service?.basePrice ?? 0)}
            </strong>
          </div>
          {user?.role === "staff" && (
            <p className="booking-error">
              Personel hesabındasın. Randevu denemek için Deniz müşteri hesabına
              geçebilirsin.
            </p>
          )}
          {error && (
            <p className="booking-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button-dark booking-confirm"
            disabled={!time || user?.role === "staff"}
            onClick={confirmBooking}
          >
            {user ? "Randevumu oluştur" : "Giriş yap ve randevu al"}
            <ArrowRight size={17} />
          </button>
          <p className="booking-summary-help">
            <ShieldCheck size={15} />
            Kolay rezervasyon, salonda ödeme.
          </p>
          <div className="booking-summary-bottom">
            <MapPin size={18} />
            <div>
              <strong>BOSS Erkek Kuaförü</strong>
              <p>
                Hilmi Çakmakçı Cad. No: 194
                <br />
                Isparta Merkez / Isparta
              </p>
            </div>
          </div>
          <p className="booking-demo-note">
            Demo deneyimi · Randevular bu tarayıcıda saklanır.
          </p>
        </aside>
      </div>
    </section>
  );
}

export default Booking;
