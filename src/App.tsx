import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronRight, Clock3, Leaf, LogOut, MapPin, Menu, Scissors, ShieldCheck, Sparkles, Star, UserRound, Users, X } from 'lucide-react';
import { useSalon, formatMoney } from './store';
import Booking from './components/Booking';
import MyAppointments from './components/MyAppointments';
import StaffDashboard from './components/StaffDashboard';
import LoginModal from './components/LoginModal';

const mapLink = 'https://www.google.com/maps/search/?api=1&query=BOSS+Erkek+Kuaf%C3%B6r%C3%BC+Hilmi+%C3%87akmak%C3%A7%C4%B1+Caddesi+194+Isparta';
const readPage = () => window.location.hash === '#panel' ? 'staff' : window.location.hash === '#randevularim' ? 'appointments' : 'home';

export default function App() {
  const { state, user, logout } = useSalon();
  const [page, setPage] = useState(readPage);
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [allServices, setAllServices] = useState(false);
  const [selectedService, setSelectedService] = useState<string>();
  const [selectedStaff, setSelectedStaff] = useState<string>();
  const [selectionKey, setSelectionKey] = useState(0);
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  useEffect(() => { const handle = () => setPage(readPage()); window.addEventListener('hashchange', handle); return () => window.removeEventListener('hashchange', handle); }, []);
  function navigate(next: 'home' | 'appointments' | 'staff') {
    window.location.hash = next === 'home' ? 'anasayfa' : next === 'staff' ? 'panel' : 'randevularim';
    setPage(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function goTo(id: string, serviceId?: string, staffId?: string) {
    if (serviceId) setSelectedService(serviceId);
    if (staffId) setSelectedStaff(staffId);
    if (serviceId || staffId) setSelectionKey(value => value + 1);
    if (page !== 'home') navigate('home');
    setMenuOpen(false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }
  const handleLoginSuccess = (role: 'staff' | 'customer') => { setLoginOpen(false); if (role === 'staff') navigate('staff'); };

  return <>
    {page === 'staff' && user?.role === 'staff' ? <StaffDashboard onBack={() => navigate('home')} /> : <>
      <div className="announcement"><span>İyi bir kesim, iyi bir gün.</span><span><span className="status-dot" /> ISPARTA, MERKEZ <span className="announcement-divider">/</span> <span className="demo-label">DEMO DENEYİMİ</span></span></div>
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => navigate('home')} aria-label="BOSS ana sayfa"><span className="brand-name">BOSS<span className="brand-dot">®</span></span><span className="brand-tagline">ERKEK KUAFÖRÜ</span></button>
          <nav className="desktop-nav" aria-label="Ana menü">
            <button className={page === 'home' ? 'active' : ''} onClick={() => navigate('home')}>Ana sayfa</button>
            <button onClick={() => goTo('hizmetler')}>Hizmetler</button>
            <button onClick={() => goTo('ekibimiz')}>Ekibimiz</button>
            <button onClick={() => goTo('iletisim')}>İletişim</button>
          </nav>
          <div className="header-actions">
            {user ? <div className="signed-in-actions"><button className="account-button" aria-label={user.role === 'staff' ? 'Personel paneli' : 'Randevularım'} onClick={() => navigate(user.role === 'staff' ? 'staff' : 'appointments')}><UserRound size={17} /><span>{user.role === 'staff' ? 'Personel paneli' : 'Randevularım'}</span></button><button className="icon-button logout-button" onClick={() => { logout(); navigate('home'); }} title="Çıkış yap" aria-label="Çıkış yap"><LogOut size={17} /></button></div> : <button className="account-button" aria-label="Giriş yap" onClick={() => setLoginOpen(true)}><UserRound size={18} /><span>Giriş yap</span></button>}
            <button className="button button-dark header-book" onClick={() => goTo('randevu')}>Randevu al <ArrowUpRight size={17} /></button>
            <button className="icon-button menu-toggle" aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
        {menuOpen && <nav className="mobile-nav" aria-label="Mobil menü"><button onClick={() => navigate('home')}>Ana sayfa</button><button onClick={() => goTo('hizmetler')}>Hizmetler</button><button onClick={() => goTo('ekibimiz')}>Ekibimiz</button><button onClick={() => goTo('iletisim')}>İletişim</button><button onClick={() => user ? navigate(user.role === 'staff' ? 'staff' : 'appointments') : setLoginOpen(true)}>{user ? 'Hesabım' : 'Giriş yap'}</button></nav>}
      </header>
      <main>
        {page === 'home' ? <>
          <section className="hero page-container" aria-labelledby="hero-title">
            <div className="hero-content">
              <p className="eyebrow"><span className="eyebrow-line" /> SENİN TARZIN. SENİN ZAMANIN.</p>
              <h1 id="hero-title">Tarzına<br /><span>zaman ayır.</span><span className="hero-spark">✳</span></h1>
              <p className="hero-description">İyi görünmenin verdiği o his.<br />Usta eller, özenli detaylar ve tamamen sana ayrılan bir zaman. BOSS'ta yerin hazır.</p>
              <div className="hero-buttons"><button className="button button-primary" onClick={() => goTo('randevu')}>Randevunu oluştur <ArrowUpRight size={20} /></button><button className="text-button" onClick={() => goTo('hizmetler')}>Hizmetleri keşfet <ArrowDown size={16} /></button></div>
              <div className="hero-social-proof"><div className="avatar-stack"><span>AY</span><span>MK</span><span>ED</span><span>+60</span></div><div><div className="rating-stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill="currentColor" />)}<strong>4,6 <span>/ 5</span></strong></div><p>Google'da 60 değerlendirme</p></div></div>
            </div>
            <div className="hero-visual">
              <img className="hero-photo" src={`${import.meta.env.BASE_URL}images/barbershop.png`} alt="Özenli saç kesimi ve berber deneyimini gösteren temsili görsel" fetchPriority="high" />
              <div className="hero-photo-shade" />
              <span className="hero-image-label"><span /> HER DETAYDA ÖZEN</span>
              <div className="hero-photo-caption"><span>BOSS EXPERIENCE</span><p>Bir kesimden<br />daha fazlası.</p><span className="photo-note">Temsili görsel</span></div>
              <button className="hero-round-link" onClick={() => goTo('randevu')} aria-label="Randevu bölümüne git"><ArrowUpRight size={28} /></button>
              <div className="floating-detail"><span className="floating-icon"><Scissors size={23} /></span><div><strong>Ustalık, detayda gizli.</strong><span>Sana yakışanı birlikte bulalım.</span></div><Check size={17} /></div>
            </div>
          </section>
          <div className="benefits page-container"><div><CalendarDays /><span><strong>Bir dakikada randevu</strong><small>Sana uyan saati kolayca seç.</small></span></div><div><Scissors /><span><strong>İşinin ustası bir ekip</strong><small>Tarzını anlayan, deneyimli eller.</small></span></div><div><ShieldCheck /><span><strong>Özenli ve hijyenik</strong><small>Her ziyaretinde aynı hassasiyet.</small></span></div><span className="benefit-signature">LOOK GOOD.<br /><strong>FEEL GOOD.</strong></span></div>
          <section className="services-section page-container" id="hizmetler">
            <div className="section-heading"><div><p className="eyebrow">BAKIMININ HER DETAYI</p><h2>Sana iyi gelen hizmetler.</h2></div><button className="text-button" onClick={() => setAllServices(!allServices)}>{allServices ? 'Daha az göster' : 'Tüm hizmetleri gör'} <ArrowUpRight size={18} /></button></div>
            <div className="service-grid">{state.services.slice(0, allServices ? undefined : 4).map((service, index) => {
              const offers = state.staff.flatMap(person => person.services.filter(item => item.serviceId === service.id && item.enabled));
              const price = offers.length ? Math.min(...offers.map(offer => offer.price)) : service.basePrice;
              const Icon = index === 1 ? Sparkles : index === 2 ? Users : index === 3 ? Leaf : Scissors;
              return <button className="service-card" key={service.id} onClick={() => goTo('randevu', service.id)}><div className="service-card-top"><span className="service-icon"><Icon size={26} strokeWidth={1.35} /></span><span className="service-number">0{index + 1}</span></div><h3>{service.name}</h3><p>{service.description}</p><div className="service-card-bottom"><span><strong>{formatMoney(price)}</strong><small>başlangıç fiyatı</small></span><span className="service-duration"><Clock3 size={13} /> {service.duration} dk</span><span className="service-arrow"><ArrowUpRight size={19} /></span></div></button>;
            })}</div>
            <p className="sample-prices">Gösterilen hizmet ücretleri ve ekip bilgileri demo amaçlıdır.</p>
          </section>
          <section className="booking-section" id="randevu"><div className="page-container"><Booking initialServiceId={selectedService} initialStaffId={selectedStaff} selectionKey={selectionKey} onRequireLogin={() => setLoginOpen(true)} /></div></section>
          <section className="team-section page-container" id="ekibimiz"><div className="team-intro"><p className="eyebrow">BOSS EKİBİ</p><h2>Ustanı seç.<br />Rahatına bak.</h2><p>Tarzını tanıyan bir usta, her seferinde içine sinen bir sonuç. Ekibimizle tanış.</p><div className="team-mini-label"><Scissors size={16} /> Her detayda BOSS dokunuşu</div></div><div className="team-grid">{state.staff.map((person, index) => <div className="team-card" key={person.id}><div className={`team-portrait portrait-${index}`}><span className="portrait-letter">{person.initials}</span><Scissors className="portrait-scissors" strokeWidth={.6} /><span className="team-demo-badge">DEMO PERSONEL</span></div><div className="team-card-info"><div><h3>{person.name}</h3><p>{person.title}</p></div><button className="icon-button" onClick={() => goTo('randevu', undefined, person.id)} aria-label={`${person.name} için randevu al`}><ArrowUpRight size={20} /></button></div></div>)}</div></section>
          <section className="contact-section page-container" id="iletisim"><div className="contact-card"><div className="contact-copy"><p className="eyebrow">YOLUN BOSS'A DÜŞSÜN</p><h2>Isparta'da,<br />tam da yerinde.</h2><p><MapPin size={20} /><span>Hilmi Çakmakçı Caddesi, No: 194<br />32200 Merkez / Isparta</span></p><a className="button button-dark" href={mapLink} target="_blank" rel="noreferrer">Yol tarifi al <ArrowUpRight size={17} /></a></div><div className="contact-graphic"><div className="map-street street-one" /><div className="map-street street-two" /><div className="map-street street-three" /><span className="map-label map-label-one">ISPARTA MERKEZ</span><span className="map-label map-label-two">HİLMİ ÇAKMAKÇI CADDESİ</span><div className="map-boss"><MapPin size={26} /><strong>BOSS</strong><span>ERKEK KUAFÖRÜ</span></div><span className="map-footnote">Konum şeması · Tam adres için yol tarifini aç</span></div></div></section>
        </> : <section className="appointments-page page-container"><MyAppointments onBook={() => goTo('randevu')} onRequireLogin={() => setLoginOpen(true)} /></section>}
      </main>
      <footer className="site-footer page-container"><div className="footer-top"><button className="brand" onClick={() => navigate('home')}><span className="brand-name">BOSS<span className="brand-dot">®</span></span><span className="brand-tagline">ERKEK KUAFÖRÜ</span></button><p>İyi görün. İyi hisset. Kendin ol.</p><button className="text-button" onClick={() => user?.role === 'staff' ? navigate('staff') : setLoginOpen(true)}>Personel girişi <ChevronRight size={16} /></button></div><div className="footer-bottom"><span>© {new Date().getFullYear()} BOSS Erkek Kuaförü</span><span>Demo sürüm · Veriler bu tarayıcıda saklanır.</span><span>Isparta'da özenle.</span></div></footer>
    </>}
    {loginOpen && <LoginModal onClose={closeLogin} onSuccess={handleLoginSuccess} />}
  </>;
}
