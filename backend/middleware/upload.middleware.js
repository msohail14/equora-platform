import fs from 'fs';
import path from 'path';
import multer from 'multer';

const userProfileImageDir = path.join(process.cwd(), 'upload', 'profile-images', 'users');
const disciplineIconDir = path.join(process.cwd(), 'upload', 'discipline-icons');
const stableLogoDir = path.join(process.cwd(), 'upload', 'stable-logos');
const horseProfileImageDir = path.join(process.cwd(), 'upload', 'profile-images', 'horses');
const arenaImageDir = path.join(process.cwd(), 'upload', 'arena-images');
const courseThumbnailDir = path.join(process.cwd(), 'upload', 'course-thumbnails');

const ensureDirectory = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const sanitizeFileName = (fileName) =>
  fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_').toLowerCase();

const createStorage = (destinationDir) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDirectory(destinationDir);
      cb(null, destinationDir);
    },
    filename: (_req, file, cb) => {
      const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const fileName = sanitizeFileName(file.originalname);
      cb(null, `${uniquePrefix}-${fileName}`);
    },
  });

const defaultAllowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

const createImageFileFilter = (allowedTypes = defaultAllowedTypes, errorMessage = 'Only image files are allowed.') =>
  (_req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error(errorMessage), false);
      return;
    }
    cb(null, true);
  };

const createImageUpload = (
  destinationDir,
  fieldName,
  {
    fileSize = 5 * 1024 * 1024,
    allowedTypes = defaultAllowedTypes,
    typeErrorMessage = 'Only image files are allowed.',
  } = {}
) =>
  multer({
    storage: createStorage(destinationDir),
    fileFilter: createImageFileFilter(allowedTypes, typeErrorMessage),
    limits: {
      fileSize,
    },
  }).single(fieldName);

export const uploadUserProfileImage = createImageUpload(userProfileImageDir, 'profile_image');
export const uploadDisciplineIcon = createImageUpload(disciplineIconDir, 'icon_image');
export const uploadStableLogo = createImageUpload(stableLogoDir, 'logo_image');
export const uploadHorseProfileImage = createImageUpload(horseProfileImageDir, 'profile_image', {
  fileSize: 2 * 1024 * 1024,
  typeErrorMessage: 'Horse image must be PNG, JPG, or JPEG only.',
});
export const uploadArenaImage = createImageUpload(arenaImageDir, 'image', {
  fileSize: 2 * 1024 * 1024,
  typeErrorMessage: 'Arena image must be PNG, JPG, or JPEG only.',
});
export const uploadCourseThumbnail = createImageUpload(courseThumbnailDir, 'thumbnail_image', {
  fileSize: 3 * 1024 * 1024,
  typeErrorMessage: 'Course thumbnail must be PNG, JPG, or JPEG only.',
});
