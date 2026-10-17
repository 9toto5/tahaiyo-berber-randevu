import { expect, test, type Page } from "@playwright/test";

const monday = "2026-10-19";
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-19T05:00:00Z") });
  await page.goto("./");
});

async function login(page: Page, email: string, staff = false) {
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  const dialog = page.getByRole("dialog");
  if (staff)
    await dialog
      .getByRole("button", { name: "Personel girişi", exact: true })
      .click();
  await dialog.getByLabel("E-posta adresi").fill(email);
  await dialog.getByLabel("Parola", { exact: true }).fill("boss123");
  await dialog.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

async function selectTestPhoto(page: Page) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 600;
    const context = canvas.getContext("2d")!;
    for (const [index, color] of ["#ff0000", "#00aa00", "#0000ff"].entries()) {
      context.fillStyle = color;
      context.fillRect(index * 400, 0, 400, 600);
    }
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Profil fotoğrafı seç", { exact: true }).setInputFiles({
    name: "test-portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(base64, "base64"),
  });
  await expect(
    page.getByRole("dialog", { name: "Fotoğrafını kırp." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Kırp ve kaydet" }),
  ).toBeEnabled();
}

test("customer books, keeps the reservation after reload and cancels it", async ({
  page,
}) => {
  await page
    .locator(".booking-services")
    .getByRole("button")
    .filter({ hasText: "Saç & sakal" })
    .click();
  await page
    .locator(".booking-staff-list")
    .getByRole("button")
    .filter({ hasText: "Mert Kaya" })
    .click();
  await page.getByLabel("Randevu tarihi", { exact: true }).fill(monday);
  await page
    .locator(".booking-slots")
    .getByRole("button", { name: "09:00", exact: true })
    .click();
  await page
    .getByLabel("Bilmemizi istediğin bir şey var mı?")
    .fill("Test rezervasyonu");
  await page.getByRole("button", { name: "Giriş yap ve randevu al" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Giriş yap", exact: true })
    .click();
  await expect(page.locator(".booking-slots .is-selected > span")).toHaveText(
    "09:00",
  );
  await page.getByRole("button", { name: "Randevumu oluştur" }).click();
  await expect(
    page.getByRole("heading", { name: "Randevun hazır." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Randevularımı gör" }).click();
  let card = page
    .locator(".account-appointment")
    .filter({ hasText: "Test rezervasyonu" });
  await expect(card).toContainText("Mert Kaya");
  await expect(card).toContainText("09:00 · 60 dk");
  await page.reload();
  card = page
    .locator(".account-appointment")
    .filter({ hasText: "Test rezervasyonu" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Randevuyu iptal et" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Evet, iptal et" })
    .click();
  await expect(card).toHaveCount(0);
  await page.getByRole("tab", { name: /Geçmiş & iptal edilen/ }).click();
  await expect(
    page
      .locator(".account-appointment")
      .filter({ hasText: "Test rezervasyonu" }),
  ).toContainText("İptal edildi");
});

test("booking shows occupied times as disabled and cancellation releases the slot", async ({
  page,
}) => {
  const slots = page.locator(".booking-slots");
  await expect(slots.getByRole("button")).toHaveCount(26);
  await expect(
    slots.getByRole("button", { name: "10:00 · Dolu", exact: true }),
  ).toBeVisible();
  await expect(
    slots.getByRole("button", { name: "10:00 · Dolu", exact: true }),
  ).toBeDisabled();
  await expect(
    slots.getByRole("button", { name: "10:30 · Dolu", exact: true }),
  ).toBeDisabled();
  await expect(
    slots.getByRole("button", { name: "13:00 · Mola", exact: true }),
  ).toBeDisabled();
  await expect(
    slots.getByRole("button", { name: "09:00", exact: true }),
  ).toBeEnabled();
  await page
    .locator(".booking-services")
    .getByRole("button")
    .filter({ hasText: "Saç & sakal" })
    .click();
  await expect(
    slots.getByRole("button", { name: "09:30 · Dolu", exact: true }),
  ).toBeDisabled();
  await expect(
    slots.getByRole("button", { name: "12:30 · Mola", exact: true }),
  ).toBeDisabled();
  await expect(
    slots.getByRole("button", { name: "21:30 · Süre yetmez", exact: true }),
  ).toBeDisabled();
  await login(page, "emre@boss.demo", true);
  await page
    .getByRole("button", {
      name: "Deniz Yıldız randevusunu iptal et",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Evet, iptal et", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Müşteri görünümüne dön", exact: true })
    .click();
  await expect(
    slots.getByRole("button", { name: "10:00", exact: true }),
  ).toBeEnabled();
  await expect(
    slots.getByRole("button", { name: "11:30 · Dolu", exact: true }),
  ).toBeDisabled();
});

test("staff prices, working hours and leave change only that staff’s availability", async ({
  page,
}) => {
  await login(page, "emre@boss.demo", true);
  await expect(
    page.getByRole("heading", { name: "Merhaba, Emre." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hizmetler & ücretler", exact: true })
    .click();
  await page
    .getByRole("spinbutton", { name: "Saç kesimi ücreti", exact: true })
    .fill("515");
  await page
    .getByRole("spinbutton", { name: "Saç kesimi süresi", exact: true })
    .fill("45");
  await page.getByRole("button", { name: "Değişiklikleri kaydet" }).click();
  await expect(page.getByRole("status")).toContainText("kaydedildi");
  await page
    .getByRole("button", { name: "Çalışma saatlerim", exact: true })
    .click();
  await page
    .getByLabel("Pazartesi mesai başlangıcı", { exact: true })
    .fill("10:00");
  await page.getByRole("button", { name: "Saatleri kaydet" }).click();
  await expect(page.getByRole("status")).toContainText("kaydedildi");
  await page.getByRole("button", { name: "İzinlerim", exact: true }).click();
  await page.getByLabel("Başlangıç tarihi", { exact: true }).fill("2026-10-28");
  await page.getByLabel(/Bitiş tarihi/).fill("2026-10-29");
  await page.getByLabel("Açıklama", { exact: true }).fill("Test izni");
  await page.getByRole("button", { name: "İzin ekle", exact: true }).click();
  await expect(page.locator(".staff-leave-item")).toContainText("Test izni");
  await page.getByRole("button", { name: "Müşteri görünümüne dön" }).click();
  await expect(page.locator(".booking-summary-total")).toContainText("515");
  await expect(
    page
      .locator(".booking-slots")
      .getByRole("button", { name: "09:00", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Randevu tarihi", { exact: true }).fill("2026-10-28");
  await expect(page.locator(".booking-no-slots")).toBeVisible();
  await page
    .locator(".booking-staff-list")
    .getByRole("button")
    .filter({ hasText: "Mert Kaya" })
    .click();
  await expect(
    page
      .locator(".booking-slots")
      .getByRole("button", { name: "09:00", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".booking-summary-total")).toContainText("400");
});

test("staff sees only own customers and can finish an appointment", async ({
  page,
}) => {
  await login(page, "emre@boss.demo", true);
  await expect(page.locator(".staff-appointment")).toHaveCount(2);
  await expect(page.locator(".staff-appointments-list")).not.toContainText(
    "Ayşe Öz",
  );
  await page
    .getByRole("button", { name: "Deniz Yıldız randevusunu tamamla" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Evet, tamamla" })
    .click();
  await expect(
    page.locator(".staff-appointment").filter({ hasText: "Deniz Yıldız" }),
  ).toContainText("Tamamlandı");
  await expect(page.locator(".staff-stat-highlight")).toContainText("600");
  await page.getByRole("button", { name: "Hesaptan çıkış yap" }).click();
  await login(page, "mert@boss.demo", true);
  await expect(page.locator(".staff-appointment")).toHaveCount(2);
  await expect(page.locator(".staff-appointments-list")).toContainText(
    "Ayşe Öz",
  );
  await expect(page.locator(".staff-appointments-list")).not.toContainText(
    "Deniz Yıldız",
  );
});

test("mobile navigation and staff settings fit the screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".hero-photo")).toBeVisible();
  expect(
    await page
      .locator(".hero-photo")
      .evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
  ).toBeTruthy();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Menüyü aç" }).click();
  await page
    .getByRole("navigation", { name: "Mobil menü" })
    .getByRole("button", { name: "Ekibimiz" })
    .click();
  await page.getByRole("button", { name: "Can Demir için randevu al" }).click();
  await expect(page.locator(".booking-staff.is-selected")).toContainText(
    "Can Demir",
  );
  await login(page, "can@boss.demo", true);
  for (const name of [
    "Genel bakış",
    "Hizmetler & ücretler",
    "Çalışma saatlerim",
    "İzinlerim",
    "Profil ayarları",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      name,
    ).toBeTruthy();
  }
});

test("staff explicitly crops a photo and customers see the persisted square result", async ({
  page,
}) => {
  await login(page, "emre@boss.demo", true);
  await page
    .getByRole("button", { name: "Profil ayarları", exact: true })
    .click();
  await selectTestPhoto(page);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("boss-salon-demo-v1")!).staff[0]
          .photoUrl,
    ),
  ).toBeUndefined();
  await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(page.locator(".staff-preview-avatar img")).toHaveCount(0);
  await selectTestPhoto(page);
  await page.getByRole("slider", { name: "Yakınlaştır", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(page.locator(".photo-crop-zoom output")).toHaveText("%300");
  await page.getByRole("button", { name: "Kırp ve kaydet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const photo = await page
    .locator(".staff-preview-avatar img")
    .getAttribute("src");
  expect(photo).toMatch(/^data:image\/jpeg;base64,/);
  const result = await page.evaluate(async (source) => {
    const image = new Image();
    image.src = source!;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      center: [...context.getImageData(256, 256, 1, 1).data],
      edge: [...context.getImageData(10, 256, 1, 1).data],
    };
  }, photo);
  expect(result.width).toBe(512);
  expect(result.height).toBe(512);
  for (const pixel of [result.center, result.edge]) {
    expect(pixel[1]).toBeGreaterThan(150);
    expect(pixel[0]).toBeLessThan(10);
    expect(pixel[2]).toBeLessThan(10);
  }
  await page.reload();
  await page
    .getByRole("button", { name: "Profil ayarları", exact: true })
    .click();
  await expect(page.locator(".staff-preview-avatar img")).toHaveAttribute(
    "src",
    photo!,
  );
  await page.getByRole("button", { name: "Müşteri görünümüne dön" }).click();
  const emre = page
    .locator(".booking-staff")
    .filter({ hasText: "Emre Yılmaz" });
  await expect(emre.locator("img.profile-photo")).toHaveAttribute(
    "src",
    photo!,
  );
  await expect(
    page
      .locator(".team-card")
      .filter({ hasText: "Emre Yılmaz" })
      .locator("img.profile-photo"),
  ).toHaveAttribute("src", photo!);
  await expect(
    page
      .locator(".booking-staff")
      .filter({ hasText: "Mert Kaya" })
      .locator("img.profile-photo"),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Personel paneli", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Profil ayarları", exact: true })
    .click();
  await page.getByRole("button", { name: "Kaldır", exact: true }).click();
  await expect(page.locator(".staff-preview-avatar img")).toHaveCount(0);
  await page.getByRole("button", { name: "Müşteri görünümüne dön" }).click();
  await expect(emre.locator("img.profile-photo")).toHaveCount(0);
  await page.reload();
  await expect(emre.locator("img.profile-photo")).toHaveCount(0);
});

test("mobile photo editing handles rotation, invalid images and storage failure", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "emre@boss.demo", true);
  await page
    .getByRole("button", { name: "Profil ayarları", exact: true })
    .click();
  await page.getByLabel("Profil fotoğrafı seç", { exact: true }).setInputFiles({
    name: "not-a-photo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
  });
  await expect(page.getByRole("alert")).toContainText("JPG, PNG veya WebP");
  await page.getByLabel("Profil fotoğrafı seç", { exact: true }).setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("invalid image"),
  });
  await expect(page.getByRole("alert")).toContainText("fotoğraf açılamadı");
  await selectTestPhoto(page);
  const dialog = page.getByRole("dialog", { name: "Fotoğrafını kırp." });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await dialog.getByRole("button", { name: "90° döndür" }).click();
  await dialog.getByRole("button", { name: "Kırp ve kaydet" }).click();
  await expect(dialog).not.toBeVisible();
  const original = await page
    .locator(".staff-preview-avatar img")
    .getAttribute("src");
  const rotated = await page.evaluate(async (source) => {
    const image = new Image();
    image.src = source!;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    return {
      top: [...context.getImageData(256, 10, 1, 1).data],
      bottom: [...context.getImageData(256, 501, 1, 1).data],
    };
  }, original);
  expect(rotated.top[0]).toBeGreaterThan(240);
  expect(rotated.bottom[2]).toBeGreaterThan(240);
  await selectTestPhoto(page);
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "boss-salon-demo-v1")
        throw new DOMException("full", "QuotaExceededError");
      return setItem.call(this, key, value);
    };
  });
  await dialog.getByRole("button", { name: "Kırp ve kaydet" }).click();
  await expect(dialog.getByRole("alert")).toContainText("kaydedilemedi");
  await expect(page.locator(".staff-preview-avatar img")).toHaveAttribute(
    "src",
    original!,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Profil ayarları", exact: true })
    .click();
  await expect(page.locator(".staff-preview-avatar img")).toHaveAttribute(
    "src",
    original!,
  );
});
