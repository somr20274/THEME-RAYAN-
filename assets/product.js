/* ========================================================================
   INFORMATIONS GÉNÉRALES SUR LE SITE
   Propriété de © 2019/2024 Shopiweb.fr
   Pour plus d'informations, visitez : https://www.shopiweb.fr
   ======================================================================== */

/* =====================
   Formulaire (ATC) basé sur la variante
   ===================== */
window.handleAtcFormVariantClick = async (btn, event) => {
  const form = btn.closest("form");
  form.querySelector('[name="id"]').value = btn.dataset.variantId;

  window.handleAddToCartFormSubmit(form, event);
};

/* =====================
   Formulaire principal d'ajout au panier (ATC)
   ===================== */
window.handleAddToCartFormSubmit = async (form, event) => {
  event.preventDefault();

  const btn = form.querySelector(".btn-atc");

  btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;

  form.classList.add("loading");

  const response = await fetch("/cart/add.js", {
    method: "POST",
    body: new FormData(form),
  });

  form.classList.remove("loading");
  btn.innerHTML = window.theme.product.addedToCart;

  setTimeout(() => {
    btn.innerHTML = btn.dataset.textAddToCart;
  }, 2000);

  window.updateCartContents(response);

  if (form.hasAttribute("data-shopiweb-upsell-modal")) return;
  if (btn.closest(".modal")) return;

  if (document.querySelector("#offcanvas-cart")) {
    bootstrap.Offcanvas.getOrCreateInstance("#offcanvas-cart").show();
  }
};

/* =====================
   Mise à jour de divers éléments en cas de changement de variante nécessitant une nouvelle recherche de documents
   ===================== */
window.addEventListener("variantChange.shopiweb.product", async (event) => {
  const inventoryBar = document.querySelector("#inventory-bar");

  if (inventoryBar) {
    inventoryBar.style.opacity = ".25";
  }

  const respoonse = await fetch(window.location.href);
  const text = await respoonse.text();
  const newDocument = new DOMParser().parseFromString(text, "text/html");

  document
    .querySelector("#inventory-bar")
    ?.replaceWith(newDocument.querySelector("#inventory-bar"));
  document
    .querySelector("#product-qty-breaks")
    ?.replaceWith(newDocument.querySelector("#product-qty-breaks"));

  document
    .querySelector("#product-qty-bundle")
    ?.replaceWith(newDocument.querySelector("#product-qty-bundle"));

  document
    .querySelector("#product-store-availability-wrapper")
    ?.replaceWith(
      newDocument.querySelector("#product-store-availability-wrapper")
    );

  if (document.querySelector('.page-type-product')) {
      document.querySelector('.product-variant-selector')
          ?.replaceWith(newDocument.querySelector('.product-variant-selector'))
  }

  initializeInventoryBar();
  initializeQantityBreaks();

  document.querySelectorAll('[role="tooltip"]').forEach((el) => el.remove());

  document
    .querySelectorAll('.product-options [data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el));
});

/* =====================
   Options d'achat (plans de vente/abonnement)
   ===================== */
const initializePurchaseOptions = () => {
  const wrapper = document.querySelector("#purchase-options-product");

  if (!wrapper) return;

  wrapper.querySelectorAll('[name="purchase_option"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (input.id === "purchase-options-one-time") {
        wrapper
          .querySelector("#purchase-delivery-options")
          .setAttribute("hidden", "hidden");
        wrapper.querySelector('[name="selling_plan"]').disabled = true;

        if (input.closest("#product-template")) {
          const url = new URL(window.location);
          url.searchParams.delete("selling_plan");
          window.history.replaceState({}, "", url);
        }
        const btnAtcPrice = input.closest('form').querySelector('.btn-atc-price')

        if (btnAtcPrice) {
            btnAtcPrice.textContent = Shopify.formatMoney(input.dataset.price)
        }
      } else {
        wrapper
          .querySelector("#purchase-delivery-options")
          .removeAttribute("hidden");
        wrapper.querySelector('[name="selling_plan"]').disabled = false;

        if (input.closest("#product-template")) {
          const url = new URL(window.location);
          url.searchParams.set(
            "variant",
            wrapper.closest(".product-content").querySelector('[name="id"]')
              .value
          );
          url.searchParams.set(
            "selling_plan",
            wrapper.querySelector('[name="selling_plan"]').value
          );
          window.history.replaceState({}, "", url);
        }

        const btnAtcPrice = input.closest('form').querySelector('.btn-atc-price')

        if (btnAtcPrice) {
            btnAtcPrice.textContent = Shopify.formatMoney(input.dataset.price)
        }
      }
    });
  });

  const selectDeliverEvery = wrapper.querySelector(
    "#options-select-purchase-delivery"
  );

  if (selectDeliverEvery) {
    selectDeliverEvery.addEventListener("change", () => {
      if (selectDeliverEvery.closest("#product-template")) {
        const url = new URL(window.location);
        url.searchParams.set(
          "selling_plan",
          wrapper.querySelector('[name="selling_plan"]').value
        );
        window.history.replaceState({}, "", url);
      }
    });
  }

  if (wrapper.dataset.subSelectedFirst === "true") {
    wrapper.querySelector("input#purchase-options-subscription").checked = true;
    wrapper
      .querySelector("input#purchase-options-subscription")
      .dispatchEvent(new Event("change"));
  }
};
initializePurchaseOptions();

