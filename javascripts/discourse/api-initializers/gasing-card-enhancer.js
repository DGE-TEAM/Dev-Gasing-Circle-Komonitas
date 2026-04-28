import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICONS = {
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>`,
  heartFill: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>`,
  comment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>`,
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
  </svg>`,
  bookmarkFill: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
  </svg>`,
  more: `<svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
  </svg>`,
  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>`,
  arrowDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>`,
};

// ─── Discourse API helpers ────────────────────────────────────────────────────

const bookmarkTopic = (topicId) =>
  ajax("/bookmarks.json", {
    type: "POST",
    data: { bookmarkable_id: topicId, bookmarkable_type: "Topic" },
  });

const removeBookmark = (bookmarkId) =>
  ajax(`/bookmarks/${bookmarkId}.json`, { type: "DELETE" });

const deleteTopic = (topicId) =>
  ajax(`/t/${topicId}.json`, { type: "DELETE" });

const shareUrl = async (url, title) => {
  if (navigator.share) {
    try {
      await navigator.share({ url, title });
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  await navigator.clipboard?.writeText(url);
};

// ─── Extract topic metadata from card DOM ─────────────────────────────────────

const getTopicMeta = (card) => {
  const topicId = card.dataset.topicId;
  const titleEl = card.querySelector("a.title, a.raw-topic-link");
  const href = titleEl?.getAttribute("href") || "";
  const match = href.match(/\/t\/([^/]+)\/(\d+)/);
  return {
    topicId: topicId || match?.[2] || null,
    topicSlug: match?.[1] || null,
    titleHref: href,
    title: titleEl?.textContent.trim() || "",
  };
};

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#e91e8c", "#7c3aed", "#0ea5e9", "#10b981",
  "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6",
  "#ec4899", "#14b8a6",
];

const getAvatarColor = (name) =>
  AVATAR_COLORS[(name || "U").charCodeAt(0) % AVATAR_COLORS.length];

const formatCount = (n) => {
  const num = parseInt(n, 10) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "m";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return num.toString();
};

const getRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60_000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1) return "baru saja";
    if (mins < 60) return `${mins} menit yang lalu`;
    if (hrs < 24) return `${hrs} jam yang lalu`;
    if (days < 30) return `${days} hari yang lalu`;
    return new Date(dateStr).toLocaleDateString("id-ID");
  } catch {
    return "";
  }
};

// ─── Dropdown portal (created once, scoped inside initializer) ────────────────

let _dropdownPortal = null;
let _activeMoreBtn = null;
let _dropdownCtx = null;

const closeDropdownPortal = () => {
  _dropdownPortal?.classList.remove("is-open");
  _activeMoreBtn?.setAttribute("aria-expanded", "false");
  _activeMoreBtn = null;
  _dropdownCtx = null;
};

const buildDropdownPortal = (currentUser) => {
  const portal = document.createElement("div");
  portal.className = "gc-dropdown-menu gc-dropdown-portal";
  portal.setAttribute("role", "menu");
  portal.setAttribute("aria-label", "Opsi topik");
  portal.innerHTML = `
    <button type="button" class="gc-dropdown-item" role="menuitem" data-action="flag">
      ${ICONS.flag}<span>Laporkan</span>
    </button>
    <button type="button" class="gc-dropdown-item" role="menuitem" data-action="share">
      ${ICONS.share}<span>Bagikan</span>
    </button>
    <button type="button" class="gc-dropdown-item is-danger gc-delete-btn" role="menuitem" data-action="delete">
      ${ICONS.trash}<span>Hapus</span>
    </button>
  `;
  document.body.appendChild(portal);

  // Flag → navigate to topic so user can use Discourse's native flag UI
  portal.querySelector('[data-action="flag"]').addEventListener("click", () => {
    const { topicSlug, topicId } = _dropdownCtx || {};
    if (topicSlug && topicId) {
      window.location.href = `/t/${topicSlug}/${topicId}`;
    }
    closeDropdownPortal();
  });

  // Share → Web Share API with clipboard fallback
  portal.querySelector('[data-action="share"]').addEventListener("click", async (e) => {
    e.preventDefault();
    const ctx = _dropdownCtx;
    if (ctx) {
      const url = new URL(ctx.titleHref, window.location.origin).href;
      await shareUrl(url, ctx.title);
    }
    closeDropdownPortal();
  });

  // Delete → Discourse API, visible only to owner / mod / admin
  portal.querySelector('[data-action="delete"]').addEventListener("click", async () => {
    const ctx = _dropdownCtx;
    if (!ctx?.topicId) { closeDropdownPortal(); return; }
    if (!window.confirm("Hapus topik ini? Tindakan ini tidak dapat dibatalkan.")) {
      closeDropdownPortal();
      return;
    }
    try {
      await deleteTopic(ctx.topicId);
      ctx.card?.remove();
    } catch (err) {
      console.error("[GC] Gagal menghapus topik:", err);
    }
    closeDropdownPortal();
  });

  return portal;
};

const getOrCreatePortal = (currentUser) => {
  if (!_dropdownPortal) _dropdownPortal = buildDropdownPortal(currentUser);
  return _dropdownPortal;
};

const openDropdownPortal = (btn, ctx, currentUser) => {
  const portal = getOrCreatePortal(currentUser);

  if (_activeMoreBtn === btn && portal.classList.contains("is-open")) {
    closeDropdownPortal();
    return;
  }
  closeDropdownPortal();
  _activeMoreBtn = btn;
  _dropdownCtx = ctx;

  // Show delete only if user has permission
  const canDelete =
    currentUser &&
    (currentUser.admin || currentUser.moderator || currentUser.username === ctx.opName);
  portal.querySelector(".gc-delete-btn").style.display = canDelete ? "" : "none";

  const rect = btn.getBoundingClientRect();
  portal.style.cssText = `position:fixed;top:${rect.bottom + 6}px;right:${window.innerWidth - rect.right}px;left:auto;`;
  portal.classList.add("is-open");
  btn.setAttribute("aria-expanded", "true");
};

// ─── Card enhancement ─────────────────────────────────────────────────────────

const enhanceCard = (card, currentUser, api) => {
  if (!card || card.dataset.gcEnhanced === "1") return;
  card.dataset.gcEnhanced = "1";

  if (card.classList.contains("unseen") || card.classList.contains("unread")) {
    card.classList.add("gc-highlighted");
  }

  const { topicId, topicSlug, titleHref, title } = getTopicMeta(card);

  // ── Extract from Discourse-rendered cells ──────────────────────────────────
  const mainCell = card.querySelector("td.main-link, td.topic");
  const postersCell = card.querySelector("td.posters");

  const titleEl = mainCell?.querySelector("a.title, a.raw-topic-link");
  const excerptText = mainCell?.querySelector(".topic-excerpt")?.textContent.trim() || "";
  const tagsEl = mainCell?.querySelector(".discourse-tags");
  const topicStatusEl = mainCell?.querySelector(".topic-status");

  let thumbnailSrc = "";
  const thumbImg =
    card.querySelector("td.topic-image img") ||
    mainCell?.querySelector(".topic-thumbnail img, a.topic-thumbnail-link img");
  if (thumbImg) thumbnailSrc = thumbImg.getAttribute("src") || "";

  const likes = card.querySelector("td.likes .number, td.op-likes .number")?.textContent.trim() || "0";
  const posts = card.querySelector("td.posts .number, td.replies .number, .posts-map .number")?.textContent.trim() || "0";
  const views = card.querySelector("td.views .number")?.textContent.trim() || "0";

  const opLink = postersCell?.querySelector("a:first-child");
  const opAvatarImg = opLink?.querySelector("img.avatar");
  const opName = opLink?.getAttribute("data-user-card") || "User";
  const opColor = getAvatarColor(opName);
  const opInitial = opName.charAt(0).toUpperCase();

  const latestLink =
    postersCell?.querySelector("a.latest") || postersCell?.querySelector("a:last-child");
  const latestRaw = latestLink?.getAttribute("data-user-card") || opName;
  const latestName = latestRaw.replace(/_/g, " ");
  const latestColor = getAvatarColor(latestRaw);
  const latestInitial = latestName.charAt(0).toUpperCase();

  const activityLink = card.querySelector("td.activity a");
  let activityTime = "";
  if (activityLink) {
    const timeEl = activityLink.querySelector("time");
    activityTime = timeEl
      ? getRelativeTime(timeEl.getAttribute("datetime"))
      : activityLink.textContent.trim();
  }

  // ── Avatar ─────────────────────────────────────────────────────────────────
  const avatarDiv = document.createElement("div");
  avatarDiv.className = "gc-avatar";

  if (opAvatarImg) {
    const img = document.createElement("img");
    img.src = opAvatarImg.src;
    img.alt = opAvatarImg.alt || opName;
    img.className = "avatar";
    img.width = 40;
    img.height = 40;
    avatarDiv.appendChild(img);
  } else {
    const em = document.createElement("em");
    em.className = "gc-letter-av";
    em.style.backgroundColor = opColor;
    em.setAttribute("aria-hidden", "true");
    em.textContent = opInitial;
    avatarDiv.appendChild(em);
  }

  // ── Content ────────────────────────────────────────────────────────────────
  const contentDiv = document.createElement("div");
  contentDiv.className = "gc-content";

  const titleLine = document.createElement("div");
  titleLine.className = "gc-title-line";
  if (topicStatusEl) titleLine.appendChild(topicStatusEl.cloneNode(true));
  const titleLink = document.createElement("a");
  titleLink.href = titleHref;
  titleLink.className = "gc-title";
  titleLink.textContent = title;
  titleLine.appendChild(titleLink);
  contentDiv.appendChild(titleLine);

  if (excerptText) {
    const exc = document.createElement("a");
    exc.href = titleHref;
    exc.className = "gc-excerpt";
    exc.textContent = excerptText;
    contentDiv.appendChild(exc);
  }

  if (tagsEl && tagsEl.children.length > 0) {
    const tagsClone = tagsEl.cloneNode(true);
    tagsClone.className = "gc-tags discourse-tags";
    contentDiv.appendChild(tagsClone);
  }

  const replyMeta = document.createElement("div");
  replyMeta.className = "gc-reply-meta";
  const arrowSpan = document.createElement("span");
  arrowSpan.className = "gc-reply-arrow";
  arrowSpan.textContent = "↳";
  const replyAvEm = document.createElement("em");
  replyAvEm.className = "gc-reply-avatar";
  replyAvEm.style.backgroundColor = latestColor;
  replyAvEm.setAttribute("aria-hidden", "true");
  replyAvEm.textContent = latestInitial;
  const replyTextSpan = document.createElement("span");
  replyTextSpan.className = "gc-reply-text";
  replyTextSpan.textContent = `${latestName} menjawab${activityTime ? " " + activityTime : ""}`;
  replyMeta.append(arrowSpan, replyAvEm, replyTextSpan);
  contentDiv.appendChild(replyMeta);

  // ── Thumbnail (optional) ───────────────────────────────────────────────────
  let thumbnailDiv = null;
  if (thumbnailSrc) {
    thumbnailDiv = document.createElement("div");
    thumbnailDiv.className = "gc-thumbnail";
    const img = document.createElement("img");
    img.src = thumbnailSrc;
    img.alt = "";
    img.loading = "lazy";
    thumbnailDiv.appendChild(img);
  }

  // ── Inner wrapper ──────────────────────────────────────────────────────────
  const inner = document.createElement("div");
  inner.className = thumbnailDiv ? "gc-inner gc-has-thumb" : "gc-inner";
  inner.appendChild(avatarDiv);
  inner.appendChild(contentDiv);
  if (thumbnailDiv) inner.appendChild(thumbnailDiv);
  card.appendChild(inner);

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footer = document.createElement("div");
  footer.className = "gc-card-footer";

  // Build footer elements programmatically so we can attach real event handlers
  const metricsDiv = document.createElement("div");
  metricsDiv.className = "gc-metrics";

  // Like button
  const likeBtn = document.createElement("button");
  likeBtn.type = "button";
  likeBtn.className = "gc-metric gc-action-like";
  likeBtn.title = "Suka";
  likeBtn.innerHTML = `${ICONS.heart}<span class="gc-count-like">${formatCount(likes)}</span>`;

  // Comment button
  const commentBtn = document.createElement("button");
  commentBtn.type = "button";
  commentBtn.className = "gc-metric gc-action-comment";
  commentBtn.title = "Balasan";
  commentBtn.innerHTML = `${ICONS.comment}<span>${formatCount(posts)}</span>`;

  // Views (static, not interactive)
  const viewsSpan = document.createElement("span");
  viewsSpan.className = "gc-metric";
  viewsSpan.title = "Dilihat";
  viewsSpan.innerHTML = `${ICONS.eye}<span>${formatCount(views)}</span>`;

  metricsDiv.append(likeBtn, commentBtn, viewsSpan);

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "gc-card-actions";

  // Bookmark button
  const bookmarkBtn = document.createElement("button");
  bookmarkBtn.type = "button";
  bookmarkBtn.className = "gc-action-btn gc-bookmark-action";
  bookmarkBtn.setAttribute("aria-label", "Bookmark");
  bookmarkBtn.title = "Bookmark";
  bookmarkBtn.innerHTML = ICONS.bookmark;

  // More button
  const moreBtn = document.createElement("button");
  moreBtn.type = "button";
  moreBtn.className = "gc-action-btn gc-more-action";
  moreBtn.setAttribute("aria-label", "Opsi lainnya");
  moreBtn.setAttribute("aria-haspopup", "true");
  moreBtn.setAttribute("aria-expanded", "false");
  moreBtn.title = "Opsi lainnya";
  moreBtn.innerHTML = ICONS.more;

  actionsDiv.append(bookmarkBtn, moreBtn);
  footer.append(metricsDiv, actionsDiv);
  card.appendChild(footer);

  // ── Like — fetch first post, call Discourse post_actions API ──────────────
  let isFetchingLike = false;

  const updateLikeBtn = (liked, count) => {
    likeBtn.innerHTML = `${liked ? ICONS.heartFill : ICONS.heart}<span class="gc-count-like">${formatCount(count)}</span>`;
    likeBtn.classList.toggle("is-liked", liked);
  };

  likeBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      window.location.href = `/login?return_path=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (!topicId || isFetchingLike) return;

    isFetchingLike = true;
    likeBtn.style.opacity = "0.5";

    try {
      const data = await ajax(`/t/${topicId}.json`);
      const firstPost = data?.post_stream?.posts?.[0];
      if (!firstPost) throw new Error("No first post");

      const likeAction = (firstPost.actions_summary || []).find((a) => a.id === 2);
      const isLiked = likeAction?.acted || false;
      const currentCount = parseInt(likeBtn.querySelector(".gc-count-like")?.textContent || "0", 10);

      if (isLiked) {
        await ajax(`/post_actions/${firstPost.id}.json?post_action_type_id=2`, { type: "DELETE" });
        updateLikeBtn(false, Math.max(0, currentCount - 1));
      } else {
        await ajax("/post_actions.json", {
          type: "POST",
          data: { id: firstPost.id, post_action_type_id: 2 },
        });
        updateLikeBtn(true, currentCount + 1);
      }
    } catch (err) {
      console.error("[GC] Like failed:", err);
    } finally {
      isFetchingLike = false;
      likeBtn.style.opacity = "1";
    }
  });

  // ── Comment — navigate to topic page (last post, ready to reply) ──────────
  commentBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      window.location.href = `/login?return_path=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    // Open Discourse compose dialog in-place (no navigation needed)
    try {
      const store = api?.container?.lookup("service:store");
      const composer = api?.container?.lookup("service:composer");
      if (store && composer && topicId) {
        const topic = await store.find("topic", parseInt(topicId, 10));
        await composer.open({
          action: "reply",
          topic,
          draftKey: topic.draft_key,
        });
        return;
      }
    } catch (err) {
      console.error("[GC] Failed to open composer inline:", err);
    }

    // Fallback: navigate to topic page
    if (titleHref) window.location.href = titleHref;
  });

  // ── Bookmark — persisted via Discourse API ─────────────────────────────────
  let bookmarkId = card.dataset.bookmarkId || null;

  if (card.classList.contains("bookmarked") || card.dataset.bookmarked === "true") {
    bookmarkBtn.classList.add("is-active");
    bookmarkBtn.innerHTML = ICONS.bookmarkFill;
  }

  bookmarkBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      window.location.href = `/login?return_path=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (bookmarkBtn.classList.contains("is-active")) {
      try {
        if (bookmarkId) await removeBookmark(bookmarkId);
        bookmarkBtn.classList.remove("is-active");
        bookmarkBtn.innerHTML = ICONS.bookmark;
        bookmarkId = null;
      } catch (err) {
        console.error("[GC] Gagal menghapus bookmark:", err);
      }
    } else {
      try {
        const data = await bookmarkTopic(topicId);
        bookmarkId = data?.id || null;
        bookmarkBtn.classList.add("is-active");
        bookmarkBtn.innerHTML = ICONS.bookmarkFill;
      } catch (err) {
        console.error("[GC] Gagal menambahkan bookmark:", err);
      }
    }
  });

  // ── More menu — Discourse API actions ─────────────────────────────────────
  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    openDropdownPortal(
      moreBtn,
      { topicId, topicSlug, titleHref, title, opName, card },
      currentUser
    );
  });
};

