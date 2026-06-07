let activeLenis = null;
let activeGsap = null;

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
    initResumeScene(THREE, gsap);
    initGsap(gsap, ScrollTrigger);
    initButtonEffects(gsap);
    initProjectShowcase(gsap);
    initTechCards(gsap);
    initTickerCarousel(gsap);
    document.documentElement.classList.add("motion-ready");

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
    initCssFallback();
  }
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
    onLeaveBack: (batch) => {
      gsap.set(batch, {
        autoAlpha: 0,
        y: 54,
        scale: 0.96,
        overwrite: "auto",
      });
    },
  });
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

function initProjectVideos() {
  const videos = document.querySelectorAll(".project-media video");

  videos.forEach((video) => {
    const card = video.closest(".work-card");
    const source = video.querySelector("source");

    video.autoplay = false;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.disableRemotePlayback = true;
    video.removeAttribute("autoplay");
    video.setAttribute("disablepictureinpicture", "");
    video.setAttribute("playsinline", "");

    video.addEventListener("error", () => {
      video.hidden = true;
      card?.classList.remove("has-project-video", "is-video-playing");
    });

    if (!source || !source.getAttribute("src")) {
      video.hidden = true;
      return;
    }

    card?.classList.add("has-project-video");

    video.addEventListener("loadeddata", () => {
      if (video.currentTime < 0.01) {
        video.currentTime = 0.01;
      }
    }, { once: true });

    video.addEventListener("playing", () => {
      card?.classList.add("is-video-playing");
    });

    video.addEventListener("pause", () => {
      card?.classList.remove("is-video-playing");
    });

    card?.addEventListener("pointerenter", () => {
      playProjectVideo(video);
    });

    card?.addEventListener("pointerleave", () => {
      pauseProjectVideo(video, "metadata");
    });
  });
}

function playProjectVideo(video) {
  if (!video || video.hidden) {
    return;
  }

  video.preload = "auto";

  if (video.readyState === 0) {
    video.load();
  }

  video.playbackRate = 1;
  video.play().catch(() => {
    video.closest(".work-card")?.classList.remove("is-video-playing");
  });
}

