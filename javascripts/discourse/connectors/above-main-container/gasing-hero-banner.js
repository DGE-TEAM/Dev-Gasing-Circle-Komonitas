export default {
  setupComponent(args, component) {
    const update = () => {
      if (component.isDestroyed || component.isDestroying) return;
      const body = document.body;
      component.set("shouldRender", body.classList.contains("gasing-layout-active") && !body.classList.contains("gc-forum-subcategory-active"));
      component.set("categoryName", body.getAttribute("data-gc-category-name") || "");
      component.set("showDecoration", settings.show_math_decoration);
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-gc-category-name"],
    });
    component.set("_gcObserver", observer);
  },

  shouldRender() {
    return true;
  },

  teardownComponent(component) {
    component.get("_gcObserver")?.disconnect();
  },
};