// ─── Load more button ─────────────────────────────────────────────────────────

const injectLoadMoreButton = () => {
  if (!document.body.classList.contains("gasing-layout-active")) return;
  document
    .querySelectorAll(".more-topics:not(.gc-load-more-injected), #topic-list-bottom:not(.gc-load-more-injected)")
    .forEach((container) => {
      container.classList.add("gc-load-more-injected");
      const existing = container.querySelector("a, button");
      if (existing) existing.style.display = "none";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gc-load-more-btn";
      btn.setAttribute("aria-label", "Muat lebih banyak");
      btn.innerHTML = ICONS.arrowDown;
      btn.addEventListener("click", () => existing?.click());
      container.appendChild(btn);
    });
};

// ─── Global event cleanup ─────────────────────────────────────────────────────

document.addEventListener("click", (e) => {
  if (
    !e.target.closest(".gc-dropdown-portal") &&
    !e.target.closest(".gc-more-action")
  ) {
    closeDropdownPortal();
  }
});
window.addEventListener("scroll", closeDropdownPortal, { passive: true });
window.addEventListener("resize", closeDropdownPortal, { passive: true });

// ─── Initializer ─────────────────────────────────────────────────────────────

export default apiInitializer("1.14.0", (api) => {
  const currentUser = api.getCurrentUser();

  const enhanceAllCards = () => {
    if (!document.body.classList.contains("gasing-layout-active")) return;
    document
      .querySelectorAll(".topic-list-item:not(.gc-topic-card-enhanced)")
      .forEach((card) => {
        card.classList.add("gc-topic-card", "gc-topic-card-enhanced");
        enhanceCard(card, currentUser, api);
      });
    injectLoadMoreButton();
  };

  api.onPageChange(() => {
    setTimeout(enhanceAllCards, 200);
    setTimeout(enhanceAllCards, 600);
  });

  const bodyObserver = new MutationObserver((mutations) => {
    if (!document.body.classList.contains("gasing-layout-active")) return;
    for (const { addedNodes } of mutations) {
      for (const node of addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.classList?.contains("topic-list-item") && !node.classList.contains("gc-topic-card-enhanced")) {
          node.classList.add("gc-topic-card", "gc-topic-card-enhanced");
          enhanceCard(node, currentUser, api);
        }
        node.querySelectorAll?.(".topic-list-item:not(.gc-topic-card-enhanced)").forEach((el) => {
          el.classList.add("gc-topic-card", "gc-topic-card-enhanced");
          enhanceCard(el, currentUser, api);
        });
        if (node.matches?.(".more-topics, #topic-list-bottom")) {
          setTimeout(injectLoadMoreButton, 50);
        }
      }
    }
  });

  bodyObserver.observe(document.body, { childList: true, subtree: true });
});
