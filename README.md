# tahaiyo-berber-randevu

## BOSS Erkek Kuaförü

Isparta'daki BOSS Erkek Kuaförü için Türkçe, mobil uyumlu randevu ve personel yönetimi demosu.

## Çalıştırma

Node.js 24 ve npm kullanılır. Projenin mevcut klasöründe çalışın:

```sh
npm ci
npm run dev
```

Uygulama `/tahaiyo-berber-randevu/` alt yolunda çalışır. Üretim çıktısı `npm run build` ile `dist/` içine yazılır; `npm run preview` ile kontrol edilebilir.

## Demo hesapları

Tüm hesapların parolası **boss123**. Giriş penceresinden bir test hesabı da seçilebilir.

| Rol      | Ad           | E-posta         |
| -------- | ------------ | --------------- |
| Personel | Emre Yılmaz  | emre@boss.demo  |
| Personel | Mert Kaya    | mert@boss.demo  |
| Personel | Can Demir    | can@boss.demo   |
| Müşteri  | Deniz Yıldız | deniz@boss.demo |
| Müşteri  | Ayşe Öz      | ayse@boss.demo  |
| Müşteri  | Arda Şahin   | arda@boss.demo  |

Müşteriler hizmet, personel, tarih ve uygun saat seçebilir; randevularını görüntüleyip iptal edebilir. Her personel kendi randevularını, hizmet ücret ve sürelerini, açık/kapalı günlerini, mola saatlerini, izin aralıklarını ve profilini yönetir. Çakışan randevular, mesai dışı saatler, molalar ve izin günleri rezervasyona kapalıdır.

Örnek randevular ilk açılıştaki tarihe göre oluşturulur. Ücretler, ekip üyeleri, müşteri bilgileri ve görsel demo amaçlıdır. Adres ve Google değerlendirme özeti kullanıcı tarafından sağlanmıştır; canlı Google bağlantısı yoktur. Kapak görseli yapay zekâyla üretilmiştir ve işletmenin gerçek fotoğrafı değildir. Yazı tipleri ve görsel uygulamayla birlikte sunulur.

## Verilerin kapsamı

Personel, **Profil ayarları → Fotoğraf ekle** üzerinden JPG, PNG veya WebP fotoğraf seçebilir (en fazla 10 MB). Kırpma penceresinde fotoğraf sürüklenebilir, yakınlaştırılabilir ve 90° döndürülebilir. **Kırp ve kaydet** onayından sonra yalnızca kırpılmış 512×512 JPEG kaydedilir; orijinal dosya saklanmaz. Fotoğraf ekip kartlarında, müşteri berber seçiminde ve personel profilinde görünür. Fotoğraf değişikliği anında kaydedilir; profil metinleri ayrıca **Profili kaydet** ile kaydedilir.

Bu ilk sürüm GitHub Pages üzerinde sunulabilen bir **yerel demodur**. Veriler tarayıcının localStorage alanında, oturum ise sekmeye özel sessionStorage alanında tutulur. Aynı tarayıcının sekmeleri arasında demo verileri güncellenir; farklı cihazlar arasında paylaşılmaz. Parolalar örnektir ve gerçek kimlik doğrulama sağlamaz. Gerçek rezervasyon, bildirim veya ödeme alınmaz. Gerçek müşterilerle kullanımdan önce sunucu, ortak veritabanı, güvenli kimlik doğrulama ve sunucuda yetki/çakışma kontrolü gerekir.

## Testler

```sh
npm test
npm run build
npm run test:e2e
```

İlk komut randevu kurallarını sınar. Tarayıcı testleri müşteri rezervasyonu/iptali, yenileme sonrası kalıcılık, personel ayrımı, ücret/mesai/izin ayarları ve mobil ekranları kapsar. Ortamda `/usr/bin/chromium` varsa testler onu kullanır; diğer makinelerde ilk kez `npx playwright install chromium` çalıştırın.

## GitHub Pages

`.github/workflows/deploy.yml`, `main` dalına gönderilen kodu test eder, derler ve GitHub Pages'e dağıtır. Depoda bir kez **Settings → Pages → Build and deployment → Source: GitHub Actions** seçilmelidir. Ardından **Actions → Deploy BOSS to GitHub Pages → Run workflow → main** ile dağıtım başlatılabilir.

Dağıtım başarılı olduğunda adres: `https://9toto5.github.io/tahaiyo-berber-randevu/`.

GitHub Pages sadece statik dosyaları barındırır; farklı cihazların ortak randevu verilerini saklamak için ayrıca bir arka uç gerekir.
