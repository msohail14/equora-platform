import { useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';
import AppButton from './AppButton';
import Modal from './Modal';

export const DEFAULT_CROP_ASPECT_OPTIONS = [
  { key: 'square', label: 'Square (1:1)', aspect: 1 },
  { key: 'portrait', label: 'Portrait (9:16)', aspect: 9 / 16 },
  { key: 'landscape', label: 'Landscape (16:9)', aspect: 16 / 9 },
  { key: 'banner', label: 'Banner (3:1)', aspect: 3 / 1 },
];
export const SQUARE_CROP_ASPECT_OPTIONS = [{ key: 'square', label: 'Square (1:1)', aspect: 1 }];

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });

const fileNameWithoutExtension = (value) => {
  if (!value) return 'cropped-image';
  const index = value.lastIndexOf('.');
  if (index <= 0) return value;
  return value.slice(0, index);
};

const getExtensionForMimeType = (mimeType) => {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
};

const getCroppedBlob = async (imageSrc, cropPixels, outputMimeType, outputQuality) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  const context = canvas.getContext('2d');
  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not crop image.'));
          return;
        }
        resolve(blob);
      },
      outputMimeType,
      outputQuality
    );
  });
};

const ImageCropperModal = ({
  isOpen,
  sourceFile,
  onClose,
  onApply,
  title = 'Crop Image',
  outputMimeType = 'image/jpeg',
  outputQuality = 0.92,
  aspectOptions = DEFAULT_CROP_ASPECT_OPTIONS,
  lockAspectSelection = false,
}) => {
  const [sourceUrl, setSourceUrl] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedAspectKey, setSelectedAspectKey] = useState(
    aspectOptions[0]?.key || DEFAULT_CROP_ASPECT_OPTIONS[0].key
  );
  const [cropPixels, setCropPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedAspectOption = useMemo(() => {
    const found = aspectOptions.find((item) => item.key === selectedAspectKey);
    return found || aspectOptions[0] || DEFAULT_CROP_ASPECT_OPTIONS[0];
  }, [aspectOptions, selectedAspectKey]);

  useEffect(() => {
    if (!aspectOptions?.length) return;
    if (lockAspectSelection) {
      setSelectedAspectKey(aspectOptions[0].key);
      return;
    }
    const hasSelected = aspectOptions.some((item) => item.key === selectedAspectKey);
    if (!hasSelected) {
      setSelectedAspectKey(aspectOptions[0].key);
    }
  }, [aspectOptions, lockAspectSelection, selectedAspectKey]);

  useEffect(() => {
    if (!sourceFile) {
      setSourceUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(sourceFile);
    setSourceUrl(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropPixels(null);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [sourceFile]);

  useEffect(() => {
    if (!isOpen) {
      setIsSaving(false);
    }
  }, [isOpen]);

  const onCropComplete = (_croppedArea, croppedAreaPixels) => {
    setCropPixels(croppedAreaPixels);
  };

  const onApplyCrop = async () => {
    if (!sourceUrl || !cropPixels || isSaving) return;
    setIsSaving(true);
    try {
      const blob = await getCroppedBlob(sourceUrl, cropPixels, outputMimeType, outputQuality);
      const extension = getExtensionForMimeType(outputMimeType);
      const baseName = fileNameWithoutExtension(sourceFile?.name);
      const fileName = `${baseName}-${selectedAspectOption.key}.${extension}`;
      const croppedFile = new File([blob], fileName, { type: outputMimeType });
      await onApply?.(croppedFile, { blob, aspect: selectedAspectOption });
      onClose?.();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose}>
      <div className="grid gap-4">
        {/* <div className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Aspect Ratio
          </span>
          {lockAspectSelection ? (
            <span className="inline-flex w-fit rounded-lg border border-emerald-500 bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white">
              {selectedAspectOption.label}
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {aspectOptions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedAspectKey(item.key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    selectedAspectKey === item.key
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div> */}

        <div className="relative h-[360px] overflow-hidden rounded-xl bg-gray-950">
          {sourceUrl ? (
            <Cropper
              image={sourceUrl}
              crop={crop}
              zoom={zoom}
              aspect={selectedAspectOption.aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-gray-300">No image selected.</div>
          )}
        </div>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Zoom
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <AppButton type="button" onClick={onApplyCrop} disabled={!sourceUrl || !cropPixels || isSaving}>
            {isSaving ? 'Applying...' : 'Apply Crop'}
          </AppButton>
          <AppButton type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </AppButton>
        </div>
      </div>
    </Modal>
  );
};

export default ImageCropperModal;
