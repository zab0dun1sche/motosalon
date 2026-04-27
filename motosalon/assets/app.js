const DATA_URL = "data/products.json";

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function rubles(value) {
  try {
    return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
  } catch {
    return String(value) + " ₽";
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadData() {
  if (window.__MOTOSALON_DATA__) return window.__MOTOSALON_DATA__;
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Не удалось загрузить каталог");
  return await res.json();
}

function setCompanyContacts(company) {
  $all("[data-company-phone]").forEach((el) => (el.textContent = company.phone));
  $all("[data-company-email]").forEach((el) => (el.textContent = company.email));
  $all("[data-company-address]").forEach((el) => (el.textContent = company.address));

  $all("[data-company-phone-link]").forEach((el) => (el.href = "tel:" + company.phone.replace(/[^\d+]/g, "")));
  $all("[data-company-email-link]").forEach((el) => (el.href = "mailto:" + company.email));
}

function productCardHtml(p) {
  const img = p.images?.[0] ?? "";
  const stockBadge = p.inStock
    ? `<span class="badge">В наличии</span>`
    : `<span class="badge">Нет в наличии</span>`;

  return `
  <article class="card product-card">
    <a class="product-card__media" href="product.html?id=${encodeURIComponent(p.id)}" aria-label="Открыть ${escapeHtml(p.name)}">
      <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy">
    </a>
    <div class="product-card__body">
      <h3 class="product-card__name">${escapeHtml(p.name)}</h3>
      <div class="product-card__meta">
        <div class="price">${rubles(p.price)}</div>
        ${stockBadge}
      </div>
      <div class="muted small" style="margin-top:8px">${escapeHtml(p.short ?? "")}</div>
      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap">
        <a class="btn btn--ghost" href="product.html?id=${encodeURIComponent(p.id)}">Подробнее</a>
        <a class="btn btn--accent" href="contacts.html?product=${encodeURIComponent(p.name)}">Заказать</a>
      </div>
    </div>
  </article>`;
}

function fillCategorySelect(selectEl, categories) {
  selectEl.innerHTML = `
    <option value="all">Все категории</option>
    ${categories
      .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`)
      .join("")}
  `;
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function renderHome(data) {
  setCompanyContacts(data.company);

  const list = $("#popularList");
  if (!list) return;

  const popular = data.popularIds
    .map((id) => data.products.find((p) => p.id === id))
    .filter(Boolean);

  list.innerHTML = popular.map(productCardHtml).join("");
}

function renderCatalog(data) {
  setCompanyContacts(data.company);

  const list = $("#catalogList");
  const select = $("#categorySelect");
  const count = $("#catalogCount");
  if (!list || !select) return;

  fillCategorySelect(select, data.categories);

  const initial = getQueryParam("category");
  if (initial) select.value = initial;

  const apply = () => {
    const cat = select.value;
    const items = cat === "all" ? data.products : data.products.filter((p) => p.category === cat);
    list.innerHTML = items.map(productCardHtml).join("");
    if (count) count.textContent = String(items.length);
  };

  select.addEventListener("change", apply);
  apply();
}

function renderProduct(data) {
  setCompanyContacts(data.company);

  const id = getQueryParam("id");
  const root = $("#productRoot");
  if (!root) return;

  const p = data.products.find((x) => x.id === id);
  if (!p) {
    root.innerHTML = `<div class="alert alert--bad">Товар не найден. Вернитесь в <a class="btn btn--ghost" href="catalog.html">каталог</a>.</div>`;
    return;
  }

  const mainImg = p.images?.[0] ?? "";
  const thumbs = (p.images ?? [])
    .map(
      (src, idx) => `
      <button class="thumb" type="button" data-thumb="${idx}" aria-current="${idx === 0 ? "true" : "false"}">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(p.name)} — фото ${idx + 1}" loading="lazy">
      </button>`
    )
    .join("");

  root.innerHTML = `
    <div class="product">
      <div class="gallery">
        <div class="gallery__main">
          <img id="productMainImg" src="${escapeHtml(mainImg)}" alt="${escapeHtml(p.name)}">
        </div>
        <div class="gallery__thumbs">${thumbs}</div>
      </div>

      <div class="card card--padded">
        <div class="badge">${escapeHtml(
          (data.categories.find((c) => c.id === p.category)?.title ?? "Категория")
        )}</div>
        <h1 style="margin:10px 0 10px; font-size:28px; line-height:1.2">${escapeHtml(p.name)}</h1>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap">
          <div class="price" style="font-size:22px">${rubles(p.price)}</div>
          <div class="badge">${p.inStock ? "В наличии" : "Нет в наличии"}</div>
        </div>

        <p class="muted" style="margin:12px 0 0">${escapeHtml(p.description ?? "")}</p>

        <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap">
          <a class="btn btn--accent" href="contacts.html?product=${encodeURIComponent(p.name)}">Заказать</a>
          <a class="btn btn--ghost" href="catalog.html">Назад в каталог</a>
        </div>

        <div class="kv">
          <div>Наличие</div><div>${p.inStock ? "В наличии" : "Уточняйте по телефону"}</div>
          <div>Телефон</div><div><a data-company-phone-link href="#">${escapeHtml(data.company.phone)}</a></div>
          <div>Email</div><div><a data-company-email-link href="#">${escapeHtml(data.company.email)}</a></div>
        </div>
      </div>
    </div>
  `;

  const main = $("#productMainImg", root);
  $all("[data-thumb]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-thumb"));
      const src = p.images?.[idx];
      if (!src || !main) return;
      main.src = src;
      $all("[data-thumb]", root).forEach((b) => b.setAttribute("aria-current", "false"));
      btn.setAttribute("aria-current", "true");
    });
  });
}

function renderContacts(data) {
  setCompanyContacts(data.company);

  const form = $("#contactForm");
  const status = $("#formStatus");
  if (!form) return;

  const product = getQueryParam("product");
  const message = $("#message");
  if (product && message && !message.value) {
    message.value = `Здравствуйте! Хочу заказать: ${product}.`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = $("#name")?.value?.trim() ?? "";
    const contact = $("#contact")?.value?.trim() ?? "";
    const msg = $("#message")?.value?.trim() ?? "";

    if (!name || !contact || !msg) {
      if (status) {
        status.className = "alert alert--bad";
        status.textContent = "Пожалуйста, заполните имя, контакт и сообщение.";
      }
      return;
    }

    const subject = `Заявка с сайта: ${data.company.name}`;
    const body = `Имя: ${name}\nКонтакт: ${contact}\n\nСообщение:\n${msg}\n`;
    const mailto = `mailto:${encodeURIComponent(data.company.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;

    if (status) {
      status.className = "alert alert--ok";
      status.textContent = "Откроется почтовый клиент для отправки заявки. Если он не открылся — позвоните или напишите нам.";
    }
  });
}

function markActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  $all(".nav a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href === path) a.setAttribute("aria-current", "page");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  markActiveNav();

  let data;
  try {
    data = await loadData();
  } catch (err) {
    const host = $("#appError");
    if (host) {
      host.className = "alert alert--bad";
      host.textContent = "Не удалось загрузить данные. Запустите сайт через локальный сервер (см. README).";
      host.style.display = "block";
    }
    return;
  }

  const page = document.body.getAttribute("data-page");
  if (page === "home") renderHome(data);
  if (page === "catalog") renderCatalog(data);
  if (page === "product") renderProduct(data);
  if (page === "contacts") renderContacts(data);
});

