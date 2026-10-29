export const MAX_PROFILE_PHOTO_BYTES = 1_258_291;

export function isValidProfilePhotoDataUri(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;

  const base64 = match[1];
  if (base64.length > Math.ceil(MAX_PROFILE_PHOTO_BYTES / 3) * 4) return false;

  const image = Buffer.from(base64, 'base64');
  return (
    image.length > 3 &&
    image.length < MAX_PROFILE_PHOTO_BYTES &&
    image.toString('base64') === base64 &&
    image[0] === 0xff &&
    image[1] === 0xd8 &&
    image[2] === 0xff
  );
}