/* =====================
   Sélecteur d'options de produits - Écouter les événements de changement
   ===================== */
window.handleProductOptionChange = async (input) => {
  const selectedOptions = [];

  input
    .closest("form")
    .querySelectorAll(".product-option")
    .forEach((elem) => {
      if (elem.type === "radio") {
        if (elem.checked) {
          selectedOptions.push(elem.value);
        }
      } else {
        selectedOptions.push(elem.value);
      }
    });

  const variantSelected = window.productVariants.find(
    (variant) =>
      JSON.stringify(variant.options) === JSON.stringify(selectedOptions)
  );

  console.log(variantSelected);

  const btn = input.closest("form").querySelector(".btn-atc");

  if (variantSelected) {
    input.closest("form").querySelector('[name="id"]').value =
      variantSelected.id;

    if (variantSelected.available) {
      btn.disabled = false;
      btn.querySelector('.btn-atc-text').textContent = window.theme.product.addToCart
    } else {
      btn.disabled = true;
      btn.querySelector('.btn-atc-text').textContent = window.theme.product.soldOut
    }

    if (variantSelected.compare_at_price > variantSelected.price) {
      input
        .closest(".product-content")
        .querySelector(".product-price").innerHTML = `
                  <span class="product-price-final me-3">
                      <span class="visually-hidden">
                          ${window.theme.product.priceSale} &nbsp;
                      </span>
                      ${Shopify.formatMoney(variantSelected.price)}
                  </span>
                  <span class="product-price-compare text-muted">
                      <span class="visually-hidden">
                          ${window.theme.product.priceFrom} &nbsp;
                      </span>
                      <s>
                          ${Shopify.formatMoney(
                            variantSelected.compare_at_price
                          )}
                      </s>
                  </span>
              `;
    } else {
      input
        .closest(".product-content")
        .querySelector(".product-price").innerHTML = `
                  <span class="product-price-final">
                      ${Shopify.formatMoney(variantSelected.price)}
                  </span>
              `;
    }
    if (variantSelected.available && variantSelected.compare_at_price) {
      input
        .closest(".product-content")
        .querySelector(".product-price")
        .insertAdjacentHTML(
          "beforeend",
          `
                  <span class="price-badge-sale badge">
                      ${window.theme.product.save}: ${Math.round(
            (1 - variantSelected.price / variantSelected.compare_at_price) * 100
          )}%
                  </span>    
              `
        );
    } else if (!variantSelected.available) {
      input
        .closest(".product-content")
        .querySelector(".product-price")
        .insertAdjacentHTML(
          "beforeend",
          `
                  <span class="price-badge-sold-out badge">
                      ${window.theme.product.soldOut}
                  </span>
              `
        );
    }

    const purchaseOptionsWrapper = document.querySelector(
      "#purchase-options-product"
    );

    if (purchaseOptionsWrapper) {
      purchaseOptionsWrapper.querySelector(
        "input#purchase-options-one-time + label [data-price]"
      ).textContent = Shopify.formatMoney(variantSelected.price);
      purchaseOptionsWrapper.querySelector(
        "input#purchase-options-subscription + label [data-price]"
      ).textContent = Shopify.formatMoney(
        variantSelected.selling_plan_allocations[0].price
      );
    }

    const skuWrapper = input
      .closest(".product-content")
      .querySelector(".current-variant-sku");

    if (skuWrapper) {
      if (variantSelected.sku.length) {
        skuWrapper.textContent = variantSelected.sku;
        skuWrapper.removeAttribute("hidden");
      } else {
        skuWrapper.setAttribute("hidden", "hidden");
      }
    }

    if (input.closest("#product-template")) {
      const url = new URL(window.location);
      url.searchParams.set("variant", variantSelected.id);
      window.history.replaceState({}, "", url);
    }

    if (btn.querySelector('.btn-atc-price')) {
        btn.querySelector('.btn-atc-price').textContent = Shopify.formatMoney(variantSelected.price)
    }

    const customEvent = new CustomEvent("variantChange.shopiweb.product", {
      detail: variantSelected,
    });
    window.dispatchEvent(customEvent);
  } else {
    btn.disabled = true;
    btn.querySelector('.btn-atc-text').textContent = window.theme.product.unavailable
  }

  if (input.closest(".color-swatches")) {
    input
      .closest(".product-option-wrapper")
      .querySelector(".color-swatches-title span").textContent = input.value;
  }

  if (input.closest(".size-buttons")) {
    input
      .closest(".product-option-wrapper")
      .querySelector(".size-buttons-title span").textContent = input.value;
  }
};

