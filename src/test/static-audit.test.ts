import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getAllTsxFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllTsxFiles(fullPath, fileList);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('Static Audit - Codebase Quality & Accessibility Gates', () => {
  const componentsDir = path.resolve(__dirname, '../components');
  const pagesDir = path.resolve(__dirname, '../pages');
  const allFiles = [...getAllTsxFiles(componentsDir), ...getAllTsxFiles(pagesDir)];

  it('scans all UI files and finds non-empty list of components', () => {
    expect(allFiles.length).toBeGreaterThan(10);
  });

  it('has zero empty onClick={() => {}} placeholder buttons', () => {
    const violations: { file: string; line: number; snippet: string }[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Matches onClick={() => {}} or onClick={() => { }}
        if (/onClick=\{\(\)\s*=>\s*\{\s*\}\}/.test(line)) {
          violations.push({
            file: path.relative(path.resolve(__dirname, '../../'), file),
            line: idx + 1,
            snippet: line.trim(),
          });
        }
      });
    }

    expect(
      violations,
      `Found ${violations.length} empty onClick handlers: ${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });

  it('has accessible labels or text on button elements', () => {
    // Check that button elements either have aria-label, title, or non-empty body text
    const iconOnlyWithoutLabel: { file: string; line: number; snippet: string }[] = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Find single-line icon-only buttons that lack aria-label and title
        // e.g. <button ...><Icon className="..." /></button>
        if (
          line.includes('<button') &&
          !line.includes('aria-label') &&
          !line.includes('title') &&
          line.includes('/>') &&
          line.includes('</button>') &&
          !/[a-zA-Z0-9]{3,}/.test(line.replace(/<[^>]+>/g, ''))
        ) {
          iconOnlyWithoutLabel.push({
            file: path.relative(path.resolve(__dirname, '../../'), file),
            line: idx + 1,
            snippet: line.trim(),
          });
        }
      });
    }

    expect(
      iconOnlyWithoutLabel,
      `Found buttons lacking accessible labels: ${JSON.stringify(iconOnlyWithoutLabel, null, 2)}`
    ).toEqual([]);
  });
});

