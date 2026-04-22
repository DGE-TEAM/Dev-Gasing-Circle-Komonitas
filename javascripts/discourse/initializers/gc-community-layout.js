// javascripts/discourse/initializers/gc-community-layout.js
// Gasing Circle – Community Category Layout
// Hero + dynamic subcategory card grid on /c/general, with TopicTrackingState badge

import { apiInitializer } from "discourse/lib/api";

// ─── Per-subcategory SVG icons (keyed by slug fragment) ────────────────────
const ICONS = {
  "mengenal-bilangan": `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="3" y="26" font-size="18" font-weight="700" fill="#7C3AED" font-family="sans-serif">1 2 3</text>
  </svg>`,
  "bakalkubagi": `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="4" y="16" font-size="13" fill="#0D9488" font-family="sans-serif">+ ×</text>
    <text x="4" y="32" font-size="13" fill="#0D9488" font-family="sans-serif">÷ −</text>
  </svg>`,
  "bilangan-bulat": `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="2" y="18" font-size="11" fill="#D97706" font-family="sans-serif">0→</text>
    <text x="2" y="32" font-size="11" fill="#D97706" font-family="sans-serif">←0</text>
  </svg>`,
  "pede": `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="14" stroke="#EC4899" stroke-width="2" fill="none"/>
    <line x1="20" y1="6"  x2="8"  y2="30" stroke="#EC4899" stroke-width="2"/>
    <line x1="20" y1="6"  x2="32" y2="30" stroke="#EC4899" stroke-width="2"/>
    <line x1="10" y1="22" x2="30" y2="22" stroke="#EC4899" stroke-width="2"/>
  </svg>`,
  "ruang-guru": `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="28" height="20" rx="4" stroke="#6366F1" stroke-width="2" fill="none"/>
    <path d="M13 24 Q20 18 27 24" stroke="#6366F1" stroke-width="2" fill="none"/>
    <circle cx="20" cy="19" r="3" fill="#6366F1"/>
  </svg>`,
  "topik-santai": `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 28 Q12 14 20 14 Q28 14 28 22 Q28 30 20 30 L14 34 Z" stroke="#F97316" stroke-width="2" fill="none"/>
    <line x1="18" y1="8" x2="18" y2="11" stroke="#F97316" stroke-width="2"/>
    <line x1="22" y1="8" x2="22" y2="11" stroke="#F97316" stroke-width="2"/>
  </svg>`,
  "default": `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="24" height="24" rx="4" stroke="#94A3B8" stroke-width="2" fill="none"/>
    <line x1="14" y1="16" x2="26" y2="16" stroke="#94A3B8" stroke-width="2"/>
    <line x1="14" y1="20" x2="26" y2="20" stroke="#94A3B8" stroke-width="2"/>
    <line x1="14" y1="24" x2="22" y2="24" stroke="#94A3B8" stroke-width="2"/>
  </svg>`,
};

// ─── Card accent palettes (bg, border, icon-bg) keyed by slug fragment ──────
const PALETTES = {
  "mengenal-bilangan": { bg: "#F5F0FF", border: "#C4B5FD", iconBg: "#EDE9FE" },
  "bakalkubagi":       { bg: "#F0FDFA", border: "#99F6E4", iconBg: "#CCFBF1" },
  "bilangan-bulat":    { bg: "#FFFBEB", border: "#FDE68A", iconBg: "#FEF3C7" },
  "pede":              { bg: "#FFF0F8", border: "#FBCFE8", iconBg: "#FCE7F3" },
  "ruang-guru":        { bg: "#EEF2FF", border: "#C7D2FE", iconBg: "#E0E7FF" },
  "topik-santai":      { bg: "#FFF7ED", border: "#FED7AA", iconBg: "#FFEDD5" },
  "default":           { bg: "#F8FAFC", border: "#E2E8F0", iconBg: "#F1F5F9" },
};

// ─── Allowed subcategory slugs (hide everything else) ───────────────────────
const ALLOWED_SLUGS = new Set([
  "mengenal-bilangan",
  "bakalkubagi",
  "pede",
  "bilangan-bulat",
  "ruang-guru",
  "topik-santai",
]);

