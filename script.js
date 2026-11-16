(() => {
  "use strict";

  const products = [
    {
      id: "jbl305",
      name: "JBL 305P MKII",
      type: "Студийный монитор",
      category: "sound",
      price: 132000,
      image: "assets/jbl.webp",
      description:
        "Активный студийный монитор для прослушивания и работы со звуком. Подойдёт для домашней студии и рабочего места музыканта.",
    },
    {
      id: "hf125",
      name: "NUMARK HF125 DJ",
      type: "Наушники",
      category: "sound",
      price: 12000,
      image: "assets/numark.jpg",
      description:
        "Проводные наушники для диджеев и прослушивания музыки. Закрытая конструкция, регулируемое оголовье.",
    },
    {
      id: "c1u",
      name: "Конденсаторный USB микрофон BEHRINGER C1U",
      type: "USB-микрофон",
      category: "microphones",
      price: 38500,
      image: "assets/behringer.png",
      description:
        "Конденсаторный USB-микрофон для записи голоса, музыки и подкастов. Подключается непосредственно к компьютеру.",
    },
    {
      id: "wms40dual",
      name: "Радиомикрофон AKG WMS40 Mini2 Vocal Set",
      type: "Радиосистема",
      category: "microphones",
      price: 175900,
      image: "assets/akg-dual-product.jpg",
      description:
        "Вокальная радиосистема с двумя ручными микрофонами и приёмником. Для выступлений, презентаций и мероприятий.",
    },
    {
      id: "wms40",
      name: "Радиомикрофон AKG WMS40 PRO MINI",
      type: "Радиосистема",
      category: "microphones",
      price: 105900,
      image: "assets/akg-single.jpg",
      description:
        "Компактная вокальная радиосистема с ручным микрофоном и приёмником. Свобода движения во время выступления.",
    },
    {
      id: "f310",
      name: "Акустическая гитара YAMAHA F310",
      type: "Акустическая гитара",
      category: "instruments",
      price: 78500,
      image: "assets/yamaha-f310.jpg",
      description:
        "Шестиструнная акустическая гитара в натуральном цвете. Классическая форма корпуса и стальные струны — для первых аккордов и любимых песен.",
    },
  ];
  const categoryNames = {
    all: "Все товары",
    instruments: "Музыкальные инструменты",
    sound: "Звуковое оборудование",
    microphones: "Микрофоны",
    light: "Световое оборудование",
  };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const money = (value) => new Intl.NumberFormat("ru-RU").format(value) + " ₸";
  const icon = (name) =>
    `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const state = {
    category: "all",
    query: "",
    sort: "popular",
    catalogMode: false,
  };
  const storageKey = "muzpetro-redesign-cart-v1";
  let cart = {};
  let toastTimeout;
  let returnFocus;

  // Persist only known products and bounded positive integer quantities.
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      for (const product of products) {
        if (Number.isInteger(stored[product.id]) && stored[product.id] > 0)
          cart[product.id] = Math.min(99, stored[product.id]);
      }
    }
  } catch {
    /* The demo also works when browser storage is unavailable. */
  }

  function showToast(message) {
    $("#toast-text").textContent = message;
    $("#toast").classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => $("#toast").classList.remove("show"), 2600);
  }

  function saveCart() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      /* Storage may be disabled. */
    }
    updateCartCount();
  }

  function updateCartCount() {
    const count = Object.values(cart).reduce(
      (sum, quantity) => sum + quantity,
      0,
    );
    $("#cart-count").textContent = count;
    $("#cart-trigger").setAttribute("aria-label", `Корзина, товаров: ${count}`);
    $("#cart-title-count").textContent = count ? ` / ${count}` : "";
  }

  function addToCart(id, button) {
    if (!products.some((product) => product.id === id)) return;
    if ((cart[id] || 0) >= 99) {
      showToast("В корзине уже 99 штук этого товара");
      return;
    }
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    showToast("Товар добавлен в корзину");
    if (button) {
      const original = button.innerHTML;
      button.classList.add("added");
      button.innerHTML = `${icon("check")} Добавлено`;
      button.disabled = true;
      setTimeout(() => {
        button.innerHTML = original;
        button.classList.remove("added");
        button.disabled = false;
      }, 900);
    }
  }

  function renderProducts() {
    const query = state.query.trim().toLocaleLowerCase("ru");
    let visible = products.filter(
      (product) =>
        (state.category === "all" || product.category === state.category) &&
        `${product.name} ${product.type}`
          .toLocaleLowerCase("ru")
          .includes(query),
    );
    if (state.sort === "price-asc") visible.sort((a, b) => a.price - b.price);
    if (state.sort === "price-desc") visible.sort((a, b) => b.price - a.price);
    if (state.sort === "name")
      visible.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    $("#products-grid").innerHTML = visible
      .map(
        (product) => `
      <article class="product-card">
        <span class="product-type">${product.type}</span>
        <button class="product-visual" data-product="${product.id}" aria-label="Подробнее: ${product.name}"><img src="${product.image}" alt="${product.name}" width="320" height="240" loading="lazy"></button>
        <span class="product-status">В наличии</span>
        <h3><button class="product-name" data-product="${product.id}">${product.name}</button></h3>
        <div class="product-bottom"><span class="product-price">${money(product.price)}</span><button class="add-to-cart" data-add="${product.id}" aria-label="Добавить в корзину: ${product.name}">${icon("cart")} В корзину</button></div>
      </article>`,
      )
      .join("");
    $("#empty-state").hidden = visible.length !== 0;
    const lightEmpty = state.category === "light" && !query;
    $("#empty-title").textContent = lightEmpty
      ? "Подберём свет для вашей сцены"
      : "Пока ничего не нашлось";
    $("#empty-description").textContent = lightEmpty
      ? "В демонстрационной подборке нет светового оборудования. Уточните ассортимент у консультанта."
      : "Попробуйте другое название или выберите другую категорию.";
    $("#catalog-title").textContent = query
      ? "Результаты поиска"
      : state.category !== "all"
        ? categoryNames[state.category]
        : state.catalogMode
          ? "Каталог товаров"
          : "Хиты продаж";
    $("#catalog-controls").hidden = !state.catalogMode;
    $("#all-products").hidden = state.catalogMode;
    $("#search-summary").hidden = !query;
    // Search text is user input: always insert through textContent.
    $("#search-summary").textContent = query
      ? `По запросу «${state.query.trim()}»: ${visible.length}`
      : "";
    $$(".filter-chip").forEach((button) => {
      const selected = button.dataset.filter === state.category;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function closeMenus() {
    $$(".nav-dropdown-trigger").forEach((button) => {
      button.setAttribute("aria-expanded", "false");
      document.getElementById(button.getAttribute("aria-controls")).hidden =
        true;
    });
    $("#main-nav").classList.remove("mobile-open");
    $("#menu-trigger").setAttribute("aria-expanded", "false");
    $("#menu-trigger").setAttribute("aria-label", "Открыть меню");
  }

  function showCatalog(category = "all", reset = true) {
    state.category = category;
    state.catalogMode = true;
    if (reset) {
      state.query = "";
      $("#search-input").value = "";
    }
    renderProducts();
    closeMenus();
    $("#catalog").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openDialog(dialog) {
    closeMenus();
    const current = $("dialog[open]");
    if (current) current.close();
    else returnFocus = document.activeElement;
    dialog.showModal();
    document.body.classList.add("modal-open");
  }

  function renderCart(focusKey) {
    const entries = products.filter((product) => cart[product.id]);
    $("#cart-summary").hidden = entries.length === 0;
    if (!entries.length) {
      $("#cart-items").innerHTML =
        `<div class="cart-empty">${icon("cart")}<p>Здесь пока тихо. Добавьте первый инструмент!</p><button class="button button-outline" data-continue>Перейти к товарам</button></div>`;
      if (focusKey) $("[data-continue]").focus();
      return;
    }
    $("#cart-items").innerHTML = entries
      .map(
        (product) =>
          `<div class="cart-item"><img src="${product.image}" alt="${product.name}" width="75" height="85"><div><p class="cart-item-name">${product.name}</p><p class="cart-item-price">${money(product.price * cart[product.id])}</p><div class="quantity-controls"><button data-quantity="${product.id}" data-delta="-1" aria-label="Уменьшить количество ${product.name}">−</button><span aria-label="Количество">${cart[product.id]}</span><button data-quantity="${product.id}" data-delta="1" aria-label="Увеличить количество ${product.name}">+</button></div></div><button class="icon-button remove-item" data-remove="${product.id}" aria-label="Удалить ${product.name}">${icon("close")}</button></div>`,
      )
      .join("");
    const total = entries.reduce(
      (sum, product) => sum + product.price * cart[product.id],
      0,
    );
    $("#cart-total").textContent = money(total);
    const message = `Здравствуйте! Хочу уточнить наличие и цены:\n\n${entries.map((product) => `${product.name} — ${cart[product.id]} шт. × ${money(product.price)}`).join("\n")}\n\nСумма в демонстрационном макете: ${money(total)}. Подтвердите, пожалуйста, актуальную стоимость.`;
    $("#checkout-link").href =
      `https://wa.me/77072944473?text=${encodeURIComponent(message)}`;
    if (focusKey) {
      const target = $(
        `#cart-items [data-quantity="${focusKey.id}"][data-delta="${focusKey.delta}"]`,
      );
      (
        target ||
        $("#cart-items button") ||
        $("#cart-dialog [data-close-dialog]")
      ).focus();
    }
  }

  function openProduct(id) {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    $("#product-dialog-content").innerHTML =
      `<div class="product-detail"><img src="${product.image}" alt="${product.name}" width="320" height="320"><div><span class="product-status">В наличии</span><h2 id="product-dialog-title">${product.name}</h2><p>${product.description}</p><p>Цена и наличие демонстрационные. Уточните актуальные данные в салоне.</p><strong class="product-price">${money(product.price)}</strong><button class="button button-primary" data-add="${product.id}">${icon("cart")} В корзину</button></div></div>`;
    openDialog($("#product-dialog"));
  }

  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    if (add) {
      addToCart(add.dataset.add, add);
      return;
    }
    const product = event.target.closest("[data-product]");
    if (product) {
      openProduct(product.dataset.product);
      return;
    }
    const filter = event.target.closest("[data-filter]");
    if (filter) {
      event.preventDefault();
      showCatalog(filter.dataset.filter);
      return;
    }
    if (event.target.closest("[data-contact]")) {
      openDialog($("#contact-dialog"));
      return;
    }
    const close = event.target.closest("[data-close-dialog]");
    if (close) {
      close.closest("dialog").close();
      return;
    }
    if (event.target.closest("[data-continue]")) {
      $("#cart-dialog").close();
      showCatalog();
      return;
    }
    const quantity = event.target.closest("[data-quantity]");
    if (quantity) {
      const id = quantity.dataset.quantity;
      const delta = Number(quantity.dataset.delta);
      cart[id] = Math.min(99, cart[id] + delta);
      if (cart[id] <= 0) delete cart[id];
      saveCart();
      renderCart({ id, delta });
      return;
    }
    const remove = event.target.closest("[data-remove]");
    if (remove) {
      delete cart[remove.dataset.remove];
      saveCart();
      renderCart({ id: remove.dataset.remove, delta: -1 });
      return;
    }
    const dropdown = event.target.closest(".nav-dropdown-trigger");
    if (dropdown) {
      const expanded = dropdown.getAttribute("aria-expanded") === "true";
      $$(".nav-dropdown-trigger").forEach((button) => {
        button.setAttribute("aria-expanded", "false");
        document.getElementById(button.getAttribute("aria-controls")).hidden =
          true;
      });
      dropdown.setAttribute("aria-expanded", String(!expanded));
      document.getElementById(dropdown.getAttribute("aria-controls")).hidden =
        expanded;
      return;
    }
    if (!event.target.closest(".site-header")) closeMenus();
    if (event.target.closest("#main-nav > a")) closeMenus();
  });

  $("#menu-trigger").addEventListener("click", () => {
    const open = $("#main-nav").classList.toggle("mobile-open");
    $("#menu-trigger").setAttribute("aria-expanded", String(open));
    $("#menu-trigger").setAttribute(
      "aria-label",
      open ? "Закрыть меню" : "Открыть меню",
    );
  });
  $("#cart-trigger").addEventListener("click", () => {
    renderCart();
    openDialog($("#cart-dialog"));
  });
  $("#clear-cart").addEventListener("click", () => {
    cart = {};
    saveCart();
    renderCart({ id: "", delta: 0 });
    showToast("Корзина очищена");
  });
  $("#all-products").addEventListener("click", () => showCatalog());
  $("#hero-catalog").addEventListener("click", (event) => {
    event.preventDefault();
    showCatalog();
  });
  $("#reset-search").addEventListener("click", () => showCatalog());
  $("#search-input").addEventListener("input", (event) => {
    state.query = event.target.value;
    state.category = "all";
    state.catalogMode = true;
    renderProducts();
  });
  $("#search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    $("#search-input").blur();
    showCatalog("all", false);
  });
  $("#sort-select").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });

  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        dialog.close();
    });
    dialog.addEventListener("close", () => {
      if (!$("dialog[open]")) {
        document.body.classList.remove("modal-open");
        if (returnFocus?.isConnected)
          returnFocus.focus({ preventScroll: true });
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenus();
    if (
      event.key === "/" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !event.target.matches("input,textarea,select,[contenteditable]") &&
      !$("dialog[open]")
    ) {
      event.preventDefault();
      $("#search-input").focus();
    }
  });

  // The line deformation is baked offline into one small silent video.
  const hero = $(".hero");
  const waveVideo = $(".sound-wave");
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  let heroInView = !("IntersectionObserver" in window);
  const updateWavePlayback = () => {
    const shouldPlay =
      heroInView && !document.hidden && !motionPreference.matches;
    if (!shouldPlay) {
      waveVideo.pause();
      return;
    }
    if (!waveVideo.getAttribute("src")) waveVideo.src = waveVideo.dataset.src;
    waveVideo.muted = true;
    waveVideo.play().catch(() => {
      // Autoplay restrictions leave a still frame; the rest of the page works.
    });
  };
  waveVideo.addEventListener("playing", () => {
    waveVideo.dataset.playback = "playing";
  });
  waveVideo.addEventListener("pause", () => {
    waveVideo.dataset.playback = "paused";
  });
  if ("IntersectionObserver" in window) {
    const heroObserver = new IntersectionObserver(([entry]) => {
      heroInView = entry.isIntersecting;
      updateWavePlayback();
    });
    heroObserver.observe(hero);
  }
  document.addEventListener("visibilitychange", updateWavePlayback);
  motionPreference.addEventListener("change", updateWavePlayback);
  updateWavePlayback();

  // Mobile categories enter once as they reach the viewport; no scroll loop.
  const categoryCards = $$(".categories .category-card");
  const mobileCategories = window.matchMedia("(max-width: 650px)");
  if (
    "IntersectionObserver" in window &&
    mobileCategories.matches &&
    !motionPreference.matches
  ) {
    const finishCategoryReveal = (card) => {
      card.classList.remove("category-reveal-pending", "category-revealing");
      card.style.removeProperty("--category-delay");
      card.dataset.categoryRevealed = "true";
    };
    const categoryObserver = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((entry) => entry.isIntersecting);
        entering.forEach(({ target: card }, index) => {
          card.style.setProperty("--category-delay", `${index * 90}ms`);
          card.classList.remove("category-reveal-pending");
          card.classList.add("category-revealing");
          card.dataset.categoryRevealed = "true";
          categoryObserver.unobserve(card);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -48px 0px" },
    );

    categoryCards.forEach((card) => {
      card.classList.add("category-reveal-pending");
      card.addEventListener("animationend", (event) => {
        if (event.target === card && event.animationName === "category-enter") {
          finishCategoryReveal(card);
        }
      });
      card.addEventListener("focus", () => {
        categoryObserver.unobserve(card);
        finishCategoryReveal(card);
      });
      categoryObserver.observe(card);
    });
    const stopCategoryReveals = () => {
      if (motionPreference.matches || !mobileCategories.matches) {
        categoryObserver.disconnect();
        categoryCards.forEach(finishCategoryReveal);
      }
    };
    motionPreference.addEventListener("change", stopCategoryReveals);
    mobileCategories.addEventListener("change", stopCategoryReveals);
  }
  $("#year").textContent = new Date().getFullYear();
  renderProducts();
  updateCartCount();
})();
