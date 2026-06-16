/**
 * Module to add a shipping rates calculator to cart page.
 *
 * Copyright (c) 2011-2016 Caroline Schnapp (11heavens.com)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * Modified by David Little, 2016
 *
 * Vanilla rewrite (no jQuery): jQuery.ajax -> fetch, jQuery DOM ops -> native.
 * External deps are all optional/guarded: Handlebars (template render),
 * Countries (province data), Currency (multi-currency), Shopify.formatMoney
 * (has a built-in fallback), Shopify.CountryProvinceSelector (guarded).
 */

if (typeof Countries === "object") {
  Countries.updateProvinceLabel = function (countryName, labelEl) {
    if (
      typeof countryName === "string" &&
      Countries[countryName] &&
      Countries[countryName].provinces
    ) {
      if (typeof labelEl !== "object") {
        labelEl = document.getElementById("address_province_label");
        if (labelEl === null) return;
      }
      labelEl.innerHTML = Countries[countryName].label;
      var parent = labelEl.parentNode;
      if (parent) {
        var inner = parent.querySelector(".custom-style-select-box-inner");
        if (inner) inner.innerHTML = Countries[countryName].provinces[0];
      }
    }
  };
}

if (typeof Shopify === "undefined") {
  window.Shopify = {};
}
if (typeof Shopify.Cart === "undefined") {
  Shopify.Cart = {};
}

