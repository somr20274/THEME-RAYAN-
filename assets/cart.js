/* ========================================================================
   INFORMATIONS GÉNÉRALES SUR LE SITE
   Propriété de © 2019/2024 Shopiweb.fr
   Pour plus d'informations, visitez : https://www.shopiweb.fr
   ======================================================================== */

/* =====================
   Actualiser le contenu du panier (panier hors toile, page du panier, badges de comptage, etc.)
   ===================== */
window.updateCartContents = async (response) => {
  console.log(response);

  const offcanvasCart = document.querySelector("#offcanvas-cart");
  const cartPage = document.querySelector("#cart");

  offcanvasCart?.classList.add("loading");
  cartPage?.classList.add("loading");

  const newResponse = await fetch(window.location.href);
  const text = await newResponse.text();
  const newDocument = new DOMParser().parseFromString(text, "text/html");

  // Remplacement du contenu du panier
  offcanvasCart
    ?.querySelector(".offcanvas-body")
    .replaceWith(newDocument.querySelector("#offcanvas-cart .offcanvas-body"));
  offcanvasCart
    ?.querySelector(".offcanvas-footer")
    .replaceWith(
      newDocument.querySelector("#offcanvas-cart .offcanvas-footer")
    );
  cartPage?.replaceWith(newDocument.querySelector("#cart"));
  
  document.querySelectorAll(".cart-count-badge").forEach((badge) => {
    badge.textContent =
      newDocument.querySelector(".cart-count-badge").textContent;
    badge.removeAttribute("hidden");
  });
  
  offcanvasCart?.classList.remove("loading");
  cartPage?.classList.remove("loading");

  window.dispatchEvent(new Event("updated.shopiweb.cart"));
  
  if (response.ok) {
    if (response.url.includes("add.js")) {
      offcanvasCart
        ?.querySelector("#offcanvas-cart-alert-add")
        .removeAttribute("hidden");

      const data = await response.json();

      if (data.items?.length > 1) {
        const elemAlertItemsAdded = offcanvasCart?.querySelector(
          "#offcanvas-cart-alert-add [data-alert-items-added]"
        );

        elemAlertItemsAdded.textContent =
          elemAlertItemsAdded.textContent.replace("[count]", data.items.length);
        elemAlertItemsAdded.removeAttribute("hidden");
      } else {
        offcanvasCart
          ?.querySelector("#offcanvas-cart-alert-add [data-alert-item-added]")
          .removeAttribute("hidden");
      }
    } else {
      offcanvasCart
        ?.querySelector("#offcanvas-cart-alert-updated")
        .removeAttribute("hidden");
    }
  } else {
    const data = await response.json();
    const alert = document.querySelector("#offcanvas-cart-alert-error");
    alert.querySelector(
      "span"
    ).textContent = `${data.message} - ${data.description}`;
    alert.removeAttribute("hidden");
  }

  if (offcanvasCart?.querySelector("#offcanvas-cart-empty")) {
    setTimeout(() => {
      bootstrap.Offcanvas.getOrCreateInstance(offcanvasCart).hide();
    }, 1000);
  }

  if (offcanvasCart?.querySelector("#cart-shipping-rates")) {
    new Shopify.CountryProvinceSelector(
      "shipping-rates-modal-country",
      "shipping-rates-modal-province",
      {
        hideElement: "shipping-rates-modal-province-wrapper",
      }
    );
  }
};

/* =====================
   Compte à rebours panier
   ===================== */


/* =====================
   Note sur le panier
   ===================== */
window.handleCartNoteSave = async (btn) => {
  btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status" style="width: 1rem; height: 1rem">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;

  const note = btn.closest("#cart-note").querySelector('[name="note"]').value;

  await fetch("/cart/update.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });

  btn.innerHTML = `✓ <span class="visually-hidden">${btn.dataset.textNoteSaved}</span>`;

  setTimeout(() => {
    btn.innerHTML = btn.dataset.textBtnSave;
  }, 4000);
};

/* =====================
   Supprimer les boutons
   ===================== */
window.handleCartItemRemoval = async (btn) => {
  const response = await fetch("/cart/change.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: btn.dataset.lineItemKey,
      quantity: 0,
    }),
  });
  window.updateCartContents(response);
};

/* =====================
   Quantité Entrées
   ===================== */
window.handleCartQuantityChange = async (input) => {
  const response = await fetch("/cart/change.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: input.dataset.lineItemKey,
      quantity: input.value,
    }),
  });
  window.updateCartContents(response);
};

/* =====================
   Objectif panier - Animer la largeur
   ===================== */
const initializeCartGoal = () => {
  const progressBar = document.querySelector("#cart-goal .progress-bar");
  if (progressBar) {
    setTimeout(() => {
      progressBar.style.width = progressBar.dataset.width;
    }, 250);
  }
};
initializeCartGoal();

window.addEventListener("updated.shopiweb.cart", () => {
  initializeCartGoal();
});

