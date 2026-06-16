window.theme = window.theme || {};
window.slate = window.slate || {};

/* ================ SLATE ================ */
theme.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];

  document.addEventListener("shopify:section:unload", this._onSectionUnload.bind(this));
  document.addEventListener("shopify:section:load", this._onSectionLoad.bind(this));
  document.addEventListener("shopify:section:select", this._onSelect.bind(this));
  document.addEventListener("shopify:section:deselect", this._onDeselect.bind(this));
  document.addEventListener("shopify:block:select", this._onBlockSelect.bind(this));
  document.addEventListener("shopify:block:deselect", this._onBlockDeselect.bind(this));
};

theme.Sections.prototype = Object.assign({}, theme.Sections.prototype, {
  _createInstance: function (container, constructor) {
    var id = container.getAttribute("data-section-id");
    var type = container.getAttribute("data-section-type");

    constructor = constructor || this.constructors[type];

    if (constructor === undefined) {
      return;
    }

    var instance = Object.assign(new constructor(container), {
      id: id,
      type: type,
      container: container,
    });

    this.instances.push(instance);
  },

  _onSectionLoad: function (evt) {
    var container = evt.target.querySelector("[data-section-id]");
    if (container) {
      this._createInstance(container);
    }
    if (typeof AOS !== "undefined" && AOS) {
      AOS.refreshHard();
    }
  },
  _loadSubSections: function () {
    if (typeof AOS !== "undefined" && AOS) {
      AOS.refreshHard();
    }
  },
  _onSectionUnload: function (evt) {
    this.instances = this.instances.filter(function (instance) {
      var isEventInstance = instance.id === evt.detail.sectionId;

      if (isEventInstance) {
        if (typeof instance.onUnload === "function") {
          instance.onUnload(evt);
        }
      }

      return !isEventInstance;
    });
  },

  _onSelect: function (evt) {
    var instance = this.instances.find(function (instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (instance && typeof instance.onSelect === "function") {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function (evt) {
    var instance = this.instances.find(function (instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (instance && typeof instance.onDeselect === "function") {
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function (evt) {
    var instance = this.instances.find(function (instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (instance && typeof instance.onBlockSelect === "function") {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function (evt) {
    var instance = this.instances.find(function (instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (instance && typeof instance.onBlockDeselect === "function") {
      instance.onBlockDeselect(evt);
    }
  },

  register: function (type, constructor) {
    this.constructors[type] = constructor;

    document
      .querySelectorAll('[data-section-type="' + type + '"]')
      .forEach(
        function (container) {
          this._createInstance(container, constructor);
        }.bind(this)
      );
  },
});

window.slate = window.slate || {};

/**
 * iFrames
 * -----------------------------------------------------------------------------
 * Wrap videos in div to force responsive layout.
 *
 * @namespace iframes
 */

slate.rte = {
  wrapTable: function () {
    document.querySelectorAll(".rte table").forEach(function (table) {
      var wrapper = document.createElement("div");
      wrapper.className = "rte__table-wrapper";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  },

  iframeReset: function () {
    var videoSel =
      '.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"]';
    document.querySelectorAll(videoSel).forEach(function (iframe) {
      // Add wrapper to make video responsive
      var wrapper = document.createElement("div");
      wrapper.className = "video-wrapper";
      iframe.parentNode.insertBefore(wrapper, iframe);
      wrapper.appendChild(iframe);
    });

    document
      .querySelectorAll(videoSel + ', .rte iframe#admin_bar_iframe')
      .forEach(function (iframe) {
        // Re-set the src attribute on each iframe after page load
        // for Chrome's "incorrect iFrame content on 'back'" bug.
        // https://code.google.com/p/chromium/issues/detail?id=395791
        iframe.src = iframe.src;
      });
  },
};

window.slate = window.slate || {};

/**
 * A11y Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help make your theme more accessible
 * to users with visual impairments.
 *
 *
 * @namespace a11y
 */

slate.a11y = {
  // Normalize a jQuery object / DOM element / selector to a DOM element so the
  // helpers work whether the (still jQuery-based) callers pass $obj or a node.
  _el: function (x) {
    if (!x) return null;
    if (x instanceof Element) return x;
    if (typeof x === "string") return document.querySelector(x);
    if (x.jquery || typeof x.length === "number") return x[0] || null;
    return null;
  },

  /**
   * For use when focus shifts to a container rather than a link.
   */
  pageLinkFocus: function (element) {
    var el = this._el(element);
    if (!el) return;
    var focusClass = "js-focus-hidden";
    el.setAttribute("tabIndex", "-1");
    el.focus();
    el.classList.add(focusClass);
    el.addEventListener("blur", function callback() {
      el.classList.remove(focusClass);
      el.removeAttribute("tabindex");
      el.removeEventListener("blur", callback);
    });
  },

  /**
   * If there's a hash in the url, focus the appropriate element
   */
  focusHash: function () {
    var hash = window.location.hash;
    if (hash && document.getElementById(hash.slice(1))) {
      this.pageLinkFocus(document.getElementById(hash.slice(1)));
    }
  },

  /**
   * When an in-page (url w/hash) link is clicked, focus the appropriate element
   */
  bindInPageLinks: function () {
    var self = this;
    document.querySelectorAll('a[href*="#"]').forEach(function (a) {
      a.addEventListener("click", function (evt) {
        var hash = evt.currentTarget.hash;
        if (hash) self.pageLinkFocus(document.querySelector(hash));
      });
    });
  },

  /**
   * Traps the focus in a particular container.
   * options.$container / $elementToFocus may be jQuery objects or DOM nodes.
   */
  trapFocus: function (options) {
    var container = this._el(options.$container);
    if (!container) return;
    var toFocus = options.$elementToFocus
      ? this._el(options.$elementToFocus)
      : container;
    container.setAttribute("tabindex", "-1");
    if (toFocus) toFocus.focus();

    this._traps = this._traps || {};
    var key = options.namespace || "_default";
    if (this._traps[key]) {
      document.removeEventListener("focusin", this._traps[key]);
    }
    var handler = function (evt) {
      if (container !== evt.target && !container.contains(evt.target)) {
        container.focus();
      }
    };
    this._traps[key] = handler;
    document.addEventListener("focusin", handler);
  },

  /**
   * Removes the trap of focus in a particular container.
   */
  removeTrapFocus: function (options) {
    options = options || {};
    var container = this._el(options.$container);
    if (container) container.removeAttribute("tabindex");
    this._traps = this._traps || {};
    var key = options.namespace || "_default";
    if (this._traps[key]) {
      document.removeEventListener("focusin", this._traps[key]);
      delete this._traps[key];
    }
  },
};

/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *
 * Alternatives
 * - Accounting.js - http://openexchangerates.github.io/accounting.js/
 *
 */

theme.Currency = (function () {
  var moneyFormat = "${{amount}}"; // eslint-disable-line camelcase

  function formatMoney(cents, format) {
    if (typeof cents === "string") {
      cents = cents.replace(".", "");
    }
    var value = "";
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || moneyFormat;

    function formatWithDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ",";
      decimal = decimal || ".";

      if (isNaN(number) || number === null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      var parts = number.split(".");
      var dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        "$1" + thousands
      );
      var centsAmount = parts[1] ? decimal + parts[1] : "";

      return dollarsAmount + centsAmount;
    }

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
      case "amount_no_decimals_with_space_separator":
        value = formatWithDelimiters(cents, 0, " ");
        break;
      case "amount_with_apostrophe_separator":
        value = formatWithDelimiters(cents, 2, "'");
        break;
    }
    return formatString.replace(placeholderRegex, value);
  }

  return {
    formatMoney: formatMoney,
  };
})();

/**
 * Image Helper Functions
 * -----------------------------------------------------------------------------
 * A collection of functions that help with basic image operations.
 *
 */

theme.Images = (function () {
  /**
   * Preloads an image in memory and uses the browsers cache to store it until needed.
   *
   * @param {Array} images - A list of image urls
   * @param {String} size - A shopify image size attribute
   */

  function preload(images, size) {
    if (typeof images === "string") {
      images = [images];
    }

    for (var i = 0; i < images.length; i++) {
      var image = images[i];
      this.loadImage(this.getSizedImageUrl(image, size));
    }
  }

  /**
   * Loads and caches an image in the browsers cache.
   * @param {string} path - An image url
   */
  function loadImage(path) {
    new Image().src = path;
  }

  /**
   * Swaps the src of an image for another OR returns the imageURL to the callback function
   * @param image
   * @param element
   * @param callback
   */
  function switchImage(image, element, callback) {
    var size = this.imageSize(element.src);
    var imageUrl = this.getSizedImageUrl(image.src, size);

    if (callback) {
      callback(imageUrl, image, element); // eslint-disable-line callback-return
    } else {
      element.src = imageUrl;
    }
  }

  /**
   * +++ Useful
   * Find the Shopify image attribute size
   *
   * @param {string} src
   * @returns {null}
   */
  function imageSize(src) {
    src = src || "";

    var match = src.match(
      /.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\\.@]/
    );

    if (match === null) {
      return null;
    } else {
      return match[1];
    }
  }

  /**
   * +++ Useful
   * Adds a Shopify size attribute to a URL
   *
   * @param src
   * @param size
   * @returns {*}
   */
  function getSizedImageUrl(src, size) {
    if (size === null) {
      return src;
    }

    if (size === "master") {
      return this.removeProtocol(src);
    }

    var match = src.match(
      /\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i
    );

    if (match !== null) {
      var prefix = src.split(match[0]);
      var suffix = match[0];

      return this.removeProtocol(prefix[0] + "_" + size + suffix);
    }

    return null;
  }

  function removeProtocol(path) {
    return path.replace(/http(s)?:/, "");
  }

  return {
    preload: preload,
    loadImage: loadImage,
    switchImage: switchImage,
    imageSize: imageSize,
    getSizedImageUrl: getSizedImageUrl,
    removeProtocol: removeProtocol,
  };
})();

/**
 * Variant Selection scripts
 * ------------------------------------------------------------------------------
 *
 * Handles change events from the variant inputs in any `cart/add` forms that may
 * exist.  Also updates the master select and triggers updates when the variants
 * price or image changes.
 *
 * @namespace variants
 */

slate.Variants = (function () {
  /**
   * Variant constructor
   *
   * @param {object} options - Settings from `product.js`
   */
  function Variants(options) {
    // Accept a jQuery object OR a DOM element for $container.
    this.container =
      options.$container && options.$container.jquery
        ? options.$container[0]
        : options.$container;
    this.product = options.product;
    this.singleOptionSelector = options.singleOptionSelector;
    this.originalSelectorId = options.originalSelectorId;
    this.enableHistoryState = options.enableHistoryState;
    this.currentVariant = this._getVariantFromOptions();

    var self = this;
    this.container
      .querySelectorAll(this.singleOptionSelector)
      .forEach(function (el) {
        el.addEventListener("change", self._onSelectChange.bind(self));
      });
  }

  Variants.prototype = Object.assign({}, Variants.prototype, {
    // Dispatch a native CustomEvent (variant on .detail AND directly on the event
    // for handler compatibility), and also fire the jQuery event so listeners that
    // are not yet migrated keep working. The jQuery compat is removed once all
    // listeners (theme.Product / swatchCard2 / bundleProduct) are vanilla.
    _trigger: function (type, variant) {
      var ev = new CustomEvent(type, { bubbles: false, detail: { variant: variant } });
      ev.variant = variant;
      this.container.dispatchEvent(ev);
      if (window.jQuery) {
        window.jQuery(this.container).trigger({ type: type, variant: variant });
      }
    },

    _getCurrentOptions: function () {
      var currentOptions = Array.prototype.map.call(
        this.container.querySelectorAll(this.singleOptionSelector),
        function (element) {
          var type = element.getAttribute("type");
          var currentOption = {};

          if (type === "radio" || type === "checkbox") {
            if (element.checked) {
              currentOption.value = element.value;
              currentOption.index = element.getAttribute("data-index");
              return currentOption;
            } else {
              return false;
            }
          } else {
            currentOption.value = element.value;
            currentOption.index = element.getAttribute("data-index");
            return currentOption;
          }
        }
      );
      return currentOptions.filter(Boolean);
    },

    _getVariantFromOptions: function () {
      var selectedValues = this._getCurrentOptions();
      var variants = this.product.variants;
      var found = variants.find(function (variant) {
        return selectedValues.every(function (values) {
          return variant[values.index] === values.value;
        });
      });
      for (var r = 0; r < selectedValues.length; r++) {
        var t = r + 1;
        document
          .querySelectorAll(".js-swatch-display--" + t)
          .forEach(function (el) {
            el.textContent = selectedValues[r].value;
          });
      }
      return found;
    },

    _onSelectChange: function () {
      var variant = this._getVariantFromOptions();

      this._trigger("variantChange", variant);

      if (!variant) {
        return;
      }

      this._updateMasterSelect(variant);
      this._updateImages(variant);
      this._updatePrice(variant);
      this._updateSKU(variant);
      this.currentVariant = variant;

      if (this.enableHistoryState) {
        this._updateHistoryState(variant);
      }
    },

    _updateImages: function (variant) {
      var variantImage = variant.featured_image || {};
      var currentVariantImage = this.currentVariant.featured_image || {};

      if (
        !variant.featured_image ||
        variantImage.src === currentVariantImage.src
      ) {
        return;
      }

      this._trigger("variantImageChange", variant);
    },

    _updatePrice: function (variant) {
      if (
        variant.price === this.currentVariant.price &&
        variant.compare_at_price === this.currentVariant.compare_at_price
      ) {
        return;
      }

      this._trigger("variantPriceChange", variant);
    },

    _updateSKU: function (variant) {
      if (variant.sku === this.currentVariant.sku) {
        return;
      }

      this._trigger("variantSKUChange", variant);
    },

    _updateHistoryState: function (variant) {
      if (!history.replaceState || !variant) {
        return;
      }

      var newurl =
        window.location.protocol +
        "//" +
        window.location.host +
        window.location.pathname +
        "?variant=" +
        variant.id;
      window.history.replaceState({ path: newurl }, "", newurl);
    },

    _updateMasterSelect: function (variant) {
      var master = this.container.querySelector(this.originalSelectorId);
      if (master) master.value = variant.id;
    },
  });

  return Variants;
})();

/*================ MODULES ================*/
// Vanilla replacement for the $.fn.prepareTransition (Snook) plugin: add an
// 'is-transitioning' class for the duration of the element's CSS transition.
theme.prepareTransition = function (el) {
  if (!el) return el;
  var duration = parseFloat(getComputedStyle(el).transitionDuration) || 0;
  if (duration !== 0) {
    el.classList.add("is-transitioning");
    void el.offsetWidth; // force reflow so the transition runs
    el.addEventListener("transitionend", function handler() {
      el.classList.remove("is-transitioning");
      el.removeEventListener("transitionend", handler);
    });
  }
  return el;
};

// Vanilla replacements for jQuery .fadeIn / .fadeOut / .slideToggle.
theme.fadeIn = function (el, display) {
  if (!el) return;
  el.style.opacity = 0;
  el.style.display = display || "block";
  requestAnimationFrame(function () {
    el.style.transition = "opacity .35s";
    el.style.opacity = 1;
  });
};
theme.fadeOut = function (el, cb) {
  if (!el) {
    if (cb) cb();
    return;
  }
  el.style.transition = "opacity .35s";
  el.style.opacity = 0;
  el.addEventListener("transitionend", function handler() {
    el.style.display = "none";
    el.removeEventListener("transitionend", handler);
    if (cb) cb();
  });
};
theme.slideToggle = function (el) {
  if (!el) return;
  var hidden = getComputedStyle(el).display === "none" || el.offsetHeight === 0;
  el.style.overflow = "hidden";
  el.style.transition = "height .3s ease";
  var done = function () {
    el.style.height = "";
    el.style.overflow = "";
    el.style.transition = "";
  };
  if (hidden) {
    el.style.removeProperty("display");
    if (getComputedStyle(el).display === "none") el.style.display = "block";
    var target = el.scrollHeight;
    el.style.height = "0px";
    requestAnimationFrame(function () {
      el.style.height = target + "px";
    });
    el.addEventListener("transitionend", function handler() {
      done();
      el.removeEventListener("transitionend", handler);
    });
  } else {
    el.style.height = el.scrollHeight + "px";
    requestAnimationFrame(function () {
      el.style.height = "0px";
    });
    el.addEventListener("transitionend", function handler() {
      el.style.display = "none";
      done();
      el.removeEventListener("transitionend", handler);
    });
  }
};

// Vanilla cookie get/set (replaces the jquery.cookie plugin).
theme.cookie = {
  get: function (name) {
    var m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return m ? decodeURIComponent(m.pop()) : null;
  },
  set: function (name, value, daysOrDate, path) {
    var expires = "";
    if (daysOrDate instanceof Date) {
      expires = "; expires=" + daysOrDate.toUTCString();
    } else if (daysOrDate) {
      var d = new Date();
      d.setTime(d.getTime() + daysOrDate * 864e5);
      expires = "; expires=" + d.toUTCString();
    }
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      expires +
      "; path=" +
      (path || "/");
  },
};

theme.Drawers = (function () {
  var Drawer = function (id, position, options) {
    var defaults = {
      close: ".js-drawer-close",
      open: ".js-drawer-open-" + position,
      openClass: "js-drawer-open",
      dirOpenClass: "js-drawer-open-" + position,
    };

    this.config = Object.assign(defaults, options);
    this.position = position;

    this.drawer = document.getElementById(id);
    if (!this.drawer) {
      return false;
    }

    this.page = document.querySelector(".page-element");
    this.drawerIsOpen = false;
    // Bind handlers once so they can be detached on close.
    this._onKeyup = this._onKeyup.bind(this);
    this._onOutsideClick = this._onOutsideClick.bind(this);
    this._onPageTouch = function (e) {
      e.preventDefault();
    };
    this.init();
  };

  Drawer.prototype.init = function () {
    var self = this;
    document.querySelectorAll(this.config.open).forEach(function (btn) {
      btn.addEventListener("click", self.open.bind(self));
    });
    // Delegated close (close buttons live inside the drawer)
    this.drawer.addEventListener("click", function (evt) {
      if (evt.target.closest(self.config.close)) {
        self.close(evt);
      }
    });
  };

  Drawer.prototype._setParentClass = function (add) {
    var method = add ? "add" : "remove";
    var cls = [this.config.openClass, this.config.dirOpenClass];
    [document.body, document.documentElement].forEach(function (el) {
      cls.forEach(function (c) {
        el.classList[method](c);
      });
    });
  };

  Drawer.prototype.open = function (evt) {
    var externalCall = false;

    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Stop the click bubbling to the page click handler (which would re-close).
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      this.activeSource = evt.currentTarget;
    }

    if (this.drawerIsOpen && !externalCall) {
      return this.close();
    }

    theme.prepareTransition(this.drawer);
    this._setParentClass(true);
    this.drawerIsOpen = true;

    slate.a11y.trapFocus({
      $container: this.drawer,
      $elementToFocus: this.drawer.querySelector(".drawer__close-button"),
      namespace: "drawer_focus",
    });

    if (
      this.config.onDrawerOpen &&
      typeof this.config.onDrawerOpen === "function"
    ) {
      if (!externalCall) {
        this.config.onDrawerOpen();
      }
    }

    if (this.activeSource && this.activeSource.getAttribute("aria-expanded")) {
      this.activeSource.setAttribute("aria-expanded", "true");
    }

    document.addEventListener("keyup", this._onKeyup);
    document.addEventListener("click", this._onOutsideClick);
    if (this.page) {
      this.page.addEventListener("touchmove", this._onPageTouch, {
        passive: false,
      });
    }
  };

  Drawer.prototype._onKeyup = function (evt) {
    if (evt.keyCode !== 27) return; // esc
    this.close();
  };

  Drawer.prototype._onOutsideClick = function (evt) {
    // Close on any click outside the drawer. The darkened backdrop is a ::after
    // pseudo-element on the (transformed) .page-container, so a document-level
    // listener is more reliable than listening on .page-element.
    if (this.drawer.contains(evt.target)) return; // inside drawer -> keep open
    if (
      this.activeSource &&
      (evt.target === this.activeSource ||
        (this.activeSource.contains && this.activeSource.contains(evt.target)))
    ) {
      return; // the open trigger toggles itself
    }
    this.close();
  };

  Drawer.prototype.close = function () {
    if (!this.drawerIsOpen) return;

    // deselect any focused form elements
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }

    theme.prepareTransition(this.drawer);
    this._setParentClass(false);
    this.drawerIsOpen = false;

    slate.a11y.removeTrapFocus({
      $container: this.drawer,
      namespace: "drawer_focus",
    });

    document.removeEventListener("keyup", this._onKeyup);
    document.removeEventListener("click", this._onOutsideClick);
    if (this.page) {
      this.page.removeEventListener("touchmove", this._onPageTouch);
    }
  };

  return Drawer;
})();

window.Modals = (function () {
  var Modal = function (id, name, options) {
    var defaults = {
      close: ".js-modal-close",
      open: ".js-modal-open-" + name,
      openClass: "modal--is-active",
    };

    this.modal = document.getElementById(id);
    if (!this.modal) {
      return false;
    }
    // Compat bridge: theme.Product (still jQuery) uses this.ProductModal.$modal
    // .on()/.off(). Remove once theme.Product is migrated (cart block).
    this.$modal = window.jQuery ? window.jQuery(this.modal) : null;

    this.config = Object.assign(defaults, options);

    this.modalIsOpen = false;
    this.focusOnOpen = this.config.focusOnOpen
      ? document.querySelector(this.config.focusOnOpen)
      : this.modal;
    this._onKeyup = this._onKeyup.bind(this);
    this.init();
  };

  Modal.prototype.init = function () {
    var self = this;
    document.querySelectorAll(this.config.open).forEach(function (btn) {
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", self.open.bind(self));
    });
    this.modal.querySelectorAll(this.config.close).forEach(function (btn) {
      btn.addEventListener("click", self.close.bind(self));
    });
  };

  Modal.prototype.open = function (evt) {
    var externalCall = false;

    if (this.modalIsOpen) {
      return;
    }

    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      this.activeSource = evt.currentTarget;
    }

    if (this.modalIsOpen && !externalCall) {
      return this.close();
    }

    theme.prepareTransition(this.modal);
    this.modal.classList.add(this.config.openClass);
    document.body.classList.add(this.config.openClass);

    this.modalIsOpen = true;

    slate.a11y.trapFocus({
      $container: this.modal,
      namespace: "modal_focus",
      $elementToFocus: this.focusOnOpen,
    });

    if (this.activeSource && this.activeSource.getAttribute("aria-expanded")) {
      this.activeSource.setAttribute("aria-expanded", "true");
    }

    this.bindEvents();
  };

  Modal.prototype.close = function () {
    if (!this.modalIsOpen) {
      return;
    }

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }

    theme.prepareTransition(this.modal);
    this.modal.classList.remove(this.config.openClass);
    document.body.classList.remove(this.config.openClass);

    this.modalIsOpen = false;

    slate.a11y.removeTrapFocus({
      $container: this.modal,
      namespace: "modal_focus",
    });

    if (this.activeSource && this.activeSource.getAttribute("aria-expanded")) {
      this.activeSource.setAttribute("aria-expanded", "false");
      this.activeSource.focus();
    }

    this.unbindEvents();
  };

  Modal.prototype._onKeyup = function (evt) {
    if (evt.keyCode === 27) {
      this.close();
    }
  };

  Modal.prototype.bindEvents = function () {
    document.body.addEventListener("keyup", this._onKeyup);
  };

  Modal.prototype.unbindEvents = function () {
    document.body.removeEventListener("keyup", this._onKeyup);
  };

  return Modal;
})();

window.QtySelector = (function () {
  var QtySelector = function ($el) {
    this.cache = {
      $body: $("body"),
      $subtotal: $("#CartSubtotal"),
      $discountTotal: $("#cartDiscountTotal"),
      $cartTable: $(".cart-table"),
      $cartTemplate: $("#CartProducts"),
    };

    this.settings = {
      loadingClass: "js-qty--is-loading",
      isCartTemplate: this.cache.$body.hasClass("template-cart"),
      // On the cart template, minimum is 0. Elsewhere min is 1
      minQty: this.cache.$body.hasClass("template-cart") ? 0 : 1,
    };

    this.$el = $el;
    this.qtyUpdateTimeout;
    this.createInputs();
    this.bindEvents();
  };

  QtySelector.prototype.createInputs = function () {
    var $el = this.$el;

    var data = {
      value: $el.val(),
      key: $el.attr("id"),
      name: $el.attr("name"),
      line: $el.attr("data-line"),
    };
    var source = $("#QuantityTemplate").html();
    var template = Handlebars.compile(source);

    this.$wrapper = $(template(data)).insertBefore($el);

    // Remove original number input
    $el.remove();
  };

  QtySelector.prototype.validateAvailability = function (line, quantity) {
    var product = theme.cartObject.items[line - 1]; // 0-based index in API
    var handle = product.handle; // needed for the ajax request
    var id = product.id; // needed to find right variant from ajax results

    var params = {
      type: "GET",
      url: "/products/" + handle + ".js",
      dataType: "json",
      success: $.proxy(function (cartProduct) {
        this.validateAvailabilityCallback(line, quantity, id, cartProduct);
      }, this),
    };

    $.ajax(params);
  };

  QtySelector.prototype.validateAvailabilityCallback = function (
    line,
    quantity,
    id,
    product
  ) {
    var quantityIsAvailable = true;

    // This returns all variants of a product.
    // Loop through them to get our desired one.
    for (var i = 0; i < product.variants.length; i++) {
      var variant = product.variants[i];
      if (variant.id === id) {
        break;
      }
    }

    // If the variant tracks inventory and does not sell when sold out
    // we can compare the requested with available quantity
    if (
      variant.inventory_management !== null &&
      variant.inventory_policy === "deny"
    ) {
      if (variant.inventory_quantity < quantity) {
        // Set quantity to max amount available
        this.$wrapper.find(".js-qty__input").val(variant.inventory_quantity);

        quantityIsAvailable = false;
        this.$wrapper.removeClass(this.settings.loadingClass);
      }
    }

    if (quantityIsAvailable) {
      this.updateItemQuantity(line, quantity);
    }
  };

  QtySelector.prototype.validateQty = function (qty) {
    if (parseFloat(qty) === parseInt(qty, 10) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      // Not a number. Default to 1.
      qty = 1;
    }
    return parseInt(qty, 10);
  };

  QtySelector.prototype.adjustQty = function (evt) {
    var $el = $(evt.currentTarget);
    var $input = $el.siblings(".js-qty__input");
    var qty = this.validateQty($input.val());
    var line = $input.attr("data-line");

    if ($el.hasClass("js-qty__adjust--minus")) {
      qty -= 1;
      if (qty <= this.settings.minQty) {
        qty = this.settings.minQty;
      }
    } else {
      qty += 1;
    }

    if (this.settings.isCartTemplate) {
      $el.parent().addClass(this.settings.loadingClass);
      this.updateCartItemPrice(line, qty);
    } else {
      $input.val(qty);
    }
  };

  QtySelector.prototype.bindEvents = function () {
    this.$wrapper
      .find(".js-qty__adjust")
      .on("click", $.proxy(this.adjustQty, this));

    // Select input text on click
    this.$wrapper.on("click", ".js-qty__input", function () {
      this.setSelectionRange(0, this.value.length);
    });

    // If the quantity changes on the cart template, update the price
    if (this.settings.isCartTemplate) {
      this.$wrapper.on(
        "change",
        ".js-qty__input",
        $.proxy(function (evt) {
          var $input = $(evt.currentTarget);
          var line = $input.attr("data-line");
          var qty = this.validateQty($input.val());
          $input.parent().addClass(this.settings.loadingClass);
          this.updateCartItemPrice(line, qty);
        }, this)
      );
    }
  };

  QtySelector.prototype.updateCartItemPrice = function (line, qty) {
    // Update cart after short timeout so user doesn't create simultaneous ajax calls
    clearTimeout(this.qtyUpdateTimeout);
    this.qtyUpdateTimeout = setTimeout(
      $.proxy(function () {
        this.validateAvailability(line, qty);
      }, this),
      200
    );
  };

  QtySelector.prototype.updateItemQuantity = function (line, quantity) {
    var params = {
      type: "POST",
      url: "/cart/change.js",
      data: "quantity=" + quantity + "&line=" + line,
      dataType: "json",
      success: $.proxy(function (cart) {
        this.updateCartItemCallback(cart);
      }, this),
    };

    $.ajax(params);
  };

  QtySelector.prototype.updateCartItemCallback = function (cart) {
    // Reload the page to show the empty cart if no items
    if (cart.item_count === 0) {
      location.reload();
      return;
    }

    // Update cart object
    theme.cartObject = cart;

    // Handlebars.js cart layout
    var data = {};
    var items = [];
    var item = {};
    var source = $("#CartProductTemplate").html();
    var template = Handlebars.compile(source);
    var prodImg;

    // Add each item to our handlebars.js data
    $.each(cart.items, function (index, cartItem) {
      /* Hack to get product image thumbnail
       *   - If image is not null
       *     - Remove file extension, add 240x240, and re-add extension
       *     - Create server relative link
       *   - A hard-coded url of no-image
       */

      if (cartItem.image === null) {
        prodImg =
          "//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif";
      } else {
        prodImg = cartItem.image
          .replace(/(\.[^.]*)$/, "_240x240$1")
          .replace("http:", "");
      }

      if (cartItem.properties !== null) {
        $.each(cartItem.properties, function (key, value) {
          if (key.charAt(0) === "_" || !value) {
            delete cartItem.properties[key];
          }
        });
      }

      // Create item's data object and add to 'items' array
      item = {
        key: cartItem.key,
        line: index + 1, // Shopify uses a 1+ index in the API
        url: cartItem.url,
        img: prodImg,
        name: cartItem.product_title,
        variation: cartItem.variant_title,
        properties: cartItem.properties,
        itemQty: cartItem.quantity,
        price: theme.Currency.formatMoney(cartItem.price, theme.moneyFormat),
        vendor: cartItem.vendor,
        linePrice: theme.Currency.formatMoney(
          cartItem.line_price,
          theme.moneyFormat
        ),
        originalLinePrice: theme.Currency.formatMoney(
          cartItem.original_line_price,
          theme.moneyFormat
        ),
        discounts: cartItem.discounts,
        discountsApplied:
          cartItem.line_price === cartItem.original_line_price ? false : true,
      };

      items.push(item);
      //theme.updateCurrencies();
    });

    // Gather all cart data and add to DOM
    data = {
      items: items,
    };
    this.cache.$cartTemplate.empty().append(template(data));

    // Create new quantity selectors
    this.cache.$cartTable.find('input[type="number"]').each(function (i, el) {
      new QtySelector($(el));
    });

    // Update the cart subtotal
    this.cache.$subtotal.html(
      theme.Currency.formatMoney(cart.total_price, theme.moneyFormat)
    );

    // Update the cart total discounts
    if (cart.total_discount > 0) {
      this.cache.$discountTotal.html(
        theme.strings.totalCartDiscount.replace(
          "[savings]",
          theme.Currency.formatMoney(cart.total_discount, theme.moneyFormat)
        )
      );
    } else {
      this.cache.$discountTotal.empty();
    }

    theme.miniCart.updateElements();
    //theme.updateCurrencies();
    // Set focus on cart table
    slate.a11y.pageLinkFocus(this.cache.$cartTable);
  };

  return QtySelector;
})();

/*
  Allow product to be added to cart via ajax with
  custom success and error responses.
*/
window.AjaxCart = (function () {
  var _mc = document.querySelector(".js-mini-cart");
  var styleCart = _mc ? _mc.getAttribute("data-cartmini") : null;

  var cart = function (form) {
    // accept a jQuery object or a DOM <form>
    this.form = form && form.jquery ? form[0] : form;
    this.eventListeners();

    this.showNotice = false;
    if (this.form) {
      this.showNotice = this.form.classList.contains("js-form--notice");
    }
  };

  cart.prototype.eventListeners = function () {
    if (this.form) {
      this.form.addEventListener("submit", this.addItemFromForm.bind(this));
    }
  };

  cart.prototype.addItemFromForm = function (evt) {
    evt.preventDefault();
    var form = this.form;
    var submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.classList.add("is-loading");
    var self = this;
    fetch(window.Shopify.routes.root + "cart/add.js", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw data;
          return data;
        });
      })
      .then(function (lineItem) {
        self.success(lineItem);
      })
      .catch(function (err) {
        self.error(err);
      })
      .finally(function () {
        if (submitButton) submitButton.classList.remove("is-loading");
      });
  };

  cart.prototype.success = function (item) {
    if (theme.miniCart) {
      theme.miniCart.updateElements();
      theme.miniCart.generateCart();
    }
    if (styleCart != "true") {
      if (this.showNotice) {
        var htmlVariant =
          item.variant_title !== null
            ? "<i>(" + item.variant_title + ")</i>"
            : "";
        var htmlAlert =
          '<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="' +
          item.image +
          '"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">' +
          item.product_title +
          " x " +
          item.quantity +
          "</p>" +
          htmlVariant +
          "<div><div>";
        theme.alert.new(
          theme.strings.addToCartSuccess,
          htmlAlert,
          3000,
          "notice"
        );
      } else {
        if (theme.crosssell) theme.crosssell.showPopup(item);
      }
    }
  };

  // Error handling reference from Shopify.onError in api.jquery.js
  cart.prototype.error = function (data) {
    if (data && data.message) {
      theme.alert.new("", data.description, 3000, "warning");
    }
  };

  return cart;
})();

/*================ TEMPLATES ================*/
theme.customerTemplates = (function () {
  function on(el, evt, fn) {
    if (el) el.addEventListener(evt, fn);
  }

  function initEventListeners() {
    // Show / hide reset password form
    on(document.getElementById("RecoverPassword"), "click", function (evt) {
      evt.preventDefault();
      toggleRecoverPasswordForm();
    });
    on(document.getElementById("HideRecoverPasswordLink"), "click", function (evt) {
      evt.preventDefault();
      toggleRecoverPasswordForm();
    });
  }

  function toggleRecoverPasswordForm() {
    var form = document.getElementById("RecoverPasswordForm");
    var login = document.getElementById("CustomerLoginForm");
    if (form) form.classList.toggle("hide");
    if (login) login.classList.toggle("hide");
  }

  function resetPasswordSuccess() {
    if (!document.querySelector(".reset-password-success")) {
      return;
    }
    var success = document.getElementById("ResetSuccess");
    if (success) success.classList.remove("hide");
  }

  function customerAddressForm() {
    var newAddressForm = document.getElementById("AddressNewForm");
    if (!newAddressForm) {
      return;
    }

    // Initialize observers on address selectors, defined in shopify_common.js
    if (window.Shopify) {
      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector(
        "AddressCountryNew",
        "AddressProvinceNew",
        { hideElement: "AddressProvinceContainerNew" }
      );
    }

    // Initialize each edit form's country/province selector
    document.querySelectorAll(".address-country-option").forEach(function (el) {
      var formId = el.getAttribute("data-form-id");
      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector(
        "AddressCountry_" + formId,
        "AddressProvince_" + formId,
        { hideElement: "AddressProvinceContainer_" + formId }
      );
    });

    // Toggle new/edit address forms
    document.querySelectorAll(".address-new-toggle").forEach(function (el) {
      el.addEventListener("click", function () {
        newAddressForm.classList.toggle("hide");
      });
    });

    document.querySelectorAll(".address-edit-toggle").forEach(function (el) {
      el.addEventListener("click", function () {
        var formId = el.getAttribute("data-form-id");
        var edit = document.getElementById("EditAddress_" + formId);
        if (edit) edit.classList.toggle("hide");
      });
    });

    document.querySelectorAll(".address-delete").forEach(function (el) {
      el.addEventListener("click", function () {
        var formId = el.getAttribute("data-form-id");
        var confirmMessage = el.getAttribute("data-confirm-message");
        // eslint-disable-next-line no-alert
        if (
          confirm(
            confirmMessage || "Are you sure you wish to delete this address?"
          )
        ) {
          Shopify.postLink("/account/addresses/" + formId, {
            parameters: { _method: "delete" },
          });
        }
      });
    });
  }

  function checkUrlHash() {
    // Allow deep linking to recover password form
    if (window.location.hash === "#recover") {
      toggleRecoverPasswordForm();
    }
  }

  return {
    init: function () {
      checkUrlHash();
      initEventListeners();
      resetPasswordSuccess();
      customerAddressForm();
    },
  };
})();

/*================ SECTIONS ================*/
theme.HeaderSection = (function () {
  function HeaderSection(container) {
    var sectionId = container.getAttribute("data-section-id");
    var stickyId = container.getAttribute("data-sticky");
    theme.NavDrawer = new theme.Drawers("NavDrawer", "left");
    this.selectors = {
      headerID: ".section-" + sectionId,
      typeHeader: stickyId,
    };
    this.init();
  }
  HeaderSection.prototype = Object.assign({}, HeaderSection.prototype, {
    init: function () {
      this.stickyHeader();
      this.headerSearch();
      this.headerHeight();
      this.delayMenu();
    },
    headerHeight: function () {
      var header = document.querySelector(".site-header");
      var rootElement = document.querySelector(":root");
      rootElement.style.setProperty(
        "--height-header",
        header.offsetHeight + "px"
      );
    },
    headerSearch: function () {
      let modalOpen = document.querySelector(".modal__toggle-open"),
        close = document.querySelector(".search-modal__close-button"),
        searchMobile = document.querySelector(".modal__toggle-search-mobile");
      (input = document.getElementById("Search-In-Modal")),
        (overlayOpen = document.querySelector(".modal-overlay"));

      modalOpen.addEventListener("click", toggleClassSearch);
      overlayOpen.addEventListener("click", toggleClassSearch);
      close.addEventListener("click", toggleClassSearch);
      searchMobile.addEventListener("click", toggleClassSearch);

      function toggleClassSearch() {
        document.querySelector(".detail-modal").classList.toggle("active");
        overlayOpen.classList.toggle("active");
        if (window.matchMedia("(min-width: 992px)").matches) {
          input.focus();
        }
      }
      overlayOpen.addEventListener("click", function () {
        input.value = "";
        document.querySelector(".predictive-search").style.display = "none";
      });
      close.addEventListener("click", function () {
        input.value = "";
        document.querySelector(".predictive-search").style.display = "none";
      });
    },
    // Stickyheader
    stickyHeader: function () {
      var stickHeaderClass = this.selectors.headerID;
      var stickyHeader = this.selectors.typeHeader;
      var offsetHeight = document
        .querySelector(stickHeaderClass)
        .clientHeight.toString();

      var prevScrollpos = window.pageYOffset;
      if (stickyHeader === "sticky") {
        window.onscroll = debounce(function () {
          var currentScrollPos = window.pageYOffset;
          if (currentScrollPos > 30) {
            setTimeout(function () {
              document.querySelector(stickHeaderClass).classList.add("active");
            }, 0);
          } else {
            setTimeout(function () {
              document
                .querySelector(stickHeaderClass)
                .classList.remove("active");
            }, 0);
          }
          prevScrollpos = currentScrollPos;
        }, 100);
      } else if (stickyHeader === "sticky-top") {
        const mediaQuery = window.matchMedia("(min-width: 1000px)");

        window.onscroll = function () {
          var currentScrollPos = window.pageYOffset;
          if (
            prevScrollpos > currentScrollPos &&
            prevScrollpos - currentScrollPos > offsetHeight
          ) {
            function responsiveHeader() {
              if (mediaQuery.matches) {
                document.querySelector(stickHeaderClass).style.top = "0";
              }
            }
            responsiveHeader();
            document.addEventListener("resize", (event) => {
              responsiveHeader();
            });
            if (currentScrollPos == 0) {
              document
                .querySelector(stickHeaderClass)
                .classList.remove("active");
            } else {
              document.querySelector(stickHeaderClass).classList.add("active");
            }
          } else if (currentScrollPos - prevScrollpos > offsetHeight) {
            function responsiveHeader2() {
              if (mediaQuery.matches) {
                document.querySelector(
                  stickHeaderClass
                ).style.top = `-${offsetHeight}px`;
              }
            }
            responsiveHeader2();
            document.addEventListener("resize", (event) => {
              responsiveHeader2();
            });
            document.querySelector(stickHeaderClass).classList.remove("active");
          }
          prevScrollpos = currentScrollPos;
        };
      } else {
        return null;
      }
      function debounce(func, wait) {
        var timeout;
        return function executedFunction() {
          var context = this;
          var args = arguments;
          var later = function () {
            timeout = null;
            func.apply(context, args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      }
    },
    // hoverMenu
    delayMenu: function () {
      document.querySelectorAll(".site-nav__item-mega").forEach(function (mega) {
        mega.querySelectorAll(".d-col-link").forEach(function (link, i) {
          link.style.animationDelay = ((i + 1) / 10) * 0.8 + "s";
        });
      });
    },
  });

  return HeaderSection;
})();

theme.CartDraw = (function () {
  theme.testDrawer = new theme.Drawers("testDrawer", "left");
  /*$('.drawer-crossell-product').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    variableWidth: true,
    dots: false,
    arrows:true,
    infinite:false,
  });*/
  /*$(document).ready(function() {
    $('body').on('click', '[name="checkout"], [name="goto_pp"], [name="goto_gc"]', function() {
      if ($('#agree_checkout').is(':checked')) {
        $(this).submit();
      }
      else {
        alert("You must agree with the terms and conditions of sales to check out.");
        return false;
      }
    });
  });*/
})();

theme.Product = (function () {
  var defaults = {
    smallBreakpoint: 750,
    productThumbIndex: 0,
    productThumbMax: 0,
    ajaxCart: false,
    stockSetting: false,
  };

  // DOM helpers (apply to single or multiple matches, like jQuery)
  function setHtml(sel, html, ctx) {
    (ctx || document).querySelectorAll(sel).forEach(function (e) {
      e.innerHTML = html;
    });
  }
  function setText(sel, txt, ctx) {
    (ctx || document).querySelectorAll(sel).forEach(function (e) {
      e.textContent = txt;
    });
  }
  function addCls(sel, cls, ctx) {
    (ctx || document).querySelectorAll(sel).forEach(function (e) {
      e.classList.add(cls);
    });
  }
  function rmCls(sel, cls, ctx) {
    (ctx || document).querySelectorAll(sel).forEach(function (e) {
      e.classList.remove(cls);
    });
  }
  function setDisp(sel, show, ctx) {
    (ctx || document).querySelectorAll(sel).forEach(function (e) {
      e.style.display = show ? "" : "none";
    });
  }

  function Product(container) {
    this.container = container;
    var sectionId = container.getAttribute("data-section-id");
    var sectionTem = container.getAttribute("data-id");

    this.selectors = {
      originalSelectorId: "#ProductSelect-" + sectionId,
      modal: "ProductModal",
      productZoomImage: "#ProductZoomImg",
      addToCart: "#AddToCart-" + sectionId,
      productPrice: "#ProductPrice-" + sectionId,
      comparePrice: "#ComparePrice-" + sectionId,
      addToCartText: "#AddToCartText-" + sectionId,
      SKU: ".js-variant-sku",
      productImageMain: ".gallery-wrap" + sectionId,
      productImageContainers: ".product__photo-container-" + sectionId,
      productImageWrappers: ".product__photo-wrapper-" + sectionId,
      productThumbContainers: ".product-single__thumbnail-item-" + sectionId,
      productThumbsWrapper: ".product-single__thumbnails-" + sectionId,
      productThumbs: ".product-single__thumbnail-" + sectionId,
      saleTag: "#ProductSaleTag-" + sectionId,
      productStock: "#ProductStock-" + sectionId,
      singleOptionSelector: ".single-option-selector-" + sectionId,
      shopifyPaymentButton: ".shopify-payment-button",
      availability: ".product-single__availability",
      hurrify: ".js-hurrify",
      txtHurrify: ".js-hurrify .js-txt-hurrify",
      labelwrap_sale: ".product-tag-sale",
      numbersale_change: ".product-tag-sale-number",
    };
    this.settings = Object.assign({}, defaults, {
      sectionId: sectionId,
      sectionTem: sectionTem,
      ajaxCart: container.getAttribute("data-ajax") === "true",
      stockSetting: container.getAttribute("data-stock") === "true",
      enableHistoryState:
        container.getAttribute("data-enable-history-state") === "true",
      namespace: ".product-" + sectionId,
    });

    // Stop parsing if we don't have the product json script tag
    var jsonEl = document.getElementById("ProductJson-" + sectionId);
    if (!jsonEl || !jsonEl.innerHTML) {
      return;
    }

    this.productSingleObject = JSON.parse(jsonEl.innerHTML);
    this.addVariantInfo();

    this.init();
  }

  Product.prototype = Object.assign({}, Product.prototype, {
    init: function () {
      this._stringOverrides();
      this._initVariants();
      this._productZoomImage();
      this._productThumbSwitch();
      this._productThumbnailSlider();
      this._initQtySelector();

      if (this.settings.ajaxCart) {
        theme.AjaxCart = new window.AjaxCart(
          document.getElementById("AddToCartForm-" + this.settings.sectionId)
        );
      }
    },

    _stringOverrides: function () {
      window.productStrings = window.productStrings || {};
      Object.assign(theme.strings, window.productStrings);
    },

    addVariantInfo: function () {
      if (!this.productSingleObject || !this.settings.stockSetting) {
        return;
      }

      var jsonEl = document.getElementById(
        "VariantJson-" + this.settings.sectionId
      );
      if (!jsonEl) return;
      var variantInfo = JSON.parse(jsonEl.innerHTML);

      for (var i = 0; i < variantInfo.length; i++) {
        Object.assign(this.productSingleObject.variants[i], variantInfo[i]);
      }
    },

    _initVariants: function () {
      var options = {
        $container: this.container,
        enableHistoryState: this.settings.enableHistoryState,
        product: this.productSingleObject,
        singleOptionSelector: this.selectors.singleOptionSelector,
        originalSelectorId: this.selectors.originalSelectorId,
      };

      // eslint-disable-next-line no-new
      this.variants = new slate.Variants(options);
      var variant = this.variants;
      if (
        variant.currentVariant.compare_at_price > variant.currentVariant.price
      ) {
        var load_sale_minus =
          variant.currentVariant.compare_at_price -
          variant.currentVariant.price;
        var load_sale_per =
          (load_sale_minus * 100) / variant.currentVariant.compare_at_price;
        var load_roundNumber = parseInt(load_sale_per);
        setText(this.selectors.numbersale_change, load_roundNumber + "%");
        rmCls(this.selectors.labelwrap_sale, "hide");
      } else {
        addCls(this.selectors.labelwrap_sale, "hide");
      }
      // Store bound handlers so onUnload can detach them.
      this._handlers = {
        atc: this._updateAddToCartBtn.bind(this),
        sticky: this._updateStickyCart.bind(this),
        price: this._updatePrice.bind(this),
        sku: this._updateSKU.bind(this),
        img: this._updateImages.bind(this),
        swatch: this._updateSwatchTitle.bind(this),
      };
      this.container.addEventListener("variantChange", this._handlers.atc);
      this.container.addEventListener("variantChange", this._handlers.sticky);
      this.container.addEventListener("variantPriceChange", this._handlers.price);
      this.container.addEventListener("variantSKUChange", this._handlers.sku);
      this.container.addEventListener("variantImageChange", this._handlers.img);
      this.container.addEventListener("variantChange", this._handlers.swatch);
    },

    _updateStock: function (variant) {
      if (!this.settings.stockSetting) return;

      var stockSel = this.selectors.productStock,
        hurrifySel = this.selectors.hurrify,
        txtHurrifySel = this.selectors.txtHurrify;

      // If we don't track variant inventory, hide stock
      if (!variant || !variant.inventory_management) {
        addCls(stockSel, "hide");
        addCls(hurrifySel, "hide");
        return;
      }

      if (variant.inventory_quantity < 10 && variant.inventory_quantity > 0) {
        setHtml(
          stockSel,
          theme.strings.stockAvailable.replace("1", variant.inventory_quantity)
        );
        rmCls(stockSel, "hide");
        rmCls(hurrifySel, "hide");
        document
          .querySelectorAll(hurrifySel + " .progress-bar")
          .forEach(function (e) {
            e.style.width = variant.inventory_quantity * 10 + "%";
          });
        setHtml(
          txtHurrifySel,
          theme.strings.stringHurrify.replace(
            "number",
            variant.inventory_quantity
          )
        );
        return;
      }

      if (variant.inventory_quantity <= 0 && variant.incoming) {
        setHtml(
          stockSel,
          theme.strings.willNotShipUntil.replace(
            "[date]",
            variant.next_incoming_date
          )
        );
        rmCls(stockSel, "hide");
        addCls(hurrifySel, "hide");
        return;
      }

      // If there's more than 10 available, hide stock
      addCls(stockSel, "hide");
      addCls(hurrifySel, "hide");
    },

    _updateIncomingInfo: function (variant) {
      if (!this.settings.stockSetting) return;

      var stockSel = this.selectors.productStock;

      if (variant.incoming) {
        setHtml(
          stockSel,
          theme.strings.willBeInStockAfter.replace(
            "[date]",
            variant.next_incoming_date
          )
        );
        rmCls(stockSel, "hide");
        return;
      }

      // If there is no stock incoming, hide stock
      addCls(stockSel, "hide");
    },

    _updateAddToCartBtn: function (evt) {
      var variant = evt.variant;
      var atcSel = this.selectors.addToCart;
      var availSpanSel = this.selectors.availability + " span";
      function setDisabled(val) {
        document.querySelectorAll(atcSel).forEach(function (e) {
          e.disabled = val;
        });
      }

      if (variant) {
        let optionName = this.productSingleObject.options;

        if (variant.available) {
          // We have a valid product variant, so enable the submit button
          rmCls(atcSel, "btn--sold-out");
          setDisabled(false);
          setHtml(this.selectors.addToCartText, theme.strings.addToCart);
          setDisp(this.selectors.shopifyPaymentButton, true, this.container);
          // Show how many items are left, if below 10
          this._updateStock(variant);
          setText(availSpanSel, theme.strings.available);
          setDisp(".product__pickup-availabilities", true);
          const a1 = optionName,
            a2 = variant.options,
            someFunction = (...values) => values.join(" "),
            knownValue = ":",
            output = a1.map((value1, i) =>
              someFunction(value1, knownValue, a2[i])
            );
          setText(".pickup-availability-variant", output.join(", "));
        } else {
          // Variant is sold out, disable the submit button
          setDisabled(true);
          addCls(atcSel, "btn--sold-out");
          setHtml(this.selectors.addToCartText, theme.strings.soldOut);
          setDisp(this.selectors.shopifyPaymentButton, false, this.container);
          this._updateIncomingInfo(variant);
          setText(availSpanSel, theme.strings.soldOut);
          setDisp(".product__pickup-availabilities", false);
        }
      } else {
        setDisabled(true);
        rmCls(atcSel, "btn--sold-out");
        setHtml(this.selectors.addToCartText, theme.strings.unavailable);
        setText(availSpanSel, theme.strings.unavailable);
        setDisp(this.selectors.shopifyPaymentButton, false, this.container);
        this._updateStock();
        setDisp(".product__pickup-availabilities", false);
      }
    },

    _updatePrice: function (evt) {
      var variant = evt.variant;

      if (variant) {
        setHtml(
          this.selectors.productPrice,
          theme.Currency.formatMoney(variant.price, theme.moneyFormat)
        );

        // Update and show the product's compare price if necessary
        if (variant.compare_at_price > variant.price) {
          var sale_minus = variant.compare_at_price - variant.price;
          var sale_per = (sale_minus * 100) / variant.compare_at_price;
          var roundNumber = parseInt(sale_per);
          setText(this.selectors.numbersale_change, roundNumber + "%");
          rmCls(this.selectors.labelwrap_sale, "hide");

          setHtml(
            this.selectors.comparePrice,
            theme.Currency.formatMoney(
              variant.compare_at_price,
              theme.moneyFormat
            )
          );
          rmCls(this.selectors.comparePrice, "hide");
          rmCls(this.selectors.saleTag, "hide");
        } else {
          addCls(this.selectors.comparePrice, "hide");
          addCls(this.selectors.saleTag, "hide");
          addCls(this.selectors.labelwrap_sale, "hide");
        }

        //theme.updateCurrencies();
      } else {
        addCls(this.selectors.comparePrice, "hide");
      }
    },

    _updateSKU: function (evt) {
      var variant = evt.variant;

      if (variant) {
        setHtml(this.selectors.SKU, variant.sku);
      }
    },

    _updateImages: function (evt) {
      var variant = evt.variant;

      if (variant && variant.featured_media) {
        var imageId = variant.featured_media.id;
        this.switchProductImage(imageId);
        this.setActiveThumbnail(imageId);
      }
    },
    _updateSwatchTitle: function (e) {
      var variant = e.variant;
      for (var e = 1; e <= e.length; e++) {
        var option = "option" + e;
        setText(".js-swatch-display--" + e, variant[option]);
      }
    },

    _updateStickyCart: function (evt) {
      var variant = evt.variant;
      var stickyPrice = document.getElementById("js-sticky-price");
      var stickyTitle = document.getElementById("js-sticky-title");
      var stickyImage = document.getElementById("js-sticky-img");
      var stickyButton = document.getElementById("js-sticky-btn");
      if (variant) {
        if (stickyTitle) stickyTitle.innerHTML = " - " + variant.title;
        if (stickyPrice) {
          stickyPrice.innerHTML = theme.Currency.formatMoney(
            variant.price,
            theme.moneyFormat
          );
        }
        for (var i = 1; i <= 3; i++) {
          var option = "option" + i;
          var sb = document.getElementById("js-sticky-option-" + i);
          if (variant[option] !== null && sb) {
            sb.value = variant[option];
          }
        }
        if (variant.available) {
          if (stickyButton) {
            stickyButton.disabled = false;
            stickyButton.classList.remove("btn--sold-out");
            stickyButton.innerHTML = theme.strings.addToCart;
          }
        } else {
          if (stickyButton) {
            stickyButton.disabled = true;
            stickyButton.classList.add("btn--sold-out");
            stickyButton.innerHTML = theme.strings.soldOut;
          }
        }
        if (variant.featured_image && stickyImage) {
          stickyImage.setAttribute(
            "src",
            theme.Images.getSizedImageUrl(variant.featured_image.src, "200x")
          );
        }
      } else {
        if (stickyTitle) {
          stickyTitle.innerHTML = " - " + theme.strings.unavailable;
        }
        if (stickyButton) {
          stickyButton.disabled = true;
          stickyButton.classList.remove("btn--sold-out");
          stickyButton.innerHTML = theme.strings.unavailable;
        }
      }
    },

    switchProductImage: function (imageId) {
      var imageToShow = this.container.querySelector(
        this.selectors.productImageContainers +
          "[data-image-id='" +
          imageId +
          "']"
      );
      if (imageToShow) imageToShow.classList.remove("hide");
      //Scroll to active
      var header = document.querySelector(".site-header");
      var topMenuHeight = header ? header.offsetHeight : 0;
      if (
        this.settings.sectionTem === "media-list" ||
        this.settings.sectionTem === "media-grid" ||
        this.settings.sectionTem === "media-collage-1" ||
        this.settings.sectionTem === "media-collage-2"
      ) {
        if (imageToShow) {
          var top =
            imageToShow.getBoundingClientRect().top +
            window.pageYOffset -
            topMenuHeight;
          window.scrollTo({ top: top, behavior: "smooth" });
        }
      }
    },

    setActiveThumbnail: function (imageId) {
      var showSel =
        this.selectors.productThumbContainers +
        "[data-image-id='" +
        imageId +
        "']";
      var hideSel =
        this.selectors.productThumbContainers +
        ":not([data-image-id='" +
        imageId +
        "'])";
      this.container.querySelectorAll(hideSel).forEach(function (e) {
        e.classList.remove("is-active");
      });
      var thumbnailToShow = this.container.querySelector(showSel);
      if (thumbnailToShow) {
        thumbnailToShow.classList.add("is-active");
        thumbnailToShow.click();
      }
      // Move the Swiper main+thumb pair to the matching slide (variant change).
      if (this.mainSwiper && this._galleryMainEl) {
        var $slide = this._galleryMainEl.querySelector(
          '.swiper-slide[data-image-id="' + imageId + '"]'
        );
        if ($slide && $slide.parentElement) {
          var newIndex = Array.prototype.indexOf.call(
            $slide.parentElement.children,
            $slide
          );
          if (newIndex >= 0 && newIndex !== this.mainSwiper.activeIndex) {
            this.mainSwiper.slideTo(newIndex);
          }
        }
      }
    },

    _productZoomImage: function () {
      // The zoom image is only used on the product template, so return early
      // even if a featured product section is present.
      if (
        !document.querySelector(
          ".product-single " + this.selectors.productImageContainers
        )
      ) {
        return;
      }

      var self = this;

      document
        .querySelectorAll(this.selectors.productImageWrappers)
        .forEach(function (wrapper) {
          wrapper.addEventListener("click", function (evt) {
            evt.preventDefault();
            // Empty src before loading new image to avoid awkward image swap
            var zoomImg = document.querySelector(
              self.selectors.productZoomImage
            );
            if (zoomImg) {
              zoomImg.src = "";
              zoomImg.src = this.getAttribute("href");
            }
          });
        });

      this.ProductModal = new window.Modals(
        this.selectors.modal,
        "product-modal"
      );

      // Close modal if clicked, but not if the image is clicked
      if (this.ProductModal && this.ProductModal.modal) {
        this.ProductModal.modal.addEventListener("click", function (evt) {
          if (evt.target.nodeName !== "IMG") {
            self.ProductModal.close();
          }
        });
      }
    },

    _productThumbSwitch: function () {
      if (!document.querySelector(this.selectors.productThumbs)) {
        return;
      }

      var self = this;

      document
        .querySelectorAll(this.selectors.productThumbs)
        .forEach(function (thumb) {
          thumb.addEventListener("click", function (evt) {
            evt.preventDefault();
            var imageId = this.parentElement
              ? this.parentElement.getAttribute("data-image-id")
              : null;
            self.setActiveThumbnail(imageId);
            self.switchProductImage(imageId);
          });
        });
    },
    /*
      Thumbnail slider
     */
    /*
      Thumbnail slider (Swiper, replaces Slick asNavFor main+thumb sync).
      - media-bottom (default), media-left, media-right, media-nothumb: main
        fade slider + thumb-nav (Swiper thumbs module = two-way asNavFor).
      - media-left/right: thumbs vertical on desktop, horizontal <992 (Swiper 6
        can't switch direction per-breakpoint -> rebuild on resize across 992).
      - media-list/grid/collage: Slick used 'unslick' (static CSS grid) -> no
        carousel, left untouched.
      Markup is wrapped at runtime (like Slick did) so the same template still
      serves the grid layouts.
    */
    _productThumbnailSlider: function () {
      var self = this;
      var thumbsEl = document.querySelector(this.selectors.productThumbsWrapper);
      var mainEl = document.querySelector(this.selectors.productImageMain);
      var thumbs = document.querySelectorAll(this.selectors.productThumbs);
      if (!thumbsEl || !mainEl || !thumbs.length || thumbs.length <= 1) {
        if (mainEl) mainEl.style.opacity = "1";
        return;
      }

      var mode = this.settings.sectionTem;
      if (
        mode === "media-list" ||
        mode === "media-grid" ||
        mode === "media-collage-1" ||
        mode === "media-collage-2"
      ) {
        mainEl.style.opacity = "1";
        return;
      }

      this._galleryVertical = mode === "media-left" || mode === "media-right";

      // Wrap raw children into Swiper structure once (Slick did this at runtime).
      function wrapOnce(containerEl, navClass) {
        if (containerEl.querySelector(":scope > .swiper-wrapper")) return null;
        var w = document.createElement("div");
        w.className = "swiper-wrapper";
        Array.prototype.slice.call(containerEl.children).forEach(function (c) {
          if (c.nodeType === 1) {
            c.classList.add("swiper-slide");
            w.appendChild(c);
          }
        });
        containerEl.appendChild(w);
        containerEl.classList.add("swiper");
        var prev = document.createElement("div");
        prev.className = "swiper-button-prev " + navClass + "-prev";
        var next = document.createElement("div");
        next.className = "swiper-button-next " + navClass + "-next";
        containerEl.appendChild(prev);
        containerEl.appendChild(next);
        return { prev: prev, next: next };
      }

      this._galleryThumbsEl = thumbsEl;
      this._galleryMainEl = mainEl;
      this._thumbNav = wrapOnce(thumbsEl, "gallery-thumb");
      this._mainNav = wrapOnce(mainEl, "gallery-main");

      this._initGallerySwipers();

      if (this._galleryVertical) {
        var wasDesktop = window.innerWidth >= 992;
        var onResize = function () {
          var isDesktop = window.innerWidth >= 992;
          if (isDesktop !== wasDesktop) {
            wasDesktop = isDesktop;
            self._initGallerySwipers();
          }
        };
        var _rt;
        this._galleryResize = function () {
          clearTimeout(_rt);
          _rt = setTimeout(onResize, 150);
        };
        window.addEventListener("resize", this._galleryResize);
      }
    },

    _initGallerySwipers: function () {
      if (!window.Swiper) return;
      if (this.thumbsSwiper) {
        try { this.thumbsSwiper.destroy(true, false); } catch (e) {}
      }
      if (this.mainSwiper) {
        try { this.mainSwiper.destroy(true, false); } catch (e) {}
      }

      var thumbsEl = this._galleryThumbsEl;
      var mainEl = this._galleryMainEl;
      var thumbNav = this._thumbNav;
      var mainNav = this._mainNav;
      var vertical = this._galleryVertical && window.innerWidth >= 992;

      var thumbOpts = {
        slidesPerGroup: 1,
        spaceBetween: 0,
        watchSlidesProgress: true,
        slideToClickedSlide: true,
        navigation: thumbNav
          ? { nextEl: thumbNav.next, prevEl: thumbNav.prev }
          : false,
      };
      if (this._galleryVertical) {
        thumbOpts.direction = vertical ? "vertical" : "horizontal";
        thumbOpts.slidesPerView = vertical ? 5 : 4;
      } else {
        thumbOpts.direction = "horizontal";
        thumbOpts.slidesPerView = 4;
        thumbOpts.breakpoints = { 481: { slidesPerView: 6 } };
      }
      this.thumbsSwiper = new Swiper(thumbsEl, thumbOpts);
      thumbsEl.style.opacity = "1";

      this.mainSwiper = new Swiper(mainEl, {
        effect: "fade",
        fadeEffect: { crossFade: true },
        slidesPerView: 1,
        spaceBetween: 0,
        autoHeight: true,
        simulateTouch: false, // no mouse-drag on desktop (Slick draggable:false); touch-swipe on mobile stays on
        navigation: mainNav
          ? { nextEl: mainNav.next, prevEl: mainNav.prev }
          : false,
        thumbs: { swiper: this.thumbsSwiper },
      });
      mainEl.style.opacity = "1";

      // Position on the active (featured/variant) image.
      var active = thumbsEl.querySelector(".swiper-slide.is-active");
      if (active && active.parentElement) {
        var idx = Array.prototype.indexOf.call(
          active.parentElement.children,
          active
        );
        if (idx >= 0) this.mainSwiper.slideTo(idx, 0);
      }
    },

    _initQtySelector: function () {
      this.container
        .querySelectorAll(".product-form__quantity")
        .forEach(function (el) {
          // eslint-disable-next-line no-new
          new QtySelector(window.jQuery ? window.jQuery(el) : el);
        });
    },

    onUnload: function () {
      if (this._handlers && this.container) {
        this.container.removeEventListener("variantChange", this._handlers.atc);
        this.container.removeEventListener("variantChange", this._handlers.sticky);
        this.container.removeEventListener("variantPriceChange", this._handlers.price);
        this.container.removeEventListener("variantSKUChange", this._handlers.sku);
        this.container.removeEventListener("variantImageChange", this._handlers.img);
        this.container.removeEventListener("variantChange", this._handlers.swatch);
      }
      if (this._galleryResize) {
        window.removeEventListener("resize", this._galleryResize);
      }
      if (this.mainSwiper) {
        try { this.mainSwiper.destroy(true, true); } catch (e) {}
      }
      if (this.thumbsSwiper) {
        try { this.thumbsSwiper.destroy(true, true); } catch (e) {}
      }
    },
  });

  return Product;
})();

theme.Slideshow = (function () {
  var selectors = {
    section: ".shopify-section",
    wrapper: "#SlideshowWrapper-",
    slides: ".slideshow__slide",
    textWrapperMobile: ".slideshow__text-wrap--mobile",
    textContentMobile: ".slideshow__text-content--mobile",
  };

  // Inline chevrons so the arrows don't depend on the old Slick icon font.
  var ARROW_PREV =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  var ARROW_NEXT =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

  function slideshow(el, sectionId) {
    var self = this;
    var node = (this.node = document.querySelector(el));
    if (!node) return;
    var $slideshow = (this.$slideshow = $(node));

    this.sectionId = sectionId;
    this.adaptHeight = $slideshow.data("adapt-height");
    this.$section = $slideshow.closest(selectors.section);
    this.$textWrapperMobile = this.$section.find(selectors.textWrapperMobile);
    this.autorotate = $slideshow.data("autorotate");
    this.navArrow = $slideshow.data("arrow");
    this.navDot = $slideshow.data("dot");
    this.transit = $slideshow.data("transit");
    var autoplaySpeed = $slideshow.data("speed") || 5000;

    var $wrapper = $slideshow.closest(selectors.wrapper + sectionId);
    this.$wrapper = $wrapper.length ? $wrapper : this.$section;

    if (this.adaptHeight) {
      this.setSlideshowHeight();
      this._onResize = $.debounce(50, this.setSlideshowHeight.bind(this));
      $(window).on("resize", this._onResize);
    }

    // --- Build Swiper DOM at runtime (Slick wrapped the slides at init time;
    //     we keep the .liquid markup untouched and only restructure here). ---
    var slides = Array.prototype.slice.call(node.children).filter(function (c) {
      return c.nodeType === 1 && c.classList.contains("slideshow__slide");
    });
    if (!node.querySelector(":scope > .swiper-wrapper")) {
      var swWrap = document.createElement("div");
      swWrap.className = "swiper-wrapper";
      slides.forEach(function (s) {
        s.classList.add("swiper-slide");
        swWrap.appendChild(s);
      });
      node.appendChild(swWrap);
      node.classList.add("swiper");
    }

    var prevEl = null,
      nextEl = null;
    if (this.navArrow) {
      prevEl = document.createElement("button");
      prevEl.type = "button";
      prevEl.className = "slideshow__arrow slideshow__arrow--prev";
      prevEl.setAttribute("aria-label", "Previous slide");
      prevEl.innerHTML = ARROW_PREV;
      nextEl = document.createElement("button");
      nextEl.type = "button";
      nextEl.className = "slideshow__arrow slideshow__arrow--next";
      nextEl.setAttribute("aria-label", "Next slide");
      nextEl.innerHTML = ARROW_NEXT;
      node.appendChild(prevEl);
      node.appendChild(nextEl);
    }
    var pagiEl = null;
    if (this.navDot) {
      pagiEl = document.createElement("div");
      pagiEl.className = "swiper-pagination";
      node.appendChild(pagiEl);
    }

    // transit: 'slide' = real sliding; 'fade'/'zoom'/'slide-fade' all ran on
    // Slick fade:true plus pure-CSS decoration on .swiper-slide-active/.slick-going.
    var useFade = this.transit !== "slide";
    var opts = {
      effect: useFade ? "fade" : "slide",
      fadeEffect: { crossFade: true },
      loop: slides.length > 1,
      speed: 800,
      threshold: 20,
      watchSlidesProgress: true,
      a11y: { enabled: false }, // Slick had accessibility:false; aria-current handled manually below
      autoplay: this.autorotate
        ? { delay: autoplaySpeed, disableOnInteraction: false }
        : false,
      navigation: this.navArrow ? { nextEl: nextEl, prevEl: prevEl } : false,
      pagination: this.navDot ? { el: pagiEl, clickable: true } : false,
      on: {
        init: function () {
          self.showMobileText(0);
          self._syncAria(0);
        },
        slideChange: function () {
          self.showMobileText(this.realIndex);
          self._syncAria(this.realIndex);
        },
        slideChangeTransitionStart: function () {
          // slide-fade: mark the OUTGOING slide so its image animates out (CSS .slick-going).
          if (self.transit !== "slide-fade") return;
          var prev = this.slides[this.previousIndex];
          if (prev && prev.classList) prev.classList.add("slick-going");
        },
        slideChangeTransitionEnd: function () {
          var s = this.slides;
          for (var i = 0; i < s.length; i++) {
            if (s[i].classList) s[i].classList.remove("slick-going");
          }
        },
      },
    };

    this.swiper = window.Swiper ? new Swiper(node, opts) : null;

    // Swiper 6.7 adds 'swiper-container-initialized', but the section CSS gates
    // the reveal on '.swiper-initialized' (the Swiper 7+ name). Add it explicitly
    // so the slideshow — which is opacity:0 until initialized — becomes visible.
    // (Also a fail-safe: reveals the static first slide even if Swiper is absent.)
    node.classList.add("swiper-initialized");

    // Pause auto-rotate while the slideshow has keyboard focus (a11y), resume on blur.
    if (this.swiper && this.autorotate) {
      this._focusIn = function () {
        if (self.swiper && self.swiper.autoplay) self.swiper.autoplay.stop();
      };
      this._focusOut = function () {
        if (self.swiper && self.swiper.autoplay) self.swiper.autoplay.start();
      };
      this.$wrapper.on("focusin", this._focusIn).on("focusout", this._focusOut);
    }
  }

  slideshow.prototype.setSlideshowHeight = function () {
    var minAspectRatio = this.$slideshow.data("min-aspect-ratio");
    if (minAspectRatio) {
      this.$slideshow.height($(document).width() / minAspectRatio);
    }
  };

  // Mirror the active slide onto the (single) pagination bullet via aria-current.
  // The old theme's "mobile dots" ($dots.eq(1)) never actually rendered, so there
  // is only one dot list to keep in sync.
  slideshow.prototype._syncAria = function (index) {
    if (!this.swiper || !this.swiper.pagination) return;
    var bullets = this.swiper.pagination.bullets;
    if (!bullets || !bullets.length) return;
    Array.prototype.forEach.call(bullets, function (b) {
      b.removeAttribute("aria-current");
    });
    if (bullets[index]) bullets[index].setAttribute("aria-current", "true");
  };

  slideshow.prototype.showMobileText = function (slideIndex) {
    if (!this.$textWrapperMobile || !this.$textWrapperMobile.length) return;
    var $allTextContent = this.$textWrapperMobile.find(
      selectors.textContentMobile
    );
    var $currentTextContent = this.$textWrapperMobile.find(
      selectors.textContentMobile + "-" + slideIndex
    );
    if (
      !$currentTextContent.length &&
      this.$slideshow.find(selectors.slides).length === 1
    ) {
      this.$textWrapperMobile.hide();
    } else {
      this.$textWrapperMobile.show();
    }
    $allTextContent.hide();
    $currentTextContent.show();
  };

  slideshow.prototype.onDestroy = function () {
    if (this._onResize) $(window).off("resize", this._onResize);
    if (this._focusIn) this.$wrapper.off("focusin", this._focusIn);
    if (this._focusOut) this.$wrapper.off("focusout", this._focusOut);
    if (this.swiper) {
      try {
        this.swiper.destroy(true, true);
      } catch (e) {}
    }
  };

  return slideshow;
})();

theme.slideshows = {};

theme.SlideshowSection = (function () {
  function SlideshowSection(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr("data-section-id");
    var slideshow = (this.slideshow = "#Slideshow-" + sectionId);

    theme.slideshows[slideshow] = new theme.Slideshow(slideshow, sectionId);
  }

  return SlideshowSection;
})();

theme.SlideshowSection.prototype = Object.assign(
  {},
  theme.SlideshowSection.prototype,
  {
    onUnload: function () {
      var inst = theme.slideshows[this.slideshow];
      if (inst && inst.onDestroy) inst.onDestroy();
      delete theme.slideshows[this.slideshow];
    },

    onBlockSelect: function (evt) {
      var inst = theme.slideshows[this.slideshow];
      if (!inst || !inst.swiper) return;
      if (inst.adaptHeight) inst.setSlideshowHeight();

      // Resolve the real slide (exclude Swiper loop duplicates), then go there.
      var slide = document.querySelector(
        ".slideshow__slide--" +
          evt.detail.blockId +
          ":not(.swiper-slide-duplicate)"
      );
      var index = 0;
      if (slide) {
        var attr = slide.getAttribute("data-swiper-slide-index");
        index = attr !== null ? parseInt(attr, 10) : 0;
      }
      inst.swiper.slideToLoop(index);
      if (inst.swiper.autoplay) inst.swiper.autoplay.stop();
    },

    onBlockDeselect: function () {
      var inst = theme.slideshows[this.slideshow];
      if (inst && inst.swiper && inst.swiper.autoplay) {
        inst.swiper.autoplay.start();
      }
    },
  }
);

theme.slideshows = {};

theme.Cart = (function () {
  var selectors = {
    cartNote: "#CartSpecialInstructions",
    cartQtyInput: ".cart__quantity",
    cartNoCookiesClass: "cart--no-cookies",
  };

  function Cart(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr("data-section-id");

    theme.cartObject = JSON.parse($("#CartJson-" + sectionId).html());

    this.init($container);
  }

  Cart.prototype = Object.assign({}, Cart.prototype, {
    init: function ($container) {
      this._initQtySelector();
      this._initCartNote();

      if (!this._cookiesEnabled()) {
        $container.addClass(selectors.cartNoCookiesClass);
      }
    },

    _initQtySelector: function () {
      $(selectors.cartQtyInput).each(function (i, el) {
        // eslint-disable-next-line no-new
        new QtySelector($(el));
      });
    },

    _initCartNote: function () {
      if (!$(selectors.cartNote).length) {
        return;
      }

      var $el = $(selectors.cartNote);
      var noteText;
      var params;
      var noteOffset = $el[0].offsetHeight - $el[0].clientHeight;

      // Auto grow the cart note if text fills it up
      $el.on("keyup input", function () {
        $(this)
          .css("height", "auto")
          .css("height", $el[0].scrollHeight + noteOffset);
      });
      // Save the cart note via ajax. A safeguard in case
      // a user decides to leave the page before clicking 'Update Cart'
      $el.on(
        "change",
        $.proxy(function () {
          noteText = $el.val();
          params = {
            type: "POST",
            url: "/cart/update.js",
            data: "note=" + this._attributeToString(noteText),
            dataType: "json",
          };
          $.ajax(params);
        }, this)
      );
    },

    _attributeToString: function (attr) {
      if (typeof attr !== "string") {
        attr = String(attr);
        if (attr === "undefined") {
          attr = "";
        }
      }
      return $.trim(attr);
    },

    _cookiesEnabled: function () {
      var cookieEnabled = navigator.cookieEnabled;

      if (!cookieEnabled) {
        document.cookie = "testcookie";
        cookieEnabled = document.cookie.indexOf("testcookie") !== -1;
      }
      return cookieEnabled;
    },
  });

  return Cart;
})();

theme.noteCart = (function () {
  var drawSel = ".mini-cart-content";
  function noteUpdate(noteText) {
    fetch(window.Shopify.routes.root + "cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ note: theme.attributeToString(noteText) }),
    });
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".cart-notes-submit");
    if (!btn) return;
    var noteEl = document.querySelector("#cart__note");
    noteUpdate(noteEl ? noteEl.value : "");
    var nc = btn.closest(".js-note-cart");
    if (nc) nc.classList.remove("active");
  });
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".edit-notecart");
    if (!btn) return;
    if (btn.parentElement) {
      Array.prototype.forEach.call(btn.parentElement.children, function (sib) {
        if (sib !== btn) sib.classList.toggle("active");
      });
    }
    var draw = btn.closest(drawSel);
    if (draw) draw.classList.toggle("overlay");
  });
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".cart-note-close");
    if (!btn) return;
    var nc = btn.closest(".js-note-cart");
    if (nc) nc.classList.remove("active");
    var draw = btn.closest(drawSel);
    if (draw) draw.classList.remove("overlay");
  });
})();
theme.attributeToString = function (attribute) {
  if (typeof attribute !== "string") {
    attribute += "";
    if (attribute === "undefined") {
      attribute = "";
    }
  }
  return ("" + attribute).trim();
};

