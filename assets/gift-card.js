// Gift card page — vanilla (replaces the jQuery $(function(){...}) version).
(function () {
  function init() {
    var config = {
      qrCode: '#QrCode',
      printButton: '#PrintGiftCard',
      giftCardCode: '#GiftCardDigits'
    };

    var qrCode = document.querySelector(config.qrCode);
    if (qrCode && typeof QRCode !== 'undefined') {
      // eslint-disable-next-line no-new
      new QRCode(qrCode, {
        text: qrCode.getAttribute('data-identifier'),
        width: 120,
        height: 120
      });
    }

    var printButton = document.querySelector(config.printButton);
    if (printButton) {
      printButton.addEventListener('click', function () {
        window.print();
      });
    }

    // Auto-select gift card code on click, based on ID passed to the function
    var giftCardCode = document.querySelector(config.giftCardCode);
    if (giftCardCode) {
      giftCardCode.addEventListener('click', function () {
        selectText('GiftCardDigits');
      });
    }

    function selectText(elementId) {
      var text = document.getElementById(elementId);
      var range = '';

      if (document.body.createTextRange) {
        // ms method
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
      } else if (window.getSelection) {
        // moz, opera, webkit method
        var selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