/* =====================
   Cadeau objectif panier - Produit gratuit si objectif atteint
   ===================== */
const initializeCartGoalFreeProduct = async () => {
  const cartGoal = document.querySelector("#cart-goal");
  if (!cartGoal) return;

  const freeProductHandle = cartGoal.dataset.freeProductHandle;
  if (!freeProductHandle.length) return;

  const goalCompleted = cartGoal.dataset.goalCompleted === 'true';
  let isFreeProductInCart = false;
  let freeProductLineItemKey = null;

  document.querySelectorAll('[data-cart-line-item]').forEach(elem => {
    if (elem.dataset.productHandle === freeProductHandle) {
      isFreeProductInCart = true;
      freeProductLineItemKey = elem.dataset.lineItemKey; // Récupère la clé de l'élément gratuit
    }
  });

  const freeProductVariantId = Number(cartGoal.dataset.freeProductVariantId);

  if (goalCompleted) {
    if (!isFreeProductInCart) {
      // Ajouter le produit gratuit si l'objectif est atteint et qu'il n'est pas déjà dans le panier
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            id: freeProductVariantId,
            quantity: 1
          }]
        })
      });
      window.updateCartContents(response);
    }
  } else {
    if (isFreeProductInCart && freeProductLineItemKey) {
      // Retirer le produit gratuit si l'objectif n'est plus atteint
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: freeProductLineItemKey,
          quantity: 0
        })
      });
      window.updateCartContents(response);
    }
  }
};
initializeCartGoalFreeProduct();

window.addEventListener("updated.shopiweb.cart", () => {
  initializeCartGoalFreeProduct();
});

/* =====================
   Bouton de paiement - indiquer le chargement au clic
   ===================== */
window.handleCheckoutButtonClick = (btn) => {
  btn.style.height = btn.clientHeight + "px";
  btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status" style="width: 1.2rem; height: 1.2rem">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;
};

/* =====================
   Générer des tarifs d'expédition
   ===================== */
window.fetchShippingRates = async (btn) => {
  btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status" style="width: 1rem; height: 1rem">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;

  const wrapper = document.querySelector("#cart-shipping-rates-collapse");

  wrapper.querySelector("#shipping-rates-modal-alert-danger").innerHTML = "";
  wrapper
    .querySelector("#shipping-rates-modal-alert-danger")
    .setAttribute("hidden", "hidden");
  wrapper.querySelector("#shipping-rates-modal-alert-warning").innerHTML = "";
  wrapper
    .querySelector("#shipping-rates-modal-alert-warning")
    .setAttribute("hidden", "hidden");
  wrapper.querySelector("#shipping-rates-modal-alert-success").innerHTML = "";
  wrapper
    .querySelector("#shipping-rates-modal-alert-success")
    .setAttribute("hidden", "hidden");

  const country = wrapper.querySelector("#shipping-rates-modal-country").value;
  const province = wrapper.querySelector("#shipping-rates-modal-province").value;
  const zip = wrapper.querySelector("#shipping-rates-modal-zip").value;

  const prepareResponse = await fetch(
    `/cart/prepare_shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`,
    {
      method: "POST",
    }
  );
  console.log(prepareResponse);

  if (prepareResponse.ok) {
    const asyncRespose = await fetch(
      `/cart/async_shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`
    );
    console.log(asyncRespose);

    const data = await asyncRespose.json();
    console.log(data);

    let html = "";

    if (data.shipping_rates.length) {
      data.shipping_rates.forEach((elem) => {
        html += `
                    <li>
                        <strong>${elem.presentment_name}</strong>: ${elem.price} ${elem.currency}
                    </li>
                `;
      });

      wrapper.querySelector("#shipping-rates-modal-alert-success").innerHTML = `
                <ul class="ps-5 mb-0">
                    ${html}
                </ul>
            `;
      wrapper
        .querySelector("#shipping-rates-modal-alert-success")
        .removeAttribute("hidden");
    } else {
      wrapper.querySelector("#shipping-rates-modal-alert-warning").innerHTML = `
                <p class="mb-0">
                    ${modal.dataset.textNoResults}
                </p>
            `;
      wrapper
        .querySelector("#shipping-rates-modal-alert-warning")
        .removeAttribute("hidden");
    }
  } else {
    const data = await prepareResponse.json();
    console.log(data);

    let html = "";

    for (const [key, value] of Object.entries(data)) {
      html += `
                <li>
                    <strong>${key}</strong>: ${value.toString()}
                </li>
            `;
    }

    wrapper.querySelector("#shipping-rates-modal-alert-danger").innerHTML = `
            <ul class="ps-5 mb-0">
                ${html}
            </ul>
        `;
    wrapper
      .querySelector("#shipping-rates-modal-alert-danger")
      .removeAttribute("hidden");
  }

  btn.innerHTML = btn.dataset.text;
};

/* =====================
   Carte récapitulative sur la page du panier (sticky ordinateur)
   ===================== */
