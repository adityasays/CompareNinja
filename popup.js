document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('compareBtn').addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      const url = currentTab.url;

      // Sending  a message to background.js to fetch prices
      chrome.runtime.sendMessage({ action: 'comparePrices', url: url }, function (response) {
        if (chrome.runtime.lastError) {
          // Handle errors from background.js
          console.error(chrome.runtime.lastError);
          displayErrorMessage('Error communicating with the server. Try again later.');
        } else if (response.error) {
          // Handle errors from the server
          console.error(response.error);
          displayErrorMessage(response.error);
        } else {
          // Handle successful response
          console.log('Prices received:', response);
          displayPrices(response);
        }
      });
    });
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('Received message from background.js:', request);

  if (request.action === "showPopup") {
    const productName = request.productName;
    console.log('Product name received:', productName);
    document.getElementById('productName').innerText = `Product: ${productName}`;
  }
});

function displayPrices(prices) {
  // Logic to display prices in the popup.html
  const resultList = document.getElementById('resultList');
  resultList.innerHTML = ''; // Clear previous content

  if (prices.length === 0) {
    displayErrorMessage('No prices found. Try again later.');
  } else {
    // Display product name
    if (prices[0].productName) {
      chrome.runtime.sendMessage({ action: 'showPopup', productName: prices[0].productName });
    }

    prices.forEach(price => {
      const listItem = document.createElement('li');
      listItem.textContent = `${price.platform}: ${price.price}`;
      resultList.appendChild(listItem);
    });
  }
}

function displayErrorMessage(message) {
  // Displaying  the error message in the popup.html
  const resultList = document.getElementById('resultList');
  resultList.innerHTML = `<li class="error">${message}</li>`;
}
