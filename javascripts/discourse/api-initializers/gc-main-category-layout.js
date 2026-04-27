// javascripts/discourse/api-initializers/gc-community-layout.js
//
// Gasing Circle – Community Category Layout (Dashboard-style)
// Target: /c/general ONLY (not subcategories)
//
// Responsibilities:
//   1. Detect current route and toggle a body class (`gc-community-active`)
//      so SCSS can hide Discourse's default topic list without affecting other pages.
//   2. Render the full dashboard markup into the connector div
//      (#gc-community-layout) on each page change.
//   3. Fetch "trending" (top) and "terbaru" (latest) topics from /c/general.json.
//   4. Wire up accordion (Panduan Komunitas) and topic-card dropdowns.
//
// Architecture notes:
//   - We inject raw HTML via innerHTML for speed & simplicity. Topic data is
//     escaped to prevent XSS.
//   - Event handlers use event delegation on the wrapper → safe across re-renders.
//   - State (accordion expanded, open dropdown) is held in module-scoped vars
//     and reset on route change.

import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

// --- Route matcher (keep in sync with connector) ----------------------------
const STRICT_ROUTE_REGEX =
  /^\/c\/general(?:\/\d+)?(?:\/(?:l\/(?:latest|top|new|unread|hot)|none))?\/?(?:\?.*)?$/i;

function isCommunityRoute(path) {
  const cleanPath = (path || "").split("?")[0].split("#")[0];
  return STRICT_ROUTE_REGEX.test(cleanPath);
}

// --- HTML utilities ---------------------------------------------------------
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(str, len = 140) {
  if (!str) return "";
  const clean = String(str).replace(/<[^>]+>/g, "").trim();
  return clean.length > len ? clean.slice(0, len) + "…" : clean;
}

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(num);
}

function relativeTime(isoDate) {
  if (!isoDate) return "";
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} hari yang lalu`;
  return `${Math.floor(diff / 2592000)} bulan yang lalu`;
}

// --- Static FAQ data (Panduan Komunitas) ------------------------------------
// Removed hardcoded FAQ_ITEMS, data is now fetched via API (/tag/panduan.json)

// --- SVG icon library -------------------------------------------------------
const ICONS = {
  trending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>`,
  terbaru: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="currentColor" class="gc-icon gc-icon--book"><path d="M4 4v16a2 2 0 0 0 2 2h14V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2zm4 2h8v6l-2-1.5L12 12l-2-1.5L8 12V6z"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 4h3v3a3 3 0 0 1-3 3M7 4H4v3a3 3 0 0 0 3 3"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><polyline points="9 18 15 12 9 6"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><polyline points="6 9 12 15 18 9"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  comment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  more: `<svg viewBox="0 0 24 24" fill="currentColor" class="gc-icon"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`,
  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="currentColor" class="gc-icon"><path d="M16 4v7l3 3v2h-6v5l-1 1-1-1v-5H5v-2l3-3V4h-1V2h10v2h-1z"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gc-icon"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  fire: `<svg viewBox="0 0 24 24" fill="currentColor" class="gc-icon"><path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4-1 4 2 5 2 5s-1-3 0-5 0-4 0-4zM7 14c0 3 2 6 5 6s5-3 5-6c0 1-1 2-2 2 0-1 0-2-1-3 0 2-2 3-2 3s-1-1-1-3c-1 1-2 0-2-1 0 1-2 1-2 2z"/></svg>`,
};

// --- Dynamic "Panduan Komunitas" markup -------------------------------------
function buildPanduanHtml(topics) {
  if (!topics || topics.length === 0) {
    return `
      <section class="gc-panel gc-panduan" data-state="collapsed">
        <header class="gc-panel__header gc-panduan__header">
          <div class="gc-panel__title-wrap">
            <span class="gc-panel__icon-inline gc-panel__icon-inline--green">${ICONS.book}</span>
            <h3 class="gc-panel__title">Panduan Komunitas</h3>
          </div>
        </header>
        <div class="gc-empty">Belum ada panduan.</div>
      </section>
    `;
  }

  const items = topics.map(
    (topic, i) => `
      <div class="gc-panduan__row" data-faq-index="${i}">
        <span class="gc-panduan__q">${escapeHtml(topic.title)}</span>
      </div>`
  ).join("");

  return `
    <section class="gc-panel gc-panduan" data-state="collapsed">
      <header class="gc-panel__header gc-panduan__header" role="button" tabindex="0" aria-expanded="false">
        <div class="gc-panel__title-wrap">
          <span class="gc-panel__icon-inline gc-panel__icon-inline--green">${ICONS.book}</span>
          <h3 class="gc-panel__title">Panduan Komunitas</h3>
        </div>
        <span class="gc-panel__chevron">${ICONS.chevronDown}</span>
      </header>
      <div class="gc-panduan__list" aria-hidden="true">
        ${items}
      </div>
    </section>
  `;
}

// --- Dynamic "Challenge Bulan Ini" markup -----------------------------------
// Removed hardcoded CHALLENGE_ITEMS, data is now fetched via API (/tag/challenge.json)

function buildFireIcons(level) {
  let html = "";
  for (let i = 0; i < 3; i++) {
    html += `<span class="gc-fire ${
      i < level ? "gc-fire--active" : "gc-fire--muted"
    }">${ICONS.fire}</span>`;
  }
  return html;
}

