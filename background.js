chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('Received message from popup.js:', request);

  if (request.action === 'comparePrices') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      const url = currentTab.url;

      console.log('Sending request to compare prices for URL:', url);

      // Sending  a message to contentScript.js to get the product name
      chrome.tabs.sendMessage(currentTab.id, { action: 'getProductName' }, function (response) {
        const productName = response.productName;

        // Sending a message to the server to compare prices
        fetch('http://localhost:3000/compare', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: url, productName: productName }),
        })
          .then(response => response.json())
          .then(data => {
            console.log('Received response from the server:', data);

            // Sending a message to popup.js to display the product name
            chrome.runtime.sendMessage({ action: 'showPopup', productName: productName });
            console.log('Message sent to popup.js');

            sendResponse(data);
          })
          .catch(error => {
            console.error('Error communicating with the server:', error);
            sendResponse({ error: 'Error communicating with the server. Try again later.' });
          });
      });
    });

    // Returning  true to indicate that we will be responding asynchronously
    return true;
  }
});
