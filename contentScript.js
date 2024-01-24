chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'getProductName') {
    let productName = '';

    // Logic to extract product name from Amazon
    if (window.location.hostname.includes('amazon')) {
      const titleElement = document.getElementById('productTitle');
      if (titleElement) {
        productName = titleElement.innerText.trim();
      }
    }

    // Logic to extract product name from Flipkart
    if (window.location.hostname.includes('flipkart')) {
      const titleElement = document.querySelector('span.B_NuCI');
      if (titleElement) {
        productName = titleElement.innerText.trim();
      }
    }

    sendResponse({ productName: productName });
  }
});