// Instagrams
theme.Instagrams = (function () {
  function Instagrams(container) {
    this.$container = $(container);
    this.settings = {
      style: this.$container.data("style"),
      accesstoken: this.$container.data("accesstoken"),
      userid: this.$container.data("userid"),
      limit: this.$container.data("limit"),
      resolution: this.$container.data("resolution"),
      target: this.$container.attr("id"),
      rows: this.$container.data("rows"),

      slidesToShow: this.$container.data("slidestoshow") || 1,
      infinite: this.$container.data("infinite") || false,
      arrows: this.$container.data("arrows") || false,
      draggable: this.$container.data("draggable") || false,
      dots: this.$container.data("dots") || false,
    };

    var _self = this;
    var $instagramSelector = $("#" + this.settings.target);
    if (this.settings.style === "grid") {
      var afterInstagram = function () {}; // blank function
    } else if (this.settings.style === "carousel") {
      var afterInstagram = function () {
        // Instafeed appends the generated <div class="col"> items straight into
        // the container. Wrap them in a .swiper-wrapper, tag each .swiper-slide,
        // append nav/pagination, then init Swiper (replaces Slick). Done in JS
        // because the slides are generated at runtime (no Liquid markup to edit).
        var s = _self.settings;
        var cont = $instagramSelector[0];
        if (!cont) return;
        var clamp = function (n) { return n > 1 ? n : 1; };
        var wrapper = document.createElement("div");
        wrapper.className = "swiper-wrapper";
        Array.prototype.slice.call(cont.children).forEach(function (item) {
          if (item.nodeType === 1) item.classList.add("swiper-slide");
          wrapper.appendChild(item);
        });
        cont.appendChild(wrapper);
        cont.classList.remove("row", "mx-n2");
        cont.classList.add("swiper");
        var opts = {
          slidesPerView: 2,
          slidesPerGroup: 2,
          loop: !!s.infinite,
          grabCursor: !!s.draggable,
          autoHeight: true,
          a11y: { enabled: false },
          breakpoints: {
            481: { slidesPerView: clamp(s.slidesToShow - 3), slidesPerGroup: clamp(s.slidesToShow - 3) },
            769: { slidesPerView: clamp(s.slidesToShow - 2), slidesPerGroup: clamp(s.slidesToShow - 2) },
            993: { slidesPerView: clamp(s.slidesToShow - 1), slidesPerGroup: clamp(s.slidesToShow - 1) },
            1201: { slidesPerView: s.slidesToShow, slidesPerGroup: s.slidesToShow },
          },
        };
        if (s.arrows) {
          var prev = document.createElement("div"); prev.className = "swiper-button-prev";
          var next = document.createElement("div"); next.className = "swiper-button-next";
          cont.appendChild(prev); cont.appendChild(next);
          opts.navigation = { nextEl: next, prevEl: prev };
        }
        if (s.dots) {
          var pg = document.createElement("div"); pg.className = "swiper-pagination";
          cont.appendChild(pg);
          opts.pagination = { el: pg, clickable: true };
        }
        _self.swiper = window.Swiper ? new Swiper(cont, opts) : null;
      };
    }

    var feed = new Instafeed({
      get: "user",
      target: this.settings.target,
      userId: this.settings.userid,
      accessToken: this.settings.accesstoken,
      limit: this.settings.limit,
      resolution: this.settings.resolution,
      template:
        '<div class="col hv-image-brightness"><a class="instagram-item" href="{{link}}" target="_blank" id="{{id}}"><img alt="instagram image" class="transition lazyload" data-src="{{image}}" /></a></div>',
      after: afterInstagram,
    });

    feed.run();
  }

  Instagrams.prototype = Object.assign({}, Instagrams.prototype, {
    onUnload: function () {
      if (this.swiper) this.swiper.destroy(true, true);
      delete this.swiper;
      delete this.$container;
    },
  });

  return Instagrams;
})();

