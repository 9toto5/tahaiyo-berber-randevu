import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarOff,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  LayoutDashboard,
  LogOut,
  Plus,
  Scissors,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { formatMoney, localDate, useSalon } from "../store";
import type { Appointment, Staff } from "../types";
import ProfilePhoto from "./ProfilePhoto";
import "./staff.css";

type Tab =
  | "agenda"
  | "appointments"
  | "services"
  | "hours"
  | "leaves"
  | "profile";
type Notice = { message: string; kind: "success" | "error" };
type ServiceDraft = {
  serviceId: string;
  price: string;
  duration: string;
  enabled: boolean;
};

const navigation = [
  { id: "agenda" as Tab, label: "Genel bakış", icon: LayoutDashboard },
  { id: "appointments" as Tab, label: "Randevularım", icon: CalendarDays },
  { id: "services" as Tab, label: "Hizmetler & ücretler", icon: Scissors },
  { id: "hours" as Tab, label: "Çalışma saatlerim", icon: Clock3 },
  { id: "leaves" as Tab, label: "İzinlerim", icon: CalendarOff },
  { id: "profile" as Tab, label: "Profil ayarları", icon: Settings2 },
];
const dayNames = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];
const statuses = {
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
};
const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const fullDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const prettyDate = (value: string) => dateFormatter.format(parseDate(value));
const serviceDrafts = (staff: Staff): ServiceDraft[] =>
  staff.services.map((service) => ({
    ...service,
    price: String(service.price),
    duration: String(service.duration),
  }));

