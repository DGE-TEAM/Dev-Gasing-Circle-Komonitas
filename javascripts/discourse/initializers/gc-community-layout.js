// Gasing Circle – Community Category Layout
// Hero + subcategory card grid on /c/general/forum/, with live TopicTrackingState badges.

import { apiInitializer } from "discourse/lib/api";
import {
  ACTIVE_CLASS,
  SUBCATEGORY_ACTIVE_CLASS,
  CATEGORY_CONFIG,
  CATEGORY_GROUPS,
  TARGET_PATH,
} from "../lib/gc-category-config";

// ─── Icon helper ──────────────────────────────────────────────────────────────

function getIconHtml(slug) {
  const config = CATEGORY_CONFIG[slug] || CATEGORY_CONFIG.default;
  if (config.settingKey) {
    try {
      const url = settings[config.settingKey];
      if (url) return `<img src="${url}" alt="" />`;
    } catch (_) {}
  }
  return config.icon;
}

// ─── Tracking badge helpers ───────────────────────────────────────────────────

function getUnreadCount(trackingState, categoryId) {
  if (!trackingState || !categoryId) return 0;
  try {
    const opts = { categoryId };
    const newCount = (typeof trackingState.countNew === "function" && trackingState.countNew(opts)) || 0;
    const unreadCount = (typeof trackingState.countUnread === "function" && trackingState.countUnread(opts)) || 0;
    return newCount + unreadCount;
  } catch (_) {
    return 0;
  }
}

function badgeHtml(unreadCount, topicCount) {
  const count = unreadCount > 0 ? unreadCount : topicCount || 0;
  if (!count) return "";
  const label = count > 99 ? "99+" : String(count);
  const extraClass = unreadCount > 0 ? " gc-badge--unread" : "";
  return `<span class="gc-badge${extraClass}">${label}</span>`;
}

// ─── Gradient helper ──────────────────────────────────────────────────────────

function getGradient(slug) {
  const config = CATEGORY_CONFIG[slug];
  if (!config?.gradient) return { start: "#1e3a8a", end: "#7c3aed" };
  let { start, end } = config.gradient;
  try { const s = settings[config.gradient.settingKeyStart]; if (s) start = s; } catch (_) {}
  try { const e = settings[config.gradient.settingKeyEnd]; if (e) end = e; } catch (_) {}
  return { start, end };
}

// ─── Subcategory banner builder ───────────────────────────────────────────────

const GC_LOGO_SVG = `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="22" stroke="white" stroke-width="2" fill="none"/>
  <path d="M24 2 A22 22 0 0 1 46 24 L36 24 A12 12 0 0 0 24 12 Z" fill="white" fill-opacity="0.95"/>
  <path d="M46 24 A22 22 0 0 1 24 46 L24 36 A12 12 0 0 0 36 24 Z" fill="white" fill-opacity="0.75"/>
  <path d="M24 46 A22 22 0 0 1 2 24 L12 24 A12 12 0 0 0 24 36 Z" fill="white" fill-opacity="0.55"/>
  <path d="M2 24 A22 22 0 0 1 24 2 L24 12 A12 12 0 0 0 12 24 Z" fill="white" fill-opacity="0.35"/>
  <circle cx="24" cy="24" r="4" fill="white"/>
</svg>`;

function buildSubcategoryBanner(slug, name) {
  const { start, end } = getGradient(slug);
  return `
    <div class="gc-subcategory-banner" style="--banner-start:${start};--banner-end:${end}">
      <div class="gc-subcategory-banner__inner">
        <div class="gc-subcategory-banner__icon">${GC_LOGO_SVG}</div>
        <h1 class="gc-subcategory-banner__title">${name}</h1>
      </div>
    </div>`;
}

// ─── HTML builders ────────────────────────────────────────────────────────────

function buildHero() {
  return `
    <div class="gc-hero">
      <div class="gc-hero__inner">
        <div class="gc-hero__icon">
          <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 13C8 9.686 10.686 7 14 7H42C45.314 7 48 9.686 48 13V34C48 37.314 45.314 40 42 40H28L18 49V40H14C10.686 40 8 37.314 8 34V13Z"
              fill="white" fill-opacity="0.92"/>
            <circle cx="21" cy="24" r="2.8" fill="#4F46E5"/>
            <circle cx="28" cy="24" r="2.8" fill="#4F46E5"/>
            <circle cx="35" cy="24" r="2.8" fill="#4F46E5"/>
          </svg>
        </div>
        <h1 class="gc-hero__title">Forum</h1>
        <p class="gc-hero__subtitle">Pilih topik untuk menjelajahi berbagai diskusi di Forum Gasing Circle.</p>
      </div>
    </div>`;
}