// Slick carousel
theme.slickCarousel = (function () {
  function Carousels(container) {
    this.$container = $(container);
    this.settings = {
      rows: this.$container.data("rows") || 1,
      slidesToShow: this.$container.data("slidestoshow") || 1,
      slidesToScroll: this.$container.data("slidestoscroll") || 1,
      infinite: this.$container.data("infinite") || false,
      arrows: this.$container.data("arrows") || false,
      dots: this.$container.data("dots") || false,
      autoplay: this.$container.data("autoplay") || false,
      draggable: this.$container.data("draggable") || false,
      accessibility: this.$container.data("accessibility") || false,
      slidesToShowMobile: this.$container.data("slidestoshow-mobile") || 1,
      speed : this.$container.data("speed") || 500,
      autoplaySpeed : this.$container.data("autoplayspeed") || 0,
      cssEase : this.$container.data("css-ease") || "ease"
    };
    // --- Swiper init (replaces Slick). Slick uses max-width responsive,
    //     Swiper is mobile-first (min-width) -> breakpoints are inverted. ---
    var el = this.$container[0];
    var s = this.settings;
    var clamp = function (n) { return n > 1 ? n : 1; };
    var opts = {
      slidesPerView: s.slidesToShowMobile,
      slidesPerGroup: clamp(s.slidesToShowMobile),
      loop: !!s.infinite,
      speed: s.speed || 500,
      grabCursor: !!s.draggable,
      autoHeight: true,
      autoplay: s.autoplay ? { delay: s.autoplaySpeed || 4000, disableOnInteraction: false } : false,
      a11y: { enabled: !!s.accessibility },
      breakpoints: {
        481: { slidesPerView: clamp(s.slidesToShow - 3), slidesPerGroup: clamp(s.slidesToScroll - 3) },
        769: { slidesPerView: clamp(s.slidesToShow - 2), slidesPerGroup: clamp(s.slidesToScroll - 2) },
        993: { slidesPerView: clamp(s.slidesToShow - 1), slidesPerGroup: clamp(s.slidesToScroll - 1) },
        1201: { slidesPerView: s.slidesToShow, slidesPerGroup: s.slidesToScroll },
      },
    };
    if (s.arrows) opts.navigation = { nextEl: el.querySelector(".swiper-button-next"), prevEl: el.querySelector(".swiper-button-prev") };
    if (s.dots) opts.pagination = { el: el.querySelector(".swiper-pagination"), clickable: true };
    el.style.opacity = "1";
    this.swiper = window.Swiper ? new Swiper(el, opts) : null;

    var stl = el.closest(".shopthelook");
    if (stl && this.swiper) {
      var swiper = this.swiper;
      var sectionId = el.getAttribute("data-section-id");
      var dots = stl.querySelectorAll("#dot-" + sectionId + " li");
      Array.prototype.forEach.call(dots, function (dot) {
        dot.addEventListener("click", function () {
          var pos = parseInt(dot.getAttribute("data-pos")) || 0;
          Array.prototype.forEach.call(dots, function (d) { d.classList.remove("active"); });
          dot.classList.add("active");
          swiper.slideToLoop ? swiper.slideToLoop(pos) : swiper.slideTo(pos);
        });
      });
      swiper.on("slideChange", function () {
        var cur = swiper.realIndex;
        Array.prototype.forEach.call(dots, function (d) { d.classList.remove("active"); });
        var active = stl.querySelector("#dot-" + sectionId + ' li[data-pos="' + cur + '"]');
        if (active) active.classList.add("active");
      });
    }
  }

  Carousels.prototype = {
    _goToSlide: function (slideIndex) {
      if (this.swiper) (this.swiper.slideToLoop ? this.swiper.slideToLoop(slideIndex) : this.swiper.slideTo(slideIndex));
    },

    onUnload: function () {
      if (this.swiper) this.swiper.destroy(true, true);
      delete this.swiper;
      delete this.$container;
    },

    onBlockSelect: function (evt) {
      var slide = document.querySelector(".carousel__slide-wrapper--" + evt.detail.blockId);
      if (!slide || !this.swiper) return;
      var idx = parseInt(slide.getAttribute("data-swiper-slide-index"));
      if (isNaN(idx)) {
        var wrap = slide.closest(".swiper-wrapper");
        idx = wrap ? Array.prototype.indexOf.call(wrap.children, slide) : 0;
      }
      this._goToSlide(idx);
    },
  };

  return Carousels;
})();

