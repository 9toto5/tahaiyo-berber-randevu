import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import {
  Check,
  Crop,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "./photo.css";

async function croppedPhoto(source: string, crop: Area, rotation: number) {
  const image = new Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context || crop.width <= 0 || crop.height <= 0) throw new Error("crop");
  const radians = (rotation * Math.PI) / 180;
  const width =
    Math.abs(Math.cos(radians) * image.naturalWidth) +
    Math.abs(Math.sin(radians) * image.naturalHeight);
  const height =
    Math.abs(Math.sin(radians) * image.naturalWidth) +
    Math.abs(Math.cos(radians) * image.naturalHeight);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 512, 512);
  context.imageSmoothingQuality = "high";
  context.scale(512 / crop.width, 512 / crop.height);
  context.translate(-crop.x, -crop.y);
  context.translate(width / 2, height / 2);
  context.rotate(radians);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  return canvas.toDataURL("image/jpeg", 0.86);
}

type Props = {
  source: string;
  onClose: () => void;
  onSave: (photo: string) => { ok: boolean; error?: string };
};

export default function PhotoCropper({ source, onClose, onSave }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  const savingRef = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !savingRef.current) closeRef.current();
      if (event.key !== "Tab") return;
      const elements = dialog.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [tabindex="0"]',
      );
      if (!elements?.length) return;
      const first = elements[0],
        last = elements[elements.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  async function save() {
    if (!pixels || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const photo = await croppedPhoto(source, pixels, rotation);
      const result = onSave(photo);
      if (!result.ok) {
        setError(
          result.error || "Fotoğraf kaydedilemedi. Lütfen tekrar deneyin.",
        );
        return;
      }
      onClose();
    } catch {
      setError(
        "Fotoğraf işlenemedi. Başka bir JPG, PNG veya WebP dosyası deneyin.",
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="photo-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        ref={dialog}
        className="photo-crop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-crop-title"
        aria-describedby="photo-crop-help"
        tabIndex={-1}
      >
        <div className="photo-crop-heading">
          <span className="photo-crop-icon">
            <Crop size={21} />
          </span>
          <div>
            <p className="eyebrow">SENİN PROFİLİN, SENİN KADRAJIN</p>
            <h2 id="photo-crop-title">Fotoğrafını kırp.</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Kırpma penceresini kapat"
            disabled={saving}
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        <p id="photo-crop-help">
          Yüzünü çerçeveye yerleştir. Fotoğrafı sürükleyebilir,
          yakınlaştırabilir ve döndürebilirsin.
        </p>
        <div
          className="photo-crop-workspace"
          aria-label="Fotoğraf kırpma alanı"
        >
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            minZoom={1}
            maxZoom={3}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, area) => setPixels(area)}
            zoomWithScroll={false}
            keyboardStep={10}
            mediaProps={{ alt: "Kırpılacak profil fotoğrafı" }}
          />
        </div>
        <div className="photo-crop-zoom">
          <ZoomOut size={17} />
          <label htmlFor="photo-zoom">Yakınlaştır</label>
          <input
            id="photo-zoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            aria-valuetext={`${Math.round(zoom * 100)} yüzde`}
            onChange={(event) => setZoom(Number(event.target.value))}
            disabled={saving}
          />
          <ZoomIn size={17} />
          <output htmlFor="photo-zoom">%{Math.round(zoom * 100)}</output>
        </div>
        <div className="photo-crop-tools">
          <button
            type="button"
            className="button button-ghost"
            disabled={saving}
            onClick={() => {
              setRotation((value) => (value + 90) % 360);
              setCrop({ x: 0, y: 0 });
            }}
          >
            <RotateCw size={16} />
            90° döndür
          </button>
          <button
            type="button"
            className="photo-reset"
            disabled={saving}
            onClick={() => {
              setRotation(0);
              setZoom(1);
              setCrop({ x: 0, y: 0 });
            }}
          >
            <RotateCcw size={15} />
            Sıfırla
          </button>
        </div>
        {error && (
          <p className="photo-error" role="alert">
            {error}
          </p>
        )}
        <p className="photo-crop-note">
          Yalnızca seçtiğin kare alan kaydedilir. Profilde ve berber seçiminde
          yuvarlak görünür.
        </p>
        <div className="photo-crop-actions">
          <button
            type="button"
            className="button button-ghost"
            disabled={saving}
            onClick={onClose}
          >
            Vazgeç
          </button>
          <button
            type="button"
            className="button button-dark"
            disabled={!pixels || saving}
            onClick={save}
          >
            <Check size={17} />
            {saving ? "Kaydediliyor…" : "Kırp ve kaydet"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
