import type { ScanResult, RepoContext } from './types';
import { analyzeTests } from './testing';
import { analyzeSecurity } from './security';
import { analyzeLegal } from './legal';
import { analyzeOps } from './ops';

export interface FullScanResult {
  overall_score: number;
  test_score: number;
  security_score: number;
  legal_score: number;
  ops_score: number;
  results: ScanResult[];
}

export function runFullScan(ctx: RepoContext): FullScanResult {
  const results: ScanResult[] = [
    analyzeTests(ctx),
    analyzeSecurity(ctx),
    analyzeLegal(ctx),
    analyzeOps(ctx),
  ];

  const test_score = results.find((r) => r.category === 'testing')!.score;
  const security_score = results.find((r) => r.category === 'security')!.score;
  const legal_score = results.find((r) => r.category === 'legal')!.score;
  const ops_score = results.find((r) => r.category === 'ops')!.score;

  // Testing is weighted more heavily (40%) since it's the primary focus
  const overall_score = Math.round(
    test_score * 0.4 +
    security_score * 0.25 +
    legal_score * 0.15 +
    ops_score * 0.2
  );

  return {
    overall_score,
    test_score,
    security_score,
    legal_score,
    ops_score,
    results,
  };
}

export type { ScanResult, ScannerFinding, RepoContext } from './types';
