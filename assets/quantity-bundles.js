if (!customElements.get("nitro-quantity-bundles")) {
  class NitroQuantityBundles extends HTMLElement {
    connectedCallback() {
      this.init();

      this.form = document.querySelector(`#${this.getAttribute("data-form")}`)
      this.addEventListener("change",this.updateATCPrices.bind(this))
      this.updateATCPrices();

      setTimeout(() => this.updateATCPrices(), 50);
      setTimeout(() => this.updateATCPrices(), 100);
      setTimeout(() => this.updateATCPrices(), 200);
      setTimeout(() => this.updateATCPrices(), 300);

      this.sectionId = this.getAttribute("data-section")

      // (your Array.prototype.equals code unchanged) ...
      if (Array.prototype.equals)
        console.warn(
          "Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code."
        );
      Array.prototype.equals = function (array) {
        if (!array) return false;
        if (array === this) return true;
        if (this.length != array.length) return false;
        for (var i = 0, l = this.length; i < l; i++) {
          if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i])) return false;
          } else if (this[i] != array[i]) {
            return false;
          }
        }
        return true;
      };
      Object.defineProperty(Array.prototype, "equals", { enumerable: false });
    }
    
    parsePriceString(priceString) {
      // 1. Remove non-numeric, non-separator characters (e.g., currency symbols).
      let cleanedString = priceString.replace(/[^0-9.,]/g, '');
      
      // 2. Determine the number format based on separator usage.
      // We can't have both thousand separators and decimal points.
      // A comma followed by two digits at the end is a strong indicator of EU format.
      const isEuropeanFormat = /,\d{2}$/.test(cleanedString);

      // 3. Normalize the string by replacing the decimal separator with a period.
      if (isEuropeanFormat) {
        // If it's an EU format (e.g., "1.234,56"), first remove thousands separators (periods).
        cleanedString = cleanedString.replace(/\./g, '');
        // Then replace the decimal comma with a period.
        cleanedString = cleanedString.replace(/,/g, '.');
      } else {
        // If it's a US format (e.g., "1,234.56"), just remove thousands separators (commas).
        cleanedString = cleanedString.replace(/,/g, '');
      }

      // 4. Parse the normalized string to a floating-point number.
      return parseFloat(cleanedString);
    }

  /*  updateATCPrices(e) {
      try {
        const label = this.querySelector("input:checked + label")
        const price = label.querySelector(".quantity-bundle__price").innerText
        const comparePrice = label.querySelector(".quantity-bundle__compare-price").innerText
  
        const priceEl = this.form.querySelector("[type=submit] .custom_price")
        const comparePriceEl = this.form.querySelector("[type=submit] .compare_price")
    
        priceEl.innerHTML = price
        label.querySelector(".quantity-bundle__compare-price").hasAttribute("hidden") ? comparePriceEl.innerHTML = "" : comparePriceEl.innerHTML = comparePrice;
  
        document.querySelector(`#ProductPrice-${this.sectionId}`).innerHTML = price
        label.querySelector(".quantity-bundle__compare-price").hasAttribute("hidden") ? document.querySelector(`#ComparePrice-${this.sectionId}`).innerHTML = "" : document.querySelector(`#ComparePrice-${this.sectionId}`).innerHTML = comparePrice;  
        
        const numberPrice = this.parsePriceString(price)
        const numberComparePrice = this.parsePriceString(comparePrice)
        
        const savePercentage = Math.floor(((numberComparePrice - numberPrice) / numberComparePrice) * 100)
        document.querySelector(".product-tag-sale-number").innerHTML = savePercentage + "%"
        
      } catch (error) {
        console.log(error)
      }
    }*/
    updateATCPrices(e) {
      try {
        const label = this.querySelector("input:checked + label");
        const price = label.querySelector(".quantity-bundle__price").innerText;
        const comparePriceEl_Source = label.querySelector(".quantity-bundle__compare-price");
        const comparePrice = comparePriceEl_Source.innerText;

        // 1. Update Button Prices
        const btnPriceEl = this.form.querySelector("[type=submit] .custom_price");
        const btnComparePriceEl = this.form.querySelector("[type=submit] .compare_price");

        if (btnPriceEl && btnComparePriceEl) {
          btnPriceEl.innerHTML = price;
          btnComparePriceEl.innerHTML = comparePriceEl_Source.hasAttribute("hidden") ? "" : comparePrice;
        }

        // 2. Update Product Meta Prices (The section you requested)
        const mainPriceEl = document.querySelector(`#ProductPrice-${this.sectionId}`);
        const mainComparePriceEl = document.querySelector(`#ComparePrice-${this.sectionId}`);
        const saleTag = document.querySelector(".product-tag-sale");
        const saleNumber = document.querySelector(".product-tag-sale-number");

        if (mainPriceEl) mainPriceEl.innerHTML = price;

        if (mainComparePriceEl) {
          if (comparePriceEl_Source.hasAttribute("hidden") || !comparePrice) {
            // Hide compare price and sale tag if no discount
            mainComparePriceEl.parentElement.style.display = "none";
            if (saleTag) saleTag.classList.add("hide");
          } else {
            // Show compare price and calculate percentage
            mainComparePriceEl.innerHTML = comparePrice;
            mainComparePriceEl.parentElement.style.display = "inline-block";
            
            if (saleTag) {
              saleTag.classList.remove("hide");
              const numberPrice = this.parsePriceString(price);
              const numberComparePrice = this.parsePriceString(comparePrice);
              const savePercentage = Math.floor(((numberComparePrice - numberPrice) / numberComparePrice) * 100);
              if (saleNumber) saleNumber.innerHTML = savePercentage + "%";
            }
          }
        }

      } catch (error) {
        console.error("Price update failed:", error);
      }
    }

    async handleFormSubmit(e) {
      e.preventDefault();
      const quantity = parseFloat(
        this.querySelector("input[name='bundle_quantity']:checked").value
      );

      if (quantity != 1) e.stopImmediatePropagation();

      const variantSelectors = this.querySelectorAll(
        "input:checked + label nitro-variant-selects"
      );

      let selectedVariants = Array.from(variantSelectors)
        .map((variantSelector) => {
          const selectedOptions = Array.from(
            variantSelector.querySelectorAll("select")
          ).map((select) => select.value);

          const selectedVariant = this.productJson.variants.find((variant) =>
            variant.options.equals(selectedOptions)
          );

          return selectedVariant;
        })
        .filter((variant) => variant && variant.available);
      console.log("selectedVariants", selectedVariants);

      this.form
        .querySelector("button[type='submit']")
        .classList.add("is-loading");

      await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedVariants.map((variant) => ({
            quantity: 1,
            id: variant.id,
          })),
        }),
      });
      this.form
        .querySelector("button[type='submit']")
        .classList.remove("is-loading");

      theme.miniCart.updateElements();
      theme.miniCart.generateCart();
    }

    init() {
      this.sectionId = this.dataset.section;
      this.formId = this.dataset.form;

      this.productJson = JSON.parse(
        document.querySelector('[id^="ProductJson-"]').innerHTML
      );

      this.form = document.querySelector(`#${this.formId}`);

      this.form.addEventListener(
        "submit",
        this.handleFormSubmit.bind(this),
        true
      );
    }
  }

  customElements.define("nitro-quantity-bundles", NitroQuantityBundles);
}
