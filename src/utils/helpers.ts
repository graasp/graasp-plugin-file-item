export const randomHexOf4 = () =>
  ((Math.random() * (1 << 16)) | 0).toString(16).padStart(4, '0');