// Productlists
theme.Productlists = (function () {
  function Productlists(container) {
    this.$container = $(container);
    this.settings = {
      slidesToShow: this.$container.data("slidestoshow") || 1,
      rows: this.$container.data("rows") || 1,
      arrows: this.$container.data("arrows") || false,
      dots: this.$container.data("dots") || false,
      draggable: this.$container.data("draggable") || false,
      infinite: this.$container.data("infinite") || false,
    };
    // --- Swiper init (replaces Slick). Mobile-first breakpoints invert
    //     Slick's max-width responsive (mobile base = 2 slides). ---
    var el = this.$container[0];
    var s = this.settings;
    var clamp = function (n) { return n > 1 ? n : 1; };
    var opts = {
      slidesPerView: 2,
      slidesPerGroup: 2,
      loop: !!s.infinite,
      grabCursor: !!s.draggable,
      autoHeight: true,
      a11y: { enabled: false },
      breakpoints: {
        481: { slidesPerView: clamp(s.slidesToShow - 3), slidesPerGroup: clamp(s.slidesToShow - 3) },
        769: { slidesPerView: clamp(s.slidesToShow - 2), slidesPerGroup: clamp(s.slidesToShow - 2) },
        993: { slidesPerView: clamp(s.slidesToShow - 1), slidesPerGroup: clamp(s.slidesToShow - 1) },
        1201: { slidesPerView: s.slidesToShow, slidesPerGroup: s.slidesToShow },
      },
    };
    if (s.arrows) opts.navigation = { nextEl: el.querySelector(".swiper-button-next"), prevEl: el.querySelector(".swiper-button-prev") };
    if (s.dots) opts.pagination = { el: el.querySelector(".swiper-pagination"), clickable: true };
    el.style.opacity = "1";
    this.swiper = window.Swiper ? new Swiper(el, opts) : null;
  }

  Productlists.prototype = Object.assign({}, Productlists.prototype, {
    _goToSlide: function (slideIndex) {
      if (this.swiper) (this.swiper.slideToLoop ? this.swiper.slideToLoop(slideIndex) : this.swiper.slideTo(slideIndex));
    },

    onUnload: function () {
      if (this.swiper) this.swiper.destroy(true, true);
      delete this.swiper;
      delete this.$container;
    },
  });

  return Productlists;
})();

// Producttabs
theme.Producttabs = (function () {
  function Producttabs(container) {
    var _self = this; // avoid conflict
    this.$container = $(container);
    this.slickWrap = ".prdtab-content";
    this.swipers = [];
    this.settings = {
      slidesToShow: this.$container.data("slidestoshow") || 1,
      arrows: this.$container.data("arrows") || false,
      rows: this.$container.data("rows") || 1,
      dots: this.$container.data("dots") || false,
      draggable: this.$container.data("draggable") || false,
      infinite: this.$container.data("infinite") || false,
    };

    this._initSlick();
    // shown.bs.tab is re-emitted by native-ui's tab controller; the now-visible
    // panel's slider must (re)initialise so Swiper can measure its real width.
    this.$container
      .find('a[data-toggle="tab"]')
      .on("shown.bs.tab", function (e) {
        _self._unSlick();
        _self._initSlick();
        theme.tooltip.load();
      });
  }

  Producttabs.prototype = Object.assign({}, Producttabs.prototype, {
    _getSwiperOpts: function () {
      var s = this.settings;
      var clamp = function (n) { return n > 1 ? n : 1; };
      return {
        slidesPerView: 2,
        slidesPerGroup: 2,
        loop: !!s.infinite,
        grabCursor: !!s.draggable,
        autoHeight: true,
        observer: true,
        observeParents: true,
        a11y: { enabled: true },
        breakpoints: {
          481: { slidesPerView: clamp(s.slidesToShow - 3), slidesPerGroup: clamp(s.slidesToShow - 3) },
          769: { slidesPerView: clamp(s.slidesToShow - 2), slidesPerGroup: clamp(s.slidesToShow - 2) },
          993: { slidesPerView: clamp(s.slidesToShow - 1), slidesPerGroup: clamp(s.slidesToShow - 1) },
          1201: { slidesPerView: s.slidesToShow, slidesPerGroup: s.slidesToShow },
        },
      };
    },

    _initSlick: function () {
      var s = this.settings;
      var _self = this;
      this.$container.find(this.slickWrap).each(function () {
        var el = this;
        var opts = _self._getSwiperOpts();
        if (s.arrows) opts.navigation = { nextEl: el.querySelector(".swiper-button-next"), prevEl: el.querySelector(".swiper-button-prev") };
        if (s.dots) opts.pagination = { el: el.querySelector(".swiper-pagination"), clickable: true };
        el.style.opacity = "1";
        if (window.Swiper) _self.swipers.push(new Swiper(el, opts));
      });
    },

    _unSlick: function () {
      this.swipers.forEach(function (sw) { try { sw.destroy(true, true); } catch (e) {} });
      this.swipers = [];
    },

    onUnload: function () {
      this._unSlick();
      delete this.$container;
    },

    onSelect: function () {
      this._unSlick();
      this._initSlick();
    },

    onBlockSelect: function (evt) {
      var navItem = $(".nav-link-" + evt.detail.blockId);
      navItem.tab("show");
      this._unSlick();
      this._initSlick();
    },
  });

  return Producttabs;
})();

