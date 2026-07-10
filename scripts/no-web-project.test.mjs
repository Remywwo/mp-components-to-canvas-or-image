import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('web project removal', () => {
  it('does not keep the React/Vite web app files or scripts', () => {
    expect(existsSync('index.html')).toBe(false);
    expect(existsSync('vite.config.ts')).toBe(false);
    expect(existsSync('src/App.tsx')).toBe(false);
    expect(existsSync('src/main.tsx')).toBe(false);
    expect(existsSync('src/styles.css')).toBe(false);
    expect(existsSync('src/web')).toBe(false);

    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(packageJson.scripts.dev).toBeUndefined();
    expect(packageJson.scripts.preview).toBeUndefined();
    expect(packageJson.scripts.build).not.toContain('vite');
    expect(packageJson.dependencies).toEqual({});
    expect(packageJson.devDependencies).not.toHaveProperty('vite');
    expect(packageJson.devDependencies).not.toHaveProperty('@vitejs/plugin-react');
    expect(packageJson.devDependencies).not.toHaveProperty('@types/react');
    expect(packageJson.devDependencies).not.toHaveProperty('@types/react-dom');
  });
});