function buildCard(subcategory, trackingState) {
  const { slug = "", name = "", id, topic_count: topicCount, description } = subcategory;
  const { palette } = CATEGORY_CONFIG[slug] || CATEGORY_CONFIG.default;
  const icon = getIconHtml(slug);
  const desc = description || (topicCount ? `${topicCount} topik tersedia` : `Diskusi seputar ${name}.`);
  const unread = getUnreadCount(trackingState, id);
  const badge = badgeHtml(unread, topicCount);
  const url = `/c/${TARGET_PATH.parent}/${slug}/${id}`;
  const unreadClass = unread > 0 ? " gc-card--unread" : "";

  return `
    <a class="gc-card${unreadClass}" href="${url}"
       style="--card-bg:${palette.bg};--card-border:${palette.border};--icon-bg:${palette.iconBg}"
       data-category-id="${id}">
      <div class="gc-card__icon">${icon}</div>
      <div class="gc-card__body">
        <div class="gc-card__title">${name} ${badge}</div>
        <p class="gc-card__desc">${desc}</p>
      </div>
    </a>`;
}

function buildGroup(label, subcategories, trackingState) {
  const cards = subcategories.map((sub) => buildCard(sub, trackingState)).join("");
  return `
    <section class="gc-group">
      ${label ? `<h2 class="gc-group__title">${label}</h2>` : ""}
      <div class="gc-grid">${cards}</div>
    </section>`;
}

// ─── Category filtering & grouping ───────────────────────────────────────────

function getFilteredSubcategories(site, parentId) {
  const allowedSlugs = new Set(Object.keys(CATEGORY_CONFIG).filter((k) => k !== "default"));
  return ((site && site.categories) || [])
    .filter((cat) => cat.parent_category_id === parentId)
    .filter((cat) => allowedSlugs.has(cat.slug || ""))
    .sort((a, b) => (a.position || 0) - (b.position || 0));
}

function buildSections(subcategories, trackingState) {
  if (!subcategories.length) return "";

  const byGroup = {};
  for (const subcategory of subcategories) {
    const { group } = CATEGORY_CONFIG[subcategory.slug] || CATEGORY_CONFIG.default;
    if (!byGroup[group]) byGroup[group] = [];
    byGroup[group].push(subcategory);
  }

  const sections = CATEGORY_GROUPS
    .filter((group) => byGroup[group.id]?.length)
    .map((group) => buildGroup(group.label, byGroup[group.id], trackingState))
    .join("");

  // Fallback: show all flat if no group matched
  return sections || buildGroup("", subcategories, trackingState);
}

// ─── Background API refresh ───────────────────────────────────────────────────
// Merges fresh description/topic_count into already-loaded site.categories objects,
// then triggers a re-render. Silent on failure — preloaded data is sufficient.

function refreshCategoriesFromApi(parentId, allCats, onRefreshComplete) {
  fetch(`/categories.json?parent_category_id=${parentId}`, {
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (!data) return;
      const freshCategories =
        (data.category_list && data.category_list.categories) ||
        data.subcategory_list ||
        [];
      if (!freshCategories.length) return;

      for (const freshCat of freshCategories) {
        const existing = allCats.find((cat) => cat.id === freshCat.id);
        if (!existing) continue;
        if (freshCat.description) existing.description = freshCat.description;
        if (freshCat.topic_count != null) existing.topic_count = freshCat.topic_count;
      }

      onRefreshComplete();
    })
    .catch(() => {});
}

// ─── Layout renderer ──────────────────────────────────────────────────────────

function renderLayout(wrapper, category, site, trackingState) {
  const subcategories = getFilteredSubcategories(site, category.parent_category_id);
  const sections = buildSections(subcategories, trackingState) ||
    `<p class="gc-empty">Memuat kategori…</p>`;
  wrapper.innerHTML = buildHero() + `<div class="gc-sections">${sections}</div>`;
}

// ─── URL resolvers ────────────────────────────────────────────────────────────

