<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
:root {
  color-scheme: light;
  --black: #0d0d0d;
  --black-soft: #1a1a1a;
  --white: #ffffff;
  --off-white: #f7f7f5;
  --grey-100: #f0f0ee;
  --grey-200: #e4e4e1;
  --grey-400: #9a9a95;
  --grey-600: #6b6b66;
  --accent-red: #e11d3c;
  --accent-green: #1f8a4c;
  --accent-blue: #1656b0;
  --radius: 14px;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 10px 30px rgba(0, 0, 0, 0.12);
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}

* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
  background-color: var(--off-white);
  color: var(--black);
  -webkit-font-smoothing: antialiased;
}
#app {
  min-height: 100vh;
}

/* ---------- Brand ---------- */
/* Sedun logon tyylin mukainen wordmark: pyöreä, lihava, pienillä kirjaimilla */
.brand-mark {
  display: inline-block;
  font-family: 'Fredoka', 'Segoe UI', system-ui, sans-serif;
  font-weight: 700;
  font-size: 1.9rem;
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--black);
  margin-bottom: 22px;
  border: none;
  background: none;
  padding: 0;
  cursor: default;
}
.brand-mark.small {
  font-size: 1.15rem;
  margin-bottom: 0;
}
.brand-mark-link {
  cursor: pointer;
  transition: opacity 0.18s var(--ease);
}
.brand-mark-link:hover {
  opacity: 0.7;
}

/* ---------- Kirjautuminen ---------- */
.auth-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 20% 20%, #262626 0%, var(--black) 60%);
  padding: 24px;
}
.auth-box {
  background: var(--white);
  padding: 40px 32px;
  border-radius: 20px;
  width: 340px;
  text-align: center;
  box-shadow: var(--shadow-md);
}
.auth-box h2 {
  margin: 0 0 20px;
  font-size: 1.5rem;
}
.field {
  margin-bottom: 4px;
}
.auth-box input {
  width: 100%;
  padding: 13px 14px;
  margin-bottom: 14px;
  border: 1.5px solid var(--grey-200);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--black);
  transition: border-color 0.2s var(--ease), box-shadow 0.2s var(--ease);
  background: var(--off-white);
}
.auth-box input:focus {
  outline: none;
  border-color: var(--black);
  box-shadow: 0 0 0 3px rgba(13, 13, 13, 0.08);
  background: var(--white);
}
.auth-error {
  color: var(--accent-red);
  font-size: 0.88rem;
  background: #fdecee;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 14px;
}
.auth-switch {
  margin-top: 18px;
  font-size: 0.88rem;
  color: var(--grey-600);
}
.auth-switch a {
  color: var(--black);
  font-weight: 700;
  text-decoration: none;
  border-bottom: 1.5px solid var(--black);
  transition: opacity 0.2s ease;
}
.auth-switch a:hover {
  opacity: 0.6;
}

/* ---------- Kategorian valinta ---------- */
.choice-screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.user-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 28px;
  background: var(--white);
  border-bottom: 1px solid var(--grey-200);
  flex-wrap: wrap;
  flex-shrink: 0;
}
.user-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.hello-text {
  font-weight: 600;
  color: var(--grey-600);
}
.admin-badge {
  background: linear-gradient(135deg, var(--accent-blue), #1656b0);
  color: #fff;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}
.choice-halves {
  display: flex;
  flex: 1;
  min-height: 0;
}
.choice-half {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: clamp(20px, 4vw, 48px);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: flex-grow 0.4s var(--ease);
}
.choice-half::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.35s var(--ease);
  pointer-events: none;
}
.choice-black::before {
  background: radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.08), transparent 60%);
}
.choice-white::before {
  background: radial-gradient(circle at 50% 30%, rgba(0, 0, 0, 0.05), transparent 60%);
}
.choice-half:hover::before {
  opacity: 1;
}
.choice-half:hover {
  flex-grow: 1.08;
}
.choice-black {
  background-color: var(--black);
  color: var(--white);
}
.choice-white {
  background-color: var(--off-white);
  color: var(--black);
}
.choice-tag {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 20px;
  margin-bottom: 20px;
  border: 1px solid currentColor;
  opacity: 0.85;
}
.choice-title {
  font-size: clamp(1.5rem, 3.2vw + 1rem, 2.6rem);
  margin: 0 0 clamp(8px, 2vh, 16px);
  letter-spacing: -0.01em;
  z-index: 1;
  /* Väri annetaan aina suoraan (ei vain perittynä), koska osa selaimista
     himmentää suuren/lihavoidun otsikkotekstin harmaaksi automaattisen
     tummuustilan heuristiikalla, vaikka taustan väri olisi jo tumma. */
  color: inherit;
}
.choice-black .choice-title {
  color: var(--white);
}
.choice-white .choice-title {
  color: var(--black);
}
.choice-desc {
  max-width: 340px;
  margin-bottom: clamp(16px, 3vh, 32px);
  font-size: clamp(0.85rem, 1vw + 0.6rem, 1.05rem);
  line-height: 1.6;
  opacity: 0.85;
  z-index: 1;
}
.btn-arrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.arrow {
  transition: transform 0.25s var(--ease);
  display: inline-block;
}
.btn-arrow:hover .arrow {
  transform: translateX(5px);
}

