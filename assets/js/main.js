(() => {
  const body = document.body;
  const header = document.querySelector(".site-header");
  const navigation = document.querySelector("#primary-navigation");
  const menuToggle = header?.querySelector(".menu-toggle");
  const menuLabel = menuToggle?.querySelector(".menu-toggle__label");
  const dropdowns = Array.from(document.querySelectorAll(".nav-dropdown"));
  const mobileViewport = window.matchMedia("(max-width: 45rem)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!header || !navigation || !menuToggle || !menuLabel) {
    return;
  }

  body.classList.add("js-enabled");

  const setMenuOpen = (isOpen, { returnFocus = false } = {}) => {
    navigation.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuLabel.textContent = isOpen ? "Đóng menu" : "Mở menu";

    if (!isOpen && returnFocus) {
      menuToggle.focus();
    }
  };

  const closeDropdowns = ({ returnFocus = false } = {}) => {
    dropdowns.forEach((dropdown) => {
      if (!dropdown.open) {
        return;
      }

      dropdown.open = false;
      dropdown.querySelector("summary")?.setAttribute("aria-expanded", "false");

      if (returnFocus) {
        dropdown.querySelector("summary")?.focus();
      }
    });
  };

  dropdowns.forEach((dropdown) => {
    const summary = dropdown.querySelector("summary");
    if (!summary) {
      return;
    }

    dropdown.open = false;
    summary.setAttribute("aria-expanded", "false");
    dropdown.addEventListener("toggle", () => {
      summary.setAttribute("aria-expanded", String(dropdown.open));
    });
  });

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeDropdowns();
      setMenuOpen(false);
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (
      event.target instanceof Node &&
      !navigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeDropdowns();
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    const hasOpenDropdown = dropdowns.some((dropdown) => dropdown.open);
    const menuIsOpen = menuToggle.getAttribute("aria-expanded") === "true";

    if (hasOpenDropdown) {
      closeDropdowns({ returnFocus: !menuIsOpen });
    }

    if (menuIsOpen) {
      setMenuOpen(false, { returnFocus: true });
    }
  });

  const resetMobileMenu = () => {
    if (!mobileViewport.matches) {
      setMenuOpen(false);
    }
  };

  mobileViewport.addEventListener("change", resetMobileMenu);

  const readerArticle = document.querySelector(".assignment--reader");

  if (readerArticle) {
    const progress = document.querySelector(".reader-progress");
    const progressFill = progress?.querySelector("span");
    const backToTop = document.querySelector(".reader-back-to-top");
    const tocLinks = Array.from(
      readerArticle.querySelectorAll(".reader-toc a[href^='#']")
    );
    const sections = tocLinks
      .map((link) => readerArticle.querySelector(link.getAttribute("href")))
      .filter((section) => section instanceof HTMLElement);
    let updateScheduled = false;

    const updateReaderState = () => {
      updateScheduled = false;
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progressValue =
        scrollableHeight > 0
          ? Math.min(100, Math.max(0, (window.scrollY / scrollableHeight) * 100))
          : 100;

      if (progress && progressFill) {
        progressFill.style.transform = `scaleX(${progressValue / 100})`;
        progress.setAttribute("aria-valuenow", String(Math.round(progressValue)));
      }

      let activeSection = sections[0];
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= 160) {
          activeSection = section;
        }
      });

      if (
        sections.length > 0 &&
        window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2
      ) {
        activeSection = sections[sections.length - 1];
      }

      tocLinks.forEach((link) => {
        const isCurrent = link.hash === `#${activeSection?.id}`;
        if (isCurrent) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      if (backToTop) {
        const isVisible = window.scrollY > 560;
        backToTop.classList.toggle("is-visible", isVisible);
        backToTop.setAttribute("aria-hidden", String(!isVisible));
        backToTop.tabIndex = isVisible ? 0 : -1;
      }
    };

    const scheduleReaderUpdate = () => {
      if (updateScheduled) {
        return;
      }

      updateScheduled = true;
      window.requestAnimationFrame(updateReaderState);
    };

    window.addEventListener("scroll", scheduleReaderUpdate, { passive: true });
    window.addEventListener("resize", scheduleReaderUpdate);
    updateReaderState();
  }

  if (
    !reducedMotion.matches &&
    typeof window.IntersectionObserver === "function"
  ) {
    const revealTargets = Array.from(document.querySelectorAll(
      ".hero__copy, .portrait-frame, .intro-section, .goals-section, .contact-band, " +
        ".page-hero, .project-card, .breadcrumbs, .assignment__hero, " +
        ".assignment-section, .assignment-pagination, .reflection-item, .related-work, .integrity-card, " +
        ".integrity-timeline li, .integrity-principles li"
    )).filter(
      (target) =>
        !(
          target.matches(".assignment__hero") &&
          target.closest(".assignment--reader")
        )
    );

    document
      .querySelectorAll(".assignment--reader .reader-title, .assignment--reader .reader-student")
      .forEach((target) => revealTargets.push(target));

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealTargets.forEach((target) => {
      target.classList.add("is-reveal");
      observer.observe(target);
    });
  }
})();