function pauseProjectVideo(video, preload = "none") {
  if (!video || video.hidden) {
    return;
  }

  video.pause();
  video.preload = preload;
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
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    cards.forEach((card, index) => {
      const video = card.querySelector("video");

      card.classList.toggle("is-active", index === activeIndex);
      card.setAttribute("aria-hidden", index === activeIndex ? "false" : "true");

      if (!video || video.hidden) {
        return;
      }

      if (index === activeIndex) {
        video.preload = canHover ? "metadata" : "auto";

        if (!canHover) {
          playProjectVideo(video);
        }
      } else {
        pauseProjectVideo(video);
      }
    });
  }

  function layoutCards(animate = true) {
    const isMobile = window.innerWidth <= 820;
    const gap = isMobile ? 245 : 430;

    cards.forEach((card, index) => {
      const offset = signedOffset(index);
      const isActive = offset === 0;
      const target = {
        xPercent: -50,
        x: offset * gap,
        y: isActive ? 0 : isMobile ? 18 : 34,
        scale: isActive ? 1 : isMobile ? 0.78 : 0.74,
        rotationY: isActive ? 0 : offset > 0 ? -7 : 7,
        opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.48,
        filter: isActive ? "blur(0px)" : "blur(0.2px)",
        zIndex: isActive ? 6 : 3 - Math.abs(offset),
        duration: animate ? 0.82 : 0,
        ease: "power3.inOut",
        overwrite: "auto",
      };

      if (gsap) {
        gsap.to(card, target);
      } else {
        card.style.zIndex = String(target.zIndex);
        card.style.opacity = String(target.opacity);
        card.style.transform = `translate3d(calc(-50% + ${target.x}px), ${target.y}px, 0) scale(${target.scale}) rotateY(${target.rotationY}deg)`;
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

    if (gsap) {
      const activeContent = cards[activeIndex].querySelectorAll(".work-number, h3, p, .project-actions");
      gsap.fromTo(activeContent, {
        y: 22,
        autoAlpha: 0,
      }, {
        y: 0,
        autoAlpha: 1,
        duration: 0.62,
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

    window.addEventListener("resize", () => layoutCards(false));
    showcase.dataset.projectShowcaseReady = "true";
  }

  layoutCards(false);
}

function initTechCards(gsap) {
  document.querySelectorAll(".tech-card").forEach((card) => {
    const icon = card.querySelector("img");
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

function initResumeScene(THREE, gsap) {
  const canvas = document.querySelector("#resume-scene");
  const visual = document.querySelector(".resume-visual");

  if (!canvas || !visual) {
    return;
  }

  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
  const laptop = new THREE.Group();
  const floatingCards = new THREE.Group();
  const sparks = new THREE.Group();
  const rotationState = {
    targetY: -0.34,
    currentY: -0.34,
    targetX: -0.08,
    currentX: -0.08,
    dragging: false,
    lastX: 0,
    lastY: 0,
  };
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b0d12,
    roughness: 0.52,
    metalness: 0.42,
  });
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf7f7f2,
    roughness: 0.24,
    metalness: 0.72,
    transparent: true,
    opacity: 0.16,
  });
  const monitorVideo = document.createElement("video");
  monitorVideo.src = "assets/videos/resume-monitor.mp4";
  monitorVideo.muted = true;
  monitorVideo.loop = true;
  monitorVideo.playsInline = true;
  monitorVideo.preload = "metadata";
  monitorVideo.setAttribute("playsinline", "");
  monitorVideo.setAttribute("muted", "");

  const monitorTexture = new THREE.VideoTexture(monitorVideo);
  monitorTexture.minFilter = THREE.LinearFilter;
  monitorTexture.magFilter = THREE.LinearFilter;
  monitorTexture.generateMipmaps = false;

  if ("colorSpace" in monitorTexture && THREE.SRGBColorSpace) {
    monitorTexture.colorSpace = THREE.SRGBColorSpace;
  }

  const videoScreenMaterial = new THREE.MeshBasicMaterial({
    map: monitorTexture,
    transparent: true,
    opacity: 0.96,
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.04,
    side: THREE.DoubleSide,
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.48));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
  keyLight.position.set(2.8, 3.8, 4.2);
  scene.add(keyLight);

  const goldLight = new THREE.PointLight(0xf4c84f, 2.6, 6);
  goldLight.position.set(-1.2, 0.8, 2.4);
  scene.add(goldLight);

  const blueLight = new THREE.PointLight(0x7b8cff, 1.7, 5);
  blueLight.position.set(1.8, 1.7, 1.7);
  scene.add(blueLight);

  const base = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.12, 2.05), darkMaterial);
  base.position.set(0, -0.8, 0.26);
  base.rotation.x = -0.18;
  laptop.add(base);

  const trackpad = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.012, 0.5), edgeMaterial);
  trackpad.position.set(0, -0.72, 0.78);
  trackpad.rotation.x = -0.18;
  laptop.add(trackpad);

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      const key = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.018, 0.095),
        row === 1 && col > 5 ? edgeMaterial : darkMaterial,
      );
      key.position.set(-0.9 + col * 0.2, -0.68, -0.25 + row * 0.16);
      key.rotation.x = -0.18;
      laptop.add(key);
    }
  }

  const screenBack = new THREE.Mesh(new THREE.BoxGeometry(3.05, 1.8, 0.08), darkMaterial);
  screenBack.position.set(0, 0.32, -0.78);
  screenBack.rotation.x = -0.18;
  laptop.add(screenBack);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.68, 1.43), videoScreenMaterial);
  screen.position.set(0, 0.34, -0.72);
  screen.rotation.x = -0.18;
  laptop.add(screen);

  const screenGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.62), glowMaterial);
  screenGlow.position.set(0, 0.34, -0.695);
  screenGlow.rotation.x = -0.18;
  laptop.add(screenGlow);

  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.55, 24), edgeMaterial);
  hinge.position.set(0, -0.48, -0.55);
  hinge.rotation.z = Math.PI / 2;
  laptop.add(hinge);

  [
    { x: -1.7, y: 0.95, z: 0.1, color: 0xf4c84f },
    { x: 1.45, y: 1.15, z: -0.05, color: 0x7b8cff },
    { x: 1.8, y: -0.02, z: 0.46, color: 0x7ef2c0 },
  ].forEach((cardData) => {
    const card = new THREE.Group();
    const cardMaterial = new THREE.MeshBasicMaterial({
      color: cardData.color,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
    });
    const cardEdge = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.38), cardMaterial);
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.028, 0.01), cardEdge);
    marker.position.set(-0.12, 0.02, 0.01);
    card.add(panel, marker);
    card.position.set(cardData.x, cardData.y, cardData.z);
    card.rotation.y = cardData.x < 0 ? 0.42 : -0.38;
    card.rotation.x = -0.08;
    floatingCards.add(card);
  });

  laptop.add(floatingCards);

  const sparkMaterial = new THREE.PointsMaterial({
    color: 0xf4c84f,
    size: 0.026,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const sparkPositions = [];
  const sparkCount = window.innerWidth < 768 ? 90 : 150;

  for (let index = 0; index < sparkCount; index += 1) {
    sparkPositions.push(
      (Math.random() - 0.5) * 4.6,
      (Math.random() - 0.5) * 3.1 + 0.25,
      (Math.random() - 0.5) * 2.1,
    );
  }

  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute("position", new THREE.Float32BufferAttribute(sparkPositions, 3));
  sparks.add(new THREE.Points(sparkGeometry, sparkMaterial));
  laptop.add(sparks);

  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(1.95, 0.006, 8, 128),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
    }),
  );
  orbit.rotation.x = Math.PI / 2.7;
  orbit.rotation.y = -0.16;
  laptop.add(orbit);

  laptop.rotation.set(rotationState.currentX, rotationState.currentY, 0.02);
  laptop.position.y = -0.05;
  scene.add(laptop);
  camera.position.set(0, 0.22, 4.55);

  visual.addEventListener("pointerdown", (event) => {
    monitorVideo.play().catch(() => {});
    rotationState.dragging = true;
    rotationState.lastX = event.clientX;
    rotationState.lastY = event.clientY;
    visual.setPointerCapture(event.pointerId);
  });

  visual.addEventListener("pointermove", (event) => {
    if (!rotationState.dragging) {
      return;
    }

    const deltaX = event.clientX - rotationState.lastX;
    const deltaY = event.clientY - rotationState.lastY;
    rotationState.lastX = event.clientX;
    rotationState.lastY = event.clientY;
    rotationState.targetY += deltaX * 0.012;
    rotationState.targetX = Math.max(-0.82, Math.min(0.42, rotationState.targetX + deltaY * 0.008));
  });

  visual.addEventListener("pointerup", (event) => {
    rotationState.dragging = false;
    visual.releasePointerCapture(event.pointerId);
  });

  visual.addEventListener("pointercancel", () => {
    rotationState.dragging = false;
  });

  visual.addEventListener("dblclick", () => {
    rotationState.targetY = -0.34;
    rotationState.targetX = -0.08;
  });

  function resize() {
    const rect = visual.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.1 : 1.45));
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    laptop.scale.setScalar(rect.width < 420 ? 1.02 : 1.2);
  }

  function animate(time) {
    if (!pageVisible) {
      requestAnimationFrame(animate);
      return;
    }

    const elapsed = time * 0.001;
    if (!rotationState.dragging) {
      rotationState.targetY += Math.sin(elapsed * 0.45) * 0.0007;
    }

    rotationState.currentY += (rotationState.targetY - rotationState.currentY) * 0.12;
    rotationState.currentX += (rotationState.targetX - rotationState.currentX) * 0.12;
    laptop.rotation.y = rotationState.currentY + (rotationState.dragging ? 0 : (cursor.x - 0.5) * 0.035);
    laptop.rotation.x = rotationState.currentX + Math.sin(elapsed * 0.72) * 0.018 + (rotationState.dragging ? 0 : (0.5 - cursor.y) * 0.02);
    laptop.position.y = -0.05 + Math.sin(elapsed * 0.9) * 0.035;
    floatingCards.children.forEach((card, index) => {
      card.position.y += Math.sin(elapsed * 1.2 + index) * 0.0008;
      card.rotation.z = Math.sin(elapsed * 0.9 + index) * 0.035;
    });
    sparks.rotation.y = elapsed * 0.08;
    orbit.rotation.z = elapsed * 0.18;
    screenGlow.material.opacity = 0.035 + Math.sin(elapsed * 1.6) * 0.012;
    sparkMaterial.opacity = 0.48 + Math.sin(elapsed * 1.2) * 0.16;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(animate);
  monitorVideo.play().catch(() => {});

  gsap.fromTo(laptop.scale, {
    x: 0.98,
    y: 0.98,
    z: 0.98,
  }, {
    x: 1.2,
    y: 1.2,
    z: 1.2,
    duration: 1.2,
    ease: "power3.out",
  });

  gsap.to(floatingCards.children.map((card) => card.position), {
    y: "+=0.12",
    duration: 2.8,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    stagger: 0.18,
  });

  gsap.to(".resume-visual-label span", {
    y: -4,
    duration: 1.9,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    stagger: 0.2,
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

  const maxPixelRatio = window.innerWidth < 768 ? 0.85 : 1.1;
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
        vec3 pearl = vec3(1.0, 0.98, 0.88);
        vec3 color = mix(coolShadow, softGold, core * 0.42);
        color = mix(color, pearl, hotSpot * 0.35);
        float alpha = shadow * 0.48 + core * 0.2 + hotSpot * 0.16;

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
initProjectVideos();
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