/* ---------- Napit ---------- */
.btn {
  padding: 13px 26px;
  font-size: 0.95rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  transition: transform 0.18s var(--ease), box-shadow 0.18s var(--ease), opacity 0.18s var(--ease), background-color 0.18s var(--ease);
  font-family: inherit;
}
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}
.btn:active {
  transform: translateY(0);
  box-shadow: none;
}
.btn-block {
  width: 100%;
}
.btn-sm {
  padding: 8px 14px;
  font-size: 0.82rem;
}
.btn-white {
  background-color: var(--white);
  color: var(--black);
}
.btn-black {
  background-color: var(--black);
  color: var(--white);
}
.btn-back {
  background-color: var(--grey-100);
  color: var(--black);
}
.btn-back:hover {
  background-color: var(--grey-200);
}
.btn-ghost {
  background: transparent;
  color: var(--black);
  border: 1.5px solid var(--grey-200);
}
.btn-ghost:hover {
  border-color: var(--black);
}
.btn-ghost-active {
  background: var(--black);
  color: var(--white);
  border-color: var(--black);
}
.btn-add {
  background-color: var(--black);
  color: var(--white);
  width: 100%;
  margin-top: auto;
  padding: 10px 16px;
  font-size: 0.85rem;
  border-radius: 10px;
}
.btn-add:hover {
  background-color: var(--accent-green);
}
.btn-clear {
  background-color: var(--white);
  color: var(--accent-red);
  border: 1.5px solid var(--accent-red);
}
.btn-clear:hover {
  background-color: var(--accent-red);
  color: var(--white);
}
.btn-checkout {
  background-color: var(--black);
  color: var(--white);
}
.btn-checkout:hover {
  background-color: var(--accent-blue);
}
.cart-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
.cart-buttons .btn {
  flex: 1;
}

/* ---------- Kauppa ---------- */
.shop-screen {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.shop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding: 18px 32px;
  border-bottom: 1px solid var(--grey-200);
  background: var(--white);
  flex-shrink: 0;
}
.shop-title {
  font-size: 1.25rem;
  margin: 0;
  flex: 1;
  min-width: 200px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.cart-summary {
  font-weight: 700;
  background-color: var(--black);
  color: var(--white);
  padding: 10px 18px;
  border-radius: 30px;
  font-size: 0.9rem;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.18s var(--ease), background-color 0.18s var(--ease);
}
.cart-summary:hover {
  background-color: var(--accent-blue);
  transform: translateY(-2px);
}

.shop-body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}
.products-panel {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 24px 28px 32px;
}
.loading-text,
.empty-state {
  color: var(--grey-600);
  padding: 40px 0;
  text-align: center;
}
.products-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.products-count {
  font-size: 0.85rem;
  color: var(--grey-600);
}
.sort-control {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--grey-600);
}
.sort-control select {
  padding: 7px 10px;
  border: 1.5px solid var(--grey-200);
  border-radius: 8px;
  background: var(--white);
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--black);
  cursor: pointer;
  transition: border-color 0.2s var(--ease);
}
.sort-control select:hover,
.sort-control select:focus {
  outline: none;
  border-color: var(--black);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px 16px;
}
.product-card {
  background: transparent;
  border: none;
  border-radius: 0;
  overflow: visible;
  text-align: left;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s var(--ease);
}
.product-card:hover {
  transform: translateY(-3px);
}
.product-card.is-out {
  opacity: 0.55;
}
.product-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background-color: var(--grey-100);
  border-radius: 12px;
  position: relative;
}
.product-photo {
  width: 100%;
  height: 100%;
  object-fit: cover; /* kaikki kuvat täyttävät saman kokoisen laatikon tasaisesti */
  transition: transform 0.35s var(--ease);
}
.product-card:hover .product-photo {
  transform: scale(1.04);
}
.product-info {
  padding: 12px 2px 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}