const initializeStickySummaryCard = () => {
  const card = document.querySelector("#cart-summary");

  if (!card) return;

  if (window.matchMedia("max-width: 991px").matches) return;

  const navbarHeight =
    document.querySelector('[id*="__navbar"].sticky-top')?.clientHeight || 0;
  const announcementBarHeight =
    document.querySelector('[id*="__announcement-bar"].sticky-top')
      ?.clientHeight || 0;

  card.style.position = "sticky";
  card.style.top = `${navbarHeight + announcementBarHeight + 20}px`;
};
initializeStickySummaryCard();

window.addEventListener("updated.shopiweb.cart", () => {
  initializeStickySummaryCard();
});

/* =====================
   Panier hors-canevas - correction du défilement pour les collapses
   ===================== */
const fixOffcanvasScrolling = () => {
  document
    .querySelectorAll('#offcanvas-cart [data-bs-toggle="collapse"]')
    .forEach((elem) => {
      elem.addEventListener("click", () => {
        setTimeout(() => {
          const offcanvasBody = document.querySelector(
            "#offcanvas-cart .offcanvas-body"
          );
          offcanvasBody.scroll({
            top: offcanvasBody.scrollHeight,
            behavior: "smooth",
          });
        }, 250);
      });
    });
};
fixOffcanvasScrolling();

window.addEventListener("updated.shopiweb.cart", () => {
  fixOffcanvasScrolling();
});

/* =====================
   Emballage cadeau (Gift Wrap)
   ===================== */
window.onChangeCartGiftWrap = async (input) => {
    let response

    if (input.checked) {
        response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [{
                    quantity: 1,
                    id: Number(input.value)
                }]
            })
        })
    } else {
        response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: input.dataset.lineItemKey,
                quantity: 0
            })
        })
    }
    window.updateCartContents(response)
}

/* =====================
   Protection de l'expédition
   ===================== */
const initializeShippingProtection = async () => {
  if (!document.querySelector('[data-shipping-protection-enabled="true"]'))
    return;

  if (!document.querySelector('[data-shipping-protection-auto-initialize="true"]'))
    return;

  if (!window.localStorage.getItem("shopiweb-shipping-protection-initialize")) {
    const variantId = Number(
      document.querySelector("[data-shipping-protection-variant-id]").dataset
        .shippingProtectionVariantId
    );

    const response = await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            quantity: 1,
            id: variantId,
          },
        ],
      }),
    });

    window.updateCartContents(response);
    window.localStorage.setItem("shopiweb-shipping-protection-initialize", true);
  }
};
window.addEventListener("updated.shopiweb.cart", () => {
  initializeShippingProtection();
});

window.onChangeCartShippingProtection = async (input) => {
  let response;

  if (input.checked) {
    response = await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            quantity: 1,
            id: Number(input.value),
          },
        ],
      }),
    });
  } else {
    response = await fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: input.dataset.lineItemKey,
        quantity: 0,
      }),
    });
  }
  window.updateCartContents(response);
};

/* =====================
   Bundle Cadeau
   ===================== */
// Version simplifiée, à mettre dans cart.js

function getBundleVariantIdsAndGift() {
  const bundleData = document.getElementById('shopibundle-bundle-data');
  if (!bundleData) return { bundleVariantIds: [], giftVariantId: null };

  let bundleVariantIds = [];
  try {
    bundleVariantIds = JSON.parse(bundleData.dataset.bundleVariantIds);
  } catch(e) {
    bundleVariantIds = [];
  }
  const giftVariantId = parseInt(bundleData.dataset.giftVariantId);

  return { bundleVariantIds, giftVariantId };
}

async function syncBundleGiftInCart() {
  const { bundleVariantIds, giftVariantId } = getBundleVariantIdsAndGift();
  if (!bundleVariantIds.length || !giftVariantId) return;

  // Récupération du panier
  const cartResp = await fetch('/cart.js');
  const cart = await cartResp.json();
  const cartVariantIds = cart.items.map(item => item.variant_id);
  const giftLine = cart.items.find(item => item.variant_id === giftVariantId);

  // Ici on check que CHAQUE variante du bundle est présente dans le panier
  const bundleOk = bundleVariantIds.every(id => cartVariantIds.includes(id));

  if (bundleOk) {
    if (!giftLine) {
      await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: giftVariantId, quantity: 1 }] })
      });
      // Ici pas besoin de reload, rafraîchis juste l’UI du panier si besoin !
      window.dispatchEvent(new CustomEvent("updated.shopiweb.cart"));
    }
  } else {
    if (giftLine) {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: giftLine.key, quantity: 0 })
      });
      if (window.updateCartContents) {
        window.updateCartContents(response);
      } else {
        window.dispatchEvent(new CustomEvent("updated.shopiweb.cart"));
      }
    }
  }
}

// Re-déclencher la vérif à chaque changement du panier
window.addEventListener("updated.shopiweb.cart", syncBundleGiftInCart);
document.addEventListener("DOMContentLoaded", syncBundleGiftInCart);

