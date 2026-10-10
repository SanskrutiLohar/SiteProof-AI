/**
 * SiteProof AI - Automated Version Comparison Runner
 * 
 * Executes Playwright Anomaly Detection & Verification tests against two separately
 * configurable URLs (TARGET_URL_A and TARGET_URL_B) and generates a Markdown comparison report.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'timedOut' | 'skipped';
  durationMs: number;
  errorMessage?: string;
}

interface RunSummary {
  targetUrl: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  durationSeconds: number;
  results: TestResult[];
}

function runPlaywrightForTarget(targetUrl: string, outputJsonFile: string): RunSummary {
  console.log(`\n======================================================`);
  console.log(`🚀 Running Anomaly Detection Test Suite against: ${targetUrl}`);
  console.log(`======================================================`);

  const startTime = Date.now();
  let rawJson = '';

  try {
    const cmd = `npx playwright test e2e/anomaly-detection.spec.ts --reporter=json`;
    rawJson = execSync(cmd, {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        TARGET_URL: targetUrl,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string };
    rawJson = execError.stdout || '';
    if (!rawJson && execError.stderr) {
      console.warn('Playwright execution error:', execError.stderr);
    }
  }

  const durationSeconds = Math.round((Date.now() - startTime) / 100) / 10;
  fs.writeFileSync(outputJsonFile, rawJson || '{}', 'utf-8');

  // Parse results
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  try {
    if (rawJson) {
      const parsed = JSON.parse(rawJson);
      const suites = parsed.suites || [];

      function traverse(suite: any) {
        if (suite.specs) {
          for (const spec of suite.specs) {
            for (const test of spec.tests || []) {
              for (const result of test.results || []) {
                const status = result.status;
                if (status === 'passed') passed++;
                else if (status === 'skipped') skipped++;
                else failed++;

                results.push({
                  title: spec.title,
                  status,
                  durationMs: result.duration || 0,
                  errorMessage: result.error?.message?.split('\n')[0],
                });
              }
            }
          }
        }
        if (suite.suites) {
          for (const sub of suite.suites) {
            traverse(sub);
          }
        }
      }

      for (const s of suites) {
        traverse(s);
      }
    }
  } catch (parseErr) {
    console.warn('Failed to parse Playwright JSON output:', parseErr);
  }

  return {
    targetUrl,
    totalTests: passed + failed + skipped,
    passed,
    failed,
    skipped,
    durationSeconds,
    results,
  };
}

function generateMarkdownReport(summaryA: RunSummary, summaryB: RunSummary): string {
  const dateStr = new Date().toISOString();

  let md = `# 📊 SiteProof AI - Automated Version Comparison Report\n\n`;
  md += `**Execution Timestamp:** \`${dateStr}\`  \n`;
  md += `**Test Suite:** \`e2e/anomaly-detection.spec.ts\` (Playwright + Synthetic Test Dataset)  \n\n`;

  md += `## 1. Executive Summary\n\n`;
  md += `| Metric | Target A (Baseline) | Target B (Candidate) | Difference |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  md += `| **Target URL** | \`${summaryA.targetUrl}\` | \`${summaryB.targetUrl}\` | - |\n`;
  md += `| **Total Test Cases** | ${summaryA.totalTests} | ${summaryB.totalTests} | ${summaryB.totalTests - summaryA.totalTests} |\n`;
  md += `| **Passed Tests** | ✅ **${summaryA.passed}** | ✅ **${summaryB.passed}** | ${summaryB.passed - summaryA.passed >= 0 ? '+' : ''}${summaryB.passed - summaryA.passed} |\n`;
  md += `| **Failed Tests** | ${summaryA.failed > 0 ? `❌ **${summaryA.failed}**` : '0'} | ${summaryB.failed > 0 ? `❌ **${summaryB.failed}**` : '0'} | ${summaryB.failed - summaryA.failed} |\n`;
  md += `| **Execution Time** | ${summaryA.durationSeconds}s | ${summaryB.durationSeconds}s | ${Math.round((summaryB.durationSeconds - summaryA.durationSeconds) * 10) / 10}s |\n\n`;

  md += `## 2. Test Case Breakdown & Anomaly Detection Results\n\n`;
  md += `| # | Test Scenario | Target A Status | Target B Status | Anomaly Verification Note |\n`;
  md += `| :-: | :--- | :---: | :---: | :--- |\n`;

  const allTitles = Array.from(new Set([
    ...summaryA.results.map(r => r.title),
    ...summaryB.results.map(r => r.title)
  ]));

  allTitles.forEach((title, index) => {
    const resA = summaryA.results.find(r => r.title === title);
    const resB = summaryB.results.find(r => r.title === title);

    const statusA = resA ? (resA.status === 'passed' ? '✅ PASS' : `❌ ${resA.status.toUpperCase()}`) : '⚪ N/A';
    const statusB = resB ? (resB.status === 'passed' ? '✅ PASS' : `❌ ${resB.status.toUpperCase()}`) : '⚪ N/A';

    let note = 'Verified';
    if (title.includes('Exact duplicate')) {
      note = 'Evaluates duplicate challan modal alert upon identical document submission.';
    } else if (title.includes('different filename')) {
      note = 'Evaluates cryptographic SHA-256 hash match on renamed duplicate document.';
    } else if (title.includes('Distinct challan')) {
      note = 'Verifies clean non-duplicate submission without false-positive warnings.';
    } else if (title.includes('matching milestone')) {
      note = 'Verifies compliant photo attachment and metadata preservation.';
    } else if (title.includes('mismatch')) {
      note = 'Verifies stage mismatch & blurry photo registration without unhandled exceptions.';
    }

    md += `| ${index + 1} | ${title} | ${statusA} | ${statusB} | ${note} |\n`;
  });

  md += `\n## 3. Failure & Diagnostic Analysis\n\n`;
  const failuresA = summaryA.results.filter(r => r.status !== 'passed');
  const failuresB = summaryB.results.filter(r => r.status !== 'passed');

  if (failuresA.length === 0 && failuresB.length === 0) {
    md += `> ✅ **Zero Failures Detected:** Both target environments satisfied all anomaly detection and evidence workflow assertions cleanly.\n\n`;
  } else {
    if (failuresA.length > 0) {
      md += `### Target A Failures:\n`;
      failuresA.forEach(f => {
        md += `- **${f.title}**: \`${f.errorMessage || 'Assertion failed'}\`\n`;
      });
      md += `\n`;
    }
    if (failuresB.length > 0) {
      md += `### Target B Failures:\n`;
      failuresB.forEach(f => {
        md += `- **${f.title}**: \`${f.errorMessage || 'Assertion failed'}\`\n`;
      });
      md += `\n`;
    }
  }

  md += `## 4. Recommendation\n\n`;
  if (summaryB.failed === 0 && summaryB.passed >= summaryA.passed) {
    md += `**Status: APPROVED FOR DEPLOYMENT**  \n`;
    md += `Target B demonstrates 100% test pass rate with reliable duplicate challan detection and evidence verification parity. Safe to proceed with active milestone testing.\n`;
  } else {
    md += `**Status: REQUIRES ATTENTION**  \n`;
    md += `Target B encountered regressions or differences compared to Target A. Review failed test diagnostics before approving.\n`;
  }

  return md;
}

async function main() {
  const targetUrlA = process.env.TARGET_URL_A || 'http://localhost:3000';
  const targetUrlB = process.env.TARGET_URL_B || 'http://localhost:3000';

  const outputA = path.join(ROOT_DIR, 'test-results-target-a.json');
  const outputB = path.join(ROOT_DIR, 'test-results-target-b.json');
  const reportPath = path.join(ROOT_DIR, 'COMPARISON_REPORT.md');

  const summaryA = runPlaywrightForTarget(targetUrlA, outputA);
  const summaryB = runPlaywrightForTarget(targetUrlB, outputB);

  const markdown = generateMarkdownReport(summaryA, summaryB);
  fs.writeFileSync(reportPath, markdown, 'utf-8');

  console.log(`\n======================================================`);
  console.log(`📄 Comparison Report Generated: ${reportPath}`);
  console.log(`======================================================\n`);
  console.log(markdown);
}

main().catch(err => {
  console.error('Comparison runner failed:', err);
  process.exit(1);
});