// ─── Map slug → settings key for admin-uploaded icons ───────────────────────
const ICON_UPLOAD_MAP = {
  "mengenal-bilangan": "mengenal_bilangan_icon",
  "bakalkubagi":       "bakalkubagi_icon",
  "pede":              "pede_icon",
  "bilangan-bulat":    "bilangan_bulat_icon",
  "ruang-guru":        "ruang_guru_icon",
  "topik-santai":      "topik_santai_icon",
};

function getPalette(slug) {
  const key = Object.keys(PALETTES).find((k) => slug && slug.includes(k));
  return PALETTES[key || "default"];
}

function getIconHtml(slug) {
  // Prefer admin-uploaded image from theme settings
  const settingKey = ICON_UPLOAD_MAP[slug];
  if (settingKey) {
    try {
      const url = settings[settingKey];
      if (url) {
        return `<img src="${url}" alt="" />`;
      }
    } catch (_) { /* settings not available */ }
  }
  // Fallback to built-in SVG
  const key = Object.keys(ICONS).find((k) => slug && slug.includes(k));
  return ICONS[key || "default"];
}

// ─── TopicTrackingState: new + unread count for a single category ────────────
function getUnreadCount(trackingState, categoryId) {
  if (!trackingState || !categoryId) return 0;
  try {
    const opts = { categoryId };
    const newCount =
      (typeof trackingState.countNew === "function" &&
        trackingState.countNew(opts)) ||
      0;
    const unreadCount =
      (typeof trackingState.countUnread === "function" &&
        trackingState.countUnread(opts)) ||
      0;
    return newCount + unreadCount;
  } catch (_) {
    return 0;
  }
}

// ─── Badge pill HTML ─────────────────────────────────────────────────────────
// Shows new/unread count (blue) when > 0; falls back to topic_count (same style).
function badgeHtml(unread, topicCount) {
  const count = unread > 0 ? unread : topicCount || 0;
  if (!count) return "";
  const label = count > 99 ? "99+" : String(count);
  const extraClass = unread > 0 ? " gc-badge--unread" : "";
  return `<span class="gc-badge${extraClass}">${label}</span>`;
}

// ─── Single card ─────────────────────────────────────────────────────────────
function buildCard(sub, parentSlug, trackingState) {
  const slug = sub.slug || "";
  const p = getPalette(slug);
  const icon = getIconHtml(slug);
  const name = sub.name || "";
  const desc =
    sub.description ||
    (sub.topic_count ? `${sub.topic_count} topik tersedia` : `Diskusi seputar ${name}.`);

  const unread = getUnreadCount(trackingState, sub.id);
  const badge = badgeHtml(unread, sub.topic_count);
  const url = `/c/${parentSlug}/${slug}/${sub.id}`;
  const unreadClass = unread > 0 ? " gc-card--unread" : "";

  return `
    <a class="gc-card${unreadClass}" href="${url}"
       style="--card-bg:${p.bg};--card-border:${p.border};--icon-bg:${p.iconBg}"
       data-category-id="${sub.id}">
      <div class="gc-card__icon">${icon}</div>
      <div class="gc-card__body">
        <div class="gc-card__title">${name} ${badge}</div>
        <p class="gc-card__desc">${desc}</p>
      </div>
    </a>`;
}

// ─── Card group section ───────────────────────────────────────────────────────
function buildGroup(groupName, subcats, parentSlug, trackingState) {
  const cards = subcats.map((s) => buildCard(s, parentSlug, trackingState)).join("");
  return `
    <section class="gc-group">
      ${groupName ? `<h2 class="gc-group__title">${groupName}</h2>` : ""}
      <div class="gc-grid">${cards}</div>
    </section>`;
}

// ─── Hero banner ─────────────────────────────────────────────────────────────
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