.product-name {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--grey-600);
}
.product-price {
  margin: 0 0 4px;
  font-weight: 700;
  font-size: 1rem;
  color: var(--black);
}
.product-colors-hint {
  margin: 0 0 8px;
  font-size: 0.75rem;
  color: var(--grey-600);
}

/* ---------- Ostoskori (avautuu vain koria painamalla) ---------- */
.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 13, 13, 0.45);
  display: flex;
  justify-content: flex-end;
  z-index: 100;
  animation: fadeIn 0.2s var(--ease);
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.cart-drawer {
  width: 380px;
  max-width: 90vw;
  height: 100%;
  background: var(--white);
  display: flex;
  flex-direction: column;
  padding: 20px 22px 18px;
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.18);
  animation: slideIn 0.25s var(--ease);
}
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
.cart-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin-bottom: 16px;
}
.cart-drawer-header h3 {
  margin: 0;
}
.cart-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--grey-100);
  color: var(--black);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.18s var(--ease);
}
.cart-close:hover {
  background: var(--grey-200);
}
.cart-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.cart-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--grey-200);
  padding-top: 14px;
  margin-top: 12px;
}
.cart-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.cart-list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 4px;
  border-bottom: 1px dashed var(--grey-200);
  font-size: 0.92rem;
}
.cart-item-price {
  font-weight: 700;
}
.cart-empty {
  color: var(--grey-600);
}
.cart-total {
  font-size: 0.95rem;
  line-height: 1.6;
}

/* ---------- Tuotteen pikakatselu ---------- */
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 13, 13, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
  animation: fadeIn 0.2s var(--ease);
}
.detail-modal {
  position: relative;
  background: var(--white);
  border-radius: 20px;
  width: 760px;
  max-width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  display: flex;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  animation: fadeIn 0.25s var(--ease);
}
.detail-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  background: var(--white);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.detail-image {
  flex: 1;
  min-width: 0;
  aspect-ratio: 1 / 1;
  background: var(--grey-100);
}
.detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.detail-info {
  flex: 1;
  min-width: 0;
  padding: 28px 28px 24px;
  display: flex;
  flex-direction: column;
}
.detail-name {
  margin: 0 0 6px;
  font-size: 1.3rem;
}
.detail-price {
  margin: 0 0 16px;
  font-weight: 800;
  font-size: 1.3rem;
}
.detail-description {
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--grey-600);
  margin: 0 0 20px;
  white-space: pre-line;
}
.detail-description-empty {
  font-style: italic;
  opacity: 0.7;
}
.detail-colors {
  margin-bottom: 20px;
}
.detail-colors-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--grey-600);
  margin-bottom: 10px;
}
.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.color-swatch {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid var(--grey-200);
  padding: 0;
  cursor: pointer;
  background: var(--grey-100);
  transition: border-color 0.18s var(--ease), transform 0.18s var(--ease);
}
.color-swatch:hover {
  transform: translateY(-2px);
}
.color-swatch-active {
  border-color: var(--black);
}
.color-swatch img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.detail-info .btn-add {
  margin-top: auto;
}

@media (max-width: 640px) {
  .detail-modal {
    flex-direction: column;
    max-height: 92vh;
  }
  .detail-image {
    aspect-ratio: 4 / 3;
  }
}