theme.Video = (function () {
  var promiseYoutubeAPI;
  var promiseVimeoAPI;

  var youtube = {
    promiseAPI: function () {
      if (!promiseYoutubeAPI) {
        var tag = document.createElement("script");

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        promiseYoutubeAPI = $.Deferred(function (defer) {
          window.onYouTubeIframeAPIReady = defer.resolve;

          setTimeout(function () {
            defer.reject("Request for YouTube API timed out after 30 seconds.");
          }, 30000);
        });
      }

      return promiseYoutubeAPI;
    },
    promisePlayer: function (id, options) {
      return this.promiseAPI().then(function () {
        return $.Deferred(function (defer) {
          if (typeof window.YT === "undefined") {
            defer.reject(
              "We're sorry, something went wrong. The YouTube API has not loaded correctly."
            );
          }

          /* eslint-disable no-undef */
          var player = new YT.Player(id, options); // global YT variable injected by YouTube API

          player.addEventListener("onReady", function () {
            defer.resolve(player);
          });

          setTimeout(function () {
            defer.reject(
              "Request for YouTube player has timed out after 30 seconds."
            );
          }, 30000);
        });
      });
    },
  };

  var vimeo = {
    promiseAPI: function () {
      if (!promiseVimeoAPI) {
        promiseVimeoAPI = $.Deferred(function (defer) {
          var tag = document.createElement("script");
          tag.src = "https://player.vimeo.com/api/player.js";
          tag.onload = tag.onreadystatechange = function () {
            if (!this.readyState || this.readyState === "complete") {
              defer.resolve();
            }
          };

          var firstScriptTag = document.getElementsByTagName("script")[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          setTimeout(function () {
            defer.reject("Request for Vimeo API timed out after 30 seconds.");
          }, 30000);
        });
      }

      return promiseVimeoAPI;
    },

    promisePlayer: function (id, options) {
      return this.promiseAPI().then(function () {
        return $.Deferred(function (defer) {
          if (typeof window.Vimeo === "undefined") {
            defer.reject(
              "We're sorry, something went wrong. The Vimeo API has not loaded correctly."
            );
          }

          var player = new window.Vimeo.Player(id, options);

          setTimeout(function () {
            defer.reject(
              "Request for Vimeo player has timed out after 30 seconds."
            );
          }, 30000);

          player.ready().then(function () {
            defer.resolve(player);
          });
        });
      });
    },
  };

  var selectors = {
    loadPlayerButton: ".video-section__load-player-button",
    closePlayerButton: ".video-section__player-close",
    playerContainer: ".video-section__player",
    cover: ".video-section__cover",
    errorMessage: ".video-section__error",
    bodyOverlay: ".video-section__body-overlay",
    body: "body",
  };
  var classes = {
    playerLoading: "video-section--loading",
    playerLoaded: "video-section--loaded",
    playerError: "video-section--error",
    videoPlaying: "video-playing",
  };

  function Video(container) {
    this.$container = $(container);
    var sectionId = this.$container.attr("data-section-id");
    this.namespace = "." + sectionId;
    this.onLoad();
  }

  Video.prototype = Object.assign({}, Video.prototype, {
    onLoad: function () {
      this.$container
        .on("click", selectors.loadPlayerButton, this._loadPlayer.bind(this))
        .on("click", selectors.closePlayerButton, this._closePlayer.bind(this))
        .on("click", selectors.bodyOverlay, this._closePlayer.bind(this));
    },

    _loadPlayer: function () {
      var $container = this.$container;
      var $playerContainer = $(selectors.playerContainer, $container);
      var playerType = this.$container.attr("data-video-type");

      var promiseVideoPlayer;

      if (playerType === "youtube") {
        promiseVideoPlayer = this._loadYoutubePlayer($playerContainer[0]);
      } else if (playerType === "vimeo") {
        promiseVideoPlayer = this._loadVimeoPlayer($playerContainer[0]);
      }

      return promiseVideoPlayer
        .then(this._onPlayerLoadReady.bind(this))
        .fail(this._onPlayerLoadError.bind(this));
    },

    _loadYoutubePlayer: function (container) {
      return youtube
        .promisePlayer(container, {
          videoId: this.$container.attr("data-video-id"),
          ratio: 16 / 9,
          playerVars: {
            modestbranding: 1,
            autoplay: 1,
            showinfo: 0,
            rel: 0,
          },
        })
        .then(
          function (player) {
            this.player = player;
          }.bind(this)
        );
    },

    _loadVimeoPlayer: function (container) {
      return vimeo
        .promisePlayer(container, {
          id: this.$container.attr("data-video-id"),
        })
        .then(
          function (player) {
            this.player = player;
            this.player.play();
          }.bind(this)
        );
    },

    _onPlayerLoadReady: function () {
      $(selectors.closePlayerButton, this.$container).show().focus();
      $(selectors.cover, this.$container).addClass(classes.playerLoaded);
      this.$container.addClass(classes.playerLoaded);

      this._setScrollPositionValues();

      $(selectors.body).addClass(classes.videoPlaying);

      $(document).on("keyup" + this.namespace, this._closeOnEscape.bind(this));
      $(window).on(
        "resize" + this.namespace,
        this._setScrollPositionValues.bind(this)
      );
      slate.a11y.trapFocus({
        $container: this.$container,
        namespace: this.namespace,
      });
    },

    _onPlayerLoadError: function (err) {
      this.$container.addClass(classes.playerError);
      $(selectors.errorMessage, this.$container).text(err);
    },

    _closeOnEscape: function (evt) {
      if (evt.keyCode !== 27) {
        return;
      }

      this._closePlayer();
      $(selectors.loadPlayerButton, this.$container).focus();
    },

    _onScroll: function () {
      var scrollTop = $(window).scrollTop();

      if (
        scrollTop > this.videoTop + 0.25 * this.videoHeight ||
        scrollTop + this.windowHeight <
          this.videoBottom - 0.25 * this.videoHeight
      ) {
        // Debounce DOM edits to the next frame with requestAnimationFrame
        requestAnimationFrame(this._closePlayer.bind(this));
      }
    },

    _setScrollPositionValues: function () {
      this.videoHeight = this.$container.outerHeight(true);
      this.videoTop = this.$container.offset().top;
      this.videoBottom = this.videoTop + this.videoHeight;
      this.windowHeight = $(window).innerHeight();
    },

    _closePlayer: function () {
      $(selectors.body).removeClass(classes.videoPlaying);
      $(selectors.cover, this.$container).removeClass(classes.playerLoaded);
      this.$container.removeClass(classes.playerLoaded);
      $(selectors.closePlayerButton, this.$container).hide();

      slate.a11y.removeTrapFocus({
        $container: this.$container,
        namespace: this.namespace,
      });

      if (typeof this.player.destroy === "function") {
        this.player.destroy();
      } else if (typeof this.player.unload === "function") {
        this.player.unload();
      }

      $(document).off(this.namespace);
      $(window).off(this.namespace);
    },
  });

  return Video;
})();

theme.SwiperCustom = (function () {
  function SwiperCustom(container) {
    this.container = container;
    this.sectionId = $(container).attr("data-section-id");
    this.nav = ".swiper-wrapper-" + this.sectionId;
    this.namespace = ".swipercol-" + this.sectionId;
    var perviewDesktop = $(container).data("perview-desktop");
    var perviewMobile = $(container).data("perview-mobile") || 2.2;
    var spaceBetween = $(container).data("space-between");
    var swiper = new Swiper(this.namespace, {
      slidesPerView: "auto",
      freeMode: false,
      autoHeight: true,
      calculateHeight: true,
      freeModeSticky: true,
      centeredSlides: false,
      grabCursor: true,
      watchSlidesVisibility: true,
      watchSlidesProgress: true,
      preloadImages: true,
      updateOnImagesReady: true,
      spaceBetween: spaceBetween,
      observer: true,
      observeParents: true,
      parallax: true,
      a11y: true,
      keyboard: {
        enabled: true,
      },
      breakpoints: {
        320: {
          slidesPerView: perviewMobile,
          spaceBetween: 20,
        },
        576: {
          slidesPerView: 2,
        },
        768: {
          slidesPerView: 3,
        },
        992: {
          slidesPerView: perviewDesktop,
        },
      },
      scrollbar: {
        el: $(this.namespace).find(".swiper-scrollbar")[0],
      },
      navigation: {
        nextEl: $(this.nav).find(".swiper-button-next")[0],
        prevEl: $(this.nav).find(".swiper-button-prev")[0],
      },
    });
  }
  return SwiperCustom;
})();

theme.AnnouncementSwiper = (function () {
  function AnnouncementSwiper(container) {
    this.container = container;
    this.sectionId = $(container).attr("data-section-id");
    this.namespace = ".announswipercol-" + this.sectionId;
    var rootElement = document.querySelector(":root");
    var anNounBar = document.querySelector(".announcement-bar-carousel");
    var Nautoplay = document.querySelector(this.namespace).dataset.autoplay === "true";
    var Nautoplay_speed = parseInt(document.querySelector(this.namespace).dataset.speed);
    rootElement.style.setProperty(
      "--height-announbar",
      anNounBar.offsetHeight + "px"
    );
    var swiper = new Swiper(this.namespace, {
      slidesPerView: 1,
      loop: $(this.namespace).find(".slider .slide").length == 1 ? true : false,
      autoHeight: true,
      autoplay:Nautoplay,
      autoplaySpeed:Nautoplay_speed,
      calculateHeight: true,
      observer: true,
      a11y: true,
      navigation: {
        nextEl: $(this.namespace).find(".swiper-button-next")[0],
        prevEl: $(this.namespace).find(".swiper-button-prev")[0],
      },
    });
    document.addEventListener("shopify:block:select", function (event) {
      var sectionId = event.detail.sectionId;
      var blockId = event.detail.blockId;
      var load = event.detail.load;
      var index = $(`#${blockId}`).index();
      swiper.slideTo(index);
    });
  }
  return AnnouncementSwiper;
})();

theme.init = function () {
  theme.customerTemplates.init();
  slate.rte.wrapTable();
  slate.rte.iframeReset();

  // Common a11y fixes
  slate.a11y.pageLinkFocus($(window.location.hash));

  $(".in-page-link").on("click", function (evt) {
    slate.a11y.pageLinkFocus($(evt.currentTarget.hash));
  });

  $('a[href="#"]').on("click", function (evt) {
    evt.preventDefault();
  });

  //scroll animation

  AOS.init({
    startEvent: "DOMContentLoaded",
    offset: 30, // offset (in px) from the original trigger point
    delay: 0, // values from 0 to 3000, with step 50ms
    duration: 700,
    once: true,
  });

  window.addEventListener("load", function () {
    AOS.refresh();
  });
  // Perf: per-<img> AOS.refresh()-Listener ENTFERNT. Rief bei JEDEM Bild-Load
  // AOS.refresh() (Neuberechnung ALLER ~1259 AOS-Elemente) -> Layout-Thrashing
  // auf Mobil. Bilder haben feste width/height (kein Reflow beim Laden), daher
  // unnoetig. ALLE AOS-Scroll-Animationen bleiben voll erhalten.

  // Sections
  var sections = new theme.Sections();
  sections.register("header", theme.HeaderSection);
  sections.register("product", theme.Product);
  sections.register("slideshow-section", theme.SlideshowSection);
  sections.register("cart", theme.Cart);
  sections.register("instagrams", theme.Instagrams);
  sections.register("productlist", theme.Productlists);
  sections.register("producttab", theme.Producttabs);
  sections.register("slickCarousels", theme.slickCarousel);
  sections.register("video", theme.Video);
  sections.register("swipercustom", theme.SwiperCustom);
  sections.register("announcementswiper", theme.AnnouncementSwiper);
  sections.register("cookie", theme.CookieSection);
  sections.register("popupnewletter", theme.popupNewletter);
  sections.register("beforeafter", theme.BeforeAfter);
  sections.register("bundleproduct", theme.bundleProduct);
  sections.register("footer", theme.FooterSection);

  // Standalone modules
  $(window).on("load", theme.articleImages);
  theme.passwordModalInit();
};

theme.articleImages = function () {
  var $indentedRteImages = $(".rte--indented-images");
  if (!$indentedRteImages.length) {
    return;
  }

  $indentedRteImages.find("img").each(function (i, el) {
    var $el = $(el);
    var attr = $el.attr("style");

    // Check if undefined or float: none
    if (!attr || attr === "float: none;") {
      // Add class to parent paragraph tag if image is wider than container
      if ($el.width() >= $indentedRteImages.width()) {
        $el.parent("p").addClass("rte__image-indent");
      }
    }
  });
};

theme.passwordModalInit = function () {
  var $loginModal = $("#LoginModal");
  if (!$loginModal.length) {
    return;
  }

  // Initialize modal
  theme.PasswordModal = new window.Modals("LoginModal", "login-modal", {
    focusOnOpen: "#Password",
  });

  // Open modal if errors exist
  if ($loginModal.find(".errors").length) {
    theme.PasswordModal.open();
  }
};

// Quickview https://github.com/kellyvaughn/quickview-for-shopify/blob/master/quickview.js.liquid
theme.quickview = (function () {
  var product_handle = "",
    quickviewButtonClass = ".js-btn-quickview",
    quickviewId = "#jsQuickview",
    quickviewOption = "#jsQuickview select",
    quickviewThumb = "#qv-product-images",
    quickviewAddCartButton = ".qv-add-button",
    quickviewPrice = ".qv-product-price",
    quickviewComparePrice = ".qv-product-compare-price";
  var qvSwiper = null;
  quickLoad = "#loading_qv";
  quickQty = ".popup-quantity";
  // 1. Show quickview
  $(quickLoad).removeClass("activeload");
  $(quickviewId).removeClass("loadqvpopup");

  //quanity quickview

  $(".qv-qtity").on("click", function () {
    var $button = $(this);
    var oldValue = $button.closest(quickQty).find("input.qv-quantity").val();
    if ($button.text() == "+") {
      var newVal = parseFloat(oldValue) + 1;
    } else {
      // Don't allow decrementing below zero
      if (oldValue > 1) {
        var newVal = parseFloat(oldValue) - 1;
      } else {
        newVal = 1;
      }
    }
    $button.closest(quickQty).find("input.qv-quantity").val(newVal);
  });
  //click
  $(document).on("click", quickviewButtonClass, function () {
    $(quickQty).find("input.qv-quantity").val(1);
    //ResetQuickview
    $(quickLoad).addClass("activeload");
    var qv_color = $(quickviewId).data("color");
    var quickviewAvaible = $(this).attr("data-pavailable");
    var jdmgReview = $(this).attr("data-viewjdmg");
    product_handle = $(this).data("handle");
    if (qvSwiper) {
      try { qvSwiper.destroy(true, true); } catch (e) {}
      qvSwiper = null;
    }
    $(quickviewThumb).removeClass().empty();
    $(".qv-product-options").empty().removeClass("pb-3");
    var desc = $(this).find(".txt-short").text();

    //Pushdata
    $(quickviewId).addClass(product_handle).data("handle", product_handle);
    $.getJSON({
      url: "/products/" + product_handle + ".js?" + new Date().getTime(),
      beforeSend: function () {
        $(quickviewButtonClass + `[data-handle=${product_handle}]`).addClass(
          "qv-loading"
        );
      },
    })
      .done(function (product) {
        $(quickviewId).removeClass().addClass("modal loadqvpopup");
        if (window.NativeUI) NativeUI.openModal(quickviewId);
        var title = product.title;
        var type = product.type;
        var vendor = product.vendor;
        var price = 0;
        var compare_price = 0;
        var images = product.images;
        var variants = product.variants;
        var options = product.options;
        var url = "/products/" + product_handle;

        $(".qv-product-title").text(title);
        function renderReview() {
          if (window.SPR && theme.review) {
            $(".qv-product-rv").html(
              `<span class="shopify-product-reviews-badge" data-id="${product.id}"></span>`
            );
            return (
              window.SPR.registerCallbacks(),
              window.SPR.initRatingHandler(),
              window.SPR.initDomEls(),
              window.SPR.loadProducts(),
              window.SPR.loadBadges()
            );
          }
          if (theme.review && typeof jdgm !== "undefined") {
            $(".qv-product-rv").html(
              `<div class='pt-1 small' >${jdmgReview}</div>`
            );
            return jdgm.customizeBadges();
          }
        }
        renderReview();
        $(".qv-product-type").text(type);
        $(".qv-product-description").html(desc);
        $(".qv-view-product").attr("href", url);
        $(".qv-view-product").click(function () {
          window.location.href = url;
        });
        $(".qv-view-type").text(type);
        $(".qv-view-vendor").text(vendor);
        if ($(".qv-product-description").is(":empty")) {
          $(".qv-product-description").removeClass("mb-1");
        } else {
          $(".qv-product-description").addClass("mb-1");
        }
        if (quickviewAvaible == "true") {
          $(quickviewAddCartButton)
            .prop("disabled", false)
            .html(theme.strings.addToCart);
        } else {
          $(quickviewAddCartButton)
            .prop("disabled", true)
            .html(theme.strings.soldOut);
        }
        $(product.variants).each(function (i, variants) {
          if (variants.sku != null) {
            $(".qv-sku").addClass("show").removeClass("hide");
            $(".qv-view-sku").text(product.variants[0].sku);
          } else {
            $(".qv-sku").addClass("hide").removeClass("show");
          }
        });
        var imageCount = $(images).length;
        $(images).each(function (i, image) {
          image_embed =
            '<div><img class="lazyload " role="presentation"  data-src="' +
            image +
            "&width=800" +
            '" srcset="' +
            image +
            "&width=800" +
            '" src="' +
            image +
            "&width=800" +
            '" ></div>';
          $(quickviewThumb).append(image_embed);
        });
        (function () {
          // Wrap the runtime-built <div><img></div> slides into Swiper structure
          // (replaces Slick; same pattern as the Instagram feed slider).
          var cont = document.querySelector(quickviewThumb);
          if (!cont) return;
          var wrapper = document.createElement("div");
          wrapper.className = "swiper-wrapper";
          Array.prototype.slice.call(cont.children).forEach(function (s) {
            if (s.nodeType === 1) {
              s.classList.add("swiper-slide");
              wrapper.appendChild(s);
            }
          });
          cont.appendChild(wrapper);
          cont.classList.add("swiper");
          var prev = document.createElement("div");
          prev.className = "swiper-button-prev";
          var next = document.createElement("div");
          next.className = "swiper-button-next";
          var pagi = document.createElement("div");
          pagi.className = "swiper-pagination";
          cont.appendChild(prev);
          cont.appendChild(next);
          cont.appendChild(pagi);
          cont.style.opacity = "1";
          qvSwiper = window.Swiper
            ? new Swiper(cont, {
                slidesPerView: 1,
                loop: false,
                autoHeight: true,
                observer: true,
                observeParents: true,
                navigation: { nextEl: next, prevEl: prev },
                pagination: { el: pagi, clickable: true },
              })
            : null;
        })();

        if (product.variants[0].option1 !== "Default Title") {
          $(options).each(function (i, option) {
            var name = option.name;
            var opt = name.replace(/ /g, "-").toLowerCase();
            var selectClass = ".option." + opt;
            $(".qv-product-options")
              .append(
                `
              <div class="option-selection ${opt}">
                <span class="option text-body">
                  ${option.name} :
                  <span class="pl-2 txt-body-70 js-option-label-${i}">
                    ${option.values[0]}
                  </span>
                </span>
                <select class="option-${i} option_qv ${opt}"></select>
              </div>
            `
              )
              .addClass("pb-3");

            $(option.values).each((i, value) => {
              $(`.option_qv.${opt}`).append(
                `<option value="${value}">${value}</option>`
              );
            });

            //list
            if ($("#jsQuickview").data("type") == "list") {
              var str =
                '<div class="single-option-radio js-option-' + i + ' ">';
              if (
                option.name.includes(theme.strings.colorVariant1) ||
                option.name.includes(theme.strings.colorVariant2)
              ) {
                var k = i + 1;
              }

              //option.values = option.values.sort();
              $(option.values).each(function (i, value) {
                var cl = "";
                if (i == 0) {
                  cl = "active";
                }
                if (
                  option.name.includes(theme.strings.colorVariant1) ||
                  option.name.includes(theme.strings.colorVariant2)
                ) {
                  var variant_img = "";
                  for (cc = 0; cc < variants.length; cc++) {
                    if (variants[cc]["option" + k] == value) {
                      if (
                        variants[cc]["featured_image"] &&
                        variants[cc]["featured_image"]["src"]
                      ) {
                        variant_img = variants[cc]["featured_image"]["src"];
                      }
                    }
                  }

                  if (variant_img == "") {
                    str +=
                      '<label class="' +
                      cl +
                      '" data-value="' +
                      value +
                      '">' +
                      value +
                      "</label>";
                  } else {
                    if (qv_color) {
                      var file = variant_img;
                      var nvl = value
                        .replace(/&/g, "amp")
                        .replace(/[^a-zA-Z0-9]+/g, "-")
                        .toLowerCase();
                      const escapedValue = nvl;

                      file = file.slice(0, file.lastIndexOf("/products"));
                      str += `<label class="have-background st-color-${escapedValue} ${cl}" data-value="${value}" style="background-color:${value};"><span class="st-color-${escapedValue} st-color"></span><span>${value}</span></label>`;
                    } else {
                      str +=
                        '<label class="have-background ' +
                        cl +
                        '" data-value="' +
                        value +
                        '" style="background-image:url(' +
                        variant_img +
                        ')">' +
                        value +
                        "</label>";
                    }
                  }
                } else {
                  str +=
                    '<label class="' +
                    cl +
                    '" data-value="' +
                    value +
                    '">' +
                    value +
                    "</label>";
                }
              });
              str += "</div>";
              $(`.option-selection.${opt}`).append(str);
            }
          });
          if ($("#jsQuickview").data("type") == "list") {
            $("#jsQuickview .option-selection label").click(function () {
              $(this)
                .closest(".option-selection")
                .find("select")
                .val($(this).data("value"));
              $(this)
                .closest(".option-selection")
                .find("label")
                .removeClass("active");
              $(this).addClass("active");

              var arr_option = [];
              $("#jsQuickview")
                .find("select.option")
                .each(function () {
                  arr_option.push($(this).val());
                });
              var status = true;
              var variant = "";
              for (i = 0; i < variants.length; i++) {
                var status = true;
                for (j = 0; j < arr_option.length; j++) {
                  if (arr_option[j] != variants[i]["options"][j]) {
                    status = false;
                  }
                }
                if (variants[i]["available"] == false) {
                  status = false;
                }
                if (status == true) {
                  variant = variants[i];
                }
              }
              //console.log(variant);
              //console.log(variant['available']);
              if (variant != "" || variant["available"]) {
                $(".qv-add-button").prop("disabled", false);
              } else {
                $(".qv-add-button")
                  .prop("disabled", true)
                  .html(theme.strings.unavailable);
              }

              var selectedOptions = "";
              $(quickviewOption).each(function (i) {
                if (selectedOptions == "") {
                  selectedOptions = $(this).val();
                } else {
                  selectedOptions = selectedOptions + " / " + $(this).val();
                }
              });
              var targetVl = $(this).data("value");
              for (i = 0; i < variants.length; i++) {
                $(this)
                  .closest(".option-selection")
                  .find(".js-option-label-" + i + "")
                  .text(targetVl);
              }

              jQuery.getJSON(
                `/products/${product_handle}.js`,
                function (product) {
                  $(product.variants).each(function (i, v) {
                    if (v.title == selectedOptions) {
                      if (v.featured_image !== null) {
                        var iSlick = v.featured_image.position - 1;
                        if (qvSwiper) qvSwiper.slideTo(iSlick);
                      }
                      var price = theme.Currency.formatMoney(
                        v.price,
                        theme.moneyFormat
                      );
                      var compare_price = theme.Currency.formatMoney(
                        v.compare_at_price,
                        theme.moneyFormat
                      );
                      $(quickviewPrice).html(price);
                      $(quickviewComparePrice).html(compare_price);
                      if (v.compare_at_price !== null) {
                        $(quickviewComparePrice).html(compare_price).show();
                      } else {
                        $(quickviewComparePrice).hide();
                      }
                      //theme.updateCurrencies();

                      if (v) {
                        if (v.available == true) {
                          $(quickviewAddCartButton)
                            .prop("disabled", false)
                            .html(theme.strings.addToCart);
                        } else {
                          $(quickviewAddCartButton)
                            .prop("disabled", true)
                            .html(theme.strings.soldOut);
                        }
                      } else {
                        $(quickviewAddCartButton)
                          .prop("disabled", false)
                          .html(theme.strings.unavailable);
                      }
                    }
                  });
                }
              );
            });
          }
        }
        $(product.variants).each(function (i, v) {
          price = theme.Currency.formatMoney(v.price, theme.moneyFormat);
          compare_price = theme.Currency.formatMoney(
            v.compare_at_price,
            theme.moneyFormat
          );
          $(quickviewPrice).html(price);
          if (v.compare_at_price !== null) {
            $(quickviewComparePrice).html(compare_price).show();
          } else {
            $(quickviewComparePrice).hide();
          }
          //theme.updateCurrencies();
          //v.inventory_quantity == 0 && v.inventory_management == 'shopify'
          if (
            v.inventory_quantity == 0 &&
            v.inventory_management == "shopify"
          ) {
            $(quickviewAddCartButton)
              .prop("disabled", true)
              .val(theme.strings.soldOut);
            return true;
          } else {
            $("select.option-0").val(v.option1);
            $("select.option-1").val(v.option2);
            $("select.option-2").val(v.option3);
            return false;
          }
        });
      })
      .fail(function () {
        console.log("error");
      })
      .always(function () {
        $(quickviewButtonClass + `[data-handle=${product_handle}]`).removeClass(
          "qv-loading"
        );
        $(quickLoad).removeClass("activeload");
      });
    //addCartQuickview
  });
  $(quickviewId).on("hidden.bs.modal", function () {
    $(quickviewId).removeClass("loadqvpopup");
    $(quickLoad).removeClass("activeload");
  });
  // 2. Add to cart
  $(document).on("click", quickviewAddCartButton, function () {
    product_handle = $(quickviewId).data("handle");
    var spinner =
      '<div class="product-card__loading spinner-border d-block" role="status"></div>';
    var qty = $(".qv-quantity").val(),
      selectedOptions = "",
      var_id = "";
    function processCart() {
      $.post({
        url: "/cart/add.js",
        data: {
          quantity: qty,
          id: var_id,
        },
        dataType: "json",
        beforeSend: function () {
          $(quickviewAddCartButton).html(spinner);
        },
      })
        .done(function (item) {
          var htmlVariant =
            item.variant_title !== null
              ? "<i>(" + item.variant_title + ")</i>"
              : "";
          var styleCart = $(".js-mini-cart").attr("data-cartmini");

          if (styleCart != "true") {
            var htmlAlert =
              '<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="' +
              item.image +
              '"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">' +
              item.product_title +
              " x " +
              item.quantity +
              "</p>" +
              htmlVariant +
              "<div><div>";
            theme.alert.new(
              theme.strings.addToCartSuccess,
              htmlAlert,
              3000,
              "notice"
            );
          }

          theme.miniCart.updateElements();
          theme.miniCart.generateCart();

          if (theme.cartpage) {
            location.reload();
            $("html, body").animate({ scrollTop: 0 }, "slow");
          }
        })
        .fail(function ($xhr) {
          var data = $xhr.responseJSON;
          theme.alert.new("", data.description, 3000, "warning");
        })
        .always(function () {
          $(quickviewAddCartButton)
            .prop("disabled", false)
            .html(theme.strings.addToCart);
          $(quickviewId).modal("hide");
        });
    }
    $(quickviewOption).each(function (i) {
      if (selectedOptions == "") {
        selectedOptions = $(this).val();
      } else {
        selectedOptions = selectedOptions + " / " + $(this).val();
      }
    });
    jQuery.getJSON("/products/" + product_handle + ".js", function (product) {
      if (product.variants.length === 1) {
        var_id = product.variants[0].id;
      } else {
        $(product.variants).each(function (i, v) {
          if (v.title == selectedOptions) {
            var_id = v.id;
          }
        });
      }
      processCart();
    });
  });
  // 3. Select variants
  $(document).on("change", quickviewOption, function () {
    var selectedOptions = "";
    $(quickviewOption).each(function (i) {
      if (selectedOptions == "") {
        selectedOptions = $(this).val();
      } else {
        selectedOptions = selectedOptions + " / " + $(this).val();
      }
    });
    jQuery.getJSON("/products/" + product_handle + ".js", function (product) {
      $(product.variants).each(function (i, v) {
        if (v.title == selectedOptions) {
          if (v.featured_image !== null) {
            var iSlick = v.featured_image.position - 1;
            if (qvSwiper) qvSwiper.slideTo(iSlick);
          }
          var price = theme.Currency.formatMoney(v.price, theme.moneyFormat);
          var compare_price = theme.Currency.formatMoney(
            v.compare_at_price,
            theme.moneyFormat
          );
          $(quickviewPrice).html(price);
          $(quickviewComparePrice).html(compare_price);
          if (v.sku != null) {
            $(".qv-sku").addClass("show").removeClass("hide");
            $(".qv-view-sku").text(v.sku);
          } else {
            $(".qv-sku").addClass("hide").removeClass("show");
          }
          if (v.compare_at_price !== null) {
            $(quickviewComparePrice).html(compare_price).show();
          } else {
            $(quickviewComparePrice).hide();
          }
          //theme.updateCurrencies();
          if (v.inventory_management === null) {
            $(quickviewAddCartButton)
              .prop("disabled", false)
              .val(theme.strings.addToCart);
          } else {
            if (v.inventory_quantity < 1) {
              $(quickviewAddCartButton)
                .prop("disabled", true)
                .val(theme.strings.soldOut);
            } else {
              $(quickviewAddCartButton)
                .prop("disabled", false)
                .val(theme.strings.addToCart);
            }
          }
        }
      });
    });
  });
})();

// Button add to cart (in grid item)
theme.addCartButton = (function () {
  var buttonClass = ".js-grid-cart";
  $(document).on("click", buttonClass, function () {
    var $this = $(this);
    var id = $this.data("id");
    $this.addClass("is-loading");
    Shopify.addItem(id, 1, function (item) {
      var htmlVariant =
        item.variant_title !== null
          ? "<i>(" + item.variant_title + ")</i>"
          : "";
      var styleCart = $(".js-mini-cart").attr("data-cartmini");
      if (styleCart != "true") {
        var htmlAlert =
          '<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="' +
          item.image +
          '"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">' +
          item.product_title +
          " x " +
          item.quantity +
          "</p>" +
          htmlVariant +
          "<div><div>";
      }
      theme.miniCart.generateCart();
      theme.miniCart.updateElements();
      setTimeout(function () {
        styleCart != "true"
          ? theme.alert.new(
              theme.strings.addToCartSuccess,
              htmlAlert,
              3000,
              "notice"
            )
          : "";
        $this.removeClass("is-loading");
      }, 300);
      if (theme.cartpage) {
        location.reload();
        $("html, body").animate({ scrollTop: 0 }, "slow");
      }
    });
  });
})();

theme.GiftWrap = (function () {
  var openBox = ".open-gift",
    giftWrap = ".giftwrap",
    addGift = ".add-gift",
    boxGift = ".boxgift",
    closeBtn = ".close-gift__btn",
    cartDrawSel = ".mini-cart-content";
  var addGiftEl = document.querySelector(addGift);
  var rawId = addGiftEl ? addGiftEl.getAttribute("data-id") : null;
  var idGift = rawId !== null ? parseInt(rawId, 10) : null;

  function toggleAll(sel, cls, add) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList[add ? "add" : "remove"](cls);
    });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest(openBox);
    if (!t) return;
    if (t.nextElementSibling) t.nextElementSibling.classList.add("active");
    var cd = t.closest(cartDrawSel);
    if (cd) cd.classList.add("overlay");
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest(closeBtn);
    if (!t) return;
    var box = t.closest(boxGift);
    if (box) box.classList.remove("active");
    var cd = t.closest(cartDrawSel);
    if (cd) cd.classList.remove("overlay");
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest(addGift);
    if (!t) return;
    e.preventDefault();
    t.classList.add("is-loading");
    fetch(window.Shopify.routes.root + "cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id: idGift, quantity: 1 }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function () {
        if (theme.miniCart) {
          theme.miniCart.generateCart();
          theme.miniCart.updateElements();
        }
        setTimeout(function () {
          t.classList.remove("is-loading");
        }, 300);
        if (theme.cartpage) {
          location.reload();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
  });

  function hideGift(id) {
    if (id === idGift) {
      toggleAll(giftWrap, "hide", true);
      toggleAll(boxGift, "active", false);
      toggleAll(addGift, "is-loading", false);
      toggleAll(cartDrawSel, "overlay", false);
    }
  }
  function checkGift(id) {
    if (id === idGift) {
      toggleAll(giftWrap, "hide", false);
      toggleAll(boxGift, "active", false);
      toggleAll(addGift, "is-loading", false);
      toggleAll(cartDrawSel, "overlay", false);
    }
  }
  return {
    hideGift: hideGift,
    checkGift: checkGift,
  };
})();

