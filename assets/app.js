(() => {
  "use strict";

  const STORAGE_KEYS = {
    cart: "musales_cart_v2",
    favorites: "musales_favorites_v2",
    demoDb: "musales_demo_db_v2",
    demoSession: "musales_demo_session_v2",
  };

  const products = {
    p1: {
      id: "p1",
      name: "阿瓦提·初酿",
      price: 89,
      category: "daily",
      categoryName: "日常之选",
      spec: "单瓶装 500毫升",
      flavor: "葡果香气，层次醇厚",
      description: "从日常一杯开始，走近阿瓦提的传统葡酿风味。",
      tags: ["阿瓦提风土", "日常饮用", "500毫升"],
      images: [
        { src: "assets/images/daily-1.webp", alt: "阿瓦提初酿主图" },
        { src: "assets/images/daily-2.webp", alt: "阿瓦提初酿包装细节" },
        { src: "assets/images/daily-3.webp", alt: "阿瓦提初酿家庭餐桌场景" },
      ],
    },
    p2: {
      id: "p2",
      name: "丝路·典藏礼盒",
      price: 269,
      category: "gift",
      categoryName: "文化礼盒",
      spec: "双瓶礼盒 500毫升每瓶",
      flavor: "果香与浓郁口感",
      description: "以文创礼盒呈现地方风味，为礼赠多添一份来处。",
      tags: ["双瓶礼盒", "商务礼赠", "非遗故事"],
      images: [
        { src: "assets/images/gift-1.webp", alt: "丝路典藏礼盒主图" },
        { src: "assets/images/gift-2.webp", alt: "丝路典藏礼盒开盒细节" },
        { src: "assets/images/gift-3.webp", alt: "丝路典藏礼盒馈赠场景" },
      ],
    },
    p3: {
      id: "p3",
      name: "刀郎·风土手作",
      price: 219,
      category: "gift",
      categoryName: "风土手作",
      spec: "单瓶礼盒 750毫升",
      flavor: "果香饱满，回味悠长",
      description: "从手作与风土汲取灵感，装下一份清楚的阿瓦提记忆。",
      tags: ["手作礼盒", "750毫升", "阿瓦提记忆"],
      images: [
        { src: "assets/images/gift-2.webp", alt: "刀郎风土手作开盒细节" },
        { src: "assets/images/gift-3.webp", alt: "刀郎风土手作馈赠场景" },
        { src: "assets/images/gift-1.webp", alt: "刀郎风土手作礼盒外观" },
      ],
    },
    p4: {
      id: "p4",
      name: "西域·旅人伴手礼",
      price: 149,
      category: "travel",
      categoryName: "旅行纪念",
      spec: "旅行礼盒 375毫升",
      flavor: "清新葡香，柔和口感",
      description: "旅途中带走的一份心意，也是认识地方文化的一扇小窗。",
      tags: ["旅行礼盒", "375毫升", "轻巧伴手"],
      images: [
        { src: "assets/images/travel-1.webp", alt: "西域旅人伴手礼主图" },
        { src: "assets/images/travel-2.webp", alt: "西域旅人伴手礼开盒细节" },
        { src: "assets/images/travel-3.webp", alt: "西域旅人伴手礼陈列场景" },
      ],
    },
  };

  const state = {
    backend: false,
    backendChecked: false,
    user: null,
    addresses: [],
    orders: [],
    cart: normalizeCart(readJSON(STORAGE_KEYS.cart, [])),
    favorites: normalizeFavorites(readJSON(STORAGE_KEYS.favorites, [])),
    selectedProductId: null,
    selectedImageIndex: 0,
    detailQuantity: 1,
    selectedAddressId: null,
    pendingCheckout: false,
    authTab: "login",
    activePanel: "orders",
    filter: "all",
    query: "",
    toastTimer: 0,
    profileAvatarDraft: null,
    locationBusy: false,
    giftAdvisor: {
      step: 0,
      answers: {},
    },
  };

  const routeTitles = {
    home: "西葡秘酿｜阿瓦提慕萨莱斯非遗葡酿",
    shop: "风土好礼｜西葡秘酿",
    story: "品牌故事｜西葡秘酿",
    business: "企业礼赠｜西葡秘酿",
    account: "个人中心｜西葡秘酿",
    cart: "确认心意｜西葡秘酿",
  };

  const giftBudgetRanges = {
    value: { min: 0, max: 100 },
    mid: { min: 100, max: 200 },
    premium: { min: 200, max: Infinity },
  };

  const giftProfiles = {
    p1: {
      occasions: ["self", "friend"],
      preferences: ["light"],
      reason: "单瓶装不压预算，也适合从日常轻松喝起。",
    },
    p2: {
      occasions: ["elder", "business", "friend"],
      preferences: ["culture"],
      reason: "文化礼盒完整体面，适合需要表达诚意的场合。",
    },
    p3: {
      occasions: ["elder", "business"],
      preferences: ["craft"],
      reason: "礼盒更强调手作与风土，适合重视产地故事的人。",
    },
    p4: {
      occasions: ["self", "friend", "business"],
      preferences: ["travel", "light"],
      reason: "小规格轻巧好带，适合旅行、走访和朋友分享。",
    },
  };

  const elements = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    setupImageMarquee();
    bindEvents();
    bindDialogs();
    renderGiftAdvisor();
    restoreDemoSession();
    renderAll();
    activateRoute(routeFromHash(), false);

    detectBackend().then(async (online) => {
      state.backend = online;
      state.backendChecked = true;
      if (online) {
        await restoreBackendSession();
      } else {
        restoreDemoSession();
        await refreshUserData();
      }
      renderAll();
    });
  }

  function setupImageMarquee() {
    const track = document.querySelector(".image-marquee-track");
    const group = track?.firstElementChild;
    if (!track || !group || track.children.length > 1) return;

    const duplicate = group.cloneNode(true);
    duplicate.setAttribute("aria-hidden", "true");
    track.append(duplicate);
  }

  function cacheElements() {
    elements.views = [...document.querySelectorAll("[data-view]")];
    elements.giftAdvisor = document.getElementById("giftAdvisor");
    elements.giftResults = document.getElementById("giftResults");
    elements.topNavLinks = [...document.querySelectorAll(".desktop-nav [data-route]")];
    elements.bottomNavLinks = [...document.querySelectorAll("[data-nav-route]")];
    elements.cartCount = document.getElementById("cartCount");
    elements.productGrid = document.getElementById("productGrid");
    elements.productResultCount = document.getElementById("productResultCount");
    elements.productSearch = document.getElementById("productSearch");
    elements.filterButtons = [...document.querySelectorAll("[data-filter]")];
    elements.loginForm = document.getElementById("loginForm");
    elements.registerForm = document.getElementById("registerForm");
    elements.loginMessage = document.getElementById("loginMessage");
    elements.registerMessage = document.getElementById("registerMessage");
    elements.authTabs = [...document.querySelectorAll("[data-auth-tab]")];
    elements.authDialog = document.getElementById("authDialog");
    elements.authModeNote = document.getElementById("authModeNote");
    elements.productDialog = document.getElementById("productDialog");
    elements.addressDialog = document.getElementById("addressDialog");
    elements.successDialog = document.getElementById("successDialog");
    elements.addressForm = document.getElementById("addressForm");
    elements.addressMessage = document.getElementById("addressMessage");
    elements.addressDialogTitle = document.getElementById("addressDialogTitle");
    elements.locateAddressButton = document.getElementById("locateAddressButton");
    elements.locationStatus = document.getElementById("locationStatus");
    elements.businessForm = document.getElementById("businessForm");
    elements.businessMessage = document.getElementById("businessMessage");
    elements.signedOutCard = document.getElementById("signedOutCard");
    elements.accountDashboard = document.getElementById("accountDashboard");
    elements.accountDetail = document.getElementById("accountDetail");
    elements.modeBadge = document.getElementById("modeBadge");
    elements.checkoutAddress = document.getElementById("checkoutAddress");
    elements.cartItems = document.getElementById("cartItems");
    elements.cartItemCount = document.getElementById("cartItemCount");
    elements.cartSubtotal = document.getElementById("cartSubtotal");
    elements.cartTotal = document.getElementById("cartTotal");
    elements.checkoutButton = document.getElementById("checkoutButton");
    elements.editAddressButton = document.getElementById("editAddressButton");
    elements.checkoutModeNote = document.getElementById("checkoutModeNote");
    elements.giftCardToggle = document.getElementById("giftCardToggle");
    elements.giftMessageField = document.getElementById("giftMessageField");
    elements.giftMessage = document.getElementById("giftMessage");
    elements.orderNote = document.getElementById("orderNote");
    elements.cartRecommendationsSection = document.getElementById("cartRecommendationsSection");
    elements.cartRecommendations = document.getElementById("cartRecommendations");
    elements.toast = document.getElementById("toast");
    elements.successOrderNo = document.getElementById("successOrderNo");
    elements.headerAccountIcon = document.getElementById("headerAccountIcon");
    elements.headerAvatar = document.getElementById("headerAvatar");
    elements.accountTitle = document.getElementById("accountTitle");
    elements.accountLead = document.getElementById("accountLead");
    elements.profileAvatarButton = document.getElementById("profileAvatarButton");
    elements.profileAvatarImage = document.getElementById("profileAvatarImage");
    elements.profileAvatarText = document.getElementById("profileAvatarText");
    elements.profileGreeting = document.getElementById("profileGreeting");
    elements.profileName = document.getElementById("profileName");
    elements.profilePhone = document.getElementById("profilePhone");
    elements.statOrders = document.getElementById("statOrders");
    elements.statAddresses = document.getElementById("statAddresses");
    elements.statFavorites = document.getElementById("statFavorites");
    elements.quantityValue = document.getElementById("quantityValue");
    elements.favoriteButton = document.getElementById("favoriteButton");
    elements.detailImage = document.getElementById("detailImage");
    elements.detailThumbs = document.getElementById("detailThumbs");
    elements.profileDialog = document.getElementById("profileDialog");
    elements.profileForm = document.getElementById("profileForm");
    elements.profileNameInput = document.getElementById("profileNameInput");
    elements.profileMessage = document.getElementById("profileMessage");
    elements.avatarInput = document.getElementById("avatarInput");
    elements.avatarPreviewButton = document.getElementById("avatarPreviewButton");
    elements.avatarPreviewImage = document.getElementById("avatarPreviewImage");
    elements.avatarPreviewText = document.getElementById("avatarPreviewText");
    elements.chooseAvatarButton = document.getElementById("chooseAvatarButton");
    elements.removeAvatarButton = document.getElementById("removeAvatarButton");
    elements.profileSubmit = document.getElementById("profileSubmit");
  }

  function bindEvents() {
    document.addEventListener("click", handleDocumentClick);
    window.addEventListener("hashchange", () => activateRoute(routeFromHash(), true));

    document.getElementById("openCart").addEventListener("click", () => navigate("cart"));
    document.getElementById("openAccount").addEventListener("click", () => navigate("account"));
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.registerForm.addEventListener("submit", handleRegister);
    elements.addressForm.addEventListener("submit", handleAddressSubmit);
    elements.businessForm.addEventListener("submit", handleBusinessSubmit);
    elements.profileForm.addEventListener("submit", handleProfileSubmit);
    elements.locateAddressButton.addEventListener("click", locateCurrentAddress);
    elements.chooseAvatarButton.addEventListener("click", () => elements.avatarInput.click());
    elements.avatarPreviewButton.addEventListener("click", () => elements.avatarInput.click());
    elements.avatarInput.addEventListener("change", handleAvatarFileChange);
    elements.removeAvatarButton.addEventListener("click", () => {
      state.profileAvatarDraft = null;
      renderProfileAvatarPreview();
      setProfileMessage("已恢复默认头像，保存后生效。", "success");
    });

    elements.productSearch.addEventListener("input", () => {
      state.query = elements.productSearch.value.trim();
      renderProducts();
    });

    elements.filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        elements.filterButtons.forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        renderProducts();
      });
    });

    elements.authTabs.forEach((button) => {
      button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
    });

    document.getElementById("quantityMinus").addEventListener("click", () => changeDetailQuantity(-1));
    document.getElementById("quantityPlus").addEventListener("click", () => changeDetailQuantity(1));
    document.getElementById("favoriteButton").addEventListener("click", toggleFavorite);
    document.getElementById("addToCartButton").addEventListener("click", () => {
      addToCart(state.selectedProductId, state.detailQuantity, false);
    });
    document.getElementById("buyNowButton").addEventListener("click", () => {
      addToCart(state.selectedProductId, state.detailQuantity, true);
      closeDialog(elements.productDialog);
    });

    document.querySelectorAll("[data-accordion]").forEach((button) => {
      button.addEventListener("click", () => toggleAccordion(button));
    });

    document.getElementById("editAddressButton").addEventListener("click", () => {
      if (!requireLogin()) return;
      openAddressDialog();
    });

    elements.giftCardToggle.addEventListener("change", () => {
      elements.giftMessageField.hidden = !elements.giftCardToggle.checked;
      if (elements.giftCardToggle.checked) {
        window.setTimeout(() => elements.giftMessage.focus({ preventScroll: true }), 0);
      }
    });

    elements.checkoutButton.addEventListener("click", submitOrder);
  }

  function bindDialogs() {
    document.querySelectorAll("dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
      dialog.addEventListener("close", syncDialogState);
      dialog.addEventListener("cancel", () => {
        window.setTimeout(syncDialogState, 0);
      });
    });

    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => {
        const dialog = document.getElementById(button.dataset.closeDialog);
        closeDialog(dialog);
      });
    });
  }

  async function detectBackend() {
    if (window.location.protocol === "file:") return false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1800);
    try {
      const response = await fetch("/api/health", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.ok === true;
    } catch {
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) {
      const error = new Error(data.message || "服务暂不可用，请稍后再试。");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function restoreBackendSession() {
    try {
      const data = await apiRequest("/api/session");
      state.user = data.user || null;
    } catch {
      state.user = null;
    }
    await refreshUserData();
  }

  function restoreDemoSession() {
    if (state.backend) return;
    const userId = readStorage(STORAGE_KEYS.demoSession);
    const db = getDemoDb();
    const user = db.users.find((entry) => entry.id === userId);
    state.user = user ? publicUser(user) : null;
  }

  async function refreshUserData() {
    state.selectedAddressId = null;
    if (!state.user) {
      state.addresses = [];
      state.orders = [];
      return;
    }

    if (state.backend) {
      try {
        const [addressData, orderData] = await Promise.all([
          apiRequest("/api/addresses"),
          apiRequest("/api/orders"),
        ]);
        state.addresses = Array.isArray(addressData.addresses) ? addressData.addresses : [];
        state.orders = Array.isArray(orderData.orders) ? orderData.orders : [];
      } catch (error) {
        if (error.status === 401) state.user = null;
        showToast(error.message || "账户数据加载失败。");
        state.addresses = [];
        state.orders = [];
      }
    } else {
      const db = getDemoDb();
      state.addresses = Array.isArray(db.addresses[state.user.id]) ? db.addresses[state.user.id] : [];
      state.orders = Array.isArray(db.orders[state.user.id]) ? db.orders[state.user.id] : [];
    }

    const defaultAddress = state.addresses.find((address) => address.isDefault) || state.addresses[0];
    state.selectedAddressId = defaultAddress ? defaultAddress.id : null;
  }

  function renderAll() {
    renderCart();
    renderAccount();
    updateModeUI();
    updateFavoriteButton();
    const footerAuth = document.querySelector('.footer-links [data-open-auth="login"]');
    if (footerAuth) footerAuth.textContent = state.user ? "个人中心" : "账户登录";
  }

  function updateModeUI() {
    if (!state.backendChecked) {
      elements.modeBadge.textContent = "正在连接账户服务";
      elements.authModeNote.textContent = "正在确认账户服务连接。";
      elements.checkoutModeNote.textContent = "订单信息将在提交时校验。";
      return;
    }

    if (state.backend) {
      elements.modeBadge.textContent = state.user ? "账户已安全登录" : "MySQL 账户服务已连接";
      elements.authModeNote.textContent = "当前使用 Flask 会话与 MySQL 数据。密码仅以哈希形式保存。";
      elements.checkoutModeNote.textContent = "提交后订单、地址与账户将在 MySQL 中完成绑定。";
    } else {
      elements.modeBadge.textContent = "本地体验模式";
      elements.authModeNote.textContent = "当前为本地体验模式。启动同目录 app.py 后会自动启用 MySQL 账户服务。";
      elements.checkoutModeNote.textContent = "当前为本地体验模式，订单保存在此浏览器；启动 Flask 后自动切换为 MySQL。";
    }
  }

  function activateRoute(route, scrollToTop) {
    const validRoute = ["home", "shop", "story", "business", "account", "cart"].includes(route) ? route : "home";
    elements.views.forEach((view) => {
      const active = view.dataset.view === validRoute;
      view.hidden = !active;
      view.classList.toggle("is-active", active);
    });

    const navRoute = validRoute === "business" ? "" : validRoute === "cart" ? "" : validRoute;
    elements.topNavLinks.forEach((link) => {
      const active = link.dataset.route === navRoute;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    elements.bottomNavLinks.forEach((link) => {
      const active = link.dataset.navRoute === navRoute;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    document.title = routeTitles[validRoute];
    if (validRoute === "shop") renderProducts();
    if (validRoute === "cart") renderCart();
    if (validRoute === "account") renderAccount();
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }

  function routeFromHash() {
    const route = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    return ["home", "shop", "story", "business", "account", "cart"].includes(route) ? route : "home";
  }

  function navigate(route) {
    const nextHash = `#${route}`;
    if (window.location.hash === nextHash) {
      activateRoute(route, true);
      return;
    }
    window.location.hash = route;
  }

  function renderGiftAdvisor(focusHeading = false) {
    const advisor = elements.giftAdvisor;
    if (!advisor) return;

    const steps = [...advisor.querySelectorAll("[data-gift-step]")];
    const result = advisor.querySelector("[data-gift-result]");
    const actions = advisor.querySelector("[data-gift-actions]");
    const backButton = advisor.querySelector("[data-gift-back]");
    const progress = advisor.querySelector("[data-gift-progress]");
    const dots = [...advisor.querySelectorAll("[data-gift-dot]")];
    const answers = state.giftAdvisor.answers;
    const complete = ["occasion", "budget", "preference"].every((key) => answers[key]);

    steps.forEach((step, index) => {
      step.hidden = complete || index !== state.giftAdvisor.step;
    });
    result.hidden = !complete;
    actions.hidden = complete;
    backButton.hidden = state.giftAdvisor.step === 0;
    progress.textContent = complete ? "已完成" : `0${state.giftAdvisor.step + 1} / 03`;
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", !complete && index === state.giftAdvisor.step);
      dot.classList.toggle("is-complete", complete || index < state.giftAdvisor.step);
    });

    advisor.querySelectorAll("[data-gift-choice]").forEach((button) => {
      const answer = answers[button.dataset.giftChoice];
      const selected = answer?.value === button.dataset.value;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    if (!complete) {
      if (focusHeading) {
        steps[state.giftAdvisor.step]?.querySelector("h3")?.focus({ preventScroll: true });
      }
      return;
    }

    const resultTitle = result.querySelector("h3");
    resultTitle.textContent = `${answers.occasion.label} · ${answers.preference.label}`;
    renderGiftRecommendations();

    if (focusHeading) {
      resultTitle.focus({ preventScroll: true });
    }
  }

  function handleGiftAdvisorClick(event) {
    const advisor = elements.giftAdvisor;
    if (!advisor || !advisor.contains(event.target)) return false;

    const choice = event.target.closest("[data-gift-choice]");
    if (choice) {
      const key = choice.dataset.giftChoice;
      state.giftAdvisor.answers[key] = {
        value: choice.dataset.value,
        label: choice.querySelector("strong")?.textContent.trim() || "",
      };
      if (key !== "preference") {
        state.giftAdvisor.step = Math.min(state.giftAdvisor.step + 1, 2);
      }
      renderGiftAdvisor(true);
      return true;
    }

    if (event.target.closest("[data-gift-back]")) {
      state.giftAdvisor.step = Math.max(0, state.giftAdvisor.step - 1);
      renderGiftAdvisor(true);
      return true;
    }

    if (event.target.closest("[data-gift-restart]")) {
      state.giftAdvisor.step = 0;
      state.giftAdvisor.answers = {};
      renderGiftAdvisor(true);
      return true;
    }

    return false;
  }

  function renderGiftRecommendations() {
    const answers = state.giftAdvisor.answers;
    const range = giftBudgetRanges[answers.budget.value] || giftBudgetRanges.premium;
    const recommendations = Object.values(products)
      .filter((product) => product.price >= range.min && product.price <= range.max)
      .map((product) => {
        const profile = giftProfiles[product.id];
        let score = 0;
        if (profile.occasions.includes(answers.occasion.value)) score += 3;
        if (profile.preferences.includes(answers.preference.value)) score += 4;
        return { product, profile, score };
      })
      .sort((left, right) => right.score - left.score || left.product.price - right.product.price)
      .slice(0, 2);

    elements.giftResults.innerHTML = recommendations.map(({ product, profile }, index) => {
      const image = product.images[0];
      return `
        <article class="gift-result-card">
          <button class="gift-result-media" type="button" data-product="${escapeHTML(product.id)}" aria-label="查看${escapeHTML(product.name)}">
            <img src="${escapeHTML(smallImageSource(image.src))}" alt="${escapeHTML(image.alt)}" width="1024" height="1536" loading="lazy" decoding="async">
          </button>
          <div class="gift-result-copy">
            <span>${index === 0 ? "首选推荐" : "另一份心意"}</span>
            <h4>${escapeHTML(product.name)}</h4>
            <p>${escapeHTML(profile.reason)}</p>
            <div class="gift-result-footer">
              <strong>${formatMoney(product.price)}</strong>
              <button type="button" data-product="${escapeHTML(product.id)}">查看详情<i class="ph ph-arrow-right" aria-hidden="true"></i></button>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  function handleDocumentClick(event) {
    if (handleGiftAdvisorClick(event)) return;

    const routeLink = event.target.closest("[data-route]");
    if (routeLink) {
      event.preventDefault();
      navigate(routeLink.dataset.route);
      return;
    }

    const authTrigger = event.target.closest("[data-open-auth]");
    if (authTrigger) {
      openAuth(authTrigger.dataset.openAuth);
      return;
    }

    const productTrigger = event.target.closest("[data-product]");
    if (productTrigger) {
      openProduct(productTrigger.dataset.product);
      return;
    }

    const accountPanelTrigger = event.target.closest("[data-account-panel]");
    if (accountPanelTrigger) {
      state.activePanel = accountPanelTrigger.dataset.accountPanel;
      renderAccountDetail();
      return;
    }

    const profileEditTrigger = event.target.closest("[data-open-profile-edit]");
    if (profileEditTrigger) {
      openProfileEditor();
      return;
    }

    const logoutTrigger = event.target.closest("[data-logout]");
    if (logoutTrigger) {
      logout();
      return;
    }

    const cartQuantity = event.target.closest("[data-cart-quantity]");
    if (cartQuantity) {
      updateCartQuantity(cartQuantity.dataset.productId, Number(cartQuantity.dataset.cartQuantity));
      return;
    }

    const cartRemove = event.target.closest("[data-cart-remove]");
    if (cartRemove) {
      removeCartItem(cartRemove.dataset.cartRemove);
      return;
    }

    const addressEdit = event.target.closest("[data-address-edit]");
    if (addressEdit) {
      openAddressDialog(addressEdit.dataset.addressEdit);
      return;
    }

    const addressDelete = event.target.closest("[data-address-delete]");
    if (addressDelete) {
      deleteAddress(addressDelete.dataset.addressDelete);
      return;
    }

    const addressAdd = event.target.closest("[data-address-add]");
    if (addressAdd) {
      openAddressDialog();
      return;
    }

    const resetFilters = event.target.closest("[data-reset-filters]");
    if (resetFilters) {
      state.filter = "all";
      state.query = "";
      elements.productSearch.value = "";
      elements.filterButtons.forEach((button) => {
        const active = button.dataset.filter === "all";
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      renderProducts();
      return;
    }

    if (event.target.closest("[data-success-home]")) {
      closeDialog(elements.successDialog);
      navigate("home");
      return;
    }

    if (event.target.closest("[data-success-orders]")) {
      closeDialog(elements.successDialog);
      state.activePanel = "orders";
      navigate("account");
      renderAccountDetail();
    }
  }

  function renderProducts() {
    if (!elements.productGrid) return;
    const query = state.query.toLocaleLowerCase("zh-CN");
    const items = Object.values(products).filter((product) => {
      const categoryMatch = state.filter === "all" || product.category === state.filter;
      const haystack = `${product.name} ${product.categoryName} ${product.description} ${product.tags.join(" ")}`.toLocaleLowerCase("zh-CN");
      return categoryMatch && (!query || haystack.includes(query));
    });

    if (!items.length) {
      elements.productGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1">
          <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
          <h3>没有找到对应好礼</h3>
          <p>换个关键词，或查看全部风土好礼。</p>
          <button class="mini-button" type="button" data-reset-filters>查看全部</button>
        </div>`;
      elements.productResultCount.textContent = "0 件好礼";
      return;
    }

    elements.productGrid.innerHTML = items.map((product) => {
      const image = product.images[0];
      const smallImage = smallImageSource(image.src);
      const selectedImage = window.matchMedia("(max-width: 820px)").matches ? smallImage : image.src;
      return `
        <article class="product-card">
          <button class="product-hit" type="button" data-product="${escapeHTML(product.id)}" aria-label="查看${escapeHTML(product.name)}"></button>
          <div class="product-card-media">
            <img src="${escapeHTML(selectedImage)}" alt="${escapeHTML(image.alt)}" width="1024" height="1536" loading="lazy" decoding="async">
          </div>
          <div class="product-card-body">
            <span class="product-card-category">${escapeHTML(product.categoryName)}</span>
            <h3>${escapeHTML(product.name)}</h3>
            <span class="product-card-price">${formatMoney(product.price)}</span>
            <p>${escapeHTML(product.description)}</p>
            <span class="product-card-cta">查看详情 <i class="ph ph-arrow-right" aria-hidden="true"></i></span>
          </div>
        </article>`;
    }).join("");
    elements.productResultCount.textContent = `${items.length} 件风土好礼`;
  }

  function openProduct(productId) {
    const product = products[productId];
    if (!product) return;
    state.selectedProductId = productId;
    state.selectedImageIndex = 0;
    state.detailQuantity = 1;

    document.getElementById("detailCategory").textContent = product.categoryName;
    document.getElementById("detailTitle").textContent = product.name;
    document.getElementById("detailPrice").textContent = formatMoney(product.price);
    document.getElementById("detailDescription").textContent = product.description;
    document.getElementById("detailTags").innerHTML = product.tags
      .map((tag) => `<span>${escapeHTML(tag)}</span>`)
      .join("");
    elements.detailThumbs.innerHTML = product.images.map((image, index) => `
      <button class="detail-thumb${index === 0 ? " is-active" : ""}" type="button" data-image-index="${index}" aria-label="查看商品图片 ${index + 1}">
        <img src="${escapeHTML(smallImageSource(image.src))}" alt="" width="80" height="96" loading="lazy" decoding="async">
      </button>`).join("");
    elements.detailThumbs.querySelectorAll("[data-image-index]").forEach((button) => {
      button.addEventListener("click", () => selectDetailImage(Number(button.dataset.imageIndex)));
    });

    selectDetailImage(0);
    updateDetailQuantity();
    updateFavoriteButton();
    openDialog(elements.productDialog);
  }

  function selectDetailImage(index) {
    const product = products[state.selectedProductId];
    if (!product || !product.images[index]) return;
    state.selectedImageIndex = index;
    const image = product.images[index];
    elements.detailImage.src = window.matchMedia("(max-width: 820px)").matches
      ? smallImageSource(image.src)
      : image.src;
    elements.detailImage.removeAttribute("srcset");
    elements.detailImage.removeAttribute("sizes");
    elements.detailImage.alt = image.alt;
    elements.detailThumbs.querySelectorAll("[data-image-index]").forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.imageIndex) === index);
    });
  }

  function changeDetailQuantity(delta) {
    state.detailQuantity = clamp(state.detailQuantity + delta, 1, 20);
    updateDetailQuantity();
  }

  function updateDetailQuantity() {
    elements.quantityValue.textContent = String(state.detailQuantity);
    document.getElementById("quantityMinus").disabled = state.detailQuantity <= 1;
    document.getElementById("quantityPlus").disabled = state.detailQuantity >= 20;
  }

  function updateFavoriteButton() {
    if (!elements.favoriteButton) return;
    const active = Boolean(state.selectedProductId && state.favorites.includes(state.selectedProductId));
    elements.favoriteButton.classList.toggle("is-active", active);
    elements.favoriteButton.setAttribute("aria-pressed", String(active));
    elements.favoriteButton.querySelector("span").textContent = active ? "已收藏" : "收藏";
  }

  function toggleFavorite() {
    if (!state.selectedProductId) return;
    const index = state.favorites.indexOf(state.selectedProductId);
    if (index >= 0) {
      state.favorites.splice(index, 1);
      showToast("已取消收藏。");
    } else {
      state.favorites.push(state.selectedProductId);
      showToast("已加入收藏。");
    }
    writeJSON(STORAGE_KEYS.favorites, state.favorites);
    updateFavoriteButton();
    renderAccount();
  }

  function addToCart(productId, quantity, goToCart) {
    const product = products[productId];
    if (!product) return;
    const existing = state.cart.find((item) => item.productId === productId);
    if (existing) {
      existing.quantity = clamp(existing.quantity + quantity, 1, 20);
    } else {
      state.cart.push({ productId, quantity: clamp(quantity, 1, 20) });
    }
    saveCart();
    showToast(`${product.name}已加入购物袋。`);
    if (goToCart) navigate("cart");
  }

  function updateCartQuantity(productId, quantity) {
    const item = state.cart.find((entry) => entry.productId === productId);
    if (!item) return;
    item.quantity = clamp(quantity, 1, 20);
    saveCart();
  }

  function removeCartItem(productId) {
    state.cart = state.cart.filter((item) => item.productId !== productId);
    saveCart();
    showToast("已从购物袋移除。");
  }

  function saveCart() {
    writeJSON(STORAGE_KEYS.cart, state.cart);
    updateCartCount();
    renderCart();
  }

  function updateCartCount() {
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = String(count > 99 ? "99+" : count);
    elements.cartCount.hidden = count === 0;
  }

  function renderCart() {
    if (!elements.cartItems) return;
    updateCartCount();
    const cartLines = state.cart
      .map((item) => {
        const product = products[item.productId];
        return product ? { ...item, product, subtotal: product.price * item.quantity } : null;
      })
      .filter(Boolean);
    const total = cartLines.reduce((sum, item) => sum + item.subtotal, 0);
    const quantity = cartLines.reduce((sum, item) => sum + item.quantity, 0);

    elements.cartItemCount.textContent = `${quantity} 件`;
    elements.cartSubtotal.textContent = formatMoney(total);
    elements.cartTotal.textContent = formatMoney(total);
    elements.checkoutButton.disabled = !cartLines.length;

    if (!cartLines.length) {
      elements.cartItems.innerHTML = `
        <div class="empty-state compact-empty">
          <i class="ph ph-shopping-bag" aria-hidden="true"></i>
          <h3>购物袋还是空的</h3>
          <p>从四款风土好礼里，挑一份适合此刻的心意。</p>
          <button class="mini-button" type="button" data-route="shop">去逛商城</button>
        </div>`;
    } else {
      elements.cartItems.innerHTML = cartLines.map((line) => {
        const image = line.product.images[0];
        return `
          <article class="cart-item">
            <img src="${escapeHTML(smallImageSource(image.src))}" alt="${escapeHTML(image.alt)}" width="84" height="104" loading="lazy" decoding="async">
            <div class="cart-item-copy">
              <span>${escapeHTML(line.product.categoryName)}</span>
              <h3>${escapeHTML(line.product.name)}</h3>
              <p>${escapeHTML(line.product.spec)}</p>
              <div class="cart-item-price">${formatMoney(line.subtotal)}</div>
            </div>
            <div class="cart-item-actions">
              <button class="cart-remove" type="button" data-cart-remove="${escapeHTML(line.productId)}" aria-label="移除${escapeHTML(line.product.name)}">
                <i class="ph ph-trash" aria-hidden="true"></i>
              </button>
              <div class="quantity-stepper">
                <button type="button" data-cart-quantity="${line.quantity - 1}" data-product-id="${escapeHTML(line.productId)}" aria-label="减少${escapeHTML(line.product.name)}数量" ${line.quantity <= 1 ? "disabled" : ""}>
                  <i class="ph ph-minus" aria-hidden="true"></i>
                </button>
                <output aria-label="当前数量">${line.quantity}</output>
                <button type="button" data-cart-quantity="${line.quantity + 1}" data-product-id="${escapeHTML(line.productId)}" aria-label="增加${escapeHTML(line.product.name)}数量" ${line.quantity >= 20 ? "disabled" : ""}>
                  <i class="ph ph-plus" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </article>`;
      }).join("");
    }

    renderCheckoutAddress();
    renderCartRecommendations(cartLines.map((line) => line.productId));
  }

  function renderCartRecommendations(cartProductIds) {
    if (!elements.cartRecommendations) return;
    const recommendations = Object.values(products)
      .filter((product) => !cartProductIds.includes(product.id))
      .slice(0, 2);
    elements.cartRecommendationsSection.hidden = recommendations.length === 0;
    elements.cartRecommendations.innerHTML = recommendations.map((product) => {
      const image = product.images[0];
      return `
        <article class="cart-recommendation-card">
          <button class="cart-recommendation-hit" type="button" data-product="${escapeHTML(product.id)}" aria-label="查看${escapeHTML(product.name)}"></button>
          <img src="${escapeHTML(smallImageSource(image.src))}" alt="${escapeHTML(image.alt)}" width="96" height="126" loading="lazy" decoding="async">
          <div class="cart-recommendation-copy">
            <span>${escapeHTML(product.categoryName)}</span>
            <h3>${escapeHTML(product.name)}</h3>
            <p>${escapeHTML(product.description)}</p>
            <strong>${formatMoney(product.price)}</strong>
          </div>
        </article>`;
    }).join("");
  }

  function renderCheckoutAddress() {
    if (!elements.checkoutAddress) return;
    elements.editAddressButton.textContent = state.user ? "新增地址" : "登录并添加";

    if (!state.user) {
      elements.checkoutAddress.innerHTML = `
        <div class="inline-empty">
          <i class="ph ph-user-circle" aria-hidden="true"></i>
          <p>登录账户后，收货地址会自动关联到订单。</p>
        </div>`;
      return;
    }

    if (!state.addresses.length) {
      elements.checkoutAddress.innerHTML = `
        <div class="inline-empty">
          <i class="ph ph-map-pin-plus" aria-hidden="true"></i>
          <p>还没有收货地址，请先添加一条配送信息。</p>
        </div>`;
      return;
    }

    if (!state.addresses.some((address) => address.id === state.selectedAddressId)) {
      const fallback = state.addresses.find((address) => address.isDefault) || state.addresses[0];
      state.selectedAddressId = fallback.id;
    }

    elements.checkoutAddress.innerHTML = `
      <div class="address-choice-list">
        ${state.addresses.map((address) => `
          <label class="address-choice">
            <input type="radio" name="deliveryAddress" value="${escapeHTML(address.id)}" ${address.id === state.selectedAddressId ? "checked" : ""}>
            <span>
              <strong>${escapeHTML(address.recipient)} ${maskPhone(address.phone)}</strong>
              <p>${escapeHTML(fullAddress(address))}</p>
            </span>
            ${address.isDefault ? '<span class="default-badge">默认</span>' : ""}
          </label>`).join("")}
      </div>`;

    elements.checkoutAddress.querySelectorAll('input[name="deliveryAddress"]').forEach((input) => {
      input.addEventListener("change", () => {
        state.selectedAddressId = input.value;
      });
    });
  }

  function renderAccount() {
    if (!state.user) {
      elements.signedOutCard.hidden = false;
      elements.accountDashboard.hidden = true;
      elements.accountTitle.textContent = "我的西葡秘酿";
      elements.accountLead.textContent = "管理收货地址、订单与收藏，查看属于你的风味记录。";
      renderAvatar(elements.headerAvatar, elements.headerAccountIcon, null);
      document.getElementById("openAccount").setAttribute("aria-label", "打开个人中心");
      return;
    }

    const greeting = greetingForCurrentTime();
    elements.signedOutCard.hidden = true;
    elements.accountDashboard.hidden = false;
    elements.accountTitle.textContent = `${greeting}，${state.user.name}`;
    elements.accountLead.textContent = "你的订单、地址和收藏都整理在这里。";
    elements.profileGreeting.textContent = "今天想为自己或重要的人挑一份心意？";
    elements.profileName.textContent = state.user.name;
    elements.profilePhone.textContent = maskPhone(state.user.phone);
    renderAvatar(elements.headerAvatar, elements.headerAccountIcon, state.user.avatar);
    renderAvatar(elements.profileAvatarImage, elements.profileAvatarText, state.user.avatar);
    if (!state.user.avatar) elements.profileAvatarText.textContent = getInitials(state.user.name);
    document.getElementById("openAccount").setAttribute("aria-label", `${state.user.name}的个人中心`);
    elements.statOrders.textContent = String(state.orders.length);
    elements.statAddresses.textContent = String(state.addresses.length);
    elements.statFavorites.textContent = String(state.favorites.length);
    renderAccountDetail();
  }

  function openProfileEditor() {
    if (!requireLogin()) return;
    state.profileAvatarDraft = normalizeAvatar(state.user.avatar);
    elements.profileNameInput.value = state.user.name;
    setProfileMessage("");
    renderProfileAvatarPreview();
    openDialog(elements.profileDialog);
  }

  function renderProfileAvatarPreview() {
    renderAvatar(elements.avatarPreviewImage, elements.avatarPreviewText, state.profileAvatarDraft);
    if (!state.profileAvatarDraft) {
      elements.avatarPreviewText.textContent = getInitials(state.user?.name || "西葡");
    }
    elements.removeAvatarButton.disabled = !state.profileAvatarDraft;
  }

  function setProfileMessage(message, type = "") {
    elements.profileMessage.textContent = message;
    elements.profileMessage.classList.toggle("is-success", type === "success");
  }

  async function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!String(file.type).startsWith("image/")) {
      setProfileMessage("请选择图片文件。");
      elements.avatarInput.value = "";
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setProfileMessage("图片超过15MB，请选择更小的图片。");
      elements.avatarInput.value = "";
      return;
    }

    setButtonBusy(elements.chooseAvatarButton, true);
    setProfileMessage("正在压缩并准备头像...");
    try {
      state.profileAvatarDraft = await resizeAvatarImage(file);
      renderProfileAvatarPreview();
      setProfileMessage("头像预览已更新，保存后生效。", "success");
    } catch (error) {
      setProfileMessage(error.message || "图片处理失败，请换一张图片。");
    } finally {
      setButtonBusy(elements.chooseAvatarButton, false);
      elements.avatarInput.value = "";
    }
  }

  function resizeAvatarImage(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        try {
          const sourceSize = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height);
          if (!sourceSize) throw new Error("无法读取这张图片。");
          const canvas = document.createElement("canvas");
          canvas.width = 384;
          canvas.height = 384;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("浏览器不支持图片处理。");
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          const sourceX = ((image.naturalWidth || image.width) - sourceSize) / 2;
          const sourceY = ((image.naturalHeight || image.height) - sourceSize) / 2;
          context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 384, 384);
          let dataUrl = canvas.toDataURL("image/webp", 0.82);
          if (dataUrl.length > 690000) {
            canvas.width = 256;
            canvas.height = 256;
            const smallerContext = canvas.getContext("2d");
            smallerContext.imageSmoothingQuality = "high";
            smallerContext.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 256, 256);
            dataUrl = canvas.toDataURL("image/webp", 0.72);
          }
          if (dataUrl.length > 700000) throw new Error("头像仍然过大，请换一张更小的图片。");
          resolve(normalizeAvatar(dataUrl));
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("这张图片格式暂不支持，请选择 JPG、PNG 或 WebP 图片。"));
      };
      image.src = objectUrl;
    });
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    if (!state.user) {
      closeDialog(elements.profileDialog);
      openAuth("login");
      return;
    }
    setProfileMessage("");
    const name = elements.profileNameInput.value.trim();
    if (name.length < 2 || name.length > 30) {
      setProfileMessage("用户名请输入2至30个字符。");
      return;
    }

    setButtonBusy(elements.profileSubmit, true);
    try {
      let user;
      if (state.backend) {
        const data = await apiRequest("/api/profile", {
          method: "PUT",
          body: JSON.stringify({ name, avatar: state.profileAvatarDraft || null }),
        });
        user = data.user;
      } else {
        user = updateDemoProfile(name, state.profileAvatarDraft || null);
      }
      state.user = user;
      closeDialog(elements.profileDialog);
      renderAll();
      showToast("个人资料已更新。");
    } catch (error) {
      setProfileMessage(error.message);
    } finally {
      setButtonBusy(elements.profileSubmit, false);
    }
  }

  function renderAccountDetail() {
    if (!state.user) return;
    if (state.activePanel === "addresses") {
      renderAccountAddresses();
    } else if (state.activePanel === "favorites") {
      renderAccountFavorites();
    } else {
      renderAccountOrders();
    }
  }

  function renderAccountOrders() {
    if (!state.orders.length) {
      elements.accountDetail.innerHTML = `
        <div class="account-detail-header"><h3>我的订单</h3></div>
        <div class="empty-state compact-empty">
          <i class="ph ph-receipt" aria-hidden="true"></i>
          <h3>还没有购买记录</h3>
          <p>挑一份喜欢的风土好礼，订单会在这里持续汇总。</p>
          <button class="mini-button" type="button" data-route="shop">去逛商城</button>
        </div>`;
      return;
    }

    elements.accountDetail.innerHTML = `
      <div class="account-detail-header"><h3>我的订单</h3><span class="item-count">${state.orders.length} 笔</span></div>
      <div class="detail-list">
        ${state.orders.map((order) => {
          const itemSummary = Array.isArray(order.items)
            ? order.items.map((item) => `${item.productName} × ${item.quantity}`).join("，")
            : "";
          return `
            <article class="detail-row">
              <div class="detail-row-main">
                <strong>${escapeHTML(order.orderNo)}</strong>
                <p>${escapeHTML(itemSummary || "订单商品")}</p>
                ${order.giftMessage ? `<p>祝福：${escapeHTML(order.giftMessage)}</p>` : ""}
                ${order.note ? `<p>备注：${escapeHTML(order.note)}</p>` : ""}
                <small>${formatDate(order.createdAt)}　${escapeHTML(orderStatusLabel(order.status))}</small>
              </div>
              <div class="detail-row-actions"><strong>${formatMoney(order.totalAmount)}</strong></div>
            </article>`;
        }).join("")}
      </div>`;
  }

  function renderAccountAddresses() {
    const list = state.addresses.length
      ? state.addresses.map((address) => `
          <article class="detail-row">
            <div class="detail-row-main">
              <strong>${escapeHTML(address.recipient)} ${maskPhone(address.phone)}${address.isDefault ? "（默认）" : ""}</strong>
              <p>${escapeHTML(fullAddress(address))}</p>
            </div>
            <div class="detail-row-actions">
              <button class="mini-button" type="button" data-address-edit="${escapeHTML(address.id)}">编辑</button>
              <button class="mini-button is-danger" type="button" data-address-delete="${escapeHTML(address.id)}">删除</button>
            </div>
          </article>`).join("")
      : `<div class="empty-state compact-empty">
          <i class="ph ph-map-pin" aria-hidden="true"></i>
          <h3>还没有收货地址</h3>
          <p>新增一条地址，下单时可以直接选用。</p>
        </div>`;

    elements.accountDetail.innerHTML = `
      <div class="account-detail-header">
        <h3>收货地址</h3>
        <button class="text-button" type="button" data-address-add>新增地址</button>
      </div>
      <div class="detail-list">${list}</div>`;
  }

  function renderAccountFavorites() {
    const favorites = state.favorites.map((id) => products[id]).filter(Boolean);
    const list = favorites.length
      ? favorites.map((product) => `
          <article class="detail-row">
            <div class="detail-row-main">
              <strong>${escapeHTML(product.name)}</strong>
              <p>${escapeHTML(product.categoryName)}　${escapeHTML(product.spec)}</p>
            </div>
            <div class="detail-row-actions">
              <button class="mini-button" type="button" data-product="${escapeHTML(product.id)}">查看商品</button>
            </div>
          </article>`).join("")
      : `<div class="empty-state compact-empty">
          <i class="ph ph-heart" aria-hidden="true"></i>
          <h3>收藏夹还是空的</h3>
          <p>打开商品详情，轻点收藏即可保存在这里。</p>
        </div>`;

    elements.accountDetail.innerHTML = `
      <div class="account-detail-header"><h3>我的收藏</h3><span class="item-count">${favorites.length} 件</span></div>
      <div class="detail-list">${list}</div>`;
  }

  function openAuth(tab = "login") {
    if (state.user) {
      navigate("account");
      return;
    }
    state.authTab = tab === "register" ? "register" : "login";
    switchAuthTab(state.authTab);
    elements.loginMessage.textContent = "";
    elements.registerMessage.textContent = "";
    updateModeUI();
    openDialog(elements.authDialog);
  }

  function switchAuthTab(tab) {
    state.authTab = tab;
    const loginActive = tab === "login";
    elements.loginForm.hidden = !loginActive;
    elements.registerForm.hidden = loginActive;
    elements.authTabs.forEach((button) => {
      const active = button.dataset.authTab === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    document.getElementById("authDialogTitle").textContent = loginActive ? "欢迎回来" : "创建你的账户";
  }

  async function handleLogin(event) {
    event.preventDefault();
    elements.loginMessage.textContent = "";
    const form = elements.loginForm;
    const phone = form.elements.phone.value.trim();
    const password = form.elements.password.value;
    if (!isPhone(phone)) {
      elements.loginMessage.textContent = "请输入有效的11位手机号。";
      return;
    }
    if (password.length < 8) {
      elements.loginMessage.textContent = "密码至少需要8位。";
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    setButtonBusy(button, true);
    try {
      let user;
      if (state.backend) {
        const data = await apiRequest("/api/login", {
          method: "POST",
          body: JSON.stringify({ phone, password }),
        });
        user = data.user;
      } else {
        user = await demoLogin(phone, password);
      }
      state.user = user;
      await refreshUserData();
      renderAll();
      closeDialog(elements.authDialog);
      form.reset();
      showToast(`欢迎回来，${user.name}。`);
      if (state.pendingCheckout) {
        state.pendingCheckout = false;
        navigate("cart");
      }
    } catch (error) {
      elements.loginMessage.textContent = error.message;
    } finally {
      setButtonBusy(button, false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    elements.registerMessage.textContent = "";
    const form = elements.registerForm;
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();
    const password = form.elements.password.value;
    const confirm = form.elements.confirm.value;
    const consent = form.elements.consent.checked;

    if (name.length < 2 || name.length > 30) {
      elements.registerMessage.textContent = "称呼请输入2至30个字符。";
      return;
    }
    if (!isPhone(phone)) {
      elements.registerMessage.textContent = "请输入有效的11位手机号。";
      return;
    }
    if (password.length < 8 || password.length > 64) {
      elements.registerMessage.textContent = "密码需要8至64位。";
      return;
    }
    if (password !== confirm) {
      elements.registerMessage.textContent = "两次输入的密码不一致。";
      return;
    }
    if (!consent) {
      elements.registerMessage.textContent = "请先确认隐私说明。";
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    setButtonBusy(button, true);
    try {
      let user;
      if (state.backend) {
        const data = await apiRequest("/api/register", {
          method: "POST",
          body: JSON.stringify({ name, phone, password, acceptedTerms: true }),
        });
        user = data.user;
      } else {
        user = await demoRegister(name, phone, password);
      }
      state.user = user;
      await refreshUserData();
      renderAll();
      closeDialog(elements.authDialog);
      form.reset();
      showToast("账户创建成功，请添加收货地址。");
      window.setTimeout(() => openAddressDialog(), 260);
    } catch (error) {
      elements.registerMessage.textContent = error.message;
    } finally {
      setButtonBusy(button, false);
    }
  }

  function requireLogin() {
    if (state.user) return true;
    openAuth("login");
    showToast("请先登录账户。");
    return false;
  }

  function openAddressDialog(addressId = null) {
    if (!requireLogin()) return;
    const address = addressId ? state.addresses.find((item) => item.id === addressId) : null;
    elements.addressForm.reset();
    elements.addressMessage.textContent = "";
    setLocationStatus("首次使用会请求定位权限，经纬度不会写入账户。");
    document.getElementById("addressId").value = address ? address.id : "";
    elements.addressDialogTitle.textContent = address ? "编辑收货地址" : "新增收货地址";

    if (address) {
      document.getElementById("recipientName").value = address.recipient;
      document.getElementById("recipientPhone").value = address.phone;
      document.getElementById("province").value = address.province;
      document.getElementById("city").value = address.city;
      document.getElementById("district").value = address.district;
      document.getElementById("addressDetail").value = address.detail;
      document.getElementById("addressDefault").checked = Boolean(address.isDefault);
    } else {
      document.getElementById("addressDefault").checked = state.addresses.length === 0;
      if (state.user) document.getElementById("recipientName").value = state.user.name;
    }
    openDialog(elements.addressDialog);
  }

  function setLocationStatus(message, type = "") {
    elements.locationStatus.textContent = message;
    elements.locationStatus.classList.toggle("is-success", type === "success");
    elements.locationStatus.classList.toggle("is-error", type === "error");
  }

  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("当前浏览器不支持定位，请手动填写地址。"));
        return;
      }
      if (!window.isSecureContext) {
        reject(new Error("定位需要 HTTPS 或 localhost 环境，请通过本地服务打开页面。"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      });
    });
  }

  async function lookupAddressByCoordinates(latitude, longitude) {
    if (state.backend) {
      const query = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
      });
      const data = await apiRequest(`/api/reverse-geocode?${query.toString()}`);
      return normalizeGeocodedAddress(data.address);
    }

    const adminQuery = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: "zh",
    });
    const detailQuery = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      limit: "1",
      lang: "en",
    });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const loadJson = async (url) => {
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("地址解析服务暂时不可用。");
        return response.json();
      };
      const [adminResult, detailResult] = await Promise.allSettled([
        loadJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?${adminQuery.toString()}`),
        loadJson(`https://photon.komoot.io/reverse?${detailQuery.toString()}`),
      ]);
      const adminPayload = adminResult.status === "fulfilled" ? adminResult.value : null;
      const detailPayload = detailResult.status === "fulfilled" ? detailResult.value : null;
      if (!adminPayload && !detailPayload) throw new Error("地址解析服务暂时不可用。");
      const adminAddress = normalizeGeocodedAddress(adminPayload);
      const detailAddress = normalizePhotonAddress(detailPayload);
      const merged = {
        province: adminAddress.province || detailAddress.province,
        city: adminAddress.city || detailAddress.city,
        district: adminAddress.district || detailAddress.district,
        detail: detailAddress.detail || adminAddress.detail,
      };
      if (!Object.values(merged).some(Boolean)) throw new Error("没有识别到可用地址，请手动填写。");
      return merged;
    } catch (error) {
      if (error.name === "AbortError") throw new Error("地址解析超时，请稍后重试或手动填写。");
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function normalizeGeocodedAddress(payload) {
    const raw = payload?.address && typeof payload.address === "object" ? payload.address : payload;
    if (!raw || typeof raw !== "object") {
      return { province: "", city: "", district: "", detail: "" };
    }
    const read = (...keys) => {
      for (const key of keys) {
        const value = String(raw[key] || "").trim();
        if (value) return value;
      }
      return "";
    };
    const province = read("province", "state", "principalSubdivision", "region");
    const city = read("city", "municipality", "state_district");
    const district = read("district", "county", "city_district", "locality", "suburb", "town", "village");
    const street = read("road", "pedestrian", "residential", "footway", "neighbourhood", "quarter");
    const houseNumber = read("house_number");
    let detail = `${street}${street && houseNumber ? ` ${houseNumber}` : ""}`.trim();
    if (!detail) detail = read("neighbourhood", "suburb", "town", "village");
    if (!detail) detail = String(payload?.display_name || payload?.displayName || "").trim();
    return {
      province: province.slice(0, 30),
      city: city.slice(0, 30),
      district: district.slice(0, 30),
      detail: detail.slice(0, 160),
    };
  }

  function normalizePhotonAddress(payload) {
    const feature = Array.isArray(payload?.features) ? payload.features[0] : null;
    const properties = feature?.properties;
    if (!properties || typeof properties !== "object") {
      return { province: "", city: "", district: "", detail: "" };
    }
    const street = String(properties.street || properties.name || properties.locality || "").trim();
    const houseNumber = String(properties.housenumber || "").trim();
    return {
      province: String(properties.state || "").trim().slice(0, 30),
      city: String(properties.city || properties.county || "").trim().slice(0, 30),
      district: String(properties.county || properties.district || properties.locality || "").trim().slice(0, 30),
      detail: `${street}${street && houseNumber ? ` ${houseNumber}` : ""}`.trim().slice(0, 160),
    };
  }

  async function locateCurrentAddress() {
    if (state.locationBusy) return;
    state.locationBusy = true;
    setButtonBusy(elements.locateAddressButton, true);
    setLocationStatus("正在请求浏览器定位权限...");
    try {
      const position = await getCurrentPosition();
      setLocationStatus("已获取位置，正在解析省市区和街道...");
      const address = await lookupAddressByCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );
      const form = elements.addressForm;
      if (address.province) form.elements.province.value = address.province;
      if (address.city) form.elements.city.value = address.city;
      if (address.district) form.elements.district.value = address.district;
      if (address.detail) form.elements.detail.value = address.detail;
      const missingAdmin = !address.province || !address.city || !address.district;
      const missingDetail = !address.detail;
      if (missingAdmin) {
        setLocationStatus("已获取真实定位，但部分省市区未识别，请手动补充后再保存。", "error");
      } else if (missingDetail) {
        setLocationStatus("省、市、区已自动填写，街道和门牌未识别，请补充详细地址。", "error");
      } else {
        setLocationStatus("真实位置已自动填写，请核对街道、楼栋和门牌号。地图数据：OpenStreetMap。", "success");
        showToast("当前位置已填写到收货地址。");
        form.elements.detail.focus({ preventScroll: true });
        form.elements.detail.select();
      }
    } catch (error) {
      const geolocationMessages = {
        1: "定位权限未开启，请在浏览器或系统设置中允许位置权限后重试。",
        2: "暂时无法获取当前位置，请检查网络或系统定位服务。",
        3: "定位超时，请移动到信号更好的位置后重试。",
      };
      setLocationStatus(geolocationMessages[error.code] || error.message || "定位失败，请手动填写地址。", "error");
    } finally {
      state.locationBusy = false;
      setButtonBusy(elements.locateAddressButton, false);
    }
  }

  async function handleAddressSubmit(event) {
    event.preventDefault();
    if (!state.user) {
      closeDialog(elements.addressDialog);
      openAuth("login");
      return;
    }

    elements.addressMessage.textContent = "";
    const form = elements.addressForm;
    const id = document.getElementById("addressId").value;
    const payload = {
      recipient: form.elements.recipient.value.trim(),
      phone: form.elements.phone.value.trim(),
      province: form.elements.province.value.trim(),
      city: form.elements.city.value.trim(),
      district: form.elements.district.value.trim(),
      detail: form.elements.detail.value.trim(),
      isDefault: form.elements.isDefault.checked,
    };

    if (payload.recipient.length < 1 || payload.recipient.length > 30) {
      elements.addressMessage.textContent = "请填写收货人姓名。";
      return;
    }
    if (!isPhone(payload.phone)) {
      elements.addressMessage.textContent = "请输入有效的收货手机号。";
      return;
    }
    if (!payload.province || !payload.city || !payload.district || payload.detail.length < 4) {
      elements.addressMessage.textContent = "请把省、市、区县和详细地址填写完整。";
      return;
    }

    const submitButton = document.getElementById("addressSubmit");
    setButtonBusy(submitButton, true);
    try {
      let saved;
      if (state.backend) {
        const data = await apiRequest(id ? `/api/addresses/${encodeURIComponent(id)}` : "/api/addresses", {
          method: id ? "PUT" : "POST",
          body: JSON.stringify(payload),
        });
        saved = data.address;
        await refreshAddresses();
      } else {
        saved = saveDemoAddress(id, payload);
        await refreshUserData();
      }
      state.selectedAddressId = saved?.id || state.selectedAddressId;
      closeDialog(elements.addressDialog);
      renderAll();
      showToast(id ? "收货地址已更新。" : "收货地址已保存。");
    } catch (error) {
      elements.addressMessage.textContent = error.message;
    } finally {
      setButtonBusy(submitButton, false);
    }
  }

  async function refreshAddresses() {
    if (!state.user) return;
    if (state.backend) {
      const data = await apiRequest("/api/addresses");
      state.addresses = Array.isArray(data.addresses) ? data.addresses : [];
    } else {
      const db = getDemoDb();
      state.addresses = Array.isArray(db.addresses[state.user.id]) ? db.addresses[state.user.id] : [];
    }
    const defaultAddress = state.addresses.find((address) => address.isDefault) || state.addresses[0];
    if (!state.addresses.some((address) => address.id === state.selectedAddressId)) {
      state.selectedAddressId = defaultAddress ? defaultAddress.id : null;
    }
    renderCart();
    renderAccount();
  }

  async function deleteAddress(addressId) {
    const address = state.addresses.find((item) => item.id === addressId);
    if (!address) return;
    if (!window.confirm(`确定删除“${address.recipient}”的收货地址吗？`)) return;
    try {
      if (state.backend) {
        await apiRequest(`/api/addresses/${encodeURIComponent(addressId)}`, { method: "DELETE" });
        await refreshAddresses();
      } else {
        const db = getDemoDb();
        const list = db.addresses[state.user.id] || [];
        db.addresses[state.user.id] = list.filter((item) => item.id !== addressId);
        if (db.addresses[state.user.id].length && !db.addresses[state.user.id].some((item) => item.isDefault)) {
          db.addresses[state.user.id][0].isDefault = true;
        }
        saveDemoDb(db);
        await refreshUserData();
      }
      renderAll();
      showToast("收货地址已删除。");
    } catch (error) {
      showToast(error.message);
    }
  }

  async function submitOrder() {
    if (!state.cart.length) {
      showToast("请先把喜欢的商品加入购物袋。");
      return;
    }
    if (!state.user) {
      state.pendingCheckout = true;
      openAuth("login");
      return;
    }
    if (!state.addresses.length) {
      openAddressDialog();
      showToast("请先添加收货地址。");
      return;
    }
    const address = state.addresses.find((item) => item.id === state.selectedAddressId)
      || state.addresses.find((item) => item.isDefault)
      || state.addresses[0];
    state.selectedAddressId = address.id;
    const note = elements.orderNote.value.trim();
    const giftMessage = elements.giftCardToggle.checked ? elements.giftMessage.value.trim() : "";
    if (elements.giftCardToggle.checked && !giftMessage) {
      showToast("请填写祝福留言，或关闭赠礼祝福。");
      elements.giftMessage.focus();
      return;
    }

    setButtonBusy(elements.checkoutButton, true);
    try {
      let order;
      if (state.backend) {
        const data = await apiRequest("/api/orders", {
          method: "POST",
          body: JSON.stringify({
            addressId: address.id,
            items: state.cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
            note,
            giftMessage: giftMessage || null,
          }),
        });
        order = data.order;
        await refreshUserData();
      } else {
        order = saveDemoOrder(address, { note, giftMessage: giftMessage || null });
        await refreshUserData();
      }
      state.cart = [];
      saveCart();
      resetCheckoutPreferences();
      renderAll();
      elements.successOrderNo.textContent = order.orderNo;
      openDialog(elements.successDialog);
    } catch (error) {
      showToast(error.message);
    } finally {
      setButtonBusy(elements.checkoutButton, false);
      elements.checkoutButton.disabled = state.cart.length === 0;
    }
  }

  function resetCheckoutPreferences() {
    elements.giftCardToggle.checked = false;
    elements.giftMessage.value = "";
    elements.giftMessageField.hidden = true;
    elements.orderNote.value = "";
  }

  async function handleBusinessSubmit(event) {
    event.preventDefault();
    elements.businessMessage.textContent = "";
    elements.businessMessage.classList.remove("is-success");
    const form = elements.businessForm;
    const payload = {
      company: form.elements.company.value.trim(),
      contact: form.elements.contact.value.trim(),
      phone: form.elements.phone.value.trim(),
      quantity: Number(form.elements.quantity.value),
      message: form.elements.message.value.trim(),
    };
    if (!payload.company || !payload.contact) {
      elements.businessMessage.textContent = "请填写企业名称与联系人。";
      return;
    }
    if (!isPhone(payload.phone)) {
      elements.businessMessage.textContent = "请输入有效的11位手机号。";
      return;
    }
    if (!Number.isInteger(payload.quantity) || payload.quantity < 1) {
      elements.businessMessage.textContent = "采购数量请输入大于0的整数。";
      return;
    }

    const button = document.getElementById("businessSubmit");
    setButtonBusy(button, true);
    try {
      if (state.backend) {
        await apiRequest("/api/inquiries", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        const db = getDemoDb();
        db.inquiries.push({
          id: randomId("inq"),
          ...payload,
          createdAt: new Date().toISOString(),
        });
        saveDemoDb(db);
      }
      form.reset();
      elements.businessMessage.textContent = "采购意向已提交，商务团队会尽快联系你。";
      elements.businessMessage.classList.add("is-success");
    } catch (error) {
      elements.businessMessage.textContent = error.message;
    } finally {
      setButtonBusy(button, false);
    }
  }

  async function logout() {
    try {
      if (state.backend) {
        await apiRequest("/api/logout", { method: "POST", body: "{}" });
      } else {
        removeStorage(STORAGE_KEYS.demoSession);
      }
    } catch {
      removeStorage(STORAGE_KEYS.demoSession);
    }
    state.user = null;
    state.addresses = [];
    state.orders = [];
    state.selectedAddressId = null;
    renderAll();
    showToast("已安全退出账户。");
  }

  async function demoRegister(name, phone, password) {
    const db = getDemoDb();
    if (db.users.some((user) => user.phone === phone)) {
      throw new Error("该手机号已经注册，请直接登录。");
    }
    const user = {
      id: randomId("user"),
      name,
      phone,
      passwordHash: await hashDemoPassword(password),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.addresses[user.id] = [];
    db.orders[user.id] = [];
    saveDemoDb(db);
    writeStorage(STORAGE_KEYS.demoSession, user.id);
    return publicUser(user);
  }

  async function demoLogin(phone, password) {
    const db = getDemoDb();
    const user = db.users.find((entry) => entry.phone === phone);
    if (!user) throw new Error("手机号或密码不正确。");
    const passwordHash = await hashDemoPassword(password);
    if (passwordHash !== user.passwordHash) throw new Error("手机号或密码不正确。");
    writeStorage(STORAGE_KEYS.demoSession, user.id);
    return publicUser(user);
  }

  function updateDemoProfile(name, avatar) {
    const db = getDemoDb();
    const user = db.users.find((entry) => entry.id === state.user.id);
    if (!user) throw new Error("账户信息不存在，请重新登录。");
    user.name = name;
    user.avatar = avatar;
    saveDemoDb(db);
    return publicUser(user);
  }

  function saveDemoAddress(id, payload) {
    const db = getDemoDb();
    const list = Array.isArray(db.addresses[state.user.id]) ? db.addresses[state.user.id] : [];
    if (payload.isDefault || list.length === 0) {
      list.forEach((address) => {
        address.isDefault = false;
      });
      payload.isDefault = true;
    }

    let saved;
    if (id) {
      const index = list.findIndex((address) => address.id === id);
      if (index < 0) throw new Error("收货地址不存在。");
      saved = { ...list[index], ...payload, updatedAt: new Date().toISOString() };
      list[index] = saved;
    } else {
      saved = {
        id: randomId("addr"),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      list.push(saved);
    }
    db.addresses[state.user.id] = list;
    saveDemoDb(db);
    return saved;
  }

  function saveDemoOrder(address, preferences = {}) {
    const db = getDemoDb();
    const now = new Date();
    const orderNo = `MS${compactDate(now)}${randomDigits(4)}`;
    const items = state.cart.map((line) => {
      const product = products[line.productId];
      return {
        productId: line.productId,
        productName: product.name,
        unitPrice: product.price,
        quantity: line.quantity,
        subtotal: product.price * line.quantity,
      };
    });
    const order = {
      id: randomId("order"),
      orderNo,
      totalAmount: items.reduce((sum, item) => sum + item.subtotal, 0),
      status: "pending",
      createdAt: now.toISOString(),
      note: preferences.note || null,
      giftMessage: preferences.giftMessage || null,
      address: {
        recipient: address.recipient,
        phone: address.phone,
        fullAddress: fullAddress(address),
      },
      items,
    };
    if (!Array.isArray(db.orders[state.user.id])) db.orders[state.user.id] = [];
    db.orders[state.user.id].unshift(order);
    saveDemoDb(db);
    return order;
  }

  function toggleAccordion(button) {
    const item = button.closest(".accordion-item");
    const nextOpen = !item.classList.contains("is-open");
    item.classList.toggle("is-open", nextOpen);
    button.setAttribute("aria-expanded", String(nextOpen));
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    if (panel) {
      panel.setAttribute("aria-hidden", String(!nextOpen));
      panel.inert = !nextOpen;
    }
  }

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    syncDialogState();
  }

  function closeDialog(dialog) {
    if (!dialog || !dialog.open) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    syncDialogState();
  }

  function syncDialogState() {
    document.body.classList.toggle("modal-open", Boolean(document.querySelector("dialog[open]")));
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 2800);
  }

  function setButtonBusy(button, busy) {
    if (!button) return;
    if (busy) {
      button.dataset.originalHtml = button.innerHTML;
      button.classList.add("is-loading");
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      const icon = button.querySelector("i");
      if (icon) icon.className = "ph ph-circle-notch";
    } else {
      button.classList.remove("is-loading");
      button.disabled = false;
      button.removeAttribute("aria-busy");
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
      }
    }
  }

  function getDemoDb() {
    const parsed = readJSON(STORAGE_KEYS.demoDb, null);
    const db = parsed && typeof parsed === "object" ? parsed : {};
    return {
      users: Array.isArray(db.users) ? db.users : [],
      addresses: db.addresses && typeof db.addresses === "object" ? db.addresses : {},
      orders: db.orders && typeof db.orders === "object" ? db.orders : {},
      inquiries: Array.isArray(db.inquiries) ? db.inquiries : [],
    };
  }

  function saveDemoDb(db) {
    writeJSON(STORAGE_KEYS.demoDb, {
      users: Array.isArray(db.users) ? db.users : [],
      addresses: db.addresses && typeof db.addresses === "object" ? db.addresses : {},
      orders: db.orders && typeof db.orders === "object" ? db.orders : {},
      inquiries: Array.isArray(db.inquiries) ? db.inquiries : [],
    });
  }

  async function hashDemoPassword(password) {
    // ponytail: demo-only client hash; real accounts always use Werkzeug hashing through app.py.
    if (window.crypto?.subtle) {
      const data = new TextEncoder().encode(`musales-demo:${password}`);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    let hash = 2166136261;
    const text = `musales-demo:${password}`;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fallback-${(hash >>> 0).toString(16)}`;
  }

  function publicUser(user) {
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      avatar: normalizeAvatar(user.avatar || user.avatar_data),
    };
  }

  function normalizeCart(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item && products[item.productId])
      .map((item) => ({
        productId: item.productId,
        quantity: clamp(Number(item.quantity) || 1, 1, 20),
      }));
  }

  function normalizeFavorites(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id) => products[id]))];
  }

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The current interaction can continue in memory if storage is unavailable.
    }
  }

  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage restrictions in private browsing.
    }
  }

  function removeStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage restrictions in private browsing.
    }
  }

  function formatMoney(value) {
    return `¥${Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;
  }

  function smallImageSource(src) {
    return String(src).replace(/\.webp$/i, "-480.webp");
  }

  function maskPhone(phone) {
    const value = String(phone || "");
    return /^1[3-9]\d{9}$/.test(value) ? `${value.slice(0, 3)}****${value.slice(-4)}` : value;
  }

  function fullAddress(address) {
    return `${address.province || ""}${address.city || ""}${address.district || ""}${address.detail || ""}`;
  }

  function getInitials(name) {
    const text = String(name || "西葡").trim();
    return text.slice(0, 2);
  }

  function normalizeAvatar(value) {
    return typeof value === "string" && /^data:image\/(?:png|jpeg|webp);base64,/.test(value)
      ? value
      : null;
  }

  function renderAvatar(imageElement, fallbackElement, avatar) {
    const safeAvatar = normalizeAvatar(avatar);
    if (safeAvatar) {
      imageElement.src = safeAvatar;
      imageElement.hidden = false;
      fallbackElement.hidden = true;
      return;
    }
    imageElement.removeAttribute("src");
    imageElement.hidden = true;
    fallbackElement.hidden = false;
  }

  function greetingForCurrentTime() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "早上好";
    if (hour >= 11 && hour < 14) return "中午好";
    if (hour >= 14 && hour < 18) return "下午好";
    if (hour >= 18 && hour < 23) return "晚上好";
    return "夜深了";
  }

  function isPhone(value) {
    return /^1[3-9]\d{9}$/.test(value);
  }

  function orderStatusLabel(status) {
    const labels = {
      pending: "待处理",
      paid: "已支付",
      shipped: "配送中",
      completed: "已完成",
      cancelled: "已取消",
    };
    return labels[status] || "待处理";
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "时间待确认";
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function compactDate(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${String(date.getFullYear()).slice(-2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function randomDigits(length) {
    let value = "";
    for (let index = 0; index < length; index += 1) {
      value += Math.floor(Math.random() * 10);
    }
    return value;
  }

  function randomId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${randomDigits(6)}`;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
})();
