// javascripts/discourse/connectors/discovery-list-container-top/gc-community-layout.js
// Gate the connector so it only renders on the exact /c/general category page,
// NOT on subcategories (/c/general/xxx) and NOT on tag-filtered views.

export default {
  shouldRender(args, component) {
    try {
      const path = window.location.pathname || "";

      // Strict regex: matches /c/general, /c/general/, /c/general?..., /c/general/l/latest,
      // but NOT /c/general/subcategory-slug
      // We allow /l/latest, /l/top, /none (no-subcategories) as query-style suffixes.
      const strictRegex = /^\/c\/general(?:\/\d+)?(?:\/(?:l\/(?:latest|top|new|unread|hot)|none))?\/?(?:\?.*)?$/i;

      if (!strictRegex.test(path)) return false;

      // Extra safety: if body already has a subcategory class, bail.
      const body = document.body;
      if (body && body.classList) {
        // Discourse adds classes like "category-general-subslug" for nested views
        const hasSubcategoryClass = Array.from(body.classList).some((c) =>
          /^category-general-/.test(c)
        );
        if (hasSubcategoryClass) return false;
      }

      return true;
    } catch (e) {
      // Fail closed: don't render if detection breaks
      // eslint-disable-next-line no-console
      console.warn("[gc-community-layout] shouldRender error:", e);
      return false;
    }
  },
};