/* =====================
   Article - Changement de la variante
   ===================== */
window.handleProductItemVariantChange = (select, event) => {
  if (select.options[select.selectedIndex].dataset.variantImage?.length) {
    select.closest(".product-item").querySelector(".product-item-img").src =
      select.options[select.selectedIndex].dataset.variantImage;
  }

  const compareAtPrice =
    select.options[select.selectedIndex].dataset.compareAtPrice;
  const price = select.options[select.selectedIndex].dataset.price;

  if (compareAtPrice.length) {
    select
      .closest(".product-item")
      .querySelector(".product-item-price").innerHTML = `
            <span class="product-item-price-final me-1">
                <span class="visually-hidden">
                    ${window.theme.product.priceSale} &nbsp;
                </span>
                ${Shopify.formatMoney(price)}
            </span>
            <span class="product-item-price-compare text-muted">
                <span class="visually-hidden">
                    ${window.theme.product.priceFrom} &nbsp;
                </span>
                <s>
                    ${Shopify.formatMoney(compareAtPrice)}
                </s>
            </span>
        `;
  } else {
    select
      .closest(".product-item")
      .querySelector(".product-item-price").innerHTML = `
            <span class="product-item-price-final">
                ${Shopify.formatMoney(price)}
            </span>
        `;
  }
};

/* =====================
   Bouton (Acheter maintenant)
   ===================== */
window.handleBuyButtonClick = (btn) => {
  btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;
  const form = btn.closest("form");
  const variantId = form.querySelector('[name="id"]').value;
  const qty = Number(form.querySelector('input[name="quantity"]')?.value || 1);
  window.location.href = `/cart/${variantId}:${qty}`;
};

/* =====================
   Galerie de produits
   ===================== */
