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
    const response = await axios.get(url, { timeout: 19000 }); // setting the timeout for 19 sec , will remove later

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

  let amazonFound = false;
  let flipkartFound = false;

  // Example: Extracting prices from Amazon
  if (url.includes('amazon')) {
    $('span.aok-offscreen').each((index, element) => {
      if (!amazonFound) {
        const priceText = $(element).text().trim();
        const price = extractNumericValue(priceText);
        if (price) {
          prices.push({ platform: 'Amazon', productName: productName, price: price });
          amazonFound = true;
        }
      }
    });
  }

  // Example: Extracting prices from Flipkart
  if (url.includes('flipkart')) {
    $('div._30jeq3._16Jk6d').each((index, element) => {
      if (!flipkartFound) {
        const priceText = $(element).text().trim();
        const price = extractNumericValue(priceText);
        if (price) {
          prices.push({ platform: 'Flipkart', productName: productName, price: price });
          flipkartFound = true;
        }
      }

      // Additional selector for Flipkart, if the previous one doesn't work
      if (!flipkartFound) {
        $('div._1vC4OE._3qQ9m1').each((index, element) => {
          if (!flipkartFound) {
            const priceText = $(element).text().trim();
            const price = extractNumericValue(priceText);
            if (price) {
              prices.push({ platform: 'Flipkart', productName: productName, price: price });
              flipkartFound = true;
            }
          }
        });
      }
    });
  }

  if (amazonFound || flipkartFound) {
    console.log('Prices found:', prices);
    return prices;
  } else {
    const notAvailable = [];
    if (!amazonFound) {
      notAvailable.push({ platform: 'Amazon', productName: productName, message: 'Not available on Amazon' });
    }
    if (!flipkartFound) {
      notAvailable.push({ platform: 'Flipkart', productName: productName, message: 'Not available on Flipkart' });
    }

    console.log('Not available on both platforms:', notAvailable);
    return notAvailable;
  }
}

function extractNumericValue(text) {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
