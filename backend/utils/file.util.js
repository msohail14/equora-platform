import fs from 'fs/promises';
import path from 'path';

export const toPublicUploadPath = (filePath) => {
  const normalized = filePath.replace(/\\/g, '/');
  const marker = '/upload/';
  const markerIndex = normalized.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return normalized.slice(markerIndex);
};

export const toAbsolutePathFromPublic = (publicPath) => {
  if (!publicPath) {
    return null;
  }

  const sanitized = publicPath.replace(/^\/+/, '');
  const resolved = path.resolve(process.cwd(), sanitized);
  const uploadDir = path.resolve(process.cwd(), 'upload');

  // Prevent path traversal — resolved path must stay within the upload directory
  if (!resolved.startsWith(uploadDir + path.sep) && resolved !== uploadDir) {
    return null;
  }

  return resolved;
};

export const deleteFileIfExists = async (absolutePath) => {
  if (!absolutePath) {
    return;
  }

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};