const initializeProductGallery = () => {
  document
    .querySelectorAll(".product-gallery:not(.init)")
    .forEach((gallery) => {
      gallery.classList.add("init");

      const main = new Splide(gallery.querySelector(".main-splide"), {
        start: Number(gallery.dataset.start),
        rewind: true,
        arrows: Number(gallery.dataset.mediaCount > 1) && gallery.dataset.arrows === 'main-slider',
        rewindByDrag: true,
        pagination: false,
        noDrag: "model-viewer",
        mediaQuery: "min",
        breakpoints: {
          0: {
            padding: {
              right: gallery.dataset.showThumbsMobile === "false" ? "4rem" : 0,
            },
          },
          992: { padding: 0 },
        },
        direction: document.documentElement.getAttribute("dir"),
      });

      const totalSlides = gallery.querySelectorAll(
        ".main-splide .splide__slide"
      ).length;

      const thumbs = new Splide(gallery.querySelector(".thumbs-splide"), {
        start: Number(gallery.dataset.start),
        arrows: Number(gallery.dataset.mediaCount > 3) && gallery.dataset.arrows === 'thumbs-slider',
        gap: ".5rem",
        rewind: true,
        rewindByDrag: true,
        pagination: false,
        isNavigation: true,
        focus: totalSlides > 5 ? "center" : 0,
        mediaQuery: "min",
        breakpoints: {
          0: { perPage: 5 },
          576: { perPage: 5 },
          768: { perPage: 5 },
          992: { perPage: 5 },
          1200: { perPage: 5 },
          1400: { perPage: 5 },
        },
        direction: document.documentElement.getAttribute("dir"),
      });

      main.on("move", (newIndex, prevIndex) => {
        const prevSlide = gallery.querySelector(`.splide__slide:nth-child(${prevIndex + 1})`);
        const currentSlide = gallery.querySelector(`.splide__slide:nth-child(${newIndex + 1})`);
      
        if (prevSlide) {
          const iframe = prevSlide.querySelector("iframe");
          const video = prevSlide.querySelector("video");
          if (iframe) iframe.src = iframe.src;
          if (video) video.pause();
        }
      
        const autoplay = gallery.dataset.autoplayVideo === "true";
      
        if (currentSlide && autoplay) {
          const video = currentSlide.querySelector("video");
          if (video) {
            video.play().catch((e) => {
              console.warn("Lecture automatique bloquée :", e);
            });
          }
        }
      });

      window.addEventListener(
        "variantChange.shopiweb.product",
        (event) => {
          const variantSelected = event.detail;

          if (variantSelected.featured_media) {
            main.go(variantSelected.featured_media.position - 1);
          }
        },
        false
      );

      main.sync(thumbs);
      main.mount();
      thumbs.mount();

      if (window.matchMedia("(min-width: 992px)").matches) {
        const navbarHeight =
          document.querySelector('[id*="__navbar"].sticky-top')?.clientHeight ||
          0;
        const announcementBarHeight =
          document.querySelector('[id*="__announcement-bar"].sticky-top')
            ?.clientHeight || 0;

        const galleryWrapper = gallery.closest(".product-gallery-wrapper");
        if (!galleryWrapper) return;
        galleryWrapper.style.position = "sticky";
        galleryWrapper.style.top = `${
          navbarHeight + announcementBarHeight + 20
        }px`;
        galleryWrapper.style.zIndex = "1";
      }

      if (window.GLightbox) {
        // eslint-disable-next-line no-unused-vars
        const lightbox = GLightbox({
          selector: `[data-gallery="product-gallery-${gallery.dataset.productId}"]`,
          videosWidth: "1290px",
          loop: true,
        });
        lightbox.on("open", () => {
          gallery.querySelectorAll("video").forEach((video) => {
            video.pause();
          });
        });
        lightbox.on("slide_changed", ({ prev, current }) => {
          main.go(current.index);
        });
      }

      const modelViewer = gallery.querySelector("model-viewer");

      if (modelViewer) {
        const increaseBtn = gallery.querySelector(
          "[data-model-3d-increase-zoom]"
        );
        const decreaseBtn = gallery.querySelector(
          "[data-model-3d-decrease-zoom]"
        );
        const fullscreenBtn = gallery.querySelector(
          "[data-model-3d-fullscreen]"
        );

        increaseBtn.addEventListener("click", () => {
          modelViewer.zoom(1);
        });

        decreaseBtn.addEventListener("click", () => {
          modelViewer.zoom(-1);
        });

        fullscreenBtn.addEventListener("click", () => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
            fullscreenBtn
              .querySelector(".bi-fullscreen")
              .removeAttribute("hidden");
            fullscreenBtn
              .querySelector(".bi-fullscreen-exit")
              .setAttribute("hidden", "hidden");
          } else {
            modelViewer
              .closest(".product-gallery-model-3d")
              .requestFullscreen();
            fullscreenBtn
              .querySelector(".bi-fullscreen")
              .setAttribute("hidden", "hidden");
            fullscreenBtn
              .querySelector(".bi-fullscreen-exit")
              .removeAttribute("hidden");
          }
        });
      }
    });
};
initializeProductGallery();

// Ajout du script pour gérer le texte rotatif séparément
const initializeSpinningText = () => {
  const textElement = document.querySelector('.spinning-text p');
  if (textElement && textElement.textContent.trim() !== "") {
    const chars = textElement.textContent.split('');
    // Remplacer le texte par des spans individuels avec transformation
    textElement.innerHTML = chars.map((char, i) => {
      return `<span style="transform: rotate(${i * 360 / chars.length}deg) translateY(-30px);">${char}</span>`;
    }).join('');
  }
};

// Appel du script au chargement de la section Shopify et de la page
document.addEventListener("DOMContentLoaded", initializeSpinningText);
document.addEventListener("shopify:section:load", initializeSpinningText);
document.addEventListener("shopify:section:load", (e) => {
  if (e.target.querySelector(".product-gallery")) {
    initializeProductGallery();
  }
});

window.addEventListener(
  "updated.shopiweb.collection",
  initializeProductGallery
);

/* =====================
   Barre d'inventaire
   ===================== */
const initializeInventoryBar = () => {
  const wrapper = document.querySelector("#inventory-bar");

  if (!wrapper) return;

  const progressBar = wrapper.querySelector(".progress-bar");

  setTimeout(() => {
    progressBar.style.width = progressBar.dataset.width;
  }, 250);
};
initializeInventoryBar();

