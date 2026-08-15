import { test, expect } from '@playwright/test';

test.describe('Journal Voice Dictation Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Assuming standard login mock or bypassing auth for the route
    await page.goto('/journal');
  });

  test('should record, process, allow edits to raw & summary, regenerate, and save', async ({ page }) => {
    // 1. Check idle state
    const micButton = page.locator('button', { hasText: 'Tap to start speaking' });
    await expect(micButton).toBeVisible();

    // 2. Start Recording
    await micButton.click();
    await expect(page.locator('textarea[placeholder*="Listening"]')).toBeVisible();

    // Note: Mocking SpeechRecognition in Playwright involves injecting a mock SR object into the page.
    // For this test structure, we assume we either mock it or test the UI interaction flow manually.
    await page.evaluate(() => {
      // Simulate raw transcript being populated
      const ta = document.querySelector('textarea[placeholder*="Listening"]') as HTMLTextAreaElement;
      if (ta) {
          ta.value = "This is a mock raw transcript for testing.";
          const event = new Event('change', { bubbles: true });
          ta.dispatchEvent(event);
      }
    });

    // 3. Stop Recording
    await page.locator('button', { hasText: 'Stop' }).click();

    // 4. Processing state
    await expect(page.getByText('Ava is writing your entry...')).toBeVisible();

    // 5. Done state
    await expect(page.getByText("Ava's Summary")).toBeVisible();
    await expect(page.getByText("Your Words")).toBeVisible();

    // 6. Edit Ava Summary
    await page.locator('button', { hasText: 'Edit' }).first().click();
    const summaryEditor = page.locator('textarea').first();
    await expect(summaryEditor).toBeVisible();
    await summaryEditor.fill('This is an edited AI summary.');
    await page.locator('button', { hasText: 'Done' }).first().click();
    await expect(page.getByText('This is an edited AI summary.')).toBeVisible();

    // 7. Edit Raw Transcript
    await page.locator('button', { hasText: 'Your Words' }).click(); // expand
    await page.locator('button', { hasText: 'Edit' }).last().click();
    const rawEditor = page.locator('textarea').last();
    await expect(rawEditor).toBeVisible();
    await rawEditor.fill('This is an edited raw transcript.');
    await page.locator('button', { hasText: 'Done' }).last().click();

    // 8. Regenerate Summary
    const regenerateBtn = page.locator('button', { hasText: 'Regenerate' });
    await regenerateBtn.click();
    await expect(page.getByText('Ava is writing your entry...')).toBeVisible();

    // 9. Audio UI Verification
    const audioPlayer = page.locator('audio');
    await expect(audioPlayer).toBeVisible();
    const downloadBtn = page.locator('a[download^="ava-journal-"]');
    await expect(downloadBtn).toBeVisible();

    // 10. Save Entry
    await page.locator('button', { hasText: 'Save Entry' }).click();

    // 11. Verify transition back to idle
    await expect(page.locator('button', { hasText: 'Tap to start speaking' })).toBeVisible();
  });

});