export function StaffDashboard({ onBack }: { onBack: () => void }) {
  const {
    state,
    user,
    logout,
    updateStaff,
    cancelAppointment,
    completeAppointment,
  } = useSalon();
  const staff = state.staff.find((member) => member.id === user?.staffId);
  const [tab, setTab] = useState<Tab>("agenda");
  const [date, setDate] = useState(localDate());
  const [listDate, setListDate] = useState("");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [services, setServices] = useState<ServiceDraft[]>(() =>
    staff ? serviceDrafts(staff) : [],
  );
  const [hours, setHours] = useState<Staff["hours"]>(() =>
    staff ? staff.hours.map((day) => ({ ...day })) : [],
  );
  const [profile, setProfile] = useState(() => ({
    name: staff?.name ?? "",
    title: staff?.title ?? "",
    bio: staff?.bio ?? "",
  }));
  const [leave, setLeave] = useState({
    date: localDate(),
    endDate: localDate(),
    reason: "",
  });
  const [action, setAction] = useState<{
    appointment: Appointment;
    type: "cancel" | "complete";
  } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!action) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAction(null);
      if (event.key === "Tab") {
        const buttons =
          dialogRef.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [action]);

  if (!staff || !user) return null;

  const today = localDate();
  const appointments = state.appointments.filter(
    (appointment) => appointment.staffId === staff.id,
  );
  const sortedAppointments = [...appointments].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
  );
  const todaysAppointments = appointments.filter(
    (appointment) => appointment.date === today,
  );
  const upcoming = sortedAppointments.find(
    (appointment) =>
      appointment.status === "confirmed" &&
      `${appointment.date}T${appointment.time}` >=
        `${today}T${new Date().toTimeString().slice(0, 5)}`,
  );
  const selectedAppointments = sortedAppointments.filter((appointment) => {
    const customer = state.users.find(
      (person) => person.id === appointment.customerId,
    );
    const matchesQuery = `${customer?.name ?? ""} ${customer?.phone ?? ""}`
      .toLocaleLowerCase("tr")
      .includes(query.toLocaleLowerCase("tr"));
    return (
      (tab === "agenda"
        ? appointment.date === date
        : !listDate || appointment.date === listDate) &&
      (status === "all" || appointment.status === status) &&
      matchesQuery
    );
  });
  const selectedNav = navigation.find((item) => item.id === tab)!;
  const notify = (message: string, kind: Notice["kind"] = "success") =>
    setNotice({ message, kind });
  const selectTab = (value: Tab) => {
    setTab(value);
    setQuery("");
    setStatus("all");
    setNotice(null);
  };
  const changeDate = (offset: number) => {
    const next = parseDate(date);
    next.setDate(next.getDate() + offset);
    setDate(localDate(next));
  };
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = parseDate(date);
    day.setDate(day.getDate() - ((day.getDay() + 6) % 7) + index);
    return day;
  });

  function saveServices(event: React.FormEvent) {
    event.preventDefault();
    for (const service of services) {
      if (
        !service.price.trim() ||
        !Number.isFinite(Number(service.price)) ||
        Number(service.price) < 1 ||
        Number(service.price) > 100000
      ) {
        notify(
          "Her hizmet için 1–100.000 TL arasında geçerli bir ücret girin.",
          "error",
        );
        return;
      }
      if (
        !service.duration.trim() ||
        !Number.isInteger(Number(service.duration)) ||
        Number(service.duration) < 5 ||
        Number(service.duration) > 480
      ) {
        notify(
          "Hizmet süreleri 5–480 dakika arasında tam sayı olmalıdır.",
          "error",
        );
        return;
      }
    }
    const result = updateStaff(staff!.id, {
      services: services.map((service) => ({
        ...service,
        price: Number(service.price),
        duration: Number(service.duration),
      })),
    });
    if (!result.ok) {
      notify(result.error!, "error");
      return;
    }
    notify(
      "Hizmetleriniz ve ücretleriniz kaydedildi. Yeni randevulara uygulanacak.",
    );
  }

  function saveHours(event: React.FormEvent) {
    event.preventDefault();
    for (const day of hours.filter((item) => item.enabled)) {
      if (!day.start || !day.end || day.start >= day.end) {
        notify(
          `${dayNames[day.day]} için bitiş saati başlangıçtan sonra olmalıdır.`,
          "error",
        );
        return;
      }
      if (
        (day.breakStart || day.breakEnd) &&
        (!day.breakStart ||
          !day.breakEnd ||
          day.breakStart >= day.breakEnd ||
          day.breakStart < day.start ||
          day.breakEnd > day.end)
      ) {
        notify(
          `${dayNames[day.day]} molasını çalışma saatleri içinde, başlangıç ve bitişiyle girin.`,
          "error",
        );
        return;
      }
    }
    const result = updateStaff(staff!.id, { hours });
    if (!result.ok) {
      notify(result.error!, "error");
      return;
    }
    notify("Çalışma saatleriniz kaydedildi. Mevcut randevularınız korunur.");
  }

  function addLeave(event: React.FormEvent) {
    event.preventDefault();
    if (
      !leave.date ||
      !leave.endDate ||
      leave.date < today ||
      leave.endDate < leave.date
    ) {
      notify(
        "Bugün veya sonrası için geçerli bir başlangıç ve bitiş tarihi seçin.",
        "error",
      );
      return;
    }
    if (!leave.reason.trim()) {
      notify("İzniniz için kısa bir açıklama ekleyin.", "error");
      return;
    }
    if (
      staff!.leaves.some(
        (item) => leave.date <= item.endDate && leave.endDate >= item.date,
      )
    ) {
      notify("Bu tarihlerde zaten bir izin kaydınız var.", "error");
      return;
    }
    const count = appointments.filter(
      (item) =>
        item.status === "confirmed" &&
        item.date >= leave.date &&
        item.date <= leave.endDate,
    ).length;
    if (count) {
      notify(
        `Bu tarihlerde ${count} onaylı randevunuz var. İzin eklemeden önce randevularınızı düzenleyin.`,
        "error",
      );
      return;
    }
    const result = updateStaff(staff!.id, {
      leaves: [
        ...staff!.leaves,
        { ...leave, reason: leave.reason.trim(), id: crypto.randomUUID() },
      ],
    });
    if (!result.ok) {
      notify(result.error!, "error");
      return;
    }
    setLeave({ date: today, endDate: today, reason: "" });
    notify("İzniniz eklendi. Bu tarihlerde yeni randevu alınamayacak.");
  }

  function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (profile.name.trim().length < 2 || profile.title.trim().length < 2) {
      notify("Adınız ve unvanınız en az 2 karakter olmalıdır.", "error");
      return;
    }
    const result = updateStaff(staff!.id, {
      name: profile.name.trim(),
      title: profile.title.trim(),
      bio: profile.bio.trim(),
    });
    if (!result.ok) {
      notify(result.error!, "error");
      return;
    }
    notify("Profiliniz kaydedildi. Müşteriler güncel bilgilerinizi görebilir.");
  }

  const patchHour = (day: number, patch: Partial<Staff["hours"][number]>) =>
    setHours((current) =>
      current.map((item) => (item.day === day ? { ...item, ...patch } : item)),
    );

  return (
    <div className="staff-shell">
      <aside className="staff-sidebar">
        <button
          className="staff-brand"
          onClick={onBack}
          aria-label="BOSS ana sayfa"
        >
          BOSS<span>ERKEK KUAFÖRÜ</span>
        </button>
        <div className="staff-workspace-label">
          <span className="staff-live-dot" />
          PERSONEL ALANI
        </div>
        <nav className="staff-nav" aria-label="Personel menüsü">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`staff-nav-item ${tab === id ? "is-active" : ""}`}
              onClick={() => selectTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
              {tab === id && <span className="staff-nav-marker" />}
            </button>
          ))}
        </nav>
        <div className="staff-sidebar-bottom">
          <div className="staff-demo-note">
            <Sparkles size={18} />
            <div>
              <strong>Denemek için özgürsün.</strong>
              <p>Örnek hesaplar ve randevularla BOSS deneyimini keşfet.</p>
            </div>
          </div>
          <button className="staff-back-link" onClick={onBack}>
            <ArrowLeft size={16} /> Müşteri görünümüne dön
          </button>
          <div className="staff-account">
            <div className="staff-avatar" style={{ background: staff.color }}>
              {staff.photoUrl ? (
                <img className="profile-photo" src={staff.photoUrl} alt="" />
              ) : (
                staff.initials
              )}
            </div>
            <div>
              <strong>{staff.name}</strong>
              <span>{staff.title}</span>
            </div>
            <button
              className="staff-icon-button"
              aria-label="Hesaptan çıkış yap"
              onClick={() => {
                logout();
                onBack();
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="staff-main">
        <header className="staff-topbar">
          <div>
            <span className="staff-breadcrumb">
              Çalışma alanım <ChevronRight size={13} />
            </span>
            <strong>{selectedNav.label}</strong>
          </div>
          <span className="staff-demo-badge">
            <span /> DEMO MODU
          </span>
        </header>
        <main className="staff-content">
          <div className="staff-page-heading">
            <div>
              <p className="eyebrow">BOSS / PERSONEL PANELİ</p>
              <h1>
                {tab === "agenda"
                  ? `Merhaba, ${staff.name.split(" ")[0]}.`
                  : selectedNav.label}
              </h1>
              <p>
                {tab === "agenda"
                  ? "Güzel bir gün, iyi bir planla başlar. Bugün koltuğunda kimler var?"
                  : tab === "appointments"
                    ? "Randevularını takip et, gününü kolayca yönet."
                    : tab === "services"
                      ? "Ustalığının karşılığını sen belirle. Hizmetlerini kişiselleştir."
                      : tab === "hours"
                        ? "Sana uygun çalışma düzenini oluştur. Müşterilerin uygun saatleri görsün."
                        : tab === "leaves"
                          ? "Kendine de zaman ayır. İzin günlerini takvimine ekle."
                          : "Müşterilerin seni tanısın. Profil bilgilerini güncel tut."}
              </p>
            </div>
            <div className="staff-heading-date">
              <CalendarDays size={18} />
              <span>{fullDateFormatter.format(new Date())}</span>
            </div>
          </div>

          {notice && (
            <div
              className={`staff-notice ${notice.kind === "error" ? "is-error" : ""}`}
              role={notice.kind === "error" ? "alert" : "status"}
            >
              <span>
                {notice.kind === "success" ? (
                  <CheckCheck size={19} />
                ) : (
                  <X size={19} />
                )}
                {notice.message}
              </span>
              <button
                aria-label="Bildirimi kapat"
                onClick={() => setNotice(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {tab === "agenda" && (
            <>
              <div className="staff-stats">
                <div className="staff-stat-card">
                  <span>
                    BUGÜNKÜ RANDEVULAR <CalendarDays size={18} />
                  </span>
                  <strong>
                    {todaysAppointments
                      .filter((item) => item.status !== "cancelled")
                      .length.toString()
                      .padStart(2, "0")}
                  </strong>
                  <p>
                    {
                      todaysAppointments.filter(
                        (item) => item.status === "confirmed",
                      ).length
                    }{" "}
                    randevu seni bekliyor
                  </p>
                </div>
                <div className="staff-stat-card">
                  <span>
                    TAMAMLANAN <CheckCheck size={18} />
                  </span>
                  <strong>
                    {todaysAppointments
                      .filter((item) => item.status === "completed")
                      .length.toString()
                      .padStart(2, "0")}
                  </strong>
                  <p>Bugün tamamladığın hizmetler</p>
                </div>
                <div className="staff-stat-card staff-stat-highlight">
                  <span>
                    BUGÜNKÜ KAZANCIN <span className="staff-lira">₺</span>
                  </span>
                  <strong>
                    {formatMoney(
                      todaysAppointments
                        .filter((item) => item.status === "completed")
                        .reduce((total, item) => total + item.price, 0),
                    )}
                  </strong>
                  <p>Tamamlanan randevulara göre</p>
                </div>
              </div>
              {upcoming && (
                <div className="staff-next-appointment">
                  <div className="staff-next-icon">
                    <Scissors size={21} />
                  </div>
                  <div>
                    <span>SIRADAKİ RANDEVUN</span>
                    <strong>
                      {state.users.find(
                        (person) => person.id === upcoming.customerId,
                      )?.name ?? "Müşteri"}{" "}
                      <span className="staff-next-divider">/</span>{" "}
                      {
                        state.services.find(
                          (service) => service.id === upcoming.serviceId,
                        )?.name
                      }
                    </strong>
                  </div>
                  <span className="staff-next-time">
                    <Clock3 size={16} />
                    {upcoming.date === today
                      ? "Bugün"
                      : prettyDate(upcoming.date)}
                    , {upcoming.time}
                  </span>
                  <button
                    className="staff-icon-button"
                    aria-label="Sıradaki randevuyu göster"
                    onClick={() => {
                      setDate(upcoming.date);
                      setStatus("confirmed");
                    }}
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}

          {(tab === "agenda" || tab === "appointments") && (
            <section
              className="staff-panel staff-agenda-panel"
              aria-label="Randevu takvimi"
            >
              <div className="staff-panel-heading">
                <div>
                  <h2>
                    {tab === "agenda" ? "Günün akışı" : "Tüm randevularım"}{" "}
                    <span className="staff-count">
                      {selectedAppointments.length}
                    </span>
                  </h2>
                  <p>
                    {tab === "agenda"
                      ? fullDateFormatter.format(parseDate(date))
                      : "Yalnızca sana ait randevular gösterilir."}
                  </p>
                </div>
                {tab === "agenda" ? (
                  <div className="staff-calendar-controls">
                    <button
                      className="staff-icon-button"
                      aria-label="Önceki hafta"
                      onClick={() => changeDate(-7)}
                    >
                      <ChevronLeft size={19} />
                    </button>
                    <button
                      className="staff-today-button"
                      onClick={() => setDate(today)}
                    >
                      Bugün
                    </button>
                    <button
                      className="staff-icon-button"
                      aria-label="Sonraki hafta"
                      onClick={() => changeDate(7)}
                    >
                      <ChevronRight size={19} />
                    </button>
                    <input
                      type="date"
                      aria-label="Takvim tarihi"
                      value={date}
                      onChange={(event) =>
                        event.target.value && setDate(event.target.value)
                      }
                    />
                  </div>
                ) : (
                  <input
                    className="input staff-date-input"
                    type="date"
                    aria-label="Randevu tarihine göre filtrele"
                    value={listDate}
                    onChange={(event) => setListDate(event.target.value)}
                  />
                )}
              </div>
              {tab === "agenda" && (
                <div className="staff-week-strip">
                  {weekDays.map((day) => {
                    const value = localDate(day);
                    const count = appointments.filter(
                      (item) =>
                        item.date === value && item.status !== "cancelled",
                    ).length;
                    return (
                      <button
                        key={value}
                        className={`staff-day ${date === value ? "is-selected" : ""} ${value === today ? "is-today" : ""}`}
                        onClick={() => setDate(value)}
                        aria-pressed={date === value}
                      >
                        <span>{dayNames[day.getDay()].slice(0, 3)}</span>
                        <strong>{day.getDate()}</strong>
                        <span
                          className="staff-day-indicator"
                          style={{ opacity: count ? 1 : 0 }}
                        >
                          {count > 0 ? `${count} randevu` : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="staff-table-tools">
                <div className="staff-status-tabs" aria-label="Randevu durumu">
                  <button
                    className={status === "all" ? "is-selected" : ""}
                    onClick={() => setStatus("all")}
                  >
                    Tümü
                  </button>
                  <button
                    className={status === "confirmed" ? "is-selected" : ""}
                    onClick={() => setStatus("confirmed")}
                  >
                    Yaklaşan
                  </button>
                  <button
                    className={status === "completed" ? "is-selected" : ""}
                    onClick={() => setStatus("completed")}
                  >
                    Tamamlanan
                  </button>
                  <button
                    className={status === "cancelled" ? "is-selected" : ""}
                    onClick={() => setStatus("cancelled")}
                  >
                    İptal
                  </button>
                </div>
                <label className="staff-search">
                  <Search size={16} />
                  <input
                    aria-label="Müşteri ara"
                    placeholder="Müşteri ara…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                {listDate && tab === "appointments" && (
                  <button
                    className="staff-text-button"
                    onClick={() => setListDate("")}
                  >
                    Tarihi temizle
                  </button>
                )}
              </div>
              <div className="staff-appointments-list">
                {selectedAppointments.length ? (
                  selectedAppointments.map((appointment) => {
                    const customer = state.users.find(
                      (person) => person.id === appointment.customerId,
                    );
                    const service = state.services.find(
                      (item) => item.id === appointment.serviceId,
                    );
                    const initials = (customer?.name ?? "M")
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("");
                    return (
                      <article
                        className="staff-appointment"
                        key={appointment.id}
                      >
                        <div className="staff-appointment-time">
                          <strong>{appointment.time}</strong>
                          <span>
                            {tab === "appointments"
                              ? prettyDate(appointment.date)
                              : `${appointment.duration} dakika`}
                          </span>
                        </div>
                        <div className="staff-customer-avatar">{initials}</div>
                        <div className="staff-appointment-person">
                          <h3>{customer?.name ?? "Müşteri"}</h3>
                          <p>
                            {service?.name ?? "Hizmet"}
                            {tab === "appointments" &&
                              ` · ${appointment.duration} dk`}
                          </p>
                          {appointment.note && (
                            <span className="staff-appointment-note">
                              Not: {appointment.note}
                            </span>
                          )}
                        </div>
                        <div className="staff-appointment-price">
                          {formatMoney(appointment.price)}
                        </div>
                        <span
                          className={`staff-status staff-status-${appointment.status}`}
                        >
                          <span />
                          {statuses[appointment.status]}
                        </span>
                        <div className="staff-appointment-actions">
                          {appointment.status === "confirmed" ? (
                            <>
                              <button
                                className="staff-complete-button"
                                title="Randevuyu tamamla"
                                aria-label={`${customer?.name ?? "Müşteri"} randevusunu tamamla`}
                                onClick={() =>
                                  setAction({ appointment, type: "complete" })
                                }
                              >
                                <Check size={17} />
                                <span>Tamamla</span>
                              </button>
                              <button
                                className="staff-icon-button staff-cancel-button"
                                title="Randevuyu iptal et"
                                aria-label={`${customer?.name ?? "Müşteri"} randevusunu iptal et`}
                                onClick={() =>
                                  setAction({ appointment, type: "cancel" })
                                }
                              >
                                <X size={17} />
                              </button>
                            </>
                          ) : (
                            <span className="staff-action-done">—</span>
                          )}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="staff-empty">
                    <CalendarDays size={32} strokeWidth={1.3} />
                    <h3>
                      {query || status !== "all"
                        ? "Eşleşen randevu bulunamadı"
                        : "Takviminde biraz boşluk var"}
                    </h3>
                    <p>
                      {query || status !== "all"
                        ? "Aramayı veya durum filtresini değiştirebilirsin."
                        : "Yeni randevular alındığında burada görünecek."}
                    </p>
                  </div>
                )}
              </div>
              <div className="staff-panel-footer">
                <span>
                  <span className="staff-live-dot" /> Randevuların güncel
                </span>
                <span>
                  {selectedAppointments
                    .filter((item) => item.status !== "cancelled")
                    .reduce((total, item) => total + item.duration, 0)}{" "}
                  dakika toplam hizmet
                </span>
              </div>
            </section>
          )}

          {tab === "services" && (
            <form onSubmit={saveServices} className="staff-panel">
              <div className="staff-panel-heading">
                <div>
                  <h2>Hizmet menün</h2>
                  <p>
                    Ücret ve süreler yalnızca kendi randevuların için
                    geçerlidir.
                  </p>
                </div>
                <Scissors size={23} strokeWidth={1.5} />
              </div>
              <div className="staff-service-list">
                {services.map((draft, index) => {
                  const service = state.services.find(
                    (item) => item.id === draft.serviceId,
                  );
                  return (
                    <div
                      className={`staff-service-row ${!draft.enabled ? "is-disabled" : ""}`}
                      key={draft.serviceId}
                    >
                      <div className="staff-service-number">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="staff-service-description">
                        <h3>{service?.name ?? "Hizmet"}</h3>
                        <p>{service?.description}</p>
                      </div>
                      <label className="staff-form-field staff-price-field">
                        <span>Ücret (TL)</span>
                        <div className="staff-input-unit">
                          <input
                            className="input"
                            type="number"
                            min="1"
                            max="100000"
                            step="0.01"
                            required
                            value={draft.price}
                            aria-label={`${service?.name} ücreti`}
                            onChange={(event) =>
                              setServices((current) =>
                                current.map((item) =>
                                  item.serviceId === draft.serviceId
                                    ? { ...item, price: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                          <span>₺</span>
                        </div>
                      </label>
                      <label className="staff-form-field staff-duration-field">
                        <span>Süre (dk)</span>
                        <input
                          className="input"
                          type="number"
                          min="5"
                          max="480"
                          step="1"
                          required
                          value={draft.duration}
                          aria-label={`${service?.name} süresi`}
                          onChange={(event) =>
                            setServices((current) =>
                              current.map((item) =>
                                item.serviceId === draft.serviceId
                                  ? { ...item, duration: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="staff-toggle-label">
                        <input
                          className="staff-toggle"
                          type="checkbox"
                          checked={draft.enabled}
                          aria-label={`${service?.name} hizmetini etkinleştir`}
                          onChange={(event) =>
                            setServices((current) =>
                              current.map((item) =>
                                item.serviceId === draft.serviceId
                                  ? { ...item, enabled: event.target.checked }
                                  : item,
                              ),
                            )
                          }
                        />
                        <span>{draft.enabled ? "Aktif" : "Kapalı"}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="staff-form-footer">
                <p>Mevcut randevuların ücretleri değişmez.</p>
                <button className="button button-dark" type="submit">
                  <Check size={17} /> Değişiklikleri kaydet
                </button>
              </div>
            </form>
          )}

          {tab === "hours" && (
            <form onSubmit={saveHours} className="staff-panel">
              <div className="staff-panel-heading">
                <div>
                  <h2>Haftalık çalışma düzenin</h2>
                  <p>Kapalı günlerde ve mola saatlerinde randevu alınamaz.</p>
                </div>
                <Clock3 size={23} strokeWidth={1.5} />
              </div>
              <div className="staff-hours-labels">
                <span>GÜN</span>
                <span>ÇALIŞMA SAATLERİ</span>
                <span>MOLA SAATLERİ</span>
              </div>
              <div className="staff-hours-list">
                {[...hours]
                  .sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7))
                  .map((day) => (
                    <div
                      className={`staff-hours-row ${!day.enabled ? "is-disabled" : ""}`}
                      key={day.day}
                    >
                      <label className="staff-hours-day">
                        <input
                          type="checkbox"
                          className="staff-toggle"
                          checked={day.enabled}
                          aria-label={`${dayNames[day.day]} çalışıyorum`}
                          onChange={(event) =>
                            patchHour(day.day, {
                              enabled: event.target.checked,
                            })
                          }
                        />
                        <span>
                          {dayNames[day.day]}
                          <small>{day.enabled ? "Açık" : "İzin günü"}</small>
                        </span>
                      </label>
                      <div className="staff-time-range">
                        <label>
                          <span className="staff-mobile-label">Başlangıç</span>
                          <input
                            className="input"
                            type="time"
                            value={day.start}
                            disabled={!day.enabled}
                            required={day.enabled}
                            aria-label={`${dayNames[day.day]} mesai başlangıcı`}
                            onChange={(event) =>
                              patchHour(day.day, { start: event.target.value })
                            }
                          />
                        </label>
                        <span>–</span>
                        <label>
                          <span className="staff-mobile-label">Bitiş</span>
                          <input
                            className="input"
                            type="time"
                            value={day.end}
                            disabled={!day.enabled}
                            required={day.enabled}
                            aria-label={`${dayNames[day.day]} mesai bitişi`}
                            onChange={(event) =>
                              patchHour(day.day, { end: event.target.value })
                            }
                          />
                        </label>
                      </div>
                      <div className="staff-time-range staff-break-range">
                        <Coffee size={16} />
                        <label>
                          <span className="staff-mobile-label">Mola</span>
                          <input
                            className="input"
                            type="time"
                            value={day.breakStart}
                            disabled={!day.enabled}
                            aria-label={`${dayNames[day.day]} mola başlangıcı`}
                            onChange={(event) =>
                              patchHour(day.day, {
                                breakStart: event.target.value,
                              })
                            }
                          />
                        </label>
                        <span>–</span>
                        <label>
                          <span className="staff-mobile-label">
                            Mola bitişi
                          </span>
                          <input
                            className="input"
                            type="time"
                            value={day.breakEnd}
                            disabled={!day.enabled}
                            aria-label={`${dayNames[day.day]} mola bitişi`}
                            onChange={(event) =>
                              patchHour(day.day, {
                                breakEnd: event.target.value,
                              })
                            }
                          />
                        </label>
                        <button
                          className="staff-icon-button"
                          type="button"
                          disabled={
                            !day.enabled || (!day.breakStart && !day.breakEnd)
                          }
                          aria-label={`${dayNames[day.day]} molasını kaldır`}
                          onClick={() =>
                            patchHour(day.day, { breakStart: "", breakEnd: "" })
                          }
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="staff-form-footer">
                <p>Saatler Türkiye saatine göredir. Mola isteğe bağlıdır.</p>
                <button className="button button-dark" type="submit">
                  <Check size={17} /> Saatleri kaydet
                </button>
              </div>
            </form>
          )}

          {tab === "leaves" && (
            <div className="staff-leave-grid">
              <form
                className="staff-panel staff-leave-form"
                onSubmit={addLeave}
              >
                <div className="staff-panel-heading">
                  <div>
                    <h2>Yeni izin ekle</h2>
                    <p>Seçtiğin tarihler randevuya kapatılır.</p>
                  </div>
                  <CalendarOff size={23} strokeWidth={1.5} />
                </div>
                <div className="staff-form-body">
                  <label className="staff-form-field">
                    <span>Başlangıç tarihi</span>
                    <input
                      className="input"
                      type="date"
                      required
                      min={today}
                      value={leave.date}
                      onChange={(event) =>
                        setLeave((current) => ({
                          ...current,
                          date: event.target.value,
                          endDate:
                            current.endDate < event.target.value
                              ? event.target.value
                              : current.endDate,
                        }))
                      }
                    />
                  </label>
                  <label className="staff-form-field">
                    <span>
                      Bitiş tarihi <small>(bu gün dahil)</small>
                    </span>
                    <input
                      className="input"
                      type="date"
                      required
                      min={leave.date || today}
                      value={leave.endDate}
                      onChange={(event) =>
                        setLeave((current) => ({
                          ...current,
                          endDate: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="staff-form-field">
                    <span>Açıklama</span>
                    <input
                      className="input"
                      placeholder="Örn. Yıllık izin"
                      maxLength={120}
                      required
                      value={leave.reason}
                      onChange={(event) =>
                        setLeave((current) => ({
                          ...current,
                          reason: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="button button-dark">
                    <Plus size={17} /> İzin ekle
                  </button>
                </div>
              </form>
              <section className="staff-panel">
                <div className="staff-panel-heading">
                  <div>
                    <h2>
                      İzin takvimin{" "}
                      <span className="staff-count">{staff.leaves.length}</span>
                    </h2>
                    <p>Planladığın molalar, tek bir yerde.</p>
                  </div>
                </div>
                {staff.leaves.length ? (
                  <div className="staff-leave-list">
                    {[...staff.leaves]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((item) => (
                        <article className="staff-leave-item" key={item.id}>
                          <div className="staff-leave-icon">
                            <CalendarOff size={20} />
                          </div>
                          <div>
                            <h3>{item.reason}</h3>
                            <p>
                              {prettyDate(item.date)}
                              {item.endDate !== item.date &&
                                ` – ${prettyDate(item.endDate)}`}
                            </p>
                            <span>
                              {item.endDate < today
                                ? "Geçmiş izin"
                                : "Randevuya kapalı"}
                            </span>
                          </div>
                          <button
                            className="staff-icon-button staff-cancel-button"
                            aria-label={`${item.reason} iznini kaldır`}
                            onClick={() => {
                              const result = updateStaff(staff.id, {
                                leaves: staff.leaves.filter(
                                  (entry) => entry.id !== item.id,
                                ),
                              });
                              if (!result.ok) {
                                notify(result.error!, "error");
                                return;
                              }
                              notify(
                                "İzin kaldırıldı. Çalışma saatlerin yeniden randevuya açık.",
                              );
                            }}
                          >
                            <Trash2 size={17} />
                          </button>
                        </article>
                      ))}
                  </div>
                ) : (
                  <div className="staff-empty">
                    <Coffee size={35} strokeWidth={1.3} />
                    <h3>Henüz planlanmış iznin yok</h3>
                    <p>İlk iznini ekleyerek takviminde kendine yer aç.</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "profile" && (
            <div className="staff-profile-grid">
              <form className="staff-panel" onSubmit={saveProfile}>
                <div className="staff-panel-heading">
                  <div>
                    <h2>Profil bilgilerin</h2>
                    <p>Bu bilgiler müşteri tarafındaki profilinde görünür.</p>
                  </div>
                  <UserRound size={23} strokeWidth={1.5} />
                </div>
                <div className="staff-form-body">
                  <ProfilePhoto staff={staff} onNotice={notify} />
                  <label className="staff-form-field">
                    <span>Ad soyad</span>
                    <input
                      className="input"
                      required
                      minLength={2}
                      maxLength={60}
                      value={profile.name}
                      autoComplete="name"
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="staff-form-field">
                    <span>Uzmanlık / unvan</span>
                    <input
                      className="input"
                      required
                      minLength={2}
                      maxLength={80}
                      placeholder="Örn. Saç & sakal uzmanı"
                      value={profile.title}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="staff-form-field">
                    <span>Kısaca sen</span>
                    <textarea
                      className="input"
                      rows={5}
                      maxLength={500}
                      placeholder="Uzmanlığını ve tarzını müşterilerine anlat."
                      value={profile.bio}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          bio: event.target.value,
                        }))
                      }
                    />
                    <small>{profile.bio.length}/500 karakter</small>
                  </label>
                  <label className="staff-form-field">
                    <span>Hesap e-postası</span>
                    <input
                      className="input"
                      type="email"
                      value={user.email}
                      disabled
                    />
                    <small>Demo hesabına ait giriş adresin.</small>
                  </label>
                  <button className="button button-dark" type="submit">
                    <Check size={17} /> Profili kaydet
                  </button>
                </div>
              </form>
              <aside className="staff-profile-preview">
                <p className="eyebrow">PROFİL ÖNİZLEMESİ</p>
                <div
                  className="staff-preview-avatar"
                  style={{ background: staff.color }}
                >
                  {staff.photoUrl ? (
                    <img
                      className="profile-photo"
                      src={staff.photoUrl}
                      alt={`${staff.name} profil fotoğrafı`}
                    />
                  ) : (
                    profile.name
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                  )}
                </div>
                <h2>{profile.name || "Adın soyadın"}</h2>
                <span className="staff-profile-title">
                  {profile.title || "Uzmanlığın"}
                </span>
                <p>{profile.bio || "Müşterilerine kendinden biraz bahset."}</p>
                <div className="staff-profile-separator" />
                <span className="staff-profile-boss">
                  <Scissors size={18} /> BOSS ERKEK KUAFÖRÜ
                </span>
                <span className="staff-profile-location">Isparta, Merkez</span>
              </aside>
            </div>
          )}

          <footer className="staff-page-footer">
            <span>
              BOSS ERKEK KUAFÖRÜ <span>·</span> İşine odaklan, gerisini planla.
            </span>
            <span>
              <Users size={13} /> Kişisel çalışma alanın
            </span>
          </footer>
        </main>
      </div>

      {action && (
        <div
          className="staff-dialog-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setAction(null)
          }
        >
          <div
            className="staff-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-dialog-title"
            aria-describedby="staff-dialog-description"
            ref={dialogRef}
          >
            <div
              className={`staff-dialog-icon ${action.type === "cancel" ? "is-cancel" : ""}`}
            >
              {action.type === "cancel" ? (
                <CalendarOff size={25} />
              ) : (
                <CheckCheck size={25} />
              )}
            </div>
            <h2 id="staff-dialog-title">
              {action.type === "cancel"
                ? "Randevu iptal edilsin mi?"
                : "Randevu tamamlandı mı?"}
            </h2>
            <p id="staff-dialog-description">
              {
                state.users.find(
                  (person) => person.id === action.appointment.customerId,
                )?.name
              }{" "}
              · {prettyDate(action.appointment.date)}, {action.appointment.time}
              .{" "}
              {action.type === "cancel"
                ? "Bu saat yeniden randevuya açılacak."
                : "Hizmet tamamlandı olarak işaretlenecek ve kazancına eklenecek."}
            </p>
            <div className="staff-dialog-actions">
              <button
                className="button button-ghost"
                ref={cancelButtonRef}
                onClick={() => setAction(null)}
              >
                Vazgeç
              </button>
              <button
                className={`button ${action.type === "cancel" ? "staff-danger-button" : "button-dark"}`}
                onClick={() => {
                  if (action.type === "cancel")
                    cancelAppointment(action.appointment.id);
                  else completeAppointment(action.appointment.id);
                  notify(
                    action.type === "cancel"
                      ? "Randevu iptal edildi."
                      : "Randevu tamamlandı olarak işaretlendi.",
                  );
                  setAction(null);
                }}
              >
                {action.type === "cancel" ? "Evet, iptal et" : "Evet, tamamla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;
