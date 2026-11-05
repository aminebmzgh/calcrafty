import { describe, expect, it } from 'vitest';
import { changedUrls } from './indexnow.ts';
import { contentHash } from './integrations/htaccess.ts';

describe('changedUrls', () => {
  it('returns new, changed and removed URLs, not unchanged ones', () => {
    const prev = { '/a/': '1', '/b/': '2', '/gone/': '3' };
    const next = { '/a/': '1', '/b/': 'x', '/new/': '4' };
    expect(changedUrls(prev, next).sort()).toEqual(['/b/', '/gone/', '/new/']);
  });

  it('treats every URL as new when there is no previous manifest', () => {
    expect(changedUrls({}, { '/a/': '1' })).toEqual(['/a/']);
  });
});

describe('contentHash', () => {
  const page = (head: string, main: string, footer: string) =>
    `<html><head>${head}</head><body><header>h</header><main id="main">${main}</main><footer>${footer}</footer></body></html>`;

  it('ignores changes outside <main>', () => {
    expect(contentHash(page('a', 'body', 'f1'))).toBe(contentHash(page('b', 'body', 'f2')));
  });

  it('ignores hashed asset filenames inside <main>', () => {
    const a = page('', '<script src="/_astro/Widget.AbC123xy.js"></script>text', '');
    const b = page('', '<script src="/_astro/Widget.ZzZ999qq.js"></script>text', '');
    expect(contentHash(a)).toBe(contentHash(b));
  });

  it('changes when the main content changes', () => {
    expect(contentHash(page('', 'old', ''))).not.toBe(contentHash(page('', 'new', '')));
  });
});