Shopify.Cart.ShippingCalculator = (function () {
  var _config = {
    submitButton: "Calculate shipping",
    submitButtonDisabled: "Calculating...",
    templateId: "shipping-calculator-response-template",
    wrapperId: "wrapper-response",
    customerIsLoggedIn: false,
    moneyFormat: "${{amount}}",
  };

  var _render = function (data) {
    var template = document.getElementById(_config.templateId);
    var wrapper = document.getElementById(_config.wrapperId);
    if (template && wrapper) {
      var compiled = Handlebars.compile(template.textContent.trim());
      var html = compiled(data);
      var tmp = document.createElement("div");
      tmp.innerHTML = html;
      while (tmp.firstChild) {
        wrapper.appendChild(tmp.firstChild);
      }
      if (
        typeof Currency !== "undefined" &&
        typeof Currency.convertAll === "function"
      ) {
        var cur = "";
        var currenciesName = document.querySelector("[name=currencies]");
        var currenciesSelected = document.querySelector(
          "#currencies span.selected"
        );
        if (currenciesName) {
          cur = currenciesName.value;
        } else if (currenciesSelected) {
          cur = currenciesSelected.getAttribute("data-currency");
        }
        if (cur !== "") {
          Currency.convertAll(
            shopCurrency,
            cur,
            "#wrapper-response span.money, #estimated-shipping span.money"
          );
        }
      }
    }
  };

  var _enableButtons = function () {
    document.querySelectorAll(".get-rates").forEach(function (btn) {
      btn.removeAttribute("disabled");
      btn.classList.remove("disabled");
      btn.value = _config.submitButton;
    });
  };

  var _disableButtons = function () {
    document.querySelectorAll(".get-rates").forEach(function (btn) {
      btn.value = _config.submitButtonDisabled;
      btn.setAttribute("disabled", "disabled");
      btn.classList.add("disabled");
    });
  };

  var _paramShippingAddress = function (address) {
    var parts = [];
    for (var key in address) {
      if (Object.prototype.hasOwnProperty.call(address, key)) {
        parts.push(
          "shipping_address[" +
            encodeURIComponent(key) +
            "]=" +
            encodeURIComponent(address[key])
        );
      }
    }
    return parts.join("&");
  };

  var _getCartShippingRatesForDestination = function (address) {
    fetch("/cart/prepare_shipping_rates", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: _paramShippingAddress(address),
    })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (txt) {
            var err = new Error("prepare_shipping_rates failed");
            err.responseText = txt;
            throw err;
          });
        }
        _pollForCartShippingRatesForDestination(address)();
      })
      .catch(_onError);
  };

  var _pollForCartShippingRatesForDestination = function (address) {
    var poll = function () {
      fetch("/cart/async_shipping_rates", {
        headers: { Accept: "application/json" },
      })
        .then(function (res) {
          if (res.status === 200) {
            return res.json().then(function (data) {
              _onCartShippingRatesUpdate(data.shipping_rates, address);
            });
          }
          setTimeout(poll, 500);
        })
        .catch(_onError);
    };
    return poll;
  };

  var _fullMessagesFromErrors = function (errors) {
    var messages = [];
    for (var key in errors) {
      if (Object.prototype.hasOwnProperty.call(errors, key)) {
        var arr = errors[key];
        for (var i = 0; i < arr.length; i++) {
          messages.push(key + " " + arr[i]);
        }
      }
    }
    return messages;
  };

  var _onError = function (error) {
    var estEl = document.getElementById("estimated-shipping");
    if (estEl) estEl.style.display = "none";
    var estEm = document.querySelector("#estimated-shipping em");
    if (estEm) estEm.innerHTML = "";
    _enableButtons();
    var feedback = "";
    var data;
    try {
      data = JSON.parse(
        error && error.responseText ? error.responseText : "{}"
      );
    } catch (e) {
      data = {};
    }
    feedback = data.message
      ? data.message + "(" + data.status + "): " + data.description
      : "Error : " + _fullMessagesFromErrors(data).join("; ") + ".";
    if (feedback === "Error : country is not supported.") {
      feedback = "We do not ship to this destination.";
    }
    _render({ rates: [], errorFeedback: feedback, success: false });
    var wrap = document.getElementById(_config.wrapperId);
    if (wrap) wrap.style.display = "";
  };

  var _onCartShippingRatesUpdate = function (rates, address) {
    _enableButtons();
    var readableAddress = "";
    if (address.zip) readableAddress += address.zip + ", ";
    if (address.province) readableAddress += address.province + ", ";
    readableAddress += address.country;
    if (rates.length) {
      var estEm = document.querySelector("#estimated-shipping em");
      if (estEm) {
        estEm.innerHTML =
          rates[0].price == "0.00" ? "FREE" : _formatRate(rates[0].price);
      }
      for (var i = 0; i < rates.length; i++) {
        rates[i].price = _formatRate(rates[i].price);
      }
    }
    _render({ rates: rates, address: readableAddress, success: true });
    var wrap = document.getElementById(_config.wrapperId);
    var est = document.getElementById("estimated-shipping");
    [wrap, est].forEach(function (el) {
      if (el) el.style.display = "";
    });
  };

  var _formatRate = function (cents) {
    function defaultOption(opt, def) {
      return typeof opt === "undefined" ? def : opt;
    }
    function formatWithDelimiters(cents, precision, thousands, decimal) {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ",");
      decimal = defaultOption(decimal, ".");
      if (isNaN(cents) || cents == null) return 0;
      cents = (cents / 100).toFixed(precision);
      var parts = cents.split(".");
      var dollars = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        "$1" + thousands
      );
      var centsPart = parts[1] ? decimal + parts[1] : "";
      return dollars + centsPart;
    }
    if (typeof Shopify.formatMoney === "function") {
      return Shopify.formatMoney(cents, _config.moneyFormat);
    }
    if (typeof cents === "string") cents = cents.replace(".", "");
    var value = "";
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = _config.moneyFormat;
    switch (formatString.match(placeholderRegex)[1]) {
      case "amount":
        value = formatWithDelimiters(cents, 2);
        break;
      case "amount_no_decimals":
        value = formatWithDelimiters(cents, 0);
        break;
      case "amount_with_comma_separator":
        value = formatWithDelimiters(cents, 2, ".", ",");
        break;
      case "amount_no_decimals_with_comma_separator":
        value = formatWithDelimiters(cents, 0, ".", ",");
        break;
    }
    return formatString.replace(placeholderRegex, value);
  };

  var _init = function () {
    if (Shopify.CountryProvinceSelector) {
      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector(
        "address_country",
        "address_province",
        { hideElement: "address_province_container" }
      );
    }
    var countryEl = document.getElementById("address_country");
    var provinceLabel = document.getElementById("address_province_label");
    if (typeof Countries !== "undefined" && countryEl) {
      Countries.updateProvinceLabel(countryEl.value, provinceLabel);
      countryEl.addEventListener("change", function () {
        Countries.updateProvinceLabel(countryEl.value, provinceLabel);
      });
    }
    document.querySelectorAll(".get-rates").forEach(function (btn) {
      btn.addEventListener("click", function () {
        _disableButtons();
        var wrap = document.getElementById(_config.wrapperId);
        if (wrap) {
          wrap.innerHTML = "";
          wrap.style.display = "none";
        }
        var address = {};
        var zipEl = document.getElementById("address_zip");
        var ctryEl = document.getElementById("address_country");
        var provEl = document.getElementById("address_province");
        address.zip = (zipEl && zipEl.value) || "";
        address.country = (ctryEl && ctryEl.value) || "";
        address.province = (provEl && provEl.value) || "";
        _getCartShippingRatesForDestination(address);
      });
    });
    if (_config.customerIsLoggedIn) {
      var firstBtn = document.querySelector(".get-rates");
      if (firstBtn) firstBtn.click();
    }
  };

  return {
    show: function (options) {
      options = options || {};
      Object.assign(_config, options);
      if (document.readyState !== "loading") {
        _init();
      } else {
        document.addEventListener("DOMContentLoaded", _init);
      }
    },
    getConfig: function () {
      return _config;
    },
    formatRate: function (cents) {
      return _formatRate(cents);
    },
  };
})();

Shopify.Cart.ShippingCalculator.show({
  submitButton: theme.strings.shippingCalcSubmitButton,
  submitButtonDisabled: theme.strings.shippingCalcSubmitButtonDisabled,
  customerIsLoggedIn: theme.strings.shippingCalcCustomerIsLoggedIn,
  moneyFormat: theme.strings.shippingCalcMoneyFormat,
});
