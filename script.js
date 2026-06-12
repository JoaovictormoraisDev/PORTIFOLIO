let activeLenis = null;
let activeGsap = null;

document.body.classList.add("is-loading");

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

if (window.location.hash) {
  window.scrollTo(0, 0);
}

const cursor = {
  x: 0.5,
  y: 0.5,
  targetX: 0.5,
  targetY: 0.5,
};
let pageVisible = true;

document.addEventListener("visibilitychange", () => {
  pageVisible = !document.hidden;
});

window.addEventListener("pointermove", (event) => {
  cursor.targetX = event.clientX / window.innerWidth;
  cursor.targetY = 1 - event.clientY / window.innerHeight;
}, { passive: true });

async function loadMotion() {
  try {
    const [{ default: Lenis }, THREE, gsapModule, scrollTriggerModule] = await Promise.all([
      import("https://esm.sh/@studio-freight/lenis@1.0.42"),
      import("https://esm.sh/three@0.164.1"),
      import("https://esm.sh/gsap@3.12.5"),
      import("https://esm.sh/gsap@3.12.5/ScrollTrigger"),
    ]);

    const gsap = gsapModule.gsap || gsapModule.default;
    const ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;

    activeGsap = gsap;
    initLenis(Lenis, gsap, ScrollTrigger);
    initThree(THREE);
    initGsap(gsap, ScrollTrigger);
    initButtonEffects(gsap);
    initProjectShowcase(gsap);
    initTechCards(gsap);
    initTickerCarousel(gsap);
    document.documentElement.classList.add("motion-ready");
    initLoader(gsap);

    requestAnimationFrame(() => {
      const initialTarget = window.location.hash && document.querySelector(window.location.hash);

      if (initialTarget && activeLenis) {
        activeLenis.scrollTo(initialTarget, {
          immediate: true,
          offset: -24,
        });
      }

      ScrollTrigger.refresh();
      ScrollTrigger.update();
      revealCurrentViewport(gsap);
    });
  } catch (error) {
    document.documentElement.classList.add("motion-fallback");
    hideLoaderFallback();
    initCssFallback();
  }
}

function initLoader(gsap) {
  const loader = document.querySelector(".page-loader");

  if (!loader) {
    document.body.classList.remove("is-loading");
    return;
  }

  const titleLetters = splitLoaderText(loader.querySelector(".loader-title"));
  const subtitleLetters = splitLoaderText(loader.querySelector(".loader-subtitle"));
  const kicker = loader.querySelector(".loader-kicker");
  const progress = loader.querySelector(".loader-progress span");

  gsap.set([...titleLetters, ...subtitleLetters], {
    autoAlpha: 0,
    yPercent: 120,
    rotateX: -42,
  });
  gsap.set(kicker, { autoAlpha: 0, y: 12 });

  const timeline = gsap.timeline({
    defaults: { ease: "power3.out" },
    onComplete: () => {
      loader.hidden = true;
      document.body.classList.remove("is-loading");
    },
  });

  timeline
    .to(kicker, { autoAlpha: 1, y: 0, duration: 0.42 })
    .to(titleLetters, {
      autoAlpha: 1,
      yPercent: 0,
      rotateX: 0,
      duration: 0.72,
      stagger: 0.025,
    }, "-=0.12")
    .to(subtitleLetters, {
      autoAlpha: 1,
      yPercent: 0,
      rotateX: 0,
      duration: 0.54,
      stagger: 0.025,
    }, "-=0.34")
    .to(progress, {
      scaleX: 1,
      duration: 0.9,
      ease: "power2.inOut",
    }, "-=0.38")
    .to(loader, {
      autoAlpha: 0,
      duration: 0.6,
      ease: "power2.inOut",
    }, "+=0.1");
}

function hideLoaderFallback() {
  const loader = document.querySelector(".page-loader");

  setTimeout(() => {
    if (loader) {
      loader.hidden = true;
    }

    document.body.classList.remove("is-loading");
  }, 900);
}