function resolveSubcategory(url, site) {
  const match = url.match(/\/c\/([^/?#]+)\/([^/?#]+)(?:\/(\d+))?\/?(?:[?#].*)?$/);
  if (!match) return null;
  const parentSlug = (match[1] || "").toLowerCase();
  const categorySlug = (match[2] || "").toLowerCase();
  if (parentSlug !== TARGET_PATH.parent) return null;
  if (categorySlug === TARGET_PATH.category) return null; // handled by hub resolver
  const allowedSlugs = new Set(Object.keys(CATEGORY_CONFIG).filter((k) => k !== "default"));
  if (!allowedSlugs.has(categorySlug)) return null;
  const fromSite = site?.categories?.find((cat) => (cat.slug || "").toLowerCase() === categorySlug);
  return fromSite || { slug: categorySlug, id: match[3] ? parseInt(match[3], 10) : null, name: categorySlug };
}

function resolveCategory(url, site) {
  // Matches /c/<parent>/<category> or /c/<parent>/<category>/<id>
  // Three-level paths like /c/parent/category/sub/id do NOT match (excluded by $)
  const match = url.match(/\/c\/([^/?#]+)\/([^/?#]+)(?:\/(\d+))?\/?(?:[?#].*)?$/);
  if (!match) return null;

  const parentSlugInUrl = (match[1] || "").toLowerCase();
  const categorySlugInUrl = (match[2] || "").toLowerCase();

  if (parentSlugInUrl !== TARGET_PATH.parent || categorySlugInUrl !== TARGET_PATH.category) {
    return null;
  }

  const fromSite = site?.categories?.find(
    (cat) => (cat.slug || "").toLowerCase() === categorySlugInUrl
  );
  return fromSite || { slug: match[2], id: match[3] ? parseInt(match[3], 10) : null };
}

// ─── Initializer ──────────────────────────────────────────────────────────────

export default apiInitializer("1.8", (api) => {
  let unsubscribeTracking = null;

  function activate(wrapper, category, site, trackingState) {
    document.body.classList.remove(SUBCATEGORY_ACTIVE_CLASS);
    document.body.classList.add(ACTIVE_CLASS);
    renderLayout(wrapper, category, site, trackingState);

    const allCats = (site && site.categories) || [];
    refreshCategoriesFromApi(category.parent_category_id, allCats, () =>
      renderLayout(wrapper, category, site, trackingState)
    );

    if (unsubscribeTracking) {
      unsubscribeTracking();
      unsubscribeTracking = null;
    }

    if (trackingState && typeof trackingState.on === "function") {
      const onTrackingChange = () => renderLayout(wrapper, category, site, trackingState);
      trackingState.on("change", onTrackingChange);
      unsubscribeTracking = () => {
        if (typeof trackingState.off === "function") {
          trackingState.off("change", onTrackingChange);
        }
      };
    }
  }

  function activateSubcategoryBanner(wrapper, subcategory) {
    document.body.classList.remove(ACTIVE_CLASS);
    document.body.classList.add(SUBCATEGORY_ACTIVE_CLASS);
    if (unsubscribeTracking) {
      unsubscribeTracking();
      unsubscribeTracking = null;
    }
    wrapper.innerHTML = buildSubcategoryBanner(subcategory.slug || "", subcategory.name || subcategory.slug || "");
  }

  function deactivate(wrapper) {
    document.body.classList.remove(ACTIVE_CLASS);
    document.body.classList.remove(SUBCATEGORY_ACTIVE_CLASS);
    if (wrapper) wrapper.innerHTML = "";
    if (unsubscribeTracking) {
      unsubscribeTracking();
      unsubscribeTracking = null;
    }
  }

  api.onPageChange((url) => {
    const site = api.container.lookup("service:site");
    const wrapper = document.getElementById("gc-community-layout");

    const hubCategory = resolveCategory(url, site);
    if (hubCategory) {
      if (!wrapper) return;
      const trackingState = api.container.lookup("service:topic-tracking-state");
      activate(wrapper, hubCategory, site, trackingState);
      return;
    }

    const subcategory = resolveSubcategory(url, site);
    if (subcategory) {
      if (!wrapper) return;
      activateSubcategoryBanner(wrapper, subcategory);
      return;
    }

    deactivate(wrapper);
  });
});