// ─── Core render function ─────────────────────────────────────────────────────
function renderLayout(wrapper, category, site, trackingState) {
  const parentSlug = category.slug;
  const parentId = category.id;

  // Primary source: site.categories (always preloaded by Discourse)
  const allCats = (site && site.categories) || [];
  let subcats = allCats
    .filter((c) => c.parent_category_id === parentId)
    .filter((c) => ALLOWED_SLUGS.has(c.slug || ""))
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  // Group subcategories into sections by slug heuristic
  const mathKeywords = ["bilangan", "bakalkubagi", "pede"];
  const mathGroup = subcats.filter((s) =>
    mathKeywords.some((k) => (s.slug || "").includes(k))
  );
  const generalGroup = subcats.filter(
    (s) => !mathKeywords.some((k) => (s.slug || "").includes(k))
  );

  let sections = "";
  if (mathGroup.length) {
    sections += buildGroup("Konsep Dasar Matematika", mathGroup, parentSlug, trackingState);
  }
  if (generalGroup.length) {
    sections += buildGroup("Diskusi Umum", generalGroup, parentSlug, trackingState);
  }
  // Flat fallback (no grouping matched)
  if (!sections && subcats.length) {
    sections = buildGroup("", subcats, parentSlug, trackingState);
  }

  if (!sections) {
    // Show loading state; API fetch below will fill it in
    sections = `<p class="gc-empty">Memuat kategori…</p>`;
  }

  wrapper.innerHTML = buildHero() + `<div class="gc-sections">${sections}</div>`;

  // ── Background API fetch to refresh data (best-effort) ─────────────────
  fetch(`/categories.json?parent_category_id=${parentId}`, {
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data) return;
      const fresh =
        (data.category_list && data.category_list.categories) ||
        data.subcategory_list ||
        [];
      if (!fresh.length) return;

      // Merge fresh descriptions/counts into site category objects
      fresh.forEach((fc) => {
        const match = allCats.find((c) => c.id === fc.id);
        if (match) {
          if (fc.description) match.description = fc.description;
          if (fc.topic_count != null) match.topic_count = fc.topic_count;
        }
      });

      // Re-render with updated data
      renderLayout(wrapper, category, site, trackingState);
    })
    .catch(() => {
      /* silent – site.categories data is sufficient */
    });
}

// ─── Target category slugs ───────────────────────────────────────────────────
// Add every slug/name variant your "Komunitas" parent category might use.
const TARGET_SLUGS = ["general", "komunitas"];
const ACTIVE_CLASS = "gc-community-active";

function resolveCategory(url, site) {
  // 1. URL must match /c/<target-slug> exactly (not subcategory pages)
  //    Patterns: /c/general  /c/general/123  /c/komunitas  etc.
  //    Subcategory URLs like /c/general/sub/456 are intentionally excluded.
  const urlMatch = url.match(/\/c\/([^/?#]+)(?:\/(\d+))?\/?(?:[?#].*)?$/);
  if (urlMatch) {
    const slugInUrl = (urlMatch[1] || "").toLowerCase();
    if (TARGET_SLUGS.includes(slugInUrl)) {
      // Enrich with full site category object if available
      const fromSite = site?.categories?.find(
        (c) => (c.slug || "").toLowerCase() === slugInUrl
      );
      return fromSite || { slug: urlMatch[1], id: urlMatch[2] ? parseInt(urlMatch[2], 10) : null };
    }
  }

  return null;
}

// ─── Initializer ─────────────────────────────────────────────────────────────
export default apiInitializer("1.8", (api) => {
  let _unsubscribe = null;

  function activate(wrapper, category, site, trackingState) {
    // Inject custom body class so CSS scope works regardless of Discourse slug
    document.body.classList.add(ACTIVE_CLASS);
    renderLayout(wrapper, category, site, trackingState);

    // Subscribe to TopicTrackingState so badges update in real-time
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
    if (trackingState && typeof trackingState.on === "function") {
      const handler = () => renderLayout(wrapper, category, site, trackingState);
      trackingState.on("change", handler);
      _unsubscribe = () => {
        if (typeof trackingState.off === "function") {
          trackingState.off("change", handler);
        }
      };
    }
  }

  function deactivate(wrapper) {
    document.body.classList.remove(ACTIVE_CLASS);
    if (wrapper) wrapper.innerHTML = "";
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
  }

  api.onPageChange((url) => {
    const site = api.container.lookup("service:site");
    const category = resolveCategory(url, site);
    const wrapper = document.getElementById("gc-community-layout");

    if (!category) {
      // Always clean up — wrapper may not exist on non-discovery pages
      deactivate(wrapper);
      return;
    }

    if (!wrapper) return;

    const trackingState = api.container.lookup("service:topic-tracking-state");
    activate(wrapper, category, site, trackingState);
  });
});
