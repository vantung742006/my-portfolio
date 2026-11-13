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

  const readerArticle = document.querySelector(".exercise-page");

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
      (target) => !target.closest(".exercise-page")
    );

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

  const initializeOceanEffects = () => {
    const existingLayer = document.querySelector(".site-effects");
    if (existingLayer) {
      existingLayer.remove();
    }

    const layer = document.createElement("div");
    layer.className = "site-effects";
    layer.setAttribute("aria-hidden", "true");
    body.append(layer);

    const connection = navigator.connection;
    const lowPerformanceDevice =
      (navigator.hardwareConcurrency > 0 &&
        navigator.hardwareConcurrency <= 4) ||
      (navigator.deviceMemory > 0 && navigator.deviceMemory <= 4) ||
      Boolean(connection?.saveData);
    const mobileViewport = window.matchMedia("(max-width: 45rem)");
    const maximumBubbles = lowPerformanceDevice ? 3 : 7;
    const maximumJellyfish =
      lowPerformanceDevice || mobileViewport.matches ? 1 : 3;
    let spawnTimer = 0;
    let jellyfishTimer = 0;
    let stopped = document.hidden || reducedMotion.matches;

    const spawnBubble = () => {
      if (stopped || document.hidden) {
        return;
      }

      if (layer.querySelectorAll(".site-bubble").length < maximumBubbles) {
        const bubble = document.createElement("span");
        const size = 7 + Math.random() * (lowPerformanceDevice ? 8 : 13);
        const duration = lowPerformanceDevice
          ? 18 + Math.random() * 8
          : 10 + Math.random() * 9;
        bubble.className = "site-bubble";
        bubble.style.setProperty("--bubble-left", `${Math.random() * 98}%`);
        bubble.style.setProperty("--bubble-size", `${size.toFixed(1)}px`);
        bubble.style.setProperty(
          "--bubble-duration",
          `${duration.toFixed(1)}s`
        );
        bubble.style.setProperty(
          "--bubble-opacity",
          `${(0.14 + Math.random() * 0.17).toFixed(2)}`
        );
        bubble.style.setProperty(
          "--bubble-drift",
          `${(Math.random() * 64 - 32).toFixed(1)}px`
        );
        bubble.addEventListener(
          "animationend",
          () => bubble.remove(),
          { once: true }
        );
        layer.append(bubble);
        window.setTimeout(
          () => bubble.remove(),
          duration * 1000 + 500
        );
      }

      const nextDelay = lowPerformanceDevice
        ? 3000 + Math.random() * 2200
        : 1250 + Math.random() * 1350;
      spawnTimer = window.setTimeout(spawnBubble, nextDelay);
    };

    const spawnJellyfish = (scheduleNext = true) => {
      if (stopped || document.hidden) {
        return;
      }

      if (layer.querySelectorAll(".site-jellyfish").length < maximumJellyfish) {
        const jellyfish = document.createElement("span");
        const body = document.createElement("span");
        const bell = document.createElement("span");
        const tentacles = document.createElement("span");
        const size = mobileViewport.matches
          ? 28 + Math.random() * 12
          : 38 + Math.random() * (lowPerformanceDevice ? 12 : 28);
        const duration = lowPerformanceDevice
          ? 42 + Math.random() * 12
          : 28 + Math.random() * 15;
        const isLeft = Math.random() >= 0.5;

        jellyfish.className = "site-jellyfish";
        body.className = "site-jellyfish__body";
        bell.className = "site-jellyfish__bell";
        tentacles.className = "site-jellyfish__tentacles";
        jellyfish.setAttribute("aria-hidden", "true");
        jellyfish.style.setProperty("--jelly-size", `${size.toFixed(1)}px`);
        jellyfish.style.setProperty(
          "--jelly-duration",
          `${duration.toFixed(1)}s`
        );
        jellyfish.style.setProperty(
          "--jelly-opacity",
          `${(0.18 + Math.random() * 0.1).toFixed(2)}`
        );
        jellyfish.style.setProperty(
          "--jelly-drift",
          `${(Math.random() * 48 - 24).toFixed(1)}px`
        );
        jellyfish.style.setProperty(
          isLeft ? "left" : "right",
          `${(1 + Math.random() * 3).toFixed(1)}vw`
        );

        for (let index = 0; index < 5; index += 1) {
          const tentacle = document.createElement("span");
          tentacle.className = "site-jellyfish__thread";
          tentacle.style.setProperty(
            "--thread-height",
            `${[72, 96, 64, 88, 70][index]}%`
          );
          tentacle.style.setProperty(
            "--thread-angle",
            `${[-9, -4, 0, 4, 9][index]}deg`
          );
          tentacle.style.setProperty(
            "--thread-wave-angle",
            `${[-15, -7, 5, 11, 17][index]}deg`
          );
          tentacle.style.setProperty(
            "--thread-duration",
            `${(1.7 + index * 0.24).toFixed(2)}s`
          );
          tentacles.append(tentacle);
        }

        body.append(bell, tentacles);
        jellyfish.append(body);
        jellyfish.addEventListener("animationend", (event) => {
          if (event.target === jellyfish) {
            jellyfish.remove();
          }
        });
        layer.append(jellyfish);
        window.setTimeout(
          () => jellyfish.remove(),
          duration * 1000 + 500
        );
      }

      if (scheduleNext) {
        const nextDelay = lowPerformanceDevice
          ? 26000 + Math.random() * 9000
          : 13000 + Math.random() * 9000;
        jellyfishTimer = window.setTimeout(spawnJellyfish, nextDelay);
      }
    };

    const startJellyfish = () => {
      spawnJellyfish(false);
      if (maximumJellyfish > 1) {
        spawnJellyfish(false);
      }
      spawnJellyfish(true);
    };

    const stopEffects = () => {
      stopped = true;
      window.clearTimeout(spawnTimer);
      window.clearTimeout(jellyfishTimer);
      layer.replaceChildren();
    };

    const resumeBubbles = () => {
      if (reducedMotion.matches) {
        stopEffects();
        layer.remove();
        return;
      }

      if (document.hidden || !stopped) {
        return;
      }

      if (!layer.isConnected) {
        body.append(layer);
      }

      stopped = false;
      spawnBubble();
      startJellyfish();
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopEffects();
      } else {
        resumeBubbles();
      }
    });

    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        stopEffects();
        layer.remove();
      } else if (!document.hidden) {
        resumeBubbles();
      }
    });

    if (!stopped) {
      spawnBubble();
      startJellyfish();
    }
  };

  initializeOceanEffects();

  const piano = document.querySelector(".home-piano");

  if (piano) {
    const soundToggle = piano.querySelector(".home-piano__sound-toggle");
    const noteOutput = piano.querySelector(".home-piano__note");
    const pianoKeys = Array.from(piano.querySelectorAll(".piano-key"));
    const keysByCode = new Map([
      ["KeyA", "C4"],
      ["KeyW", "C♯4"],
      ["KeyS", "D4"],
      ["KeyE", "D♯4"],
      ["KeyD", "E4"],
      ["KeyF", "F4"],
      ["KeyT", "F♯4"],
      ["KeyG", "G4"],
      ["KeyY", "G♯4"],
      ["KeyH", "A4"],
      ["KeyU", "A♯4"],
      ["KeyJ", "B4"],
    ]);
    const keyByNote = new Map(
      pianoKeys.map((key) => [key.dataset.note, key])
    );
    const activeVoices = new Map();
    const heldKeyboardNotes = new Set();
    let audioContext = null;
    let masterGain = null;
    let soundEnabled = true;

    const updateStatus = (message) => {
      if (noteOutput) {
        noteOutput.textContent = message;
      }
    };

    const setSoundEnabled = (isEnabled) => {
      soundEnabled = isEnabled;
      soundToggle?.setAttribute("aria-pressed", String(isEnabled));
      soundToggle?.setAttribute(
        "aria-label",
        isEnabled ? "Tắt âm thanh" : "Bật âm thanh"
      );
      if (soundToggle) {
        soundToggle.lastChild.textContent = isEnabled
          ? " Âm thanh bật"
          : " Âm thanh tắt";
      }

      if (!isEnabled) {
        activeVoices.forEach((voice, note) => {
          releaseVoice(voice);
          activeVoices.delete(note);
        });
        updateStatus("Âm thanh đang tắt");
      } else {
        updateStatus("Chọn một phím để bắt đầu");
      }
    };

    const createAudioContext = () => {
      const AudioContextConstructor =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextConstructor) {
        updateStatus("Trình duyệt chưa hỗ trợ phát âm thanh");
        return false;
      }

      try {
        audioContext = new AudioContextConstructor();
        const compressor = audioContext.createDynamicsCompressor();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.68;
        compressor.threshold.value = -18;
        compressor.knee.value = 18;
        compressor.ratio.value = 8;
        compressor.attack.value = 0.004;
        compressor.release.value = 0.22;
        masterGain.connect(compressor);
        compressor.connect(audioContext.destination);
        return true;
      } catch (error) {
        console.error("Không thể khởi tạo âm thanh piano.", error);
        updateStatus("Không thể khởi tạo âm thanh piano");
        return false;
      }
    };

    function releaseVoice(voice) {
      if (voice.released || !audioContext) {
        return;
      }

      voice.released = true;
      const now = audioContext.currentTime;
      const elapsed = now - voice.startedAt;
      const releaseLevel =
        elapsed < 0.018
          ? 0.0001 * (0.5 / 0.0001) ** (elapsed / 0.018)
          : elapsed < 0.32
            ? 0.5 * (0.17 / 0.5) ** ((elapsed - 0.018) / 0.302)
            : 0.17;
      voice.envelope.gain.cancelScheduledValues(now);
      voice.envelope.gain.setValueAtTime(releaseLevel, now);
      voice.envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      voice.oscillators.forEach((oscillator) => oscillator.stop(now + 0.4));
    }

    const startVoice = (key) => {
      if (!soundEnabled || activeVoices.has(key.dataset.note)) {
        return;
      }

      if (!audioContext && !createAudioContext()) {
        return;
      }

      if (audioContext.state === "closed") {
        audioContext = null;
        masterGain = null;
        if (!createAudioContext()) {
          return;
        }
      }

      if (audioContext.state === "suspended") {
        audioContext.resume().catch((error) => {
          console.error("Không thể tiếp tục phát âm thanh piano.", error);
          updateStatus("Không thể phát âm thanh trong trình duyệt này");
        });
      }

      const midiNote = Number(key.dataset.midi);
      if (!Number.isFinite(midiNote)) {
        console.error("Phím piano thiếu cao độ MIDI hợp lệ.", key);
        return;
      }

      const fundamental = 440 * 2 ** ((midiNote - 69) / 12);
      const envelope = audioContext.createGain();
      const now = audioContext.currentTime;
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(0.5, now + 0.018);
      envelope.gain.exponentialRampToValueAtTime(0.17, now + 0.32);
      envelope.connect(masterGain);

      const oscillators = [];
      const partials = [
        { ratio: 1, gain: 0.72 },
        { ratio: 2.01, gain: 0.23 },
        { ratio: 3.98, gain: 0.1 },
        { ratio: 6.04, gain: 0.045 },
      ];

      partials.forEach((partial) => {
        const oscillator = audioContext.createOscillator();
        const partialGain = audioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = fundamental * partial.ratio;
        partialGain.gain.value = partial.gain;
        oscillator.connect(partialGain);
        partialGain.connect(envelope);
        oscillator.start(now);
        oscillators.push(oscillator);
      });

      const voice = { envelope, oscillators, startedAt: now, released: false };
      activeVoices.set(key.dataset.note, voice);
      oscillators[0].addEventListener(
        "ended",
        () => {
          if (activeVoices.get(key.dataset.note) === voice) {
            activeVoices.delete(key.dataset.note);
          }
        },
        { once: true }
      );
    };

    const pressKey = (key) => {
      if (key.classList.contains("is-active")) {
        return;
      }

      key.classList.add("is-active");
      updateStatus(`Đang phát ${key.dataset.note}`);
      startVoice(key);
    };

    const releaseKey = (key) => {
      key.classList.remove("is-active");
      const voice = activeVoices.get(key.dataset.note);
      if (voice) {
        releaseVoice(voice);
        activeVoices.delete(key.dataset.note);
      }

      if (!piano.querySelector(".piano-key.is-active")) {
        updateStatus(
          soundEnabled ? "Chọn một phím để bắt đầu" : "Âm thanh đang tắt"
        );
      }
    };

    pianoKeys.forEach((key) => {
      key.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }

        event.preventDefault();
        key.focus({ preventScroll: true });
        key.setPointerCapture(event.pointerId);
        pressKey(key);
      });

      key.addEventListener("pointerup", () => releaseKey(key));
      key.addEventListener("pointercancel", () => releaseKey(key));
      key.addEventListener("lostpointercapture", () => releaseKey(key));
      key.addEventListener("contextmenu", (event) => event.preventDefault());
    });

    soundToggle?.addEventListener("click", () => {
      setSoundEnabled(!soundEnabled);
    });

    document.addEventListener("keydown", (event) => {
      const note = keysByCode.get(event.code);
      if (!note || event.repeat) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      const key = keyByNote.get(note);
      if (key) {
        event.preventDefault();
        heldKeyboardNotes.add(note);
        pressKey(key);
      }
    });

    document.addEventListener("keyup", (event) => {
      const note = keysByCode.get(event.code);
      if (!note || !heldKeyboardNotes.delete(note)) {
        return;
      }

      const key = keyByNote.get(note);
      if (key) {
        releaseKey(key);
      }
    });

    window.addEventListener("blur", () => {
      heldKeyboardNotes.clear();
      pianoKeys.forEach(releaseKey);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        heldKeyboardNotes.clear();
        pianoKeys.forEach(releaseKey);
      }
    });

    soundToggle?.setAttribute("aria-pressed", "true");
  }
})();
