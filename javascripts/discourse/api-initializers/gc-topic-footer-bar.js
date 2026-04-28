import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";
import { buildTopicFooterHTML } from "../lib/gc-topic-footer";

// ─── Discourse API helpers ────────────────────────────────────────────────────

const toggleLikePost = (postId, isLiked) => {
  if (isLiked) {
    return ajax(`/post_actions/${postId}.json?post_action_type_id=2`, { type: "DELETE" });
  }
  return ajax("/post_actions.json", {
    type: "POST",
    data: { id: postId, post_action_type_id: 2 },
  });
};

const bookmarkTopic = (topicId) =>
  ajax("/bookmarks.json", {
    type: "POST",
    data: { bookmarkable_id: topicId, bookmarkable_type: "Topic" },
  });

const removeBookmark = (bookmarkId) =>
  ajax(`/bookmarks/${bookmarkId}.json`, { type: "DELETE" });

const shareUrl = async (url, title) => {
  if (navigator.share) {
    try { await navigator.share({ url, title }); return; } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  try { await navigator.clipboard.writeText(url); } catch (_) {}
};

// ─── URL detection ────────────────────────────────────────────────────────────

const isTopicPage = (url) => /^\/t\/[^/]+\/\d+/.test(url);

// ─── Footer injection ─────────────────────────────────────────────────────────

const FOOTER_ID = "gc-topic-footer-bar";

const removeFooter = () => document.getElementById(FOOTER_ID)?.remove();

const injectFooter = async (url, currentUser) => {
  removeFooter();

  const match = url.match(/^\/t\/[^/]+\/(\d+)/);
  if (!match) return;
  const topicId = match[1];

  let topic, firstPost;
  try {
    const data = await ajax(`/t/${topicId}.json`);
    topic = data;
    firstPost = data.post_stream?.posts?.[0] || null;
  } catch (_) {
    return;
  }

  const html = buildTopicFooterHTML(topic, firstPost);
  const wrapper = document.createElement("div");
  wrapper.id = FOOTER_ID;
  wrapper.innerHTML = html;

  // ── Find insertion point: below the first post ────────────────────────────
  // Try multiple Discourse selectors across versions
  const anchor =
    document.querySelector(".topic-post:first-child article") ||
    document.querySelector(".topic-post:first-child") ||
    document.querySelector(".post-stream .topic-post") ||
    document.querySelector("#post_1") ||
    document.querySelector(".topic-body");

  if (anchor) {
    anchor.insertAdjacentElement("afterend", wrapper);
  } else {
    // Fallback: prepend inside main outlet
    document.querySelector("#main-outlet")?.prepend(wrapper);
  }

  // ── Like handler ──────────────────────────────────────────────────────────
  const likeBtn = wrapper.querySelector(".gc-topic-like-btn");
  const likeCountEl = wrapper.querySelector(".gc-like-count");
  let isFetchingLike = false;

  if (likeBtn && likeCountEl) {
    likeBtn.style.cursor = "pointer";
    likeBtn.setAttribute("role", "button");
    likeBtn.setAttribute("tabindex", "0");

    likeBtn.addEventListener("click", async () => {
      if (!currentUser) {
        window.location.href = `/login?return_path=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (isFetchingLike || !firstPost) return;
      isFetchingLike = true;
      likeBtn.style.opacity = "0.5";

      try {
        const isLiked = likeBtn.classList.contains("is-liked");
        await toggleLikePost(firstPost.id, isLiked);

        let count = parseInt(likeCountEl.textContent, 10) || 0;
        if (isLiked) {
          likeBtn.classList.remove("is-liked");
          likeCountEl.textContent = Math.max(0, count - 1);
        } else {
          likeBtn.classList.add("is-liked");
          likeCountEl.textContent = count + 1;
        }
      } catch (err) {
        console.error("[GC Footer] Like failed:", err);
      } finally {
        isFetchingLike = false;
        likeBtn.style.opacity = "1";
      }
    });
  }

  // ── Reply handler ─────────────────────────────────────────────────────────
  const replyBtn = wrapper.querySelector(".gc-tf-reply-btn");
  if (replyBtn) {
    replyBtn.addEventListener("click", () => {
      if (!currentUser) {
        window.location.href = `/login?return_path=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      // Trigger Discourse's native compose reply — look for the reply button in the topic
      const nativeReply =
        document.querySelector(".topic-footer-main-buttons .btn-primary") ||
        document.querySelector(".post-controls .reply") ||
        document.querySelector("button.reply.btn");

      if (nativeReply) {
        nativeReply.click();
      } else {
        // Fallback: navigate to last post
        window.location.href = `${window.location.pathname}/last`;
      }
    });
  }

  // ── Reply stat (comment icon) – scroll to replies ─────────────────────────
  const replyStatBtn = wrapper.querySelector(".gc-topic-reply-btn");
  if (replyStatBtn) {
    replyStatBtn.style.cursor = "pointer";
    replyStatBtn.setAttribute("role", "button");
    replyStatBtn.setAttribute("tabindex", "0");

    replyStatBtn.addEventListener("click", () => {
      const lastPost = document.querySelector(".topic-post:last-child");
      lastPost?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // ── Bookmark handler ──────────────────────────────────────────────────────
  const bookmarkBtn = wrapper.querySelector(".gc-topic-bookmark-btn");
  let bookmarkIdState = topic.bookmark_id || null;

  if (bookmarkBtn) {
    bookmarkBtn.addEventListener("click", async () => {
      if (!currentUser) {
        window.location.href = `/login?return_path=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      if (bookmarkBtn.classList.contains("is-bookmarked")) {
        try {
          if (bookmarkIdState) await removeBookmark(bookmarkIdState);
          bookmarkBtn.classList.remove("is-bookmarked");
          bookmarkBtn.removeAttribute("data-bookmark-id");
          bookmarkIdState = null;
        } catch (err) {
          console.error("[GC Footer] Unbookmark failed:", err);
        }
      } else {
        try {
          const data = await bookmarkTopic(topic.id);
          bookmarkIdState = data?.id || null;
          bookmarkBtn.classList.add("is-bookmarked");
          if (bookmarkIdState) bookmarkBtn.setAttribute("data-bookmark-id", bookmarkIdState);
        } catch (err) {
          console.error("[GC Footer] Bookmark failed:", err);
        }
      }
    });
  }

  // ── Share handler ─────────────────────────────────────────────────────────
  const shareBtn = wrapper.querySelector(".gc-topic-share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const topicUrl = new URL(url, window.location.origin).href;
      const title = topic.title || document.title;
      await shareUrl(topicUrl, title);
    });
  }
};

// ─── Initializer ─────────────────────────────────────────────────────────────

export default apiInitializer("1.14.0", (api) => {
  const currentUser = api.getCurrentUser();

  api.onPageChange((url) => {
    if (isTopicPage(url)) {
      // Delay to let Discourse render the first post into the DOM
      setTimeout(() => injectFooter(url, currentUser), 600);
      setTimeout(() => injectFooter(url, currentUser), 1400);
    } else {
      removeFooter();
    }
  });
});
