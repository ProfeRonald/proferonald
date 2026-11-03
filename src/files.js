import { ref, list, getDownloadURL, getBlob, getMetadata, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { storage } from './firebase.js';
import { filePolicy, draftImagePath } from './core.js';
export const listFiles = (prefix = '', pageToken) => list(ref(storage, prefix), { maxResults: 24, ...(pageToken ? { pageToken } : {}) });
export const publicPhotoURL = item => getDownloadURL(item);
export const fileMetadata = item => getMetadata(item);
export async function uploadFile(file, prefix, progress = () => {}) {
  const photos = prefix === 'fotos' || prefix.startsWith('fotos/') || prefix === 'imagenes';
  try { filePolicy(file, photos); } catch (error) { error.userMessage = error.message; throw error; }
  const isImage = file.type.startsWith('image/');
  let payload = file;
  if (isImage) {
    const bitmap = await createImageBitmap(file);
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40_000_000) throw new Error('La imagen supera 40 megapíxeles.');
      const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      payload = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
      if (!payload) throw new Error('No se pudo preparar la imagen.');
    } finally { bitmap.close(); }
  }
  const extension = isImage ? 'webp' : file.name.split('.').pop().replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'bin';
  const name = `${crypto.randomUUID()}.${extension}`;
  const item = ref(storage, `${prefix.replace(/\/$/, '')}/${name}`);
  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(item, payload, { contentType: payload.type, customMetadata: { originalName: file.name.slice(0, 200) } });
    task.on('state_changed', snapshot => progress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)), reject, resolve);
  });
  return item;
}
export const deleteFile = item => deleteObject(item);
export async function draftPhotoBlob(value) {
  const path = draftImagePath(value); if (!path) throw new Error('Imagen privada no válida.');
  const blob = await getBlob(ref(storage, path), 5 * 1024 * 1024);
  // These UUID paths are created exclusively by our WebP encoder. Some Storage
  // transports return an empty MIME type, even when the object metadata is set.
  return new Blob([blob], { type: 'image/webp' });
}
export async function publishDraftPhoto(value) {
  const blob = await draftPhotoBlob(value);
  const item = await uploadFile(new File([blob], 'imagen.webp', { type: 'image/webp' }), 'fotos');
  try { return { item, url: await publicPhotoURL(item) }; }
  catch (error) { await deleteFile(item).catch(() => {}); throw error; }
}
export async function downloadFile(item, filename = item.name) {
  const blob = await getBlob(item, 20 * 1024 * 1024);
  const url = URL.createObjectURL(blob);
  try { const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); }
  finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