document.addEventListener("shopify:section:load", (e) => {
  if (e.target.querySelector("#inventory-bar")) {
    initializeInventoryBar();
  }
});

/* =====================
   Upsell modal
   ===================== */
const initializeUpsellModal = () => {
  const modal = document.querySelector("#modal-upsell-product");
  if (!modal) return;

  const form = document.querySelector(
    '#product-content form[onsubmit*="handleAddToCartFormSubmit"]'
  );
  if (!form) return;

  form.setAttribute("data-shopiweb-upsell-modal", "true");

  form.addEventListener("submit", (e) => {
    const modal = bootstrap.Modal.getOrCreateInstance("#modal-upsell-product");
    modal.show();
  });

  document.querySelectorAll("#modal-upsell-product .btn-atc").forEach((btn) => {
    btn.addEventListener("click", () => {
      const footerBtn = document.querySelector(
        "#modal-upsell-product .modal-footer .btn"
      );
      footerBtn.classList.remove(footerBtn.dataset.defaultClass);
      footerBtn.classList.add(footerBtn.dataset.activeClass);
    });
  });

  modal.addEventListener("hidden.bs.modal", () => {
    if (document.querySelector("#offcanvas-cart")) {
      const offcanvasCart =
        bootstrap.Offcanvas.getOrCreateInstance("#offcanvas-cart");
      offcanvasCart.show();
    }
  });
};
initializeUpsellModal();

document.addEventListener("shopify:section:load", (e) => {
  if (e.target.querySelector("#modal-upsell-product")) {
    initializeUpsellModal();
  }
});

/* =====================
   Achetés ensemble
   ===================== */
