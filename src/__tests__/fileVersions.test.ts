function formatSize(size: string) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

describe('FileVersion formatting', () => {
  it('formats bytes into KB correctly', () => {
    expect(formatSize('2048')).toBe('2.0 KB');
  });

  it('formats bytes into MB correctly', () => {
    expect(formatSize('5242880')).toBe('5.0 MB');
  });

  it('handles invalid sizes gracefully', () => {
    expect(formatSize('invalid')).toBe('0 B');
  });
});