function splitLoaderText(element) {
  if (!element || element.dataset.loaderSplit === "true") {
    return [];
  }

  const text = element.textContent.trim();
  const fragment = document.createDocumentFragment();

  Array.from(text).forEach((character) => {
    if (character === " ") {
      fragment.appendChild(document.createTextNode(" "));
      return;
    }

    const letter = document.createElement("span");
    letter.className = "text-reveal-letter";
    letter.textContent = character;
    fragment.appendChild(letter);
  });

  element.textContent = "";
  element.appendChild(fragment);
  element.dataset.loaderSplit = "true";

  return element.querySelectorAll(".text-reveal-letter");
}

function initLenis(Lenis, gsap, ScrollTrigger) {
  activeLenis = new Lenis({
    lerp: 0.055,
    duration: 1.35,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 0.58,
    touchMultiplier: 1,
  });

  activeLenis.on("scroll", () => {
    if (ScrollTrigger) {
      ScrollTrigger.update();
    }
  });

  gsap.ticker.add((time) => {
    activeLenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));

      if (!target) {
        return;
      }

      event.preventDefault();
      activeLenis.scrollTo(target, {
        offset: -24,
        duration: 1,
      });
    });
  });
}

function initGsap(gsap, ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({
    ignoreMobileResize: true,
    limitCallbacks: true,
  });

  const scrollRevealSelector = [
    ".ticker",
    ".section-heading",
    ".work-showcase",
    ".resume-section > *",
    ".contact-section > *",
  ].join(", ");
  const revealItems = [
    ".site-header",
    ".hero > *",
  ].join(", ");

  gsap.from(revealItems, {
    y: 34,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.09,
    clearProps: "transform",
  });

  gsap.utils
    .toArray(scrollRevealSelector)
    .forEach((element) => {
      gsap.fromTo(
        element,
        {
          autoAlpha: 0,
          y: element.classList.contains("work-showcase") ? 62 : 42,
        },
        {
          autoAlpha: 1,
          y: 0,
          ease: "none",
          immediateRender: false,
          overwrite: "auto",
          scrollTrigger: {
            trigger: element,
            start: "top 92%",
            end: "top 66%",
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        },
      );
    });

  gsap.utils.toArray(".section").forEach((section) => {
    gsap.fromTo(
      section,
      { y: 36 },
      {
        y: 0,
        ease: "none",
        immediateRender: false,
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "top 45%",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      },
    );
  });

  initTextReveal(gsap, ScrollTrigger);
  initTechReveal(gsap, ScrollTrigger);

  setTimeout(() => {
    ScrollTrigger.refresh();
    ScrollTrigger.update();
    revealCurrentViewport(gsap);
  }, 320);
}

function initTechReveal(gsap, ScrollTrigger) {
  const cards = gsap.utils.toArray(".tech-card");

  if (!cards.length) {
    return;
  }

  gsap.set(cards, {
    autoAlpha: 0,
    y: 54,
    scale: 0.96,
  });

  ScrollTrigger.batch(cards, {
    start: "top 88%",
    end: "bottom top",
    batchMax: 2,
    interval: 0.08,
    onEnter: (batch) => {
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.12,
        overwrite: "auto",
      });
    },
  });
}

function initTextReveal(gsap, ScrollTrigger) {
  const wordSelector = [
    ".hero .eyebrow",
    ".hero h1",
    ".section-heading h2",
    ".work-card h3",
    ".resume-copy h2",
    ".contact-panel h2",
  ].join(", ");

  const letterSelector = [
    ".brand span:last-child",
    ".nav-links a",
    ".hero .intro",
    ".primary-button",
    ".section-kicker",
    ".work-card p",
    ".project-button",
    ".resume-points > span",
    ".resume-stats strong",
    ".resume-stats span",
    ".resume-note",
    ".ghost-button",
    ".contact-copy",
    ".contact-details a",
    ".contact-form label span",
    ".contact-form button",
  ].join(", ");

  gsap.utils.toArray(wordSelector).forEach((element) => {
    animateTextReveal(gsap, ScrollTrigger, element, "word");
  });

  gsap.utils.toArray(letterSelector).forEach((element) => {
    const mode = element.textContent.trim().length > 110 ? "word" : "letter";
    animateTextReveal(gsap, ScrollTrigger, element, mode);
  });
}