/* ---------- Varastotilanne ---------- */
.stock-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 11px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
}
.stock-out {
  background-color: var(--accent-red);
}
.stock-low-badge {
  background-color: #e6720f;
}
.stock-info {
  font-size: 0.78rem;
  color: var(--grey-600);
  margin: 0;
}
.stock-low {
  color: #c05500;
  font-weight: 600;
}
.stock-zero {
  color: var(--accent-red);
  font-weight: 600;
}
.btn-add:disabled {
  background-color: var(--grey-200);
  color: var(--grey-600);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.btn-add-product {
  background-color: var(--accent-blue);
  color: #fff;
  margin-bottom: 22px;
}
.btn-add-product:hover {
  background-color: #0f4489;
}

/* ---------- Suosikki-nappi ---------- */
.wishlist-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  color: var(--black);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s var(--ease), color 0.2s var(--ease), background-color 0.2s var(--ease);
}
.wishlist-btn:hover {
  transform: scale(1.14);
  background: var(--white);
}
.wishlist-btn-active {
  color: var(--accent-red);
}
.wishlist-btn-active:hover {
  transform: scale(1.14) rotate(-6deg);
}
.edit-product-btn {
  left: 8px;
  right: auto;
  font-size: 15px;
}

/* ---------- Uuden tuotteen lisäys ---------- */
.add-product-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--off-white);
  padding: 24px;
}
.add-product-box {
  background: var(--white);
  padding: 36px 32px;
  border-radius: 20px;
  width: 440px;
  max-width: 92vw;
  max-height: 90vh;
  overflow-y: auto;
  text-align: center;
  box-shadow: var(--shadow-md);
}
.add-product-box input,
.add-product-box select,
.add-product-box textarea {
  width: 100%;
  padding: 12px 14px;
  margin-bottom: 14px;
  border: 1.5px solid var(--grey-200);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--black);
  background: var(--off-white);
  transition: border-color 0.2s var(--ease);
  resize: vertical;
}
.add-product-box input:focus,
.add-product-box select:focus,
.add-product-box textarea:focus {
  outline: none;
  border-color: var(--black);
  background: var(--white);
}
.color-editor {
  text-align: left;
  margin-bottom: 14px;
}
.color-editor-label {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--grey-600);
}
.color-editor-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.color-editor-row input {
  margin-bottom: 0;
}
.color-remove {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: var(--grey-100);
  color: var(--accent-red);
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.18s var(--ease);
}
.color-remove:hover {
  background: #fdecee;
}
.add-product-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 8px;
}
.add-product-buttons .btn {
  flex: 1;
}

/* ---------- Maksu ---------- */
.payment-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--off-white);
  padding: 24px;
}
.payment-box {
  background: var(--white);
  padding: 36px 32px;
  border-radius: 20px;
  width: 380px;
  text-align: center;
  box-shadow: var(--shadow-md);
}
.payment-box .btn {
  margin-top: 10px;
}
.status-pill {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  background: var(--grey-100);
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: capitalize;
}
.status-paid {
  background: #e3f5e9;
  color: var(--accent-green);
}
.payment-note {
  font-size: 0.85rem;
  color: var(--grey-600);
  background: #fff8e1;
  padding: 12px;
  border-radius: 10px;
  margin: 18px 0;
  text-align: left;
}
.payment-success {
  color: var(--accent-green);
  font-weight: 700;
  margin: 18px 0;
}

@media (max-width: 1300px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .shop-screen {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }
  .shop-body {
    flex-direction: column;
    overflow: visible;
  }
  .products-panel {
    overflow: visible;
  }
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .cart-drawer {
    width: 100%;
    max-width: 100vw;
  }
}

@media (max-width: 600px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 380px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .choice-screen {
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: visible;
  }
  .choice-halves {
    flex-direction: column;
  }
  .choice-half {
    flex: none;
    min-height: 260px;
    padding: 32px 24px;
  }
  .choice-half:hover {
    flex-grow: 0;
  }
  .shop-header {
    padding: 14px 18px;
  }
  .products-panel {
    padding: 18px 16px 24px;
  }
}
</style>
