const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/compare', async (req, res) => {
  console.log('Received request to compare prices.');

  const { url, productName } = req.body;

  try {
    const prices = await fetchPrices(url, productName);
    if (prices.length === 0) {
      console.log('No prices found.');
      res.status(404).json({ error: 'No prices found. Try again later.' });
    } else {
      console.log('Prices found:', prices);
      res.json(prices);
    }
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Internal server error. Try again later.' });
  }
});

async function fetchPrices(url, productName) {
  console.log('Fetching prices from:', url);

  try {
    const response = await axios.get(url, { timeout: 19000 });

    const prices = parsePrices(response.data, url, productName);
    return prices;
  } catch (error) {
    console.error('Error fetching HTML from the website:', error);
    throw new Error('Failed to fetch prices');
  }
}

function parsePrices(html, url, productName) {
  console.log('Parsing prices from HTML.');

  const $ = cheerio.load(html);
  const prices = [];

  // Extracting prices from Amazon
  if (url.includes('amazon')) {
    const priceElement = $('#priceblock_ourprice');
    if (priceElement) {
      const priceText = priceElement.text().trim();
      const price = extractNumericValue(priceText);
      if (price) {
        prices.push({ platform: 'Amazon', productName: productName, price: '₹' + price });
      }
    }
  }

  // Extracting prices from Flipkart
  if (url.includes('flipkart')) {
    const priceElement = $('div._30jeq3._16Jk6d');
    if (priceElement.length > 0) {
      const priceText = priceElement.first().text().trim();
      const price = extractNumericValue(priceText);
      if (price) {
        prices.push({ platform: 'Flipkart', productName: productName, price: '₹' + price });
      }
    } else {
      prices.push({ platform: 'Flipkart', productName: productName, price: 'N/A' });
    }
  }

  if (prices.length > 0) {
    console.log('Prices found:', prices);
    return prices;
  } else {
    console.log('Prices not found on either platform.');
    return [{ platform: 'N/A', productName: productName, price: 'N/A' }];
  }
}

function extractNumericValue(text) {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});