function animateTextReveal(gsap, ScrollTrigger, element, mode) {
  if (element.dataset.textRevealReady === "true" || !element.textContent.trim()) {
    return;
  }

  const originalText = element.textContent.replace(/\s+/g, " ").trim();
  const fragment = document.createDocumentFragment();

  Array.from(element.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
      fragment.appendChild(document.createElement("br"));
      return;
    }

    if (node.nodeType !== Node.TEXT_NODE) {
      return;
    }

    node.textContent.split(/(\s+)/).forEach((token) => {
      if (!token) {
        return;
      }

      if (/^\s+$/.test(token)) {
        fragment.appendChild(document.createTextNode(token));
        return;
      }

      const word = document.createElement("span");
      word.className = "text-reveal-word";
      word.setAttribute("aria-hidden", "true");

      if (mode === "letter") {
        Array.from(token).forEach((character) => {
          const letter = document.createElement("span");
          letter.className = "text-reveal-letter";
          letter.textContent = character;
          word.appendChild(letter);
        });
      } else {
        word.textContent = token;
      }

      fragment.appendChild(word);
    });
  });

  element.textContent = "";
  const readerText = document.createElement("span");
  readerText.className = "text-reveal-reader";
  readerText.textContent = originalText;
  element.appendChild(fragment);
  element.appendChild(readerText);
  element.dataset.textRevealReady = "true";

  const targets = mode === "letter"
    ? element.querySelectorAll(".text-reveal-letter")
    : element.querySelectorAll(".text-reveal-word");

  gsap.fromTo(
    targets,
    {
      autoAlpha: 0,
      yPercent: mode === "letter" ? 105 : 110,
      rotateX: mode === "letter" ? -28 : 0,
    },
    {
      autoAlpha: 1,
      yPercent: 0,
      rotateX: 0,
      duration: mode === "letter" ? 0.5 : 0.62,
      ease: "power3.out",
      stagger: {
        each: mode === "letter" ? 0.01 : 0.035,
        from: "start",
      },
      scrollTrigger: {
        trigger: element,
        start: "top 88%",
        toggleActions: "play none none none",
      },
      onComplete: () => {
        gsap.set(targets, { clearProps: "transform,opacity,visibility" });
      },
    },
  );
}

function revealCurrentViewport(gsap) {
  if (!window.location.hash) {
    return;
  }

  const viewportItems = document.querySelectorAll([
    ".ticker",
    ".section-heading",
    ".work-showcase",
    ".tech-card",
    ".resume-section > *",
    ".contact-section > *",
  ].join(", "));

  viewportItems.forEach((element) => {
    const rect = element.getBoundingClientRect();

    if (rect.top > window.innerHeight || rect.bottom < 0) {
      return;
    }

    gsap.set(element, {
      autoAlpha: 1,
      y: 0,
    });
  });
}

function initTickerCarousel(gsap) {
  const track = document.querySelector(".ticker-track");

  if (!track) {
    return;
  }

  const distance = track.scrollWidth / 2;

  gsap.fromTo(
    track,
    { x: 0 },
    {
      x: -distance,
      duration: 34,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => Number.parseFloat(x) % distance),
      },
    },
  );
}

