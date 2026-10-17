import { expect, test, type Page } from '@playwright/test';

const monday = '2026-10-19';
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-19T05:00:00Z') });
  await page.goto('./');
});

async function login(page: Page, email: string, staff = false) {
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  const dialog = page.getByRole('dialog');
  if (staff) await dialog.getByRole('button', { name: 'Personel girişi', exact: true }).click();
  await dialog.getByLabel('E-posta adresi').fill(email);
  await dialog.getByLabel('Parola', { exact: true }).fill('boss123');
  await dialog.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

test('customer books, keeps the reservation after reload and cancels it', async ({ page }) => {
  await page.locator('.booking-services').getByRole('button').filter({ hasText: 'Saç & sakal' }).click();
  await page.locator('.booking-staff-list').getByRole('button').filter({ hasText: 'Mert Kaya' }).click();
  await page.getByLabel('Randevu tarihi', { exact: true }).fill(monday);
  await page.locator('.booking-slots').getByRole('button', { name: '09:00', exact: true }).click();
  await page.getByLabel('Bilmemizi istediğin bir şey var mı?').fill('Test rezervasyonu');
  await page.getByRole('button', { name: 'Giriş yap ve randevu al' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await expect(page.locator('.booking-slots .is-selected')).toHaveText('09:00');
  await page.getByRole('button', { name: 'Randevumu oluştur' }).click();
  await expect(page.getByRole('heading', { name: 'Randevun hazır.' })).toBeVisible();
  await page.getByRole('link', { name: 'Randevularımı gör' }).click();
  let card = page.locator('.account-appointment').filter({ hasText: 'Test rezervasyonu' });
  await expect(card).toContainText('Mert Kaya');
  await expect(card).toContainText('09:00 · 60 dk');
  await page.reload();
  card = page.locator('.account-appointment').filter({ hasText: 'Test rezervasyonu' });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Randevuyu iptal et' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Evet, iptal et' }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole('tab', { name: /Geçmiş & iptal edilen/ }).click();
  await expect(page.locator('.account-appointment').filter({ hasText: 'Test rezervasyonu' })).toContainText('İptal edildi');
});

test('staff prices, working hours and leave change only that staff’s availability', async ({ page }) => {
  await login(page, 'emre@boss.demo', true);
  await expect(page.getByRole('heading', { name: 'Merhaba, Emre.' })).toBeVisible();
  await page.getByRole('button', { name: 'Hizmetler & ücretler', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Saç kesimi ücreti', exact: true }).fill('515');
  await page.getByRole('spinbutton', { name: 'Saç kesimi süresi', exact: true }).fill('45');
  await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
  await expect(page.getByRole('status')).toContainText('kaydedildi');
  await page.getByRole('button', { name: 'Çalışma saatlerim', exact: true }).click();
  await page.getByLabel('Pazartesi mesai başlangıcı', { exact: true }).fill('10:00');
  await page.getByRole('button', { name: 'Saatleri kaydet' }).click();
  await expect(page.getByRole('status')).toContainText('kaydedildi');
  await page.getByRole('button', { name: 'İzinlerim', exact: true }).click();
  await page.getByLabel('Başlangıç tarihi', { exact: true }).fill('2026-10-28');
  await page.getByLabel(/Bitiş tarihi/).fill('2026-10-29');
  await page.getByLabel('Açıklama', { exact: true }).fill('Test izni');
  await page.getByRole('button', { name: 'İzin ekle', exact: true }).click();
  await expect(page.locator('.staff-leave-item')).toContainText('Test izni');
  await page.getByRole('button', { name: 'Müşteri görünümüne dön' }).click();
  await expect(page.locator('.booking-summary-total')).toContainText('515');
  await expect(page.locator('.booking-slots').getByRole('button', { name: '09:00', exact: true })).toHaveCount(0);
  await page.getByLabel('Randevu tarihi', { exact: true }).fill('2026-10-28');
  await expect(page.locator('.booking-no-slots')).toBeVisible();
  await page.locator('.booking-staff-list').getByRole('button').filter({ hasText: 'Mert Kaya' }).click();
  await expect(page.locator('.booking-slots').getByRole('button', { name: '09:00', exact: true })).toBeVisible();
  await expect(page.locator('.booking-summary-total')).toContainText('400');
});

test('staff sees only own customers and can finish an appointment', async ({ page }) => {
  await login(page, 'emre@boss.demo', true);
  await expect(page.locator('.staff-appointment')).toHaveCount(2);
  await expect(page.locator('.staff-appointments-list')).not.toContainText('Ayşe Öz');
  await page.getByRole('button', { name: 'Deniz Yıldız randevusunu tamamla' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Evet, tamamla' }).click();
  await expect(page.locator('.staff-appointment').filter({ hasText: 'Deniz Yıldız' })).toContainText('Tamamlandı');
  await expect(page.locator('.staff-stat-highlight')).toContainText('600');
  await page.getByRole('button', { name: 'Hesaptan çıkış yap' }).click();
  await login(page, 'mert@boss.demo', true);
  await expect(page.locator('.staff-appointment')).toHaveCount(2);
  await expect(page.locator('.staff-appointments-list')).toContainText('Ayşe Öz');
  await expect(page.locator('.staff-appointments-list')).not.toContainText('Deniz Yıldız');
});

test('mobile navigation and staff settings fit the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.hero-photo')).toBeVisible();
  expect(await page.locator('.hero-photo').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.getByRole('button', { name: 'Menüyü aç' }).click();
  await page.getByRole('navigation', { name: 'Mobil menü' }).getByRole('button', { name: 'Ekibimiz' }).click();
  await page.getByRole('button', { name: 'Can Demir için randevu al' }).click();
  await expect(page.locator('.booking-staff.is-selected')).toContainText('Can Demir');
  await login(page, 'can@boss.demo', true);
  for (const name of ['Genel bakış', 'Hizmetler & ücretler', 'Çalışma saatlerim', 'İzinlerim', 'Profil ayarları']) {
    await page.getByRole('button', { name, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name).toBeTruthy();
  }
});
