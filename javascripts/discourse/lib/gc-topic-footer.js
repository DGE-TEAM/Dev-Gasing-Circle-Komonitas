import { SVG } from "./gc-icons";

/**
 * Builds the HTML for the standalone Topic Footer Action Bar based on the reference design.
 * You can import and use this function in your other custom layouts.
 * 
 * @param {Object} topic - The discourse topic object containing stats and state.
 * @param {Object} [firstPost] - Optional. The first post object, used for likes if topic-level likes are not preferred.
 * @returns {String} HTML string for the topic footer.
 */
export function buildTopicFooterHTML(topic, firstPost = null) {
  if (!topic) return "";

  // Topic Statistics
  const likes = topic.like_count || 0;
  const replies = topic.reply_count || (topic.posts_count ? topic.posts_count - 1 : 0);
  const views = topic.views || 0;
  
  // Topic States
  const isBookmarked = topic.bookmarked || false;
  const bookmarkId = topic.bookmark_id || "";
  const bookmarkAttrs = isBookmarked ? " is-bookmarked" : "";
  const bookmarkData = bookmarkId ? ` data-bookmark-id="${bookmarkId}"` : "";

  // Handle post-specific or topic-specific like state
  const fpLike = firstPost ? firstPost.actions_summary?.find((x) => x.id === 2) : null;
  let topicLiked = false;
  let topicLikeCount = likes;
  
  if (fpLike) {
    topicLiked = fpLike.acted || false;
    topicLikeCount = fpLike.count || 0;
  }

  return `
    <div class="gc-topic-footer-bar">
      <div class="gc-tf-left">
        <span class="gc-tf-stat gc-topic-like-btn${topicLiked ? " is-liked" : ""}" data-post-id="${firstPost?.id || ""}" title="Suka Topik">
          ${topicLiked ? SVG.heartFilled : SVG.heartOutline}
          <span class="gc-like-count">${topicLikeCount}</span>
        </span>
        <span class="gc-tf-stat gc-topic-reply-btn" title="Komentar">
          ${SVG.chat}
          <span>${replies}</span>
        </span>
        <span class="gc-tf-stat" title="Dilihat">
          ${SVG.eye}
          <span>${views}</span>
        </span>
      </div>
      
      <div class="gc-tf-right">
        <button class="gc-tf-reply-btn" data-topic-id="${topic.id}">
          ${SVG.reply} Balas
        </button>
        <button class="gc-action-icon gc-topic-bookmark-btn${bookmarkAttrs}"${bookmarkData} title="Simpan Bookmark">
          ${SVG.bookmark}
        </button>
        <button class="gc-action-icon gc-topic-share-btn" title="Bagikan">
          ${SVG.share}
        </button>
      </div>
    </div>
    <hr class="gc-tf-sep" />
  `;
}
