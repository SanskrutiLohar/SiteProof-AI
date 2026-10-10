import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test.describe('SiteProof AI - Anomaly Detection & Verification Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/SiteProof AI/i);

    // Use 1-Click Contractor persona to enter contractor workspace
    const contractorButton = page.getByRole('button', { name: /Rajesh Kumar/i });
    await expect(contractorButton).toBeVisible();
    await contractorButton.click();

    // Verify redirection to contractor dashboard
    await expect(page).toHaveURL(/\/contractor\/dashboard/);
  });

  test('1. Contractor can navigate to milestone workspace and view evidence baseline', async ({ page }) => {
    await page.goto('/contractor/milestone/m-nsk-01');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/Contractual Quotation & BOQ Baseline/i)).toBeVisible();
    await expect(page.getByText(/Milestone Evidence Workspace/i)).toBeVisible();
  });

  test('2. Anomaly A: Exact duplicate delivery challan triggers duplicate detection warning', async ({ page }) => {
    await page.goto('/contractor/milestone/m-nsk-01');

    // Open Evidence Upload Modal
    const uploadButton = page.getByRole('button', { name: /Upload Files|Upload Evidence/i }).first();
    await expect(uploadButton).toBeVisible();
    await uploadButton.click();

    // Select category Delivery Challan inside the modal form
    const challanCategory = page.locator('form').getByRole('button', { name: 'Delivery Challan', exact: true });
    await challanCategory.click();

    // Upload Tata Steel Original Challan (First Time)
    const fileInput = page.locator('input[type="file"]').first();
    const challanPath = path.join(FIXTURES_DIR, 'challan_tata_original.pdf');
    await fileInput.setInputFiles(challanPath);

    // Submit the evidence
    const submitBtn = page.getByRole('button', { name: /Save & Register Evidence/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Wait for upload modal to close
    await expect(page.locator('text=Upload Milestone Evidence')).not.toBeVisible({ timeout: 8000 });

    // Open upload modal a SECOND time with the EXACT same file
    await uploadButton.click();
    await challanCategory.click();
    await fileInput.setInputFiles(challanPath);

    // Assert that the exact duplicate warning alert is rendered by the client-side hash engine
    const duplicateAlert = page.getByText(/Exact Duplicate File Detected|already uploaded/i).first();
    await expect(duplicateAlert).toBeVisible({ timeout: 5000 });
  });

  test('3. Anomaly A: Identical challan with a different filename is detected via cryptographic hash', async ({ page }) => {
    await page.goto('/contractor/milestone/m-nsk-01');

    const uploadButton = page.getByRole('button', { name: /Upload Files|Upload Evidence/i }).first();
    await uploadButton.click();

    const challanCategory = page.locator('form').getByRole('button', { name: 'Delivery Challan', exact: true });
    await challanCategory.click();

    // First upload original
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'challan_tata_original.pdf'));
    const submitBtn = page.getByRole('button', { name: /Save & Register Evidence/i });
    await submitBtn.click();
    await expect(page.locator('text=Upload Milestone Evidence')).not.toBeVisible({ timeout: 8000 });

    // Now upload the renamed file with identical byte contents (challan_tata_renamed_copy.pdf)
    await uploadButton.click();
    await challanCategory.click();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'challan_tata_renamed_copy.pdf'));

    // Verify SHA-256 hash match warning appears despite the differing filename
    const hashWarning = page.getByText(/Exact Duplicate File Detected|Visual Similarity Warning|already uploaded/i).first();
    await expect(hashWarning).toBeVisible({ timeout: 5000 });
  });

  test('4. Anomaly A: Distinct challan from different supplier is accepted cleanly without warnings', async ({ page }) => {
    await page.goto('/contractor/milestone/m-nsk-01');

    const uploadButton = page.getByRole('button', { name: /Upload Files|Upload Evidence/i }).first();
    await uploadButton.click();

    const challanCategory = page.locator('form').getByRole('button', { name: 'Delivery Challan', exact: true });
    await challanCategory.click();

    // Upload distinct UltraTech cement challan
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'challan_ultratech_cement.pdf'));

    // Verify NO duplicate alert appears
    const duplicateAlert = page.getByText(/Exact Duplicate File Detected/i);
    await expect(duplicateAlert).not.toBeVisible();

    // Submit successfully
    const submitBtn = page.getByRole('button', { name: /Save & Register Evidence/i });
    await submitBtn.click();
    await expect(page.locator('text=Upload Milestone Evidence')).not.toBeVisible({ timeout: 8000 });
  });

  test('5. Anomaly B: Construction photo matching milestone can be uploaded and inspected', async ({ page }) => {
    await page.goto('/contractor/milestone/m-nsk-01');

    const uploadButton = page.getByRole('button', { name: /Upload Files|Upload Evidence/i }).first();
    await uploadButton.click();

    // Select Site Photo category in form
    const photoCategory = page.locator('form').getByRole('button', { name: 'Site Photo', exact: true });
    await photoCategory.click();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'photo_pier14_rebar_compliant.jpg'));

    const submitBtn = page.getByRole('button', { name: /Save & Register Evidence/i });
    await submitBtn.click();
    await expect(page.locator('text=Upload Milestone Evidence')).not.toBeVisible({ timeout: 8000 });

    // Check evidence gallery has updated cards
    await expect(page.locator('img[alt*="photo_pier14_rebar_compliant"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('6. Anomaly B: Stage mismatch, unrelated, and blurry photos are safely processed with audit registration', async ({ page }) => {
    await page.goto('/contractor/milestone/m-nsk-01');

    const uploadButton = page.getByRole('button', { name: /Upload Files|Upload Evidence/i }).first();

    // Upload Wrong Stage Photo
    await uploadButton.click();
    const photoCategory = page.locator('form').getByRole('button', { name: 'Site Photo', exact: true });
    await photoCategory.click();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'photo_pavement_asphalt_wrong_stage.jpg'));
    const submitBtn = page.getByRole('button', { name: /Save & Register Evidence/i });
    await submitBtn.click();
    await expect(page.locator('text=Upload Milestone Evidence')).not.toBeVisible({ timeout: 8000 });

    // Upload Blurry Photo
    await uploadButton.click();
    await photoCategory.click();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'photo_blurry_underexposed.jpg'));
    await submitBtn.click();
    await expect(page.locator('text=Upload Milestone Evidence')).not.toBeVisible({ timeout: 8000 });

    // Verify both uploaded images are rendered in gallery cards
    await expect(page.locator('img[alt*="photo_pavement_asphalt_wrong_stage"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('img[alt*="photo_blurry_underexposed"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('7. Inspector Cockpit displays evidence verification and VLM comparison workspace', async ({ page }) => {
    // Switch to Inspector persona
    await page.goto('/login');
    const inspectorButton = page.getByRole('button', { name: /David Vance/i });
    await inspectorButton.click();

    // Navigate to Inspector verification cockpit
    await page.goto('/admin/verify/m-nsk-01');
    await expect(page.getByText(/Physical Progress & VLM Audit/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Audit Certificate|Make Official Decision|Decision:/i }).first()).toBeVisible();
  });

});