function buildChallengeItem(topic, usersById) {
  const posterUser =
    topic.posters && topic.posters[0]
      ? usersById[topic.posters[0].user_id]
      : null;
  const posterName = posterUser ? posterUser.username : "Anonim";
  const avatarUrl = posterUser && posterUser.avatar_template
    ? posterUser.avatar_template.replace("{size}", "40")
    : null;

  let displayTag = "Umum";
  let tagColor = "logika";
  if (topic.tags && topic.tags.length) {
    const t = topic.tags.find((tag) => tag.toLowerCase() !== "challenge");
    if (t) {
      displayTag = t;
      const lower = t.toLowerCase();
      if (lower.includes("mat")) tagColor = "matematika";
      else if (lower.includes("vis")) tagColor = "visual";
      else tagColor = "logika";
    }
  }

  const fireLevel = Math.min(3, Math.max(1, Math.floor((topic.like_count || 0) / 5) + 1));

  const avatarHtml = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(posterName)}" style="width:100%;height:100%;object-fit:cover;">`
    : `<span class="gc-avatar-initial">${escapeHtml(posterName.charAt(0).toUpperCase())}</span>`;

  return `
    <article class="gc-challenge-card" data-topic-id="${topic.id}">
      <div class="gc-challenge-card__head">
        <a href="/t/${escapeHtml(topic.slug)}/${topic.id}" class="gc-challenge-card__avatar" style="text-decoration:none;">
          ${avatarHtml}
        </a>
        <div class="gc-challenge-card__body">
          <div class="gc-challenge-card__title-row">
            ${topic.pinned ? `<span class="gc-challenge-card__pin">${ICONS.pin}</span>` : ""}
            <a href="/t/${escapeHtml(topic.slug)}/${topic.id}" class="gc-challenge-card__title-link" style="text-decoration:none;color:inherit;">
              <h4 class="gc-challenge-card__title">${escapeHtml(topic.title)}</h4>
            </a>
          </div>
          <p class="gc-challenge-card__snippet">${escapeHtml(truncate(topic.excerpt, 120))}</p>
          <div class="gc-challenge-card__meta">
            <div class="gc-fire-group">${buildFireIcons(fireLevel)}</div>
            <span class="gc-tag gc-tag--${tagColor}">${escapeHtml(displayTag)}</span>
          </div>
          <div class="gc-challenge-card__footer">
            <span class="gc-stat"><span class="gc-stat__icon">${ICONS.heart}</span>${formatCount(topic.like_count)}</span>
            <span class="gc-stat"><span class="gc-stat__icon">${ICONS.bell}</span>${formatCount((topic.posts_count || 1) - 1)}</span>
            <span class="gc-stat"><span class="gc-stat__icon">${ICONS.eye}</span>${formatCount(topic.views)}</span>
            <div class="gc-stat__spacer"></div>
            <button class="gc-icon-btn" aria-label="Bookmark">${ICONS.bookmark}</button>
            <button class="gc-icon-btn gc-more-btn" aria-label="More" aria-haspopup="true" aria-expanded="false">${ICONS.more}</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function buildChallengeHtml(topics, usersById) {
  if (!topics || topics.length === 0) {
    return `
      <section class="gc-panel gc-challenge">
        <header class="gc-panel__header gc-challenge__header">
          <div class="gc-panel__title-wrap">
            <span class="gc-panel__icon-inline gc-panel__icon-inline--white">${ICONS.trophy}</span>
            <h3 class="gc-panel__title gc-panel__title--light">Challenge Bulan Ini</h3>
          </div>
        </header>
        <div class="gc-empty" style="padding:20px;color:#fff;">Belum ada challenge.</div>
      </section>`;
  }

  const items = topics.map(t => buildChallengeItem(t, usersById)).join("");
  return `
    <section class="gc-panel gc-challenge">
      <header class="gc-panel__header gc-challenge__header">
        <div class="gc-panel__title-wrap">
          <span class="gc-panel__icon-inline gc-panel__icon-inline--white">${ICONS.trophy}</span>
          <h3 class="gc-panel__title gc-panel__title--light">Challenge Bulan Ini</h3>
        </div>
        <a href="/tag/challenge" class="gc-panel__chevron-circle" aria-label="View all challenges">
          ${ICONS.chevronRight}
        </a>
      </header>
      <div class="gc-challenge__scroll">
        ${items}
      </div>
    </section>
  `;
}

// --- Topic card renderer ----------------------------------------------------
function buildTopicCard(topic, usersById) {
  const posterUser =
    topic.posters && topic.posters[0]
      ? usersById[topic.posters[0].user_id]
      : null;
  const posterName = posterUser ? posterUser.username : "Anonim";
  const avatarUrl = posterUser && posterUser.avatar_template
    ? posterUser.avatar_template.replace("{size}", "48")
    : null;

  const lastPoster =
    topic.posters && topic.posters[topic.posters.length - 1]
      ? usersById[topic.posters[topic.posters.length - 1].user_id]
      : null;
  const lastPosterName = lastPoster ? lastPoster.username : posterName;
  const lastAvatar = lastPoster && lastPoster.avatar_template
    ? lastPoster.avatar_template.replace("{size}", "24")
    : null;

  const thumb = topic.image_url
    ? `<div class="gc-topic-card__thumb" style="background-image:url('${escapeHtml(
        topic.image_url
      )}')"></div>`
    : "";

  const replyPill = `
    <div class="gc-topic-card__reply-pill">
      <span class="gc-reply-arrow">↳</span>
      <span class="gc-topic-card__reply-avatar">
        ${lastAvatar
          ? `<img src="${escapeHtml(lastAvatar)}" alt="">`
          : `<span class="gc-avatar-initial">${escapeHtml(lastPosterName.charAt(0).toUpperCase())}</span>`
        }
      </span>
      <span class="gc-topic-card__reply-text">${escapeHtml(lastPosterName)} menjawab ${escapeHtml(relativeTime(topic.last_posted_at || topic.bumped_at))}</span>
    </div>
  `;

  const topicUrl = `/t/${escapeHtml(topic.slug)}/${topic.id}`;

  return `
    <article class="gc-topic-card" data-topic-id="${topic.id}">
      <a href="${topicUrl}" class="gc-topic-card__avatar">
        ${avatarUrl
          ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(posterName)}">`
          : `<span class="gc-avatar-initial">${escapeHtml(posterName.charAt(0).toUpperCase())}</span>`
        }
        <span class="gc-topic-card__avatar-check"></span>
      </a>
      <div class="gc-topic-card__main">
        <a href="${topicUrl}" class="gc-topic-card__title-link">
          <h4 class="gc-topic-card__title">${escapeHtml(topic.title)}</h4>
        </a>
        <p class="gc-topic-card__snippet">${escapeHtml(truncate(topic.excerpt, 160))}</p>
        ${replyPill}
        <div class="gc-topic-card__footer">
          <span class="gc-stat"><span class="gc-stat__icon">${ICONS.heart}</span>${formatCount(topic.like_count)}</span>
          <span class="gc-stat"><span class="gc-stat__icon">${ICONS.comment}</span>${formatCount((topic.posts_count || 1) - 1)}</span>
          <span class="gc-stat"><span class="gc-stat__icon">${ICONS.eye}</span>${formatCount(topic.views)}</span>
          <div class="gc-stat__spacer"></div>
          <button class="gc-icon-btn" aria-label="Bookmark">${ICONS.bookmark}</button>
          <button class="gc-icon-btn gc-more-btn" aria-label="More" aria-haspopup="true" aria-expanded="false">${ICONS.more}</button>
        </div>
      </div>
      ${thumb}
    </article>
  `;
}

function buildTopicSection({ id, iconHtml, title, iconClass, topics, usersById }) {
  const cards =
    topics && topics.length
      ? topics.map((t) => buildTopicCard(t, usersById)).join("")
      : `<div class="gc-empty">Belum ada topik.</div>`;

  return `
    <section class="gc-panel gc-topic-panel" data-section="${id}">
      <header class="gc-panel__header gc-topic-panel__header">
        <div class="gc-panel__title-wrap">
          <span class="gc-panel__icon-inline ${iconClass}">${iconHtml}</span>
          <h3 class="gc-panel__title">${title}</h3>
        </div>
        <a href="/c/general" class="gc-panel__chevron-circle" aria-label="View all">
          ${ICONS.chevronRight}
        </a>
      </header>
      <div class="gc-topic-panel__body">${cards}</div>
    </section>
  `;
}

// --- Hero banner ------------------------------------------------------------
function buildHeroHtml() {
  return `
    <header class="gc-hero">
      <div class="gc-hero__grid-bg"></div>
      <div class="gc-hero__ornament gc-hero__ornament--burst"></div>
      <div class="gc-hero__ornament gc-hero__ornament--pen"></div>
      <div class="gc-hero__ornament gc-hero__ornament--scribble"></div>
      <div class="gc-hero__ornament gc-hero__ornament--chat"></div>
      <div class="gc-hero__mascot">
        <!-- Replace this div with <img src="..."> for final mascot asset -->
        <div class="gc-hero__mascot-placeholder" aria-hidden="true"></div>
      </div>
      <div class="gc-hero__text">
        <h1 class="gc-hero__title">
          Selamat Datang di Komunitas
          <span class="gc-hero__wave" aria-hidden="true">👋</span>
        </h1>
        <p class="gc-hero__subtitle">
          Tempat berkumpulnya thread terbaru dan diskusi seru sesama anggota.
        </p>
      </div>
    </header>
  `;
}

// --- Main renderer ----------------------------------------------------------
async function render(wrapper) {
  // Skeleton shell
  wrapper.innerHTML = `
    ${buildHeroHtml()}
    <div class="gc-dashboard">
      <div class="gc-column gc-column--left">
        <div id="gc-section-trending"></div>
        <div id="gc-section-terbaru"></div>
      </div>
      <div class="gc-column gc-column--right">
        <div id="gc-section-panduan"></div>
        <div id="gc-section-challenge"></div>
      </div>
    </div>
  `;

  // Fetch all dynamic data
  try {
    const [topJson, latestJson, panduanJson, challengeJson] = await Promise.all([
      ajax("/c/general.json?order=activity").catch(() => null),
      ajax("/c/general/l/latest.json").catch(() => null),
      ajax("/tag/panduan.json").catch(() => null),
      ajax("/tag/challenge.json").catch(() => null),
    ]);

    const extractTopics = (json, limit = 5) => {
      if (!json || !json.topic_list) return { topics: [], users: {} };
      const topics = (json.topic_list.topics || []).slice(0, limit);
      const users = {};
      (json.users || []).forEach((u) => (users[u.id] = u));
      return { topics, users };
    };

    const top = extractTopics(topJson, 5);
    const latest = extractTopics(latestJson, 5);
    const panduan = extractTopics(panduanJson, 10);
    const challenge = extractTopics(challengeJson, 5);

    const trendingEl = wrapper.querySelector("#gc-section-trending");
    const terbaruEl = wrapper.querySelector("#gc-section-terbaru");
    const panduanEl = wrapper.querySelector("#gc-section-panduan");
    const challengeEl = wrapper.querySelector("#gc-section-challenge");

    if (trendingEl) {
      trendingEl.outerHTML = buildTopicSection({
        id: "trending",
        iconHtml: ICONS.trending,
        iconClass: "gc-panel__icon-inline--orange",
        title: "Trending",
        topics: top.topics,
        usersById: top.users,
      });
    }

    if (terbaruEl) {
      terbaruEl.outerHTML = buildTopicSection({
        id: "terbaru",
        iconHtml: ICONS.terbaru,
        iconClass: "gc-panel__icon-inline--blue",
        title: "Terbaru",
        topics: latest.topics,
        usersById: latest.users,
      });
    }

    if (panduanEl) {
      panduanEl.outerHTML = buildPanduanHtml(panduan.topics);
    }

    if (challengeEl) {
      challengeEl.outerHTML = buildChallengeHtml(challenge.topics, challenge.users);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[gc-community-layout] data fetch failed:", e);
  }
}

// --- Event wiring (delegated) -----------------------------------------------
function bindEvents(wrapper) {
  if (wrapper.__gcBound) return;
  wrapper.__gcBound = true;

  // Close any open dropdowns on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".gc-dropdown") && !e.target.closest(".gc-more-btn")) {
      wrapper.querySelectorAll(".gc-dropdown").forEach((d) => d.remove());
      wrapper.querySelectorAll(".gc-more-btn[aria-expanded='true']").forEach((b) =>
        b.setAttribute("aria-expanded", "false")
      );
    }
  });

  wrapper.addEventListener("click", (e) => {
    // --- Panduan accordion toggle -----
    const panduanHeader = e.target.closest(".gc-panduan__header");
    if (panduanHeader) {
      const panel = panduanHeader.closest(".gc-panduan");
      const collapsed = panel.getAttribute("data-state") === "collapsed";
      panel.setAttribute("data-state", collapsed ? "expanded" : "collapsed");
      panduanHeader.setAttribute("aria-expanded", String(collapsed));
      const list = panel.querySelector(".gc-panduan__list");
      if (list) list.setAttribute("aria-hidden", String(!collapsed));
      return;
    }

    // --- FAQ row click (future: expand answer; for now: noop/highlight) ----
    const faqRow = e.target.closest(".gc-panduan__row");
    if (faqRow) {
      wrapper
        .querySelectorAll(".gc-panduan__row--active")
        .forEach((r) => r.classList.remove("gc-panduan__row--active"));
      faqRow.classList.add("gc-panduan__row--active");
      return;
    }

    // --- More button → dropdown -----
    const moreBtn = e.target.closest(".gc-more-btn");
    if (moreBtn) {
      e.preventDefault();
      e.stopPropagation();

      // Close any existing dropdown
      const existing = wrapper.querySelector(".gc-dropdown");
      const wasAttachedToThis = existing && existing.dataset.owner === String(moreBtn.dataset.gcId || "");
      wrapper.querySelectorAll(".gc-dropdown").forEach((d) => d.remove());
      wrapper.querySelectorAll(".gc-more-btn[aria-expanded='true']").forEach((b) =>
        b.setAttribute("aria-expanded", "false")
      );
      if (wasAttachedToThis) return;

      const id = `more-${Date.now()}`;
      moreBtn.dataset.gcId = id;
      moreBtn.setAttribute("aria-expanded", "true");

      const dropdown = document.createElement("div");
      dropdown.className = "gc-dropdown";
      dropdown.dataset.owner = id;
      dropdown.innerHTML = `
        <button class="gc-dropdown__item" data-action="report">
          <span class="gc-dropdown__icon gc-dropdown__icon--flag">${ICONS.flag}</span>
          <span>Laporkan</span>
        </button>
        <button class="gc-dropdown__item" data-action="share">
          <span class="gc-dropdown__icon">${ICONS.share}</span>
          <span>Bagikan</span>
        </button>
        <button class="gc-dropdown__item gc-dropdown__item--danger" data-action="delete">
          <span class="gc-dropdown__icon">${ICONS.trash}</span>
          <span>Hapus</span>
        </button>
      `;

      // Position relative to button's offsetParent (the card)
      const card = moreBtn.closest(".gc-topic-card, .gc-challenge-card");
      if (card) {
        card.appendChild(dropdown);
        // Position: above the button, right-aligned
        const btnRect = moreBtn.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        dropdown.style.position = "absolute";
        dropdown.style.top = `${btnRect.bottom - cardRect.top + 6}px`;
        dropdown.style.right = `${cardRect.right - btnRect.right}px`;
      }
      return;
    }

    // --- Dropdown action ----
    const dropdownItem = e.target.closest(".gc-dropdown__item");
    if (dropdownItem) {
      const action = dropdownItem.dataset.action;
      // TODO: hook to Discourse actions (flag / share modal / delete)
      // eslint-disable-next-line no-console
      console.log("[gc-community-layout] dropdown action:", action);
      wrapper.querySelectorAll(".gc-dropdown").forEach((d) => d.remove());
      return;
    }
  });

  // Keyboard accessibility for Panduan header
  wrapper.addEventListener("keydown", (e) => {
    const panduanHeader = e.target.closest(".gc-panduan__header");
    if (panduanHeader && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      panduanHeader.click();
    }
  });
}

// --- Main initializer -------------------------------------------------------
export default apiInitializer("1.14.0", (api) => {
  const tryRenderWrapper = () => {
    const wrapper = document.getElementById("gc-community-layout");
    if (wrapper && wrapper.dataset.gcRendered !== "1") {
      wrapper.dataset.gcRendered = "1";
      render(wrapper);
      bindEvents(wrapper);
    }
  };

  // Global observer to catch the element whenever Ember injects it
  const observer = new MutationObserver(() => {
    if (!document.body.classList.contains("gc-community-active")) return;
    const wrapper = document.getElementById("gc-community-layout");
    if (wrapper && wrapper.dataset.gcRendered !== "1") {
      tryRenderWrapper();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  api.onPageChange((url) => {
    const path = typeof url === "string" ? url : window.location.pathname;
    const active = isCommunityRoute(path);

    // Toggle body class so SCSS can hide Discourse default list
    document.body.classList.toggle("gc-community-active", active);

    const existing = document.getElementById("gc-community-layout");
    
    if (!active) {
      if (existing) existing.innerHTML = "";
      return;
    }

    // Force re-render to fetch fresh data on navigation
    if (existing) delete existing.dataset.gcRendered;
    tryRenderWrapper();
  });
});