theme.openAddon = (function () {
  var openBlock = ".js-open-addon",
    closeBlock = ".btn-close-addon",
    addonBlock = ".block-addon__box--wrap",
    cartDrawSel = ".mini-cart-content";
  document.addEventListener("click", function (e) {
    var t = e.target.closest(openBlock);
    if (!t) return;
    if (t.nextElementSibling) t.nextElementSibling.classList.add("active");
    var cd = t.closest(cartDrawSel);
    if (cd) cd.classList.add("overlay");
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest(closeBlock);
    if (!t) return;
    var box = t.closest(addonBlock);
    if (box) box.classList.remove("active");
    var cd = t.closest(cartDrawSel);
    if (cd) cd.classList.remove("overlay");
  });
})();

// MiniCart
theme.miniCart = (function () {
  var miniCart = ".js-mini-cart",
    cartToggle = ".js-toggle-cart",
    cartCount = ".js-cart-count",
    cartContent = ".js-mini-cart-content",
    cartTotal = ".js-cart-total",
    $crosellcart = ".drawer-crossell",
    $cartBottom = ".js-cart-bottom",
    numberDisplayed = 5,
    buttonHtml =
      '<a class="btn btn-outline w-100 mt-5" href=' +
      theme.strings.cartCollection +
      ">" +
      theme.strings.cartEmptyButton +
      "</a>",
    emptyCartHTML =
      '<div class="alert mini-cart-empty h-100 d-flex align-items-center flex-column justify-content-center"><div class=""><div class="iconcart-empty">' +
      theme.strings.cartIcon +
      '</div><div class="txtcart-empty mt-4">' +
      theme.strings.cartEmpty +
      "</div>" +
      "</div></div>";
  var _mcEl = document.querySelector(miniCart);
  var styleCart = _mcEl ? _mcEl.getAttribute("data-cartmini") : null;
  var _ccEl = document.querySelector(cartContent);
  var cartimgsize = _ccEl ? _ccEl.getAttribute("data-sizeimg") : "";

  // ---- vanilla helpers ----
  function getCart(cb) {
    fetch(window.Shopify.routes.root + "cart.js")
      .then(function (r) {
        return r.json();
      })
      .then(cb);
  }
  function changeCartLine(body) {
    return fetch(window.Shopify.routes.root + "cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  }
  function setHtmlAll(sel, html) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.innerHTML = html;
    });
  }
  function setTextAll(sel, txt) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.textContent = txt;
    });
  }
  function setDisplayAll(sel, show) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.style.display = show ? "" : "none";
    });
  }
  function toggleClassAll(sel, cls, add) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList[add ? "add" : "remove"](cls);
    });
  }

  function updateElements() {
    getCart(function (cart) {
      if (cart.item_count === 0) {
        setHtmlAll(cartContent, emptyCartHTML);
        setDisplayAll($cartBottom + ", " + $crosellcart, false);
        if (styleCart === "true") {
          toggleClassAll(miniCart, "active", false);
          document.body.classList.remove("overflow-hidden");
        }
      } else {
        setDisplayAll($cartBottom + ", " + $crosellcart, true);
        if (styleCart === "true") {
          toggleClassAll(miniCart, "active", true);
          document.body.classList.add("overflow-hidden");
        }
      }
      setTextAll(cartCount, cart.item_count);
      setHtmlAll(
        cartTotal,
        theme.Currency.formatMoney(cart.total_price, theme.moneyFormat)
      );
      if (cart.items && cart.items.length > 0 && cart.items[0].product_id) {
        observeProductRecommendations(cart.items[0].product_id);
      }
      theme.freeShipping.load(cart);
    });
  }
  function generateCart() {
    getCart(function (cart) {
      var htmlCart = cart.item_count === 0 ? emptyCartHTML : "",
        itemCount = cart.items.length,
        forLoop = itemCount < numberDisplayed ? itemCount : numberDisplayed;
      if (cart.item_count === 0) {
        setDisplayAll($cartBottom + ", " + $crosellcart, false);
      } else {
        setDisplayAll($cartBottom + ", " + $crosellcart, true);
      }
      //styleCart === 'true' ? cart.items.length ? $(miniCart).addClass('active'): $(miniCart).removeClass('active') :null;

      // add list items
      let lastLine;
      console.log(cart.items, 'ini items')
      
      // Create array of fetch promises
      var fetchPromises = [];
      for (let i = 0; i < forLoop; i++) {
        var product = cart.items[i];
        fetchPromises.push(
          fetch(`/products/${product.handle}.js`)
            .then(response => response.json())
            .then(productData => {
              console.log(productData, 'ini productnya')
              var variant = productData.variants.find(v => v.id === product.variant_id);

              if(variant) {
                return variant && variant.compare_at_price > 0 ? variant.compare_at_price : null;
              } else {
                return productData.compare_at_price
              }
            })
            .catch(error => {
              console.error('Error fetching product data:', error);
              return null;
            })
        );
      }
      
      // Wait for all fetches to complete, then build the cart
      Promise.all(fetchPromises).then(compareAtPrices => {
        htmlCart = cart.item_count === 0 ? emptyCartHTML : "";
        
        // Calculate total savings
        var totalSavings = 0;
        var totalCompareAtPrice = 0;
        
        for (let i = 0; i < forLoop; i++) {
          var line = i + 1;
          var compareAtPrice = compareAtPrices[i]; // Get the fetched compare_at_price
          var product = cart.items[i],
            productPrice = theme.Currency.formatMoney(
              product.price,
              theme.moneyFormat
            ),
            finalPrice = theme.Currency.formatMoney(
              product.final_price,
              theme.moneyFormat
            );

          console.log('Ini compare: ', product.price)
          console.log('Ini final: ', product.final_price)
          console.log('Ini compare_at_price: ', compareAtPrice)
          console.log('Ini product: ', product)
          
          // Calculate savings for this item
          if (compareAtPrice && compareAtPrice > product.final_price) {
            var itemSavings = (compareAtPrice - product.final_price) * product.quantity;
            totalSavings += itemSavings;
            totalCompareAtPrice += compareAtPrice * product.quantity;
          } else {
            // No discount, add regular price to compare total
            totalCompareAtPrice += product.final_price * product.quantity;
          }
          
          if (product.final_price < product.price) {
           // var ItemPrice = `<s>${productPrice}</s>  ${finalPrice}`;
           if(compareAtPrice){
            var ItemPrice = `${finalPrice}`;
          }else{
            var ItemPrice = `<s>${productPrice}</s>  ${finalPrice}`;
          }
          } else {
            var ItemPrice = `${productPrice}`;
          }
          theme.GiftWrap.hideGift(product.id);
          
          lastLine = line - 1;
          htmlCart += `<div class="mini-cart-item">`;
          htmlCart += `	<a class="mini-cart-image " href="${product.url}"> <span class="d-block mini-cart-img ${cartimgsize}">`;
          htmlCart += `		<img src="${product.image}&width=160"/>`;
          htmlCart += `	</span></a>`;
          htmlCart += `	<div class="mini-cart-meta">`;
          htmlCart += `		<div class="mb-1"><a href="${product.url}">${product.title}</a></div>`;

          // Build price display
          var priceDisplay = '';
          if (compareAtPrice && compareAtPrice > product.final_price) {
            priceDisplay = `<s>${theme.Currency.formatMoney(compareAtPrice, theme.moneyFormat)}</s> <span>${ItemPrice}</span>`;
          } else {
            priceDisplay = `<span>${ItemPrice}</span>`;
          }

          // Build badge if discount exists
         /* var badge = '';
          if (compareAtPrice && compareAtPrice > product.final_price) {
            var discountPercent = Math.round(((compareAtPrice - product.final_price) / compareAtPrice) * 100);
            badge = `<span class="discount-badge" style="padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 3px; margin-left: 8px; vertical-align: middle;">${discountPercent}% OFF</span>`;
          }*/
            var badge = '';
            // Determine the base price for the discount calculation
            var basePrice = (compareAtPrice && compareAtPrice > product.price) ? compareAtPrice : product.price;

            // Show badge if the final price is lower than our base price
            if (product.final_price < basePrice) {
                var discountPercent = Math.round(((basePrice - product.final_price) / basePrice) * 100); 
                badge = `<span class="discount-badge" style="padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 3px; margin-left: 8px; vertical-align: middle;">${discountPercent}% OFF</span>`;
            }

          htmlCart +=
            `		${priceDisplay} ${badge}<div class="d-flex align-items-center mt-2 justify-content-between"><div class="js-qty mt-1"><input data-line="` +
            line +
            `" type="text" min="0" class="change-minicart js-qty__input" pattern="[0-9]*" value="${product.quantity}" data-max="${product.inventory_quantity}"><button type="button" class="js-qty__adjust js-qty__minus" aria-label="Reduce item quantity by one"><svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-minus" viewBox="0 0 22 3"><path fill="#000" d="M21.5.5v2H.5v-2z" fill-rule="evenodd"></path></svg><span class="icon__fallback-text">−</span></button><button type="button" class="js-qty__adjust js-qty__plus" aria-label="Increase item quantity by one"><svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-plus" viewBox="0 0 22 21"><path d="M12 11.5h9.5v-2H12V0h-2v9.5H.5v2H10V21h2v-9.5z" fill="#000" fill-rule="evenodd"></path></svg><span class="icon__fallback-text">+</span></button></div><button class="btn js-remove-mini-cart link pr-0" data-id="${product.id}">Remove</button></div>`;
          htmlCart += `	</div>`;
          htmlCart += `</div>`;
        }
        //observeProductRecommendations(cart.items[0].product_id);

        if (itemCount > numberDisplayed) {
          htmlCart +=
            '<p><a class="js-btn-viewmore small" href="/cart">' +
            theme.strings.cartMore +
            " (" +
            (itemCount - numberDisplayed) +
            ")</a></p>";
        }
        
        // add total price and cart button / checkout button
        setHtmlAll(cartContent, htmlCart);
        









        // Update the bottom-total section with savings
       // var savingsDisplay = '';
       // if (totalSavings > 0) {
          // Add cart.total_discount if it exists
      //    var totalSavingsWithDiscount = totalSavings + (cart.total_discount || 0);
      //    savingsDisplay = `<span class="discount-badge-cart" style="padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 3px; margin-left: 8px; vertical-align: middle;">You save ${theme.Currency.formatMoney(totalSavingsWithDiscount, theme.moneyFormat)}</span><s style="margin: 0 5px;">${theme.Currency.formatMoney(totalCompareAtPrice, theme.moneyFormat)}</s>`;
      //  }
        
      //  $('.bottom-total').html(`
      //    Total:
      //    <span style="float: right;">
      //      ${savingsDisplay}
      //      <span class="js-cart-total">${theme.Currency.formatMoney(cart.total_price, theme.moneyFormat)}</span>
      //    </span>
      //  `);


/*var savingsDisplay = '';
if (totalSavings > 0) {
  var totalSavingsWithDiscount = totalSavings + (cart.total_discount || 0);

  // Pull translation string, fallback if not available
  var savingsTemplate = theme.strings && theme.strings.you_are_saving
    ? theme.strings.you_are_saving
    : "You're saving {{ price }}";

  // Replace {{ price }} placeholder with formatted money
  var savingsText = savingsTemplate.replace(
    '{{ price }}',
    theme.Currency.formatMoney(totalSavingsWithDiscount, theme.moneyFormat)
  );

  savingsDisplay = `
    <span class="discount-badge-cart" style="padding:2px 6px;font-size:11px;font-weight:bold;border-radius:3px;margin-left:8px;vertical-align:middle;">
      ${savingsText}
    </span>
    <span class="price-inline">
      <s>${theme.Currency.formatMoney(totalCompareAtPrice, theme.moneyFormat)}</s>
      <span class="js-cart-total">${theme.Currency.formatMoney(cart.total_price, theme.moneyFormat)}</span>
    </span>
  `;
}*/
var savingsDisplay = '';
// Calculate total savings: product-level savings + cart-level discounts
var totalSavingsWithDiscount = (totalSavings || 0) + (cart.total_discount || 0);

if (totalSavingsWithDiscount > 0) {
  // 1. Determine the "Original" price to show in strike-through
  // If totalCompareAtPrice is 0 or missing, we calculate it from current total + savings
  var displayOriginalPrice = totalCompareAtPrice && totalCompareAtPrice > cart.total_price 
    ? totalCompareAtPrice 
    : (cart.total_price + totalSavingsWithDiscount);

  // 2. Prepare the translation string
  var savingsTemplate = theme.strings && theme.strings.you_are_saving
    ? theme.strings.you_are_saving
    : "You're saving {{ price }}";

  // 3. Replace placeholder with formatted money
  var savingsText = savingsTemplate.replace(
    '{{ price }}',
    theme.Currency.formatMoney(totalSavingsWithDiscount, theme.moneyFormat)
  );

  // 4. Generate the HTML
  savingsDisplay = `
    <span class="discount-badge-cart" style="padding:2px 6px;font-size:11px;font-weight:bold;border-radius:3px;margin-left:8px;vertical-align:middle;">
      ${savingsText}
    </span>
    <span class="price-inline">
      <s>${theme.Currency.formatMoney(displayOriginalPrice, theme.moneyFormat)}</s>
      <span class="js-cart-total">
        ${theme.Currency.formatMoney(cart.total_price, theme.moneyFormat)}
      </span>
    </span>
  `;
}else{
  savingsDisplay = `
    <span class="price-inline">
      <span class="js-cart-total">
        ${theme.Currency.formatMoney(cart.total_price, theme.moneyFormat)}
      </span>
    </span>
  `;
}





setHtmlAll('.bottom-total', `
  Total:
  <span class="total-wrapper">
    ${savingsDisplay}
  </span>
`);








        
        // Update the discount information at the top if it exists
       /* if (totalSavings > 0) {
          var topSavings = totalSavings + (cart.total_discount || 0);
          var discountInfo = $('.discount-information p.discount-information-text-display');
          if (discountInfo.length) {
            // Get the template from data attribute
            var template = discountInfo.attr('data-template');
            
            if (template) {
              // Format the savings amount
              var formattedSavings = theme.Currency.formatMoney(topSavings, theme.moneyFormat);
              
              // Replace {DISCOUNT} with the formatted value
              var parts = template.split('{DISCOUNT}');
              var newHtml = parts[0] + '<span style="font-weight: 600;">' + formattedSavings + '</span>' + (parts[1] || '');
              discountInfo.html(newHtml);
            }
          }
        }*/
                 // Calculate the combined savings first
            var combinedTopSavings = (totalSavings || 0) + (cart.total_discount || 0);

            // Change the condition to check the combined total
            if (combinedTopSavings > 0) {
              var discountInfo = document.querySelector('.discount-information p.discount-information-text-display');

              if (discountInfo) {
                // Get the template from data attribute
                var template = discountInfo.getAttribute('data-template');

                if (template) {
                  // Format the combined savings amount
                  var formattedSavings = theme.Currency.formatMoney(combinedTopSavings, theme.moneyFormat);

                  // Replace {DISCOUNT} with the formatted value inside a bold span
                  var parts = template.split('{DISCOUNT}');
                  var newHtml = parts[0] + '<span style="font-weight: 600;">' + formattedSavings + '</span>' + (parts[1] || '');

                  discountInfo.innerHTML = newHtml;
                  // Ensure the container is visible if it was hidden when savings were 0
                  setDisplayAll('.discount-information', true);
                }
              }
            } else {
              // Optional: Hide the banner if there are no savings at all
              setDisplayAll('.discount-information', false);
            }
        
        // qty +/- handlers are delegated at module level (see below) so they
        // survive each re-render without re-binding.

        setHtmlAll(
          cartTotal,
          theme.Currency.formatMoney(cart.total_price, theme.moneyFormat)
        );
        //theme.updateCurrencies();
      });
    });
  }

  // ---- delegated mini-cart quantity steppers (bound once) ----
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".js-mini-cart-content .js-qty__minus");
    if (!btn) return;
    var input = btn.parentElement.querySelector("input");
    if (!input) return;
    if (parseInt(input.value, 10) < 1) {
      input.value = 0;
    } else {
      input.value = parseInt(input.value, 10) - 1;
    }
    var qty = input.value;
    var line = input.getAttribute("data-line");
    changeCartLine({ quantity: qty, line: line })
      .then(function (r) {
        return r.json();
      })
      .then(function (item) {
        updateElements();
        generateCart();
        if (item.item_count === 0) {
          setDisplayAll(".discount-information", false);
        }
      })
      .catch(function () {});
  });
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".js-mini-cart-content .js-qty__plus");
    if (!btn) return;
    var input = btn.parentElement.querySelector("input");
    if (!input) return;
    var currentQty = parseInt(input.value, 10);
    var newQty = currentQty + 1;
    var line = input.getAttribute("data-line");
    changeCartLine({ quantity: newQty, line: line })
      .then(function (r) {
        if (!r.ok) throw r;
        return r.json();
      })
      .then(function () {
        input.value = newQty;
        updateElements();
        generateCart();
      })
      .catch(function () {
        var growls = document.querySelector(".cart_growl_default");
        if (!growls) return;
        var badge = growls.querySelector(".cart_badge_icon span");
        if (badge) badge.innerHTML = currentQty;
        if (growls.classList.contains("hide")) {
          growls.classList.remove("hide");
          setTimeout(function () {
            growls.classList.add("hide");
          }, 2000);
        }
      });
  });
  //observeProductRecommendations
  function observeProductRecommendations(customID) {
    const loadingIndicator = document.querySelector(".recommend-loading");
    const productRecommendationsSection = document.querySelector(
      ".product-recommendations-in"
    );

    if (!productRecommendationsSection) {
      console.error("Product recommendations section not found.");
      return;
    }

    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;

      observer.unobserve(productRecommendationsSection);

      const url = `${productRecommendationsSection.dataset.url}&product_id=${customID}&limit=4&intent=related`;

      fetch(url)
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement("div");
          html.innerHTML = text;
          const recommendations = html.querySelector(
            ".product-recommendations-in"
          );

          if (recommendations && recommendations.innerHTML.trim().length) {
            const newContent = recommendations.innerHTML;
            setTimeout(() => {
              productRecommendationsSection.innerHTML = newContent;
              loadingIndicator.classList.remove("loading");
            }, 0);
          } else {
            loadingIndicator.classList.remove("loading");
          }
        })
        .catch((e) => {
          console.error(e);
          loadingIndicator.classList.remove("loading");
        });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: "0px 0px 200px 0px",
    });
    observer.observe(productRecommendationsSection);
    loadingIndicator.classList.add("loading");
  }
  function renderRecommendations() {
    getCart(function (cart) {
      if (cart && cart.items && cart.items.length > 0) {
        const firstItem = cart.items[0];
        if (firstItem && firstItem.product_id) {
          observeProductRecommendations(cart.items[0].product_id);
        }
      }
    });
  }

  // 2. Button remove items
