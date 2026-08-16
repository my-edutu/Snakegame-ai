import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { PREVIEW_VIEWPORTS, isPresentationOnlySetting } from '../src/config.js';

const entrySource = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const entryAst = ts.createSourceFile('main.ts', entrySource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const hasTopLevelAwait = entryAst.statements.some((statement) =>
  ts.isExpressionStatement(statement) && ts.isAwaitExpression(statement.expression),
);

describe('render preview host contract', () => {
  it('defines the exact three target livestream viewport presets', () => {
    expect(PREVIEW_VIEWPORTS).toEqual({
      '1080p': { width: 1920, height: 1080 },
      '1440p': { width: 2560, height: 1440 },
      '4k': { width: 3840, height: 2160 },
    });
  });

  it('keeps preview controls presentation-only except explicit restart', () => {
    for (const key of ['skin', 'theme', 'quality', 'viewport']) expect(isPresentationOnlySetting(key)).toBe(true);
    for (const key of ['seed', 'riskTolerance', 'failureRate', 'growthPerFood']) expect(isPresentationOnlySetting(key)).toBe(false);
  });

  it('boots asynchronously without top-level await and exposes browser-ready state', () => {
    expect(hasTopLevelAwait).toBe(false);
    expect(entrySource).toContain('void bootPreview().catch');
    expect(entrySource).toContain("stage.dataset['rendererState'] = 'ready'");
    expect(entrySource).toContain("stage.dataset['rendererState'] = 'error'");
  });

  it('scales the exact-resolution canvas completely inside the visible preview stage', () => {
    expect(styleSource).toMatch(/\.stage\s*\{[^}]*place-items:\s*center;/s);
    expect(styleSource).toMatch(/\.stage canvas\s*\{[^}]*max-width:\s*100%;/s);
    expect(styleSource).toMatch(/\.stage canvas\s*\{[^}]*max-height:\s*100%;/s);
    expect(styleSource).toMatch(/\.stage canvas\s*\{[^}]*width:\s*auto\s*!important;/s);
    expect(styleSource).toMatch(/\.stage canvas\s*\{[^}]*height:\s*auto\s*!important;/s);
  });
});
