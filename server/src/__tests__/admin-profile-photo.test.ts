import { isValidProfilePhotoDataUri, MAX_PROFILE_PHOTO_BYTES } from '../utils/profilePhoto';

describe('agent profile photo validation', () => {
  it('accepts a JPEG data URI with a JPEG signature within the size limit', () => {
    expect(isValidProfilePhotoDataUri('data:image/jpeg;base64,/9j/2Q==')).toBe(true);
  });

  it.each([
    null,
    'https://example.com/photo.jpg',
    'data:image/png;base64,/9j/2Q==',
    'data:image/jpeg;base64,YWJj',
    'data:image/jpeg;base64,/9j/2Q=!',
  ])('rejects invalid photo data: %s', (value) => {
    expect(isValidProfilePhotoDataUri(value)).toBe(false);
  });

  it('rejects an image that exceeds the maximum photo size', () => {
    const bytes = Buffer.alloc(MAX_PROFILE_PHOTO_BYTES, 0);
    bytes[0] = 0xff;
    bytes[1] = 0xd8;
    bytes[2] = 0xff;

    expect(isValidProfilePhotoDataUri(`data:image/jpeg;base64,${bytes.toString('base64')}`)).toBe(false);
  });
});