/*  $(document).on("click", ".js-remove-mini-cart", function () {
    const loadingIndicator = document.querySelector(".recommend-loading");
    var itemId = $(this).data("id");
    var isOuterMiniCart = $(this).closest(miniCart).length === 0 ? true : false; // check element from mini cart or not

    // hide items
    $(this).parents(".mini-cart-item").fadeOut(100);
    loadingIndicator.classList.add("loading");
    console.log(loadingIndicator);
    theme.GiftWrap.checkGift(itemId);
    //remove from cart
    Shopify.changeItem(itemId, 0, updateElements);
    Shopify.getCart(function (cart) {
      if (cart.items.length > numberDisplayed || isOuterMiniCart) {
        generateCart();
      }
    });
  });*/
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".js-remove-mini-cart");
    if (!btn) return;
    var loadingIndicator = document.querySelector(".recommend-loading");
    var itemId = parseInt(btn.getAttribute("data-id"), 10);
    var isOuterMiniCart = !btn.closest(miniCart);

    var item = btn.closest(".mini-cart-item");
    if (item) theme.fadeOut(item);
    if (loadingIndicator) loadingIndicator.classList.add("loading");
    theme.GiftWrap.checkGift(itemId);

    // Remove from cart, then check inside the callback
    changeCartLine({ id: itemId, quantity: 0 })
      .then(function (r) {
        return r.json();
      })
      .then(function (cart) {
        updateElements();
        if (cart.item_count === 0) {
          setDisplayAll(".discount-information", false);
        }
        if (cart.items.length > numberDisplayed || isOuterMiniCart) {
          generateCart();
        }
      })
      .catch(function () {});
  });

  //Keep popup when click cart / UX
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(cartToggle);
    if (!btn) return;
    var parent = btn.parentElement;
    if (parent && parent.matches && parent.matches(miniCart)) {
      parent.classList.toggle("active");
    }
    document.body.classList.toggle("overflow-hidden");
  });
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".overlaycart, .close");
    if (!btn) return;
    var mc = btn.closest(miniCart);
    if (mc) mc.classList.remove("active");
    document.body.classList.remove("overflow-hidden");
  });

  // renderRecommendations when load page
  renderRecommendations();
  // gen minicart when load page
  generateCart();
  return {
    updateElements: updateElements,
    generateCart: generateCart,
  };
})();

// Free shipping
theme.freeShipping = (function () {
  var freeShippingClass = ".js-free-shipping",
    freeShippingTextClass = ".js-free-shipping-text",
    percentSel = ".js-free-shipping .progress-bar";
  var fsEl = document.querySelector(freeShippingClass);
  var free_fisrt = fsEl ? fsEl.getAttribute("data-start") : "";
  var free_end = fsEl ? fsEl.getAttribute("data-end") : "";
  var minOrderValue = fsEl
    ? parseInt(fsEl.getAttribute("data-value"), 10) || 0
    : 0;

  function revealSvg(el) {
    var svg = el.previousElementSibling;
    if (svg && svg.tagName && svg.tagName.toLowerCase() === "svg") {
      svg.classList.remove("hide");
    }
  }

  function generate(cart) {
    var priceCart = cart.total_price;
    document.querySelectorAll(freeShippingClass).forEach(function (el) {
      el.style.display = priceCart == 0 ? "none" : "";
    });
    var percentEls = document.querySelectorAll(percentSel);
    var textEls = document.querySelectorAll(freeShippingTextClass);
    if (priceCart >= minOrderValue) {
      percentEls.forEach(function (el) {
        el.style.width = "100%";
        el.classList.remove("progress-bar-striped", "bg-primary");
      });
      textEls.forEach(function (el) {
        el.textContent = theme.strings.freeShipping;
        revealSvg(el);
      });
    } else {
      var percent = (priceCart / minOrderValue) * 100;
      var left = theme.Currency.formatMoney(
        minOrderValue - priceCart,
        theme.moneyFormat
      );
      percentEls.forEach(function (el) {
        el.style.width = percent + "%";
        el.classList.add("progress-bar-striped", "primary");
      });
      textEls.forEach(function (el) {
        el.innerHTML = free_fisrt + " " + left + " " + free_end;
        revealSvg(el);
      });
    }
  }

  fetch(window.Shopify.routes.root + "cart.js")
    .then(function (r) {
      return r.json();
    })
    .then(function (cart) {
      generate(cart);
    });

  return {
    load: generate,
  };
})();

// Shipping time - https://github.com/phstc/jquery-dateFormat
theme.shippingTime = (function () {
  var el = document.querySelector(".js-shipping-time");
  if (!el) return;
  var shippingTime = el.getAttribute("data-time") || "",
    now = new Date(),
    restHour = 23 - now.getHours(),
    restMinute = 59 - now.getMinutes();
  if (shippingTime !== "") {
    var nextTime = new Date(now.getTime() + shippingTime * 86400000);
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    var dd = ("0" + nextTime.getDate()).slice(-2);
    var formatTime =
      days[nextTime.getDay()] +
      ", " +
      dd +
      " " +
      months[nextTime.getMonth()] +
      " " +
      nextTime.getFullYear();
    var htmlShipping =
      "Order in the next <b>" +
      restHour +
      "</b> hours <b>" +
      restMinute +
      "</b> minutes to get it by <b>" +
      formatTime +
      "</b>. ";
    el.innerHTML = htmlShipping;
  }
})();

// Wishlist
theme.wishlist = (function () {
  const btnWishlist = ".js-btn-wishlist",
    btnRemoveWishlist = ".js-remove-wishlist";
  let wishlist = JSON.parse(localStorage.getItem("localWishlist")) || [];
  const wishlistLink = document.querySelector(".js-wishlist-link");
  const wishlistPageUrl = wishlistLink ? wishlistLink.getAttribute("href") : "";

  function setCount() {
    document.querySelectorAll(".js-wishlist-count").forEach(function (el) {
      el.textContent = wishlist.length;
    });
  }

  function showNoResult() {
    const container = document.querySelector(".js-wishlist-content");
    if (!container) return;
    container.innerHTML = `
      <div class="col text-center">
        <div class="alert alert-warning d-inline-block">${theme.strings.wishlistNoResult}</div>
      </div>
    `;
  }

  function updateWishlist(self) {
    const productHandle = self.getAttribute("data-handle");
    const allSimilar = document.querySelectorAll(
      `${btnWishlist}[data-handle="${productHandle}"]`
    );
    const isAdded = wishlist.includes(productHandle);

    if (isAdded) {
      window.location.href = wishlistPageUrl;
    } else {
      wishlist.push(productHandle);
      allSimilar.forEach(function (btn) {
        btn.innerHTML = `${theme.strings.wishlistIconAdded}${theme.strings.wishlistTextAdded}`;
        btn.setAttribute("data-original-title", theme.strings.wishlistTextAdded);
      });
      const tip = document.querySelector(".tooltip-inner");
      if (tip) tip.textContent = theme.strings.wishlistTextAdded;
    }

    localStorage.setItem("localWishlist", JSON.stringify(wishlist));
    setCount();
  }

  function loadWishlist() {
    const container = document.querySelector(".js-wishlist-content");
    if (container) container.innerHTML = "";

    if (wishlist.length > 0 && container) {
      wishlist.forEach((productHandle) => {
        fetch(window.Shopify.routes.root + `products/${productHandle}.js`)
          .then((r) => r.json())
          .then((product) => {
            const productPrice = product.price_varies
              ? `from ${theme.Currency.formatMoney(
                  product.price_min,
                  theme.moneyFormat
                )}`
              : theme.Currency.formatMoney(product.price, theme.moneyFormat);
            const productComparePrice =
              product.compare_at_price_min !== 0
                ? theme.Currency.formatMoney(
                    product.compare_at_price_min,
                    theme.moneyFormat
                  )
                : "";
            const priceClass = productComparePrice ? "wl-sale" : "";

            const htmlProduct = `
            <div class="js-wishlist-item col-md-4 col-sm-6 col-xs-6 col-12 mb-4 pb-3">
              <div class="js-wishlist-itembox">
                <div class="d-flex flex-row">
                  <a class="d-inline-block mr-4 wl-left" href="${product.url}">
                    <img class="lazyload" data-src="${product.featured_image}"/>
                  </a>
                  <div>
                    <a href="${product.url}" class="title-product d-block product-card__name mb-1">${product.title}</a>
                    <span class="${priceClass}">${productPrice}</span>
                    <s>${productComparePrice}</s>
                    <p><button class="btn js-remove-wishlist link px-0 small" data-handle="${product.handle}">${theme.strings.wishlistRemove}</button></p>
                  </div>
                </div>
              </div>
            </div>
          `;

            container.insertAdjacentHTML("beforeend", htmlProduct);
          })
          .catch(function () {});
      });
    } else if (container) {
      showNoResult();
    }

    setCount();

    document.querySelectorAll(btnWishlist).forEach(function (btn) {
      const productHandle = btn.getAttribute("data-handle");
      const isProductAdded = wishlist.includes(productHandle);
      const iconWishlist = isProductAdded
        ? theme.strings.wishlistIconAdded
        : theme.strings.wishlistIcon;
      const textWishlist = isProductAdded
        ? theme.strings.wishlistTextAdded
        : theme.strings.wishlistText;

      btn.innerHTML = `${iconWishlist}${textWishlist}`;
      btn.setAttribute("title", textWishlist);
    });
  }

  document.addEventListener("click", function (event) {
    const btn = event.target.closest(btnWishlist);
    if (!btn) return;
    event.preventDefault();
    updateWishlist(btn);
  });

  document.addEventListener("click", function (event) {
    const removeBtn = event.target.closest(btnRemoveWishlist);
    if (!removeBtn) return;
    const productHandle = removeBtn.getAttribute("data-handle");

    document
      .querySelectorAll(`${btnWishlist}[data-handle="${productHandle}"]`)
      .forEach(function (btn) {
        btn.innerHTML = `${theme.strings.wishlistIcon}${theme.strings.wishlistText}`;
        btn.setAttribute("data-original-title", theme.strings.wishlistText);
      });

    const productIndex = wishlist.indexOf(productHandle);
    if (productIndex !== -1) {
      wishlist.splice(productIndex, 1);
      localStorage.setItem("localWishlist", JSON.stringify(wishlist));
    }

    const item = removeBtn.closest(".js-wishlist-item");
    if (item) {
      theme.fadeOut(item, function () {
        item.remove();
        if (wishlist.length === 0) {
          showNoResult();
        }
      });
    }

    setCount();
  });

  loadWishlist();
  document.addEventListener("shopify:section:load", loadWishlist);

  return {
    load: loadWishlist,
  };
})();

// Compare
theme.compare = (function () {
  var compareButtonClass = ".js-btn-compare",
    compareRemoveButtonClass = ".js-remove-compare",
    compareObject = JSON.parse(localStorage.getItem("localCompare")) || [],
    alertClass = "notice";

  function setCount() {
    document.querySelectorAll(".js-compare-count").forEach(function (el) {
      el.textContent = compareObject.length;
    });
  }

  function updateCompare(self) {
    var productHandle = self.getAttribute("data-handle"),
      alertText = "";
    var isAdded = compareObject.indexOf(productHandle) !== -1;
    if (isAdded) {
      compareObject.splice(compareObject.indexOf(productHandle), 1);
      alertText = theme.strings.compareNotifyRemoved;
      alertClass = "notice";
    } else {
      if (compareObject.length === 4) {
        alertText = theme.strings.compareNotifyMaximum;
        alertClass = "error";
      } else {
        alertClass = "notice";
        compareObject.push(productHandle);
        alertText = theme.strings.compareNotifyAdded;
      }
    }
    localStorage.setItem("localCompare", JSON.stringify(compareObject));
    theme.alert.new(theme.strings.compareText, alertText, 2000, alertClass);
    setCount();
  }

  function loadCompare() {
    var container = document.querySelector(".js-compare-content");
    var compareGrid;
    if (container) container.innerHTML = "";

    if (compareObject.length > 0 && container) {
      compareGrid = compareObject.length === 1 ? "col-md-12 col-sm-6" : "col";
      compareObject.forEach(function (productHandle) {
        fetch(window.Shopify.routes.root + "products/" + productHandle + ".js")
          .then(function (r) {
            return r.json();
          })
          .then(function (product) {
            var htmlProduct = "",
              productPrice = product.price_varies
                ? "from " +
                  theme.Currency.formatMoney(
                    product.price_min,
                    theme.moneyFormat
                  )
                : theme.Currency.formatMoney(product.price, theme.moneyFormat),
              productComparePrice =
                product.compare_at_price_min !== 0
                  ? theme.Currency.formatMoney(
                      product.compare_at_price_min,
                      theme.moneyFormat
                    )
                  : "",
              productAvailable = product.available
                ? theme.strings.available
                : theme.strings.unavailable,
              productAvailableClass = product.available
                ? "alert-success"
                : "alert-danger",
              productTypeHTML =
                product.type !== ""
                  ? '<a class="link" href="/collections/types?q=' +
                    product.type +
                    '">' +
                    product.type +
                    "</a>"
                  : "<span>" + theme.strings.none + "</span>",
              productVendorHTML =
                product.vendor !== ""
                  ? '<a class="link" href="/collections/vendors?q=' +
                    product.vendor +
                    '">' +
                    product.vendor +
                    "</a>"
                  : "<span>" + theme.strings.none + "</span>";
            htmlProduct +=
              '<div class="compare-item ' + compareGrid + ' col-xs-6 px-0">';
            htmlProduct +=
              '  <p class="py-3"><button class="js-remove-compare link " data-handle="' +
              product.handle +
              '">' +
              theme.strings.compareTextRemove +
              "</button></p>";
            htmlProduct +=
              '	<a class="d-block mb-4 px-4" href="' + product.url + '">';
            htmlProduct +=
              '		<img src="' +
              theme.Images.getSizedImageUrl(product.featured_image, "x230") +
              '"/>';
            htmlProduct += "	</a>";
            htmlProduct += "	<hr /><h5 >" + product.title + "</h5>";
            htmlProduct +=
              '	<hr /><s class="small">' + productComparePrice + "</s>";
            htmlProduct += "	<span> " + productPrice + "</span>";
            htmlProduct +=
              '	<hr /><span class="px-2 py-1 rounded ' +
              productAvailableClass +
              '"> ' +
              productAvailable +
              "</span>";
            htmlProduct += "	<hr />" + productTypeHTML;
            htmlProduct +=
              '	<hr /><div class="pb-3">' + productVendorHTML + "</div>";
            htmlProduct += "</div>";
            container.insertAdjacentHTML("beforeend", htmlProduct);
          })
          .catch(function () {});
      });
    } else if (container) {
      container.innerHTML =
        '<div class="alert alert-warning d-inline-block mb-0">' +
        theme.strings.compareNoResult +
        "</div>";
    }

    //button text
    document.querySelectorAll(compareButtonClass).forEach(function (btn) {
      var productHandle = btn.getAttribute("data-handle");
      btn.classList.remove("added");
      if (compareObject.indexOf(productHandle) !== -1) {
        btn.classList.add("added");
      }
    });

    setCount();
  }

  document.addEventListener("click", function (event) {
    var btn = event.target.closest(compareButtonClass);
    if (!btn) return;
    event.preventDefault();
    updateCompare(btn);
    loadCompare();
  });
  document.addEventListener("click", function (event) {
    var btn = event.target.closest(compareRemoveButtonClass);
    if (!btn) return;
    var productHandle = btn.getAttribute("data-handle");
    compareObject.splice(compareObject.indexOf(productHandle), 1);
    localStorage.setItem("localCompare", JSON.stringify(compareObject));
    loadCompare();
  });

  loadCompare();
  document.addEventListener("shopify:section:load", loadCompare);
  return {
    load: loadCompare,
  };
})();

// Popup newsletter
theme.popupNewletter = (function () {
  function popupNewletter(container) {
    var sectionId = container.getAttribute("data-section-id");
    this.selectors = {
      popupSection: ".popupnew-" + sectionId,
      formSection: "#jsPopupNewsletter" + sectionId,
    };
    this.init();
  }
  popupNewletter.prototype = Object.assign({}, popupNewletter.prototype, {
    init: function () {
      this.showPopup();
    },
    showPopup: function () {
      var formSel = this.selectors.formSection;
      var popupEl = document.querySelector(formSel);
      var newsletterForm = popupEl ? popupEl.querySelector("form") : null;
      var date = new Date();
      var minutes = theme.timePopupNewsletter;
      var minutesdelay = popupEl ? popupEl.getAttribute("data-delay") : 0;

      if (popupEl) {
        date.setTime(date.getTime() + minutes * 60 * 1000);
        var setCookies = function () {
          theme.cookie.set("cookiesNewsletter", "disabled", date, "/");
        };
        if (theme.cookie.get("cookiesNewsletter") !== "disabled") {
          window.addEventListener("load", function () {
            setTimeout(function () {
              if (window.NativeUI) NativeUI.openModal(formSel);
            }, minutesdelay * 1000);
          });
          popupEl.addEventListener("close", setCookies);
          popupEl.addEventListener("modal:hidden", setCookies);
          if (newsletterForm) {
            newsletterForm.addEventListener("submit", setCookies);
          }
        }
      }
      if (window.Shopify && Shopify.designMode) {
        document.addEventListener("shopify:section:select", function (event) {
          var el = event.target.querySelector(formSel);
          if (el && window.NativeUI) NativeUI.openModal(el);
        });
        document.addEventListener("shopify:section:deselect", function (event) {
          var el = event.target.querySelector(formSel);
          if (el && window.NativeUI) NativeUI.closeModal(el);
        });
      }
    },
  });

  return popupNewletter;
})();

theme.BeforeAfter = (function () {
  function BeforeAfter(container) {
    this.container = container;
    var sectionId = container.getAttribute("data-section-id");
    this.selectors = {
      bablockSection: "#beer-slider-" + sectionId,
    };
    this.init();
  }
  BeforeAfter.prototype = Object.assign({}, BeforeAfter.prototype, {
    init: function () {
      this.showBeforeAfter();
    },
    showBeforeAfter: function () {
      var el = document.querySelector(this.selectors.bablockSection);
      // BeerSlider is a global class (no jQuery wrapper needed).
      if (el && typeof BeerSlider !== "undefined") {
        new BeerSlider(el, { start: 50 });
      }
    },
  });

  return BeforeAfter;
})();

// Cookie policy

theme.CookieSection = (function () {
  class CookieSection {
    constructor(container) {
      this.container = container;
      this.sectionId = container.getAttribute("data-section-id");
      this.cookieSelector = ".cookie-" + this.sectionId;
      this.closeButtonSelector = ".js-btn-ok";
      this.declineButton = ".js-btn-decline";
      this.init();
    }

    init() {
      this.showCookie();
    }

    showCookie() {
      const cookiePolicy = document.querySelector(this.cookieSelector);
      const closeButton = document.querySelector(this.closeButtonSelector);
      const declineButton = document.querySelector(this.declineButton);
      const isAccepted = localStorage.getItem("localCookie") || "";

      if (!isAccepted) {
        theme.fadeIn(cookiePolicy);
      }

      if (closeButton)
        closeButton.addEventListener("click", () => {
          localStorage.setItem("localCookie", "accept");
          theme.fadeOut(cookiePolicy);
        });
      if (declineButton)
        declineButton.addEventListener("click", () => {
          theme.fadeOut(cookiePolicy);
        });

      if (window.Shopify && Shopify.designMode) {
        const sel = this.cookieSelector;
        document.addEventListener("shopify:section:load", () => {
          theme.fadeOut(cookiePolicy);
        });
        document.addEventListener("shopify:section:select", (event) => {
          const el = event.target.querySelector(sel);
          if (el) theme.fadeIn(el);
        });
        document.addEventListener("shopify:section:deselect", (event) => {
          const el = event.target.querySelector(sel);
          if (el) theme.fadeOut(el);
        });
      }
    }
  }

  return CookieSection;
})();

// Popup newsletter
theme.FooterSection = (function () {
  function FooterSection(container) {
    var sectionId = container.getAttribute("data-section-id");
    var enableAcc = Boolean(container.getAttribute("data-acc"));
    this.selectors = {
      footerSection: ".footer-" + sectionId,
      enableAcc: enableAcc,
    };
    this.init();
  }
  FooterSection.prototype = Object.assign({}, FooterSection.prototype, {
    init: function () {
      this.accordionResponsive();
    },

    accordionResponsive: function () {
      //var mqr = window.matchMedia('screen and (max-width: 749px)');
      if (this.selectors.enableAcc == true) {
        document.querySelectorAll(".site-footer__section-title").forEach(
          function (title) {
            title.addEventListener("click", function (e) {
              e.preventDefault();
              this.classList.toggle("active");
              if (this.nextElementSibling)
                theme.slideToggle(this.nextElementSibling);
            });
          }
        );
      }
    },
  });

  return FooterSection;
})();

// Open external link in new tab
theme.exLink = (function () {
  var links = document.links;
  for (let i = 0, linksLength = links.length; i < linksLength; i++) {
    if (
      links[i].hostname !== window.location.hostname &&
      links[i].getAttribute("href") !== "javascript:void(0)"
    ) {
      links[i].target = "_blank";
    }
  }
})();

// Collection view - Collection page
theme.collectionView = (function () {
  var btnView = ".js-btn-view",
    btnViewActive = ".js-btn-view.active";

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(btnView);
    if (!btn) return;
    var value = parseInt(btn.getAttribute("data-col"), 10);

    document.querySelectorAll(btnView).forEach(function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");

    document.querySelectorAll(".js-col").forEach(function (col) {
      col.className = "js-col col-sm-6 col-6";
      if (value === 3) col.classList.add("col-lg-4");
      else if (value === 4) col.classList.add("col-lg-3");
      else if (value === 5) col.classList.add("col-lg-2-4");
      else if (value === 6) col.classList.add("col-lg-2");
    });
  });

  function triggerCollectionView() {
    var active = document.querySelector(btnViewActive);
    if (active) active.click();
  }

  return {
    triggerView: triggerCollectionView,
  };
})();

