import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { useSalon } from "../store";
import type { Staff } from "../types";
import PhotoCropper from "./PhotoCropper";

export default function ProfilePhoto({
  staff,
  onNotice,
}: {
  staff: Staff;
  onNotice: (message: string, kind?: "success" | "error") => void;
}) {
  const { updateStaff } = useSalon();
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source);
    },
    [source],
  );

  async function selectPhoto(file?: File) {
    setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("JPG, PNG veya WebP biçiminde bir fotoğraf seçin.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Fotoğraf en fazla 10 MB olabilir. Daha küçük bir dosya seçin.");
      return;
    }
    const url = URL.createObjectURL(file);
    setLoading(true);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!mounted.current) {
        URL.revokeObjectURL(url);
        return;
      }
      if (image.naturalWidth * image.naturalHeight > 40_000_000) {
        URL.revokeObjectURL(url);
        setError(
          "Fotoğraf en fazla 40 megapiksel olabilir. Daha düşük çözünürlüklü bir fotoğraf seçin.",
        );
        return;
      }
      setSource(url);
    } catch {
      URL.revokeObjectURL(url);
      if (mounted.current)
        setError(
          "Bu fotoğraf açılamadı. Farklı bir JPG, PNG veya WebP dosyası seçin.",
        );
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  return (
    <div className="profile-photo-settings">
      <div className="profile-photo-settings-top">
        <div
          className="profile-photo-editor-avatar"
          style={{ background: staff.color }}
        >
          {staff.photoUrl ? (
            <img
              className="profile-photo"
              src={staff.photoUrl}
              alt={`${staff.name} profil fotoğrafı`}
            />
          ) : (
            staff.initials
          )}
        </div>
        <div>
          <h3>Profil fotoğrafın</h3>
          <p>Müşteriler randevu alırken seni bu fotoğrafla tanısın.</p>
          <div className="profile-photo-buttons">
            <button
              type="button"
              className="button button-ghost"
              disabled={loading}
              onClick={() => input.current?.click()}
            >
              <Camera size={16} />
              {loading
                ? "Fotoğraf açılıyor…"
                : staff.photoUrl
                  ? "Fotoğrafı değiştir"
                  : "Fotoğraf ekle"}
            </button>
            {staff.photoUrl && (
              <button
                type="button"
                className="photo-remove"
                onClick={() => {
                  const result = updateStaff(staff.id, { photoUrl: undefined });
                  if (result.ok) {
                    setError("");
                    onNotice("Profil fotoğrafınız kaldırıldı.");
                  } else setError(result.error || "Fotoğraf kaldırılamadı.");
                }}
              >
                <Trash2 size={15} />
                Kaldır
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        className="photo-file-input"
        aria-label="Profil fotoğrafı seç"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void selectPhoto(file);
        }}
      />
      <p className="profile-photo-hint">
        JPG, PNG veya WebP · En fazla 10 MB. Kaydetmeden önce kadrajı sen
        belirlersin.
      </p>
      {error && (
        <p className="photo-error" role="alert">
          {error}
        </p>
      )}
      {source && (
        <PhotoCropper
          source={source}
          onClose={() => setSource(null)}
          onSave={(photo) => {
            const result = updateStaff(staff.id, { photoUrl: photo });
            if (result.ok)
              onNotice(
                "Profil fotoğrafınız kaydedildi. Müşteriler berber seçiminde görebilir.",
              );
            return result;
          }}
        />
      )}
    </div>
  );
}