const initializeBoughtTogether = () => {
  if (!document.querySelector("#bought-product-together")) return;

  const setTotalPrice = () => {
    let totalCompareAtPrice = 0;
    let totalPrice = 0;

    document
      .querySelectorAll("#bought-product-together .product-item-price")
      .forEach((elem) => {
        if (
          elem
            .closest(".product-item")
            .querySelector(".check-bought-together:checked")
        ) {
          totalCompareAtPrice += elem.dataset.compareAtPrice.length
            ? Number(elem.dataset.compareAtPrice)
            : Number(elem.dataset.price);
          totalPrice += Number(elem.dataset.price);
        }
      });

    const totalElem = document.querySelector("#bought-together-total");

    if (totalCompareAtPrice > totalPrice) {
      totalElem.innerHTML = `
                ${totalElem.dataset.textTotalPrice}: 
                <span class="bought-together-total-price text-success me-2">
                    <span class="visually-hidden">
                        ${window.theme.product.priceSale} &nbsp;
                    </span>
                    ${Shopify.formatMoney(totalPrice)}
                </span>
                <span class="bought-together-total-compare-price text-muted">
                    <span class="visually-hidden">
                        ${window.theme.product.priceFrom} &nbsp;
                    </span>
                    <s>
                        ${Shopify.formatMoney(totalCompareAtPrice)}
                    </s>
                </span>
            `;
    } else {
      totalElem.innerHTML = `
                ${totalElem.dataset.textTotalPrice}: 
                <span class="bought-together-total-price">
                    ${Shopify.formatMoney(totalPrice)}
                </span>
            `;
    }
  };

  document.querySelectorAll(".check-bought-together").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        checkbox.closest(".product-item").style.opacity = "1";
      } else {
        checkbox.closest(".product-item").style.opacity = ".5";
      }

      if (document.querySelector(".check-bought-together:checked")) {
        document.querySelector("#add-to-cart-bought-together").disabled = false;
      } else {
        document.querySelector("#add-to-cart-bought-together").disabled = true;
      }

      setTotalPrice();
    });
  });

  document
    .querySelectorAll('#bought-product-together select[name="id"]')
    .forEach((select) => {
      select.addEventListener("change", () => {
        const compareAtPrice =
          select.options[select.selectedIndex].dataset.compareAtPrice;
        const price = select.options[select.selectedIndex].dataset.price;

        select
          .closest(".product-item")
          .querySelector(".product-item-price")
          .setAttribute("data-compare-at-price", compareAtPrice);
        select
          .closest(".product-item")
          .querySelector(".product-item-price")
          .setAttribute("data-price", price);

        setTotalPrice();
      });
    });

  document
    .querySelector("#add-to-cart-bought-together")
    .addEventListener("click", async (e) => {
      const btn = e.target;

      btn.style.width = btn.clientWidth + 4 + "px";
      btn.innerHTML = `
            <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;

      const items = [];

      document
        .querySelectorAll("#bought-product-together .product-item")
        .forEach((elem) => {
          if (elem.querySelector(".check-bought-together:checked")) {
            items.push({
              id: Number(elem.querySelector('[name="id"]').value),
              quantity: 1,
            });
          }
        });

      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      btn.innerHTML = window.theme.product.addedToCart;

      setTimeout(() => {
        btn.innerHTML = btn.dataset.textAddToCart;
      }, 2000);

      window.updateCartContents(response);

      bootstrap.Offcanvas.getOrCreateInstance("#offcanvas-cart").show();
    });
};
initializeBoughtTogether();

/* =====================
   Produits précédents/suivants (ne s'affiche que si le produit fait partie d'une collection)
   ===================== */
const inititializeButtonsPrevNext = async () => {
  const wrapper = document.querySelector("#product-prev-next");

  if (!wrapper) return;

  if (!window.matchMedia("(max-width: 1599px)").matches) return;

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const threshold =
    document
      .querySelector('.product-content form[action*="/cart/add"]')
      .getBoundingClientRect().bottom + window.scrollY;

  window.addEventListener("scroll", () => {
    if (window.scrollY > threshold) {
      wrapper.classList.add("show");
    } else {
      wrapper.classList.remove("show");
    }
  });
};
inititializeButtonsPrevNext();

/* =====================
   Pack quantité (Qty Breaks)
   ===================== */
const initializeQantityBreaks = () => {
  document.querySelectorAll('[name="product-qty-breaks"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const qty = Number(radio.dataset.qty);

      const qtyField = radio.closest("form").querySelector('[name="quantity"]');
      const form = radio.closest("form");
      const btn = form.querySelector('button[name="add"]');

      if (!qtyField) return;

      qtyField.value = qty;
      qtyField.dispatchEvent(new Event("change"));

      setTimeout(() => {
        btn.classList.add("animate__animated", "animate__shakeX");
      }, 250);

      setTimeout(() => {
        btn.classList.remove("animate__animated", "animate__shakeX");
      }, 1500);

      if (form.querySelector('.btn-atc-price')) {
        form.querySelector('.btn-atc-price').textContent = radio.dataset.price
      }

      document.querySelectorAll('[name="product-qty-breaks"]').forEach(radio => {
        radio.closest('.form-check').classList.remove('form-check-is-checked')
      })

      radio.closest('.form-check').classList.add('form-check-is-checked')
    });
  });
  document.querySelectorAll('[name="product-qty-breaks"]').forEach(radio => {
    const formCheck = radio.closest('.form-check');
    if (!formCheck) return; // Vérification si .form-check est introuvable
  
    const label = formCheck.querySelector('label');
    if (!label) return; // Vérification si label est introuvable
  
    label.addEventListener('click', () => {
      if (formCheck.classList.contains('form-check-is-checked')) {
        formCheck.classList.remove('form-check-is-checked');
  
        setTimeout(() => {
          document.querySelectorAll('[name="product-qty-breaks"]').forEach(radio => {
            radio.checked = false;
          });
  
          const qtyField = radio.closest('form').querySelector('[name="quantity"]');
          qtyField.value = '1';
  
          const form = radio.closest('form');
          const qtyBreaksList = radio.closest('#product-qty-breaks-list');
  
          if (form.querySelector('.btn-atc-price')) {
            form.querySelector('.btn-atc-price').textContent = qtyBreaksList.dataset.currentVariantPrice;
          }
        }, 100);
      }
    });
  });
};
initializeQantityBreaks();

/* =====================
   Pack quantité avec variantes (Qty Breaks Variants)
   ===================== */

// Gère l'affichage du bundle sélectionné (type ShopiBundle)
function toggleBundle(header) {
  document.querySelectorAll('.shopibundle-box').forEach(el => {
    el.classList.remove('active');
    el.querySelector('.accordion-collapse').classList.remove('show');
  });
  const box = header.closest('.shopibundle-box');
  box.classList.add('active');
  box.querySelector('.accordion-collapse').classList.add('show');

  // ✅ Met à jour le prix dans le bouton ATC selon l'option
  const btn = document.querySelector('.btn-atc-bundle');
  const price = box.dataset.finalPrice;
  const defaultText = btn.dataset.textAddToCart || 'Ajouter au panier';
  const showPrice = btn.dataset.showPrice === 'true';

  if (btn) {
    if (showPrice && price) {
      btn.innerHTML = `${defaultText} – <span class="btn-atc-price">${price}</span>`;
    } else {
      btn.innerHTML = defaultText;
    }
  }
}

// Ajoute le bundle sélectionné au panier (fonction native thème)
function submitSelectedBundle(event) {
  const btn = event?.currentTarget;
  if (btn) btn.disabled = true;

  const box = document.querySelector('.shopibundle-box.active');
  if (!box) {
    if (btn) btn.disabled = false;
    return alert("Veuillez sélectionner une offre.");
  }

  const selects = box.querySelectorAll('.bundle-variant-select');
  const variantCount = {};
  let valid = true;
  const bundleVariantIds = [];

  selects.forEach(sel => {
    const variantId = parseInt(sel.value);
    if (!variantId || isNaN(variantId)) {
      valid = false;
      return;
    }
    variantCount[variantId] = (variantCount[variantId] || 0) + 1;
    bundleVariantIds.push(variantId); // Ajoute chaque variante sélectionnée à la liste
  });

  // Ajout du cadeau si présent
  const giftVariantId = box.getAttribute('data-gift-variant-id');
  if (giftVariantId && !isNaN(parseInt(giftVariantId))) {
    variantCount[parseInt(giftVariantId)] = 1;
  }

  // Met à jour le data-attribute bundle pour le script panier
  const bundleData = document.getElementById('shopibundle-bundle-data');
  if (bundleData) {
    bundleData.dataset.bundleVariantIds = JSON.stringify(bundleVariantIds);
    bundleData.dataset.giftVariantId = giftVariantId || "";
  }

  if (!valid || Object.keys(variantCount).length === 0) {
    if (btn) btn.disabled = false;
    return alert("Veuillez sélectionner toutes les variantes.");
  }

  const items = Object.entries(variantCount).map(([id, qty], i) => {
    const item = {
      id: parseInt(id),
      quantity: qty
    };
    if (i === 0) {
      item.properties = {
        _shopibundle: JSON.stringify(bundleVariantIds),
        _shopibundle_gift: giftVariantId || ""
      };
    }
    return item;
  });

  fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  })
    .then(response => {
      if (document.querySelector("#offcanvas-cart")) {
        bootstrap.Offcanvas.getOrCreateInstance("#offcanvas-cart").show();
      }
      if (typeof window.updateCartContents === "function") {
        window.updateCartContents(response);
      }
      window.dispatchEvent(new CustomEvent("updated.shopiweb.cart"));
      if (btn) btn.disabled = false;
    })
    .catch(error => {
      if (btn) btn.disabled = false;
      alert("Erreur : " + error.message);
    });
}

// Initialisation globale à appeler au chargement ET au section reload Shopify
function initializeBundleWithVariants() {
  // Accordéon ShopiBundle : active la sélection de pack
  document.querySelectorAll('.shopibundle-header').forEach(header => {
    header.onclick = () => toggleBundle(header);
  });

  // Gestion dynamique des selects et images thumbnails (bundle avec variantes)
  document.querySelectorAll('.accordion-body').forEach(body => {
    const selects = body.querySelectorAll('.bundle-variant-select');
    const thumbs = body.querySelectorAll('.variant-thumbnail');
    selects.forEach((select, index) => {
      select.onchange = () => {
        const option = select.options[select.selectedIndex];
        const url = option?.dataset.image;
        if (url && thumbs[index]) {
          thumbs[index].src = url;
        }
      };
      // Mise à jour immédiate sur chargement (default)
      const option = select.options[select.selectedIndex];
      const url = option?.dataset.image;
      if (url && thumbs[index]) {
        thumbs[index].src = url;
      }
    });
  });

  // Listener bouton d’ajout bundle
  document.querySelectorAll('.btn-atc-bundle').forEach(btn => {
    btn.onclick = submitSelectedBundle;
  });

  // ✅ Ajout du prix initial dans le bouton ATC
  const activeBox = document.querySelector('.shopibundle-box.active');
  const btn = document.querySelector('.btn-atc-bundle');
  if (activeBox && btn) {
    const price = activeBox.dataset.finalPrice;
    const defaultText = btn.dataset.textAddToCart || 'Ajouter au panier';
    const showPrice = btn.dataset.showPrice === 'true';
  
    if (showPrice && price) {
      btn.innerHTML = `${defaultText} – <span class="btn-atc-price">${price}</span>`;
    } else {
      btn.innerHTML = defaultText;
    }
  }
}

// On bind l'init au chargement ET à chaque rechargement de section Shopify
document.addEventListener("DOMContentLoaded", initializeBundleWithVariants);
document.addEventListener("shopify:section:load", initializeBundleWithVariants);


/* =====================
   Personnalisation (propriétés personnalisées)
   ===================== */
const initializePersonalization = () => {
  document
    .querySelectorAll('.product-personalization-field[data-type="checkbox"]')
    .forEach((elem) => {
      let values = [];

      elem.querySelectorAll("input").forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            values.push(checkbox.value);
          } else {
            values = values.filter((item) => item !== checkbox.value);
          }

          elem.querySelector('[type="hidden"]').value = values.join(", ");
        });
      });
    });
};
initializePersonalization();

/* =====================
   Synchroniser la quantité entre la fiche produit, Sticky ATC, etc.
   ===================== */
const initializeSyncQty = () => {
  const productFormQtyInput = document.querySelector(
    '.product-buy-buttons input[name="quantity"]'
  );

  if (!productFormQtyInput) return;

  productFormQtyInput.addEventListener("change", () => {
    const stickyAtcQtyInput = document.querySelector(
      '#sticky-atc input[name="quantity"]'
    );

    if (!stickyAtcQtyInput) return;

    stickyAtcQtyInput.value = productFormQtyInput.value;
  });
};
initializeSyncQty();

/* =====================
   Offre limitée, Visiteurs en direct, Livraison estimée
   ===================== */
const initializeLimitedOffer = () => {
  const blocks = document.querySelectorAll(
    "#product-limited-offer, #product-live-visitors, #product-estimated-delivery"
  );

  if (!blocks.length) return;

  blocks.forEach((block) => {
    const icon = block.querySelector(".block-icon");

    setInterval(() => {
      icon.classList.add("animate__animated", "animate__tada");

      setTimeout(() => {
        icon.classList.remove("animate__animated", "animate__tada");
      }, 1500);
    }, 3000);
  });
};

initializeLimitedOffer();

/* =====================
   Bloc produit Témoignages
   ===================== */
//Injecté dans product-block-testimonials.liquid

/* =====================
   Estimation livraison Shopiweb
   ===================== */
const initializeEstimatedDelivery = () => {
  const container = document.querySelector("#product-estimated-delivery");
  if (!container) return;

  const startDays = parseInt(container.dataset.startDays || "3");
  const endDays = parseInt(container.dataset.endDays || "6");
  const lang = container.dataset.lang === "fr" ? "fr-FR" : "en-US";
  const color = container.dataset.color || "#000";
  const excludeSundays = container.dataset.excludeSundays === "true";
  const msg = container.dataset.message || (lang === "fr-FR"
    ? "Livraison estimée entre le"
    : "Estimated delivery between");

  const addDaysSmart = (baseDate, days, excludeSunday) => {
    const result = new Date(baseDate);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      if (!excludeSunday || result.getDay() !== 0) {
        added++;
      }
    }
    return result;
  };

  const today = new Date();
  const startDate = addDaysSmart(today, startDays, excludeSundays);
  const endDate = addDaysSmart(today, endDays, excludeSundays);

  const options = { weekday: "long", day: "numeric", month: "long" };
  const startStr = startDate.toLocaleDateString(lang, options);
  const endStr = endDate.toLocaleDateString(lang, options);
  const connector = lang === "fr-FR" ? "et" : "and";

  container.querySelector(".delivery-message").innerHTML = `
    ${msg} <span style="color:${color}; font-weight:bold;">${startStr}</span> ${connector} <span style="color:${color}; font-weight:bold;">${endStr}</span>.
  `;
};

initializeEstimatedDelivery();

document.addEventListener("shopify:section:load", (e) => {
  if (e.target.querySelector("#product-estimated-delivery")) {
    initializeEstimatedDelivery();
  }
});

/* =====================
   Bloc produit score progression
   ===================== */
document.addEventListener('DOMContentLoaded', function() {
  const productProgressScore = document.querySelectorAll('.product-progress-circle');
  productProgressScore.forEach(circle => {
    const targetPercentage = parseInt(circle.dataset.percentage);
    const valueDisplay = circle.querySelector('.progress-value');
    let currentPercentage = 0;

    const animateProgress = () => {
      if (currentPercentage < targetPercentage) {
        currentPercentage++;
        circle.style.setProperty('--percentage', currentPercentage + '%');
        valueDisplay.textContent = currentPercentage + '%';
        requestAnimationFrame(animateProgress);
      }
    };

    setTimeout(animateProgress, 100);
  });
});