// Swath variant in card item
theme.swatchCard = (function () {
  const $swatches = ".js-swatch-card-item";
  const $image = ".product-card__image img";
  const $cart = ".js-grid-cart";

  function handleSwatchClick() {
    const $swatch = $(this);
    const newImage = $swatch.data("image");
    const id = $swatch.data("id");
    const $card = $swatch.closest(".js-product-card");

    $card.find($swatches).removeClass("active");
    $swatch.addClass("active");

    $card.find($image).attr("srcset", newImage);
    $card.find($cart).data("id", id);
  }

  $(document).on("click", $swatches, handleSwatchClick);
})();

theme.swatchCard2 = (function () {
  function initVariant(id) {
    var productJson = JSON.parse($(".customJson-" + id).html());
    var $selectorForm = $(".customform-" + id);
    var $button = $(".js-customform-addtocart-" + id);
    var $buttontext = $button.find("span");
    var $wrapObject = $selectorForm.closest(".js-product-card");
    var options = {
      $container: $selectorForm,
      enableHistoryState: false,
      product: productJson,
      singleOptionSelector: ".single-option-selector-" + id,
      originalSelectorId: "#ProductSelect-" + id,
    };
    var variants = new slate.Variants(options);
    var AjaxCart = new window.AjaxCart($selectorForm);
    var _updateButton = function (evt) {
      var variant = evt.variant;
      if (variant === undefined) {
        $button.prop("disabled", true).removeClass("btn--sold-out");
        $buttontext.html(theme.strings.unavailable);
      } else {
        if (variant.available) {
          $button.removeClass("btn--sold-out").prop("disabled", false);
          $buttontext.html(theme.strings.addToCart);
        } else {
          $button.prop("disabled", true).addClass("btn--sold-out");
          $buttontext.html(theme.strings.soldOut);
        }
      }
    };
    var _updateImage = function (evt) {
      var variant = evt.variant;
      var $mainImage = $wrapObject.find(".product-card__image").find("img");
      if (variant !== undefined && variant.featured_image !== null) {
        var variantImage = variant.featured_image;
        $mainImage.attr("srcset", variantImage.src);
      }
    };
    var _updatePrice = function (evt) {
      var $price = $wrapObject.find(".product-card__price");
      var variant = evt.variant;
      if (variant !== undefined) {
        var htmlComparePrice =
          variant.compare_at_price !== null
            ? '<s class="product-card__regular-price"><span class="money">' +
              variant.compare_at_price +
              "</span></s>"
            : "";
        var htmlPrice =
          '<span class="money">' + variant.price + "</span>" + htmlComparePrice;
        $price.html(htmlPrice);
        //theme.updateCurrencies();
      }
    };
    variants.$container.on("variantChange", _updateButton);
    variants.$container.on("variantChange", _updateImage);
    variants.$container.on("variantChange", _updatePrice);
  }
  function initForm() {
    $(".js-customform").each(function () {
      var id = $(this).data("id");
      initVariant(id);
    });
  }

  initForm();
  return {
    load: initForm,
  };
})();

// Loading
theme.loading = (function () {
  var $loading = $("#js-loading"),
    hasLoading = $("#js-loading").length === 0 ? false : true;
  if (hasLoading) {
    $(window).load(function () {
      $loading.fadeOut();
    });
  }
})();

theme.effectLeavingPage = (function () {
  window.onbeforeunload = function () {
    $("body").css("opacity", "0");
  };
})();

theme.bundleProduct = (function () {
  function bundleProduct(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr("data-section-id");
    this.selectors = {
      bundleSection: "#bundle-" + sectionId,
    };
    this.init();
  }
  bundleProduct.prototype = Object.assign({}, bundleProduct.prototype, {
    init: function () {
      this.bundleList();
    },
    bundleList: function () {
      let variantSelectClass = ".fbtproduct-form__variants",
        parentClass = ".fbt-item",
        totalPrice = ".fpt-total",
        totalPriceCompare = ".fpt-totalcompare",
        totalSave = ".fpt-save",
        checkBox = ".fbt-checkbox";

      updateTotal();
      checkItem();

      // change update variant
      $(document).on("change", variantSelectClass, function () {
        var selectVariant = $(this).children(":selected"),
          selectVariantId = selectVariant.data("id"),
          newPrice = theme.Currency.formatMoney(
            selectVariant.data("price"),
            theme.moneyFormat
          );
        newPriceCompare = theme.Currency.formatMoney(
          selectVariant.data("price-compare"),
          theme.moneyFormat
        );

        if (selectVariant.data("image") !== "") {
          $(this)
            .closest(parentClass)
            .find("img")
            .attr({
              src: selectVariant.data("image"),
              "data-srcset": selectVariant.data("image"),
              srcset: selectVariant.data("image"),
            });
        }
        $(this).closest(parentClass).attr("data-item", selectVariantId);
        $(this)
          .closest(parentClass)
          .find(".fbt-price")
          .attr("data-fbtprice", selectVariant.data("price"));
        $(this).closest(parentClass).find(".fbt-price").html(newPrice);
        if (selectVariant.data("price-compare") !== undefined) {
          $(this)
            .closest(parentClass)
            .find(".fbt-price-compare")
            .html(newPriceCompare)
            .removeClass("hide");
          $(this)
            .closest(parentClass)
            .find(".fbt-price-compare")
            .attr("data-price-at", selectVariant.data("price-compare"));
        } else {
          $(this)
            .closest(parentClass)
            .find(".fbt-price-compare")
            .attr("data-price-at", "")
            .addClass("hide");
        }
        updateTotal();
      });

      // checkChecked
      function checkItem() {
        $(checkBox).change(function () {
          if (this.checked) {
            $(this).closest(parentClass).attr("data-checked", true);
          } else {
            $(this).closest(parentClass).attr("data-checked", false);
          }
          updateTotal();
        });
      }
      function updateTotal() {
        let total = 0;
        let totalCompare = 0;
        $(".fbt-item-price").each(function () {
          let isChecked = $(this)
            .closest(".fbt-item")
            .find(".fbt-checkbox")
            .is(":checked");
          let isPriceCompare = $(this)
            .find(".fbt-price-compare")
            .attr("data-price-at");
          if (isChecked) {
            let value = parseFloat(
              $(this).find(".fbt-price").attr("data-fbtprice")
            );

            total += value;
            if (isPriceCompare !== undefined && isPriceCompare !== "") {
              let valueCompare = parseFloat(isPriceCompare);
              totalCompare += valueCompare - value;
            }
          }
        });
        //console.log(totalCompare);
        $(totalPrice).html(
          theme.Currency.formatMoney(total, theme.moneyFormat)
        );
        let totalSale = totalCompare + total;
        if (totalSale > total) {
          $(totalPriceCompare).show();
          $(totalSave)
            .show()
            .html(
              `${$(totalSave).attr(
                "data-txtsave"
              )} <span class="text-theme">${theme.Currency.formatMoney(
                totalSale - total,
                theme.moneyFormat
              )}</span>`
            );
        } else {
          $(totalPriceCompare).hide();
          $(totalSave).hide().html();
        }
        $(totalPriceCompare).html(
          theme.Currency.formatMoney(totalCompare + total, theme.moneyFormat)
        );
      }
      //click add product
      $("#fbt-button").click(function (e) {
        e.preventDefault();
        function addMultipleItemsToCart(productsToAdd) {
          var cartUrl = "/cart/add.js";
          var cartData = {
            items: productsToAdd,
          };

          $.ajax({
            type: "POST",
            url: cartUrl,
            data: cartData,
            dataType: "json",
            beforeSend: function () {
              $("#fbt-button").addClass("is-loading");
            },
            success: function (data) {
              $("#fbt-button").removeClass("is-loading");
              theme.miniCart.updateElements();
              theme.miniCart.generateCart();
            },
            error: function (XMLHttpRequest, textStatus, err) {
              $("#fbt-button").removeClass("is-loading");
              console.log(err);
            },
          });
        }
        var productsToAdd = $(parentClass)
          .map(function () {
            if ($(this).attr("data-checked") === "true") {
              return {
                id: parseInt($(this).attr("data-item")),
                quantity: 1,
              };
            }
          })
          .get();
        addMultipleItemsToCart(productsToAdd);
      });
    },
  });
  return bundleProduct;
})();

// Upsell
theme.upsell = (function () {
  const upsellPopupSelector = "#jsUpsell";
  const upsellEl = document.querySelector(upsellPopupSelector);
  if (!upsellEl) return;
  const acceptButton = upsellEl.querySelector(".btn-accept");
  const upsellProductId = upsellEl.getAttribute("data-id") || "";
  const acceptButtonClass = "js-btn-accept";
  const delayTime = parseInt(upsellEl.getAttribute("data-delay"), 10) || 3000;

  function showUpsellPopupWithDelay() {
    setTimeout(() => {
      if (window.NativeUI) NativeUI.openModal(upsellPopupSelector);
    }, delayTime);
  }

  function handleAcceptButtonClick() {
    const isAcceptButton = acceptButton.classList.contains(acceptButtonClass);

    if (isAcceptButton) {
      fetch(window.Shopify.routes.root + "cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ id: upsellProductId, quantity: 1 }),
      })
        .then((r) => r.json())
        .then((item) => {
          if (theme.miniCart) {
            theme.miniCart.updateElements();
            theme.miniCart.generateCart();
          }

          const variantInfo =
            item.variant_title !== null
              ? `<i>(${item.variant_title})</i>`
              : "";
          const alertContent = `<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="${item.image}"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">${item.product_title} x ${item.quantity}</p>${variantInfo}<div><div>`;

          theme.alert.new(
            theme.strings.addToCartSuccess,
            alertContent,
            3000,
            "notice"
          );
        });
    }

    if (window.NativeUI) NativeUI.closeModal(upsellPopupSelector);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showUpsellPopupWithDelay);
  } else {
    showUpsellPopupWithDelay();
  }
  if (acceptButton) {
    acceptButton.addEventListener("click", handleAcceptButtonClick);
  }
})();

// Overwrite Shopify.onError in Shopify API
Shopify.onError = function (t, r) {
  var e = eval("(" + t.responseText + ")");
  var mess = e.message
    ? e.message + "(" + e.status + "): " + e.description
    : "Error : " + Shopify.fullMessagesFromErrors(e).join("; ") + ".";
  theme.alert.new("Alert", mess, 3000, "warning");
};

// Fake-viewers
theme.fakeViewer = (function () {
  var els = document.querySelectorAll(".js-fake-view");
  if (!els.length) return;
  var first = els[0];
  var minValue = parseInt(first.getAttribute("data-min"), 10);
  var maxValue = parseInt(first.getAttribute("data-max"), 10);
  var duration = parseInt(first.getAttribute("data-duration"), 10);

  function updateFakeViewCount() {
    var value =
      Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
    els.forEach(function (el) {
      el.textContent = value;
    });
  }

  function initFakeViewCount() {
    updateFakeViewCount();

    if (!isNaN(minValue) && !isNaN(maxValue) && duration) {
      setInterval(updateFakeViewCount, duration);
    }
  }

  initFakeViewCount();
})();

// Product-suggest
theme.productSuggest = (function () {
  var notification = document.querySelector(".product-notification");
  if (!notification) return;
  var closeButton = document.querySelector(".close-notifi");
  var suggestionDuration =
    parseInt(notification.getAttribute("data-time"), 10) || 0;
  var suggestionCookie = "productSuggestClosed";

  function closeSuggestion() {
    notification.remove();
    theme.cookie.set(suggestionCookie, "closed", 1, "/");
  }

  function toggleSuggestion() {
    if (notification.classList.contains("active")) {
      notification.classList.remove("active");
    } else {
      var items = document.querySelectorAll(".data-product");
      if (!items.length) return;
      var selected = items[Math.floor(Math.random() * items.length)];

      notification.classList.add("active");
      var img = notification.querySelector(".product-image img");
      if (img) {
        img.setAttribute("src", selected.getAttribute("data-image"));
        img.setAttribute("width", selected.getAttribute("data-wimage"));
        img.setAttribute("height", selected.getAttribute("data-himage"));
      }
      var imgLink = notification.querySelector(".product-image");
      if (imgLink) {
        imgLink.setAttribute("href", selected.getAttribute("data-url"));
        imgLink.setAttribute("title", selected.getAttribute("data-title"));
      }
      var name = notification.querySelector(".product-name");
      if (name) {
        name.textContent = selected.getAttribute("data-title");
        name.setAttribute("href", selected.getAttribute("data-url"));
      }
      var timeAgo = notification.querySelector(".time-ago");
      if (timeAgo) timeAgo.textContent = selected.getAttribute("data-time");
      var fromAgo = notification.querySelector(".from-ago");
      if (fromAgo) fromAgo.textContent = selected.getAttribute("data-local");
    }
  }

  function handleSuggestionInterval() {
    if (suggestionDuration !== 0) {
      setInterval(toggleSuggestion, suggestionDuration);
    }
  }

  function init() {
    if (theme.cookie.get(suggestionCookie) === "closed") {
      notification.remove();
    } else {
      if (closeButton) closeButton.addEventListener("click", closeSuggestion);
      handleSuggestionInterval();
    }
  }

  init();
})();

theme.activeAccordion = (function () {
  // Bootstrap collapse accordions were migrated to native <details>; the
  // "active-acc" state is now driven purely by CSS ([open]). No JS hook needed.
})();

// Anchor scroll
theme.anchorScroll = (function () {
  document.addEventListener("click", function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;
    event.preventDefault();
    if (link.classList.contains("disabled-anchor")) return;
    var target = link.getAttribute("href");
    var targetEl = null;
    try {
      targetEl = target && target !== "#" ? document.querySelector(target) : null;
    } catch (e) {
      return;
    }
    if (!targetEl) return;
    var top = targetEl.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top: top, behavior: "smooth" });
  });
})();

// Notice when soldout
theme.alert = (function () {
  var colors = {
    notice: "#2e7d32",
    error: "#c62828",
    warning: "#ef6c00",
    default: "#333",
  };
  function createAlert(title, mess, time, type) {
    var aTitle = title || "",
      aTime = time || 2000,
      aMessage = mess || "",
      aClass = type || "default";
    var container = document.getElementById("theme-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "theme-toast-container";
      container.style.cssText =
        "position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:320px;";
      document.body.appendChild(container);
    }
    var toast = document.createElement("div");
    toast.setAttribute("role", "alert");
    toast.style.cssText =
      "background:" +
      (colors[aClass] || colors.default) +
      ";color:#fff;padding:12px 16px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.2);opacity:0;transform:translateX(20px);transition:opacity .3s,transform .3s;font-size:14px;line-height:1.35;";
    toast.innerHTML =
      (aTitle
        ? '<strong style="display:block;margin-bottom:2px;">' + aTitle + "</strong>"
        : "") +
      "<span>" +
      aMessage +
      "</span>";
    container.appendChild(toast);
    requestAnimationFrame(function () {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(0)";
    });
    setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, aTime);
  }

  return {
    new: createAlert,
  };
})();

// Notice when soldout
theme.noticeSoldout = (function () {
  function noticeSoldout(variant) {
    var wrap = document.querySelector(".js-contact-soldout");
    var textEl = document.querySelector(".js-notify-text");
    var valueEl = document.getElementById("ContactProduct");
    if (wrap) {
      var success = wrap.querySelector(".form-success");
      if (success) success.remove();
    }
    var span = textEl ? textEl.querySelector("span") : null;
    if (variant.available) {
      if (span) span.textContent = "";
      if (wrap) wrap.classList.add("hide");
    } else {
      if (span) span.textContent = +variant.name;
      if (wrap) wrap.classList.remove("hide");
      if (valueEl) {
        valueEl.value = variant.name;
        valueEl.setAttribute("value", variant.name);
      }
    }
  }
  return {
    init: noticeSoldout,
  };
})();

// Sticky cart
theme.stickyCart = function () {
  var anchor = document.getElementById("js-anchor-sticky-cart");
  var wrapper = document.querySelector(".sticky-cart-wr");
  if (!anchor || !wrapper) return;

  function handleStickyCart() {
    var anchorTop = anchor.getBoundingClientRect().top + window.pageYOffset;
    var anchorHeight = anchor.offsetHeight;
    var windowHeight = window.innerHeight;
    var windowScroll = window.pageYOffset;

    wrapper.classList.toggle(
      "active",
      windowScroll > anchorTop + anchorHeight - windowHeight
    );
  }

  if (theme._stickyCartScroll) {
    window.removeEventListener("scroll", theme._stickyCartScroll);
  }
  theme._stickyCartScroll = handleStickyCart;
  window.addEventListener("scroll", handleStickyCart);
  handleStickyCart();
};

// Run on initial load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", theme.stickyCart);
} else {
  theme.stickyCart();
}

// Re-run when sections are loaded in the theme editor
if (window.Shopify && Shopify.designMode) {
  document.addEventListener("shopify:section:load", theme.stickyCart);
  document.addEventListener("shopify:section:select", theme.stickyCart);
}

//Fix reload safari
window.addEventListener(
  "pageshow",
  function (evt) {
    if (evt.persisted) {
      setTimeout(function () {
        window.location.reload();
      }, 10);
    }
  },
  false
);

// Back to top
theme.backToTop = (function () {
  function init() {
    "use strict";
    var progressPath = document.querySelector(".progress-wrap path");
    if (progressPath == null) return;
    var pathLength = progressPath.getTotalLength();
    progressPath.style.transition = progressPath.style.WebkitTransition = "none";
    progressPath.style.strokeDasharray = pathLength + " " + pathLength;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.getBoundingClientRect();
    progressPath.style.transition = progressPath.style.WebkitTransition =
      "stroke-dashoffset 10ms linear";
    var updateProgress = function () {
      var scroll = window.pageYOffset;
      var height = document.documentElement.scrollHeight - window.innerHeight;
      var progress = pathLength - (scroll * pathLength) / height;
      progressPath.style.strokeDashoffset = progress;
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress);
    var offset = 50;
    var wrap = document.querySelector(".progress-wrap");
    window.addEventListener("scroll", function () {
      if (!wrap) return;
      if (window.pageYOffset > offset) {
        wrap.classList.add("active-progress");
      } else {
        wrap.classList.remove("active-progress");
      }
    });
    if (wrap) {
      wrap.addEventListener("click", function (event) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

theme.popOver = (function () {
  document.body.addEventListener("click", function (e) {
    document.querySelectorAll("[data-hotspot]").forEach(function (hotspot) {
      var next = hotspot.nextElementSibling;
      if (!next) return;
      // hide any open popovers when anywhere else in the body is clicked
      var hitHotspot = hotspot === e.target || hotspot.contains(e.target);
      var hitPopover = !!e.target.closest(".popover");
      if (!hitHotspot && !hitPopover) {
        next.classList.remove("active");
      } else {
        next.classList.add("active");
      }
    });
  });
})();

// Tooltip
theme.tooltip = (function () {
  // Lightweight vanilla tooltip (replaces the Bootstrap 4 jQuery tooltip plugin).
  var selector = '[data-toggle="tooltip"],[data-tooltip="true"]';
  var tip = null;

  function textOf(el) {
    if (el.getAttribute("title")) {
      // mirror Bootstrap: stash title so the native tooltip doesn't double up
      el.setAttribute("data-original-title", el.getAttribute("title"));
      el.removeAttribute("title");
    }
    return el.getAttribute("data-original-title") || "";
  }

  function show(el) {
    var text = textOf(el);
    if (!text) return;
    hide();
    tip = document.createElement("div");
    tip.className = "theme-tooltip";
    tip.textContent = text;
    tip.style.cssText =
      "position:absolute;z-index:99999;background:#000;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;white-space:nowrap;pointer-events:none;transform:translate(-50%,-100%);";
    document.body.appendChild(tip);
    var r = el.getBoundingClientRect();
    tip.style.left = r.left + r.width / 2 + window.pageXOffset + "px";
    tip.style.top = r.top + window.pageYOffset - 6 + "px";
  }

  function hide() {
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
    tip = null;
  }

  document.addEventListener("mouseover", function (e) {
    var el = e.target.closest(selector);
    if (el) show(el);
  });
  document.addEventListener("mouseout", function (e) {
    if (e.target.closest(selector)) hide();
  });
  document.addEventListener("focusin", function (e) {
    var el = e.target.closest(selector);
    if (el) show(el);
  });
  document.addEventListener("focusout", hide);
  document.addEventListener("click", function (e) {
    if (e.target.closest(selector)) hide();
  });

  function loadTooltip() {
    // delegation handles current + future elements; kept for API compatibility
  }
  return {
    load: loadTooltip,
  };
})();

theme.hasInput = (function () {
  document.querySelectorAll(".form-group .form-control").forEach(function (input) {
    input.addEventListener("blur", function () {
      if (!this.value) {
        this.classList.remove("has-value");
      } else {
        this.classList.add("has-value");
      }
    });
  });

  var search = document.getElementById("Search-In-Template");
  if (search && search.value.length !== 0) {
    search.classList.add("has-value");
  }
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", theme.init);
} else {
  theme.init();
}

class CountdownTimer extends HTMLElement {
  connectedCallback() {
    if (!this.countdownInitialized) {
      this.countdownInitialized = true;

      const second = 1000,
        minute = second * 60,
        hour = minute * 60,
        day = hour * 24;

      const countDownDate = new Date(this.getAttribute("data-time")).getTime();
      const countdownContainer = document.createElement("div");

      this.appendChild(countdownContainer);

      function updateCountdown() {
        const now = new Date().getTime();
        const distance = countDownDate - now;

        const days = Math.floor(distance / day);
        const hours = Math.floor((distance % day) / hour);
        const minutes = Math.floor((distance % hour) / minute);
        const seconds = Math.floor((distance % minute) / second);

        countdownContainer.innerHTML = `
        <ul class="list--inline or-countdown">
          <li>
          <span class="countdown-time">${days}</span><span class="countdown-text">Days</span> <span class="hide countdown-time-single">D</span>
          </li>
          <li>
          <span class="countdown-time">${hours}</span> <span class="countdown-text">Hours</span> <span class="hide countdown-time-single">H</span>
          </li>
          <li>
          <span class="countdown-time">${minutes}</span> <span class="countdown-text">Mins</span> <span class="hide countdown-time-single">M</span>
          </li>
          <li>
          <span class="countdown-time">${seconds}</span> <span class="countdown-text">Secs</span> <span class="hide countdown-time-single">S</span>
          </li>
          </ul>
        `;

        if (distance > 0) {
        //  requestAnimationFrame(updateCountdown);
        } else {
          countdownContainer.innerHTML = "Countdown Finished!";
        }
      }

      updateCountdown();
    }
  }
}

customElements.define("countdown-timer", CountdownTimer);

class CheckoutButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", this.handleClick.bind(this));
  }

  connectedCallback() {
    this.checkAgreement();
  }

  handleClick(event) {
    const agreeCheckbox = this.querySelector(".checkbox__input");
    const checkoutButton = this.querySelector('a[name="checkout"]');

    if (
      event.target === agreeCheckbox ||
      event.target === this.querySelector(".checkbox__label")
    ) {
      if (agreeCheckbox.checked) {
        checkoutButton.classList.remove("disabled");
      } else {
        checkoutButton.classList.add("disabled");
      }
    }
  }
  checkAgreement() {
    const agreeCheckbox = this.querySelector(".checkbox__input");
    return agreeCheckbox.checked;
  }
}

customElements.define("checkout-button", CheckoutButton);
