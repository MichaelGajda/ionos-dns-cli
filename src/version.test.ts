import { describe, it, expect } from 'vitest';
import { VERSION } from './version';
import pkg from '../package.json';

describe('VERSION', () => {
  it('matches package.json (no drift)', () => {
    expect(VERSION).toBe(pkg.version);
  });
});