function initButtonEffects(gsap) {
  const buttons = document.querySelectorAll(".primary-button, .ghost-button, .project-button, .nav-links a, .brand");

  buttons.forEach((button) => {
    button.addEventListener("pointerenter", () => {
      const hoverState = {
        y: -3,
        scale: 1.035,
        boxShadow: "0 0 24px rgba(255, 255, 255, 0.16)",
        duration: 0.24,
        ease: "power2.out",
        overwrite: "auto",
      };

      if (button.classList.contains("ghost-button")) {
        hoverState.color = "#06070a";
      }

      gsap.to(button, hoverState);
    });

    button.addEventListener("pointerleave", () => {
      gsap.to(button, {
        y: 0,
        scale: 1,
        boxShadow: button.classList.contains("primary-button")
          ? "0 12px 28px rgba(255, 255, 255, 0.06)"
          : "0 0 0 rgba(255, 255, 255, 0)",
        color: "",
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    button.addEventListener("pointerdown", () => {
      gsap.to(button, {
        scale: 0.96,
        duration: 0.12,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    button.addEventListener("pointerup", () => {
      gsap.to(button, {
        scale: 1.03,
        duration: 0.18,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  });
}

function initProjectShowcase(gsap) {
  const showcase = document.querySelector(".work-showcase");
  const cards = Array.from(document.querySelectorAll("[data-project-slide]"));
  const nextButton = document.querySelector(".project-next");
  const prevButton = document.querySelector(".project-prev");
  const progress = document.querySelector(".project-progress span");

  if (!showcase || cards.length === 0) {
    return;
  }

  if (showcase.dataset.projectShowcaseReady === "true" && !gsap) {
    return;
  }

  let activeIndex = Math.max(0, cards.findIndex((card) => card.classList.contains("is-active")));
  let startX = 0;
  let startY = 0;

  function signedOffset(index) {
    let offset = index - activeIndex;
    const half = cards.length / 2;

    if (offset > half) {
      offset -= cards.length;
    }

    if (offset < -half) {
      offset += cards.length;
    }

    return offset;
  }

  function updateVideos() {
    cards.forEach((card, index) => {
      card.classList.toggle("is-active", index === activeIndex);
      card.setAttribute("aria-hidden", index === activeIndex ? "false" : "true");
    });
  }

  function layoutCards(animate = true) {
    const isMobile = window.innerWidth <= 820;
    const gap = isMobile ? 245 : 540;

    cards.forEach((card, index) => {
      const offset = signedOffset(index);
      const isActive = offset === 0;
      const target = {
        xPercent: -50,
        x: offset * gap,
        y: isActive ? 0 : isMobile ? 18 : 34,
        scale: isActive ? 1 : isMobile ? 0.78 : 0.68,
        opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.36,
        zIndex: isActive ? 6 : 3 - Math.abs(offset),
        duration: animate ? 0.62 : 0,
        ease: "power3.inOut",
        overwrite: "auto",
      };

      if (gsap) {
        gsap.to(card, target);
      } else {
        card.style.zIndex = String(target.zIndex);
        card.style.opacity = String(target.opacity);
        card.style.transform = `translate3d(calc(-50% + ${target.x}px), ${target.y}px, 0) scale(${target.scale})`;
      }
    });

    if (progress) {
      const scale = (activeIndex + 1) / cards.length;
      if (gsap) {
        gsap.to(progress, {
          scaleX: scale,
          duration: animate ? 0.55 : 0,
          ease: "power3.out",
          overwrite: "auto",
        });
      } else {
        progress.style.transform = `scaleX(${scale})`;
      }
    }

    if (gsap && animate) {
      const activeContent = cards[activeIndex].querySelectorAll(".work-number, h3, p, .project-actions");
      gsap.fromTo(activeContent, {
        y: 22,
        autoAlpha: 0,
      }, {
        y: 0,
        autoAlpha: 1,
        duration: 0.46,
        ease: "power3.out",
        stagger: 0.055,
        overwrite: "auto",
      });
    }

    updateVideos();
  }

  function goTo(index) {
    activeIndex = (index + cards.length) % cards.length;
    layoutCards(true);
  }

  if (showcase.dataset.projectShowcaseReady !== "true") {
    nextButton?.addEventListener("click", () => goTo(activeIndex + 1));
    prevButton?.addEventListener("click", () => goTo(activeIndex - 1));

    cards.forEach((card, index) => {
      card.addEventListener("click", (event) => {
        if (index === activeIndex || event.target.closest("a")) {
          return;
        }

        goTo(index);
      });
    });

    showcase.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      startY = event.clientY;
    }, { passive: true });

    showcase.addEventListener("pointerup", (event) => {
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;

      if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        goTo(activeIndex + (deltaX < 0 ? 1 : -1));
      }
    }, { passive: true });

    let resizeFrame = 0;
    window.addEventListener("resize", () => {
      if (resizeFrame) {
        return;
      }

      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        layoutCards(false);
      });
    });
    showcase.dataset.projectShowcaseReady = "true";
  }

  layoutCards(false);
}

function initTechCards(gsap) {
  document.querySelectorAll(".tech-card").forEach((card) => {
    const icon = card.querySelector("img, .tech-monogram");
    const title = card.querySelector("h3");
    const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!icon) {
      return;
    }

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      const rotateX = ((y / rect.height) - 0.5) * -8;

      card.style.setProperty("--tech-x", `${x}px`);
      card.style.setProperty("--tech-y", `${y}px`);
      if (!canTilt) {
        return;
      }

      gsap.to(card, {
        rotateX,
        rotateY,
        transformPerspective: 900,
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    card.addEventListener("pointerenter", () => {
      gsap.to(icon, {
        y: -8,
        rotate: 5,
        scale: 1.16,
        duration: 0.42,
        ease: "back.out(1.8)",
        overwrite: "auto",
      });

      if (title) {
        gsap.to(title, {
          x: 4,
          duration: 0.32,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    });

    card.addEventListener("pointerleave", () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.42,
        ease: "power3.out",
        overwrite: "auto",
      });

      gsap.to(icon, {
        y: 0,
        rotate: 0,
        scale: 1,
        duration: 0.42,
        ease: "power3.out",
        overwrite: "auto",
      });

      if (title) {
        gsap.to(title, {
          x: 0,
          duration: 0.36,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    });
  });
}

function initThree(THREE) {
  const canvas = document.querySelector("#scene");
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });

  const maxPixelRatio = window.innerWidth < 768 ? 0.75 : 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uMouse: { value: new THREE.Vector2(cursor.x, cursor.y) },
    uTime: { value: 0 },
    uAspect: { value: window.innerWidth / window.innerHeight },
  };

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    precision: "mediump",
    uniforms,
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform vec2 uMouse;
      uniform float uTime;
      uniform float uAspect;
      varying vec2 vUv;

      void main() {
        vec2 delta = vUv - uMouse;
        delta.x *= uAspect;

        float distanceToCursor = length(delta);
        float shadow = smoothstep(0.86, 0.0, distanceToCursor);
        float core = smoothstep(0.28, 0.0, distanceToCursor);
        float hotSpot = smoothstep(0.08, 0.0, distanceToCursor);
        vec3 coolShadow = vec3(0.10, 0.12, 0.20);
        vec3 softGold = vec3(1.0, 0.82, 0.30);
        vec3 pearl = vec3(1.0, 0.84, 0.42);
        vec3 color = mix(coolShadow, softGold, core * 0.42);
        color = mix(color, pearl, hotSpot * 0.18);
        float alpha = shadow * 0.34 + core * 0.14 + hotSpot * 0.07;

        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uAspect.value = window.innerWidth / window.innerHeight;
  }

  function animate(time) {
    if (!pageVisible) {
      requestAnimationFrame(animate);
      return;
    }

    cursor.x += (cursor.targetX - cursor.x) * 0.08;
    cursor.y += (cursor.targetY - cursor.y) * 0.08;

    uniforms.uMouse.value.set(cursor.x, cursor.y);
    uniforms.uTime.value = time * 0.001;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(animate);
}

function initCssFallback() {
  const root = document.documentElement;

  window.addEventListener("pointermove", (event) => {
    root.style.setProperty("--mouse-x", `${event.clientX}px`);
    root.style.setProperty("--mouse-y", `${event.clientY}px`);
  });
}

initMobileNav();
initProjectShowcase();
initContactForm();
loadMotion();

function initMobileNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelectorAll(".nav-links a");

  if (!header || !toggle) {
    return;
  }

  function setMenu(open) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  toggle.addEventListener("click", () => {
    setMenu(!header.classList.contains("is-open"));
  });

  links.forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      setMenu(false);
    }
  });
}

function initContactForm() {
  const form = document.querySelector(".contact-form");

  if (!form) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const recipient = form.dataset.recipient;
    const sender = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!recipient || !sender || !message) {
      return;
    }

    const subject = encodeURIComponent("Contato pelo portfolio");
    const body = encodeURIComponent(`Email de contato: ${sender}\n\nMensagem:\n${message}`);

    const openEmail = () => {
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    };

    if (!activeGsap || !submitButton) {
      openEmail();
      return;
    }

    activeGsap.timeline({
      defaults: {
        ease: "power2.out",
        overwrite: "auto",
      },
      onComplete: openEmail,
    })
      .to(submitButton, {
        scale: 0.95,
        duration: 0.1,
      })
      .to(submitButton, {
        scale: 1,
        backgroundColor: "#f4c84f",
        duration: 0.2,
      })
      .to(form, {
        y: -5,
        duration: 0.18,
      }, 0)
      .to(form, {
        y: 0,
        duration: 0.24,
      });
  });
}
