import { apiInitializer } from "discourse/lib/api";

// ─── Settings helpers ────────────────────────────────────────────────────────

const getTargetCategories = () =>
  (settings.target_categories || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

const isTargetCategory = (path) => {
  if (!path) return false;
  return getTargetCategories().some((target) => {
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^/c/${escaped}(/\\d+)?(/.*)?$`).test(path);
  });
};

// ─── Category lookup (Discourse API — no hardcoded names) ────────────────────

const parsePath = (path) => {
  // Matches /c/parent/child or /c/parent/child/id
  const m = path.match(/^\/c\/([^/]+)\/([^/\d][^/]*)/);
  return m ? { parentSlug: m[1], childSlug: m[2] } : {};
};

const findCategory = (slug, categories) =>
  (categories || []).find((c) => c.slug === slug) || null;

const categoryDisplayName = (category, slug) =>
  category?.name ||
  (slug || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// ─── CSS variable injection ──────────────────────────────────────────────────

const injectCssVariables = () => {
  const root = document.documentElement;
  const map = {
    "--gc-gradient-start": settings.banner_gradient_start,
    "--gc-gradient-end": settings.banner_gradient_end,
    "--gc-banner-text": settings.banner_text_color,
    "--gc-accent": settings.primary_accent_color,
    "--gc-pin-color": settings.pin_icon_color,
  };
  Object.entries(map).forEach(([key, val]) => {
    if (val) root.style.setProperty(key, val);
  });
};

// ─── SVG constants ───────────────────────────────────────────────────────────

const BOOKMARK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
</svg>`;

const PLUS_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

const SEARCH_SVG = `<svg class="gc-search-icon" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M10 2a8 8 0 105.29 14.03l4.84 4.84 1.42-1.42-4.84-4.84A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z" fill="currentColor"/>
</svg>`;

// ─── Filter Bar ──────────────────────────────────────────────────────────────

const buildFilterBar = ({
  categoryName,
  parentCategory,
  baseUrl,
  newTopicUrl,
  isLatest,
  isReplies,
  isTrending,
  newCount,
}) => {
  const wrapper = document.createElement("div");
  wrapper.className = "gc-filter-wrapper gc-injected-filter";
  wrapper.id = "gc-filter-bar";

  // Breadcrumb — parent link derived from Discourse category data
  const parentHref = parentCategory
    ? `/c/${parentCategory.slug}/${parentCategory.id}`
    : "/categories";
  const parentName = parentCategory?.name || "Komonitas";

  const breadcrumb = document.createElement("nav");
  breadcrumb.className = "gc-breadcrumb";
  breadcrumb.setAttribute("aria-label", "breadcrumb");
  
  const parentLink = document.createElement("a");
  parentLink.href = parentHref;
  parentLink.className = "gc-breadcrumb-link";
  parentLink.textContent = parentName;

  const separator1 = document.createElement("span");
  separator1.className = "gc-breadcrumb-separator";
  separator1.setAttribute("aria-hidden", "true");
  separator1.textContent = "›";

  const forumLink = document.createElement("a");
  forumLink.href = parentCategory ? `/c/${parentCategory.slug}/forum` : "/c/general/forum";
  forumLink.className = "gc-breadcrumb-link";
  forumLink.textContent = "Forum";

  const separator2 = document.createElement("span");
  separator2.className = "gc-breadcrumb-separator";
  separator2.setAttribute("aria-hidden", "true");
  separator2.textContent = "›";

  const current = document.createElement("span");
  current.className = "gc-breadcrumb-current";
  current.textContent = categoryName;

  if (categoryName.toLowerCase() === "forum") {
    breadcrumb.append(parentLink, separator1, current);
  } else {
    breadcrumb.append(parentLink, separator1, forumLink, separator2, current);
  }

  // Filter pills
  const badgeHtml =
    newCount > 0
      ? `<span class="gc-pill-badge" aria-label="${newCount} topik baru">${newCount}</span>`
      : "";
  const pills = document.createElement("div");
  pills.className = "gc-filter-pills";
  pills.setAttribute("role", "tablist");
  pills.innerHTML = `
    <a href="${baseUrl}/l/latest" class="gc-pill${isLatest ? " is-active" : ""}" role="tab" aria-selected="${isLatest}">
      Latest${badgeHtml}
    </a>
    <a href="${baseUrl}/l/top" class="gc-pill${isReplies ? " is-active" : ""}" role="tab" aria-selected="${isReplies}">Most Replies</a>
    <a href="${baseUrl}/l/hot" class="gc-pill${isTrending ? " is-active" : ""}" role="tab" aria-selected="${isTrending}">Trending</a>
  `;

  // Search
  const searchField = document.createElement("label");
  searchField.className = "gc-search-field";
  searchField.innerHTML = `
    ${SEARCH_SVG}
    <input type="search" class="gc-search-input" id="gc-search-input" placeholder="Cari thread..." aria-label="Cari thread" />
  `;

  // Bookmark button
  const bookmarkBtn = document.createElement("button");
  bookmarkBtn.type = "button";
  bookmarkBtn.className = "gc-icon-btn gc-filter-btn";
  bookmarkBtn.setAttribute("aria-label", "Bookmark");
  bookmarkBtn.title = "Bookmark";
  bookmarkBtn.innerHTML = BOOKMARK_SVG;

  // New topic button — uses category ID from Discourse for proper routing
  const newTopicLink = document.createElement("a");
  newTopicLink.href = newTopicUrl;
  newTopicLink.className = "gc-icon-btn gc-add-btn";
  newTopicLink.setAttribute("aria-label", "Buat thread baru");
  newTopicLink.title = "Buat thread baru";
  newTopicLink.innerHTML = PLUS_SVG;

  const actions = document.createElement("div");
  actions.className = "gc-filter-actions";
  actions.append(searchField, bookmarkBtn, newTopicLink);

  const bar = document.createElement("div");
  bar.className = "gc-filter-bar";
  bar.append(pills, actions);

  wrapper.append(breadcrumb, bar);

  // Live search filter
  searchField.querySelector(".gc-search-input").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll(".topic-list-item.gc-topic-card").forEach((card) => {
      const title =
        card.querySelector(".title, .main-link a")?.textContent?.toLowerCase() || "";
      const excerpt =
        card.querySelector(".topic-excerpt")?.textContent?.toLowerCase() || "";
      card.style.display =
        title.includes(query) || excerpt.includes(query) ? "" : "none";
    });
  });

  return wrapper;
};

const injectFilterBar = (categories) => {
  if (!document.body.classList.contains("gasing-layout-active")) return;
  if (document.querySelector(".gc-injected-filter")) return;

  const path = window.location.pathname;
  const { parentSlug, childSlug } = parsePath(path);

  const parentCategory = parentSlug ? findCategory(parentSlug, categories) : null;
  const childCategory = childSlug ? findCategory(childSlug, categories) : null;

  const categoryName = categoryDisplayName(childCategory, childSlug);

  // Build base URL including category ID if available (Discourse canonical form)
  const baseUrl = childCategory
    ? `/c/${parentSlug}/${childSlug}/${childCategory.id}`
    : `/c/${parentSlug}/${childSlug}`;

  // New topic URL targets the specific category via ID
  const newTopicUrl = childCategory?.id
    ? `/new-topic?category_id=${childCategory.id}`
    : "/new-topic";

  // Actual unseen/new count from DOM — no fake fallback
  const newCount = document.querySelectorAll(
    ".topic-list-item.unseen, .topic-list-item.new"
  ).length;

  const isLatest = path.includes("/l/latest") || !path.match(/\/l\//);
  const isReplies = path.includes("/l/top");
  const isTrending = path.includes("/l/hot");

  const filterBar = buildFilterBar({
    categoryName,
    parentCategory,
    baseUrl,
    newTopicUrl,
    isLatest,
    isReplies,
    isTrending,
    newCount,
  });

  const hero = document.querySelector(".gc-hero-banner");
  const listArea = document.querySelector(
    "#list-area, .list-container, .topic-list-wrapper, .contents"
  );

  if (hero?.parentNode) {
    hero.insertAdjacentElement("afterend", filterBar);
  } else if (listArea) {
    listArea.insertAdjacentElement("beforebegin", filterBar);
  } else {
    document.querySelector("#main-outlet")?.prepend(filterBar);
  }
};

const removeFilterBar = () => {
  document.querySelector(".gc-injected-filter")?.remove();
};

// ─── Body class + data attributes ───────────────────────────────────────────

const applyBodyClass = (path, categories) => {
  const body = document.body;
  if (!body) return;

  if (isTargetCategory(path)) {
    body.classList.add("gasing-layout-active");

    const { parentSlug, childSlug } = parsePath(path);
    const parentCategory = parentSlug ? findCategory(parentSlug, categories) : null;
    const childCategory = childSlug ? findCategory(childSlug, categories) : null;

    body.setAttribute(
      "data-gc-category-name",
      categoryDisplayName(childCategory, childSlug)
    );
    if (childSlug) body.setAttribute("data-gc-slug", childSlug);
    if (parentSlug) body.setAttribute("data-gc-parent-slug", parentSlug);
    if (childCategory?.id) body.setAttribute("data-gc-category-id", String(childCategory.id));
    if (parentCategory?.id) body.setAttribute("data-gc-parent-id", String(parentCategory.id));
  } else {
    body.classList.remove("gasing-layout-active");
    ["data-gc-category-name", "data-gc-slug", "data-gc-parent-slug",
      "data-gc-category-id", "data-gc-parent-id"].forEach((attr) =>
      body.removeAttribute(attr)
    );
    removeFilterBar();
  }
};

// ─── Initializer ─────────────────────────────────────────────────────────────

export default apiInitializer("1.14.0", (api) => {
  injectCssVariables();

  // Load all categories from Discourse — single source of truth, no hardcoding
  const site = api.container.lookup("service:site");
  const categories = site?.categories || [];

  applyBodyClass(window.location.pathname, categories);

  api.onPageChange((url) => {
    applyBodyClass(url, categories);

    if (isTargetCategory(url)) {
      removeFilterBar();
      setTimeout(() => injectFilterBar(categories), 100);
      setTimeout(() => injectFilterBar(categories), 400);
      setTimeout(() => injectFilterBar(categories), 900);
    }
  });

  api.modifyClass("component:topic-list-item", {
    pluginId: "gasing-community-layout",
    didInsertElement() {
      this._super(...arguments);
      if (document.body.classList.contains("gasing-layout-active")) {
        this.element?.classList.add("gc-topic-card");
      }
    },
  });

  setTimeout(() => {
    if (document.body.classList.contains("gasing-layout-active")) {
      injectFilterBar(categories);
    }
  }, 300);
});
