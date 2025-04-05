import express from 'express';
import puppeteer from 'puppeteer';
import Tesseract from 'tesseract.js';
import fs from 'fs/promises';

const app = express();

app.get('/ocr', async (req, res) => {
  const date = req.query.date || '2025-04-04';
  const url = `https://tge.pl/energia-elektryczna-rdn?date=${date}`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.table-responsive', { timeout: 15000 });

    const table = await page.$('.table-responsive');
    const screenshotPath = '/tmp/table.png';
    await table.screenshot({ path: screenshotPath });
    await browser.close();

    const result = await Tesseract.recognize(screenshotPath, 'eng');
    res.setHeader('Content-Type', 'text/plain');
    res.send(result.data.text);
  } catch (err) {
    console.error(err);
    res.status(500).send('OCR failed: ' + err.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
