(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const preloader = document.querySelector(".preloader");

  if (preloader) {
    const count = preloader.querySelector(".preloader-count");
    const line = preloader.querySelector(".preloader-line i");
    const hasLoaded = sessionStorage.getItem("atelier-loaded");
    if (hasLoaded) {
      preloader.classList.add("is-done");
    } else {
      let value = 0;
      const duration = reduceMotion ? 30 : 820;
      const start = performance.now();
      const tick = (now) => {
        value = Math.min(100, Math.round(((now - start) / duration) * 100));
        if (count) count.textContent = String(value).padStart(2, "0");
        if (line) line.style.width = `${value}%`;
        if (value < 100) requestAnimationFrame(tick);
        else {
          sessionStorage.setItem("atelier-loaded", "1");
          window.setTimeout(() => preloader.classList.add("is-done"), reduceMotion ? 0 : 180);
        }
      };
      requestAnimationFrame(tick);
    }
  }

  const revealItems = document.querySelectorAll(".reveal, .teaser-rule");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const progressBar = document.querySelector(".reading-progress i");
  let scrollQueued = false;
  const updateScroll = () => {
    if (progressBar) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    scrollQueued = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  updateScroll();

  const menuButton = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      mobileMenu.classList.toggle("is-open", open);
      mobileMenu.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("menu-open", open);
    });
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Abrir menú");
        mobileMenu.classList.remove("is-open");
        mobileMenu.setAttribute("aria-hidden", "true");
        document.body.classList.remove("menu-open");
      });
    });
  }

  const pageWipe = document.querySelector(".page-wipe");
  document.querySelectorAll('a[href$=".html"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = new URL(link.href, window.location.href);
      if (target.origin !== window.location.origin || target.pathname === window.location.pathname) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank") return;
      event.preventDefault();
      if (!pageWipe || reduceMotion) {
        window.location.href = target.href;
        return;
      }
      pageWipe.classList.add("is-active");
      window.setTimeout(() => { window.location.href = target.href; }, 450);
    });
  });

  document.querySelectorAll(".product-card").forEach((card) => {
    const image = card.querySelector(".product-image");
    if (!image) return;
    image.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const rect = image.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const shine = image.querySelector(".product-shine");
      if (shine) shine.style.transform = `translate(${(x - 0.5) * 100}%, 0) rotate(9deg)`;
    });
    image.addEventListener("pointerleave", () => {
      const shine = image.querySelector(".product-shine");
      if (shine) shine.style.removeProperty("transform");
    });
    image.addEventListener("click", () => {
      if (window.matchMedia("(hover: none)").matches) {
        card.classList.toggle("is-shining");
        window.setTimeout(() => card.classList.remove("is-shining"), 900);
      }
    });
  });

  const filterButtons = document.querySelectorAll(".filter-button");
  const catalogCards = document.querySelectorAll(".catalog-card");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      const filter = button.dataset.filter;
      catalogCards.forEach((card) => {
        const visible = filter === "all" || card.dataset.intensity === filter;
        card.classList.toggle("is-hidden", !visible);
      });
    });
  });

  const pieces = {
    original: { name: "El Original", price: 45, className: "original" },
    noir: { name: "Negro Profundo", price: 55, className: "noir" },
    blanc: { name: "Blanco Nacarado", price: 60, className: "blanc" },
    piment: { name: "Guindilla Picante", price: 62, className: "piment" },
    fleur: { name: "Flor de Sal", price: 58, className: "fleur" },
    or: { name: "Edición de Oro", price: 120, className: "or" }
  };
  const selection = [];
  const selectedList = document.querySelector("#selected-list");
  const boxCount = document.querySelector("#box-count");
  const boxTotal = document.querySelector("#box-total");
  const reserveButton = document.querySelector("#reserve-button");
  const renderBox = () => {
    if (!selectedList || !boxCount || !boxTotal || !reserveButton) return;
    boxCount.textContent = String(selection.length);
    boxTotal.textContent = `${selection.reduce((total, piece) => total + piece.price, 0)} €`;
    reserveButton.disabled = selection.length !== 6;
    document.querySelectorAll(".box-slot").forEach((slot, index) => {
      const piece = selection[index];
      slot.classList.toggle("is-filled", Boolean(piece));
      if (piece) slot.classList.remove("is-removing");
      slot.dataset.piece = piece ? piece.className : "";
      const number = slot.querySelector("span");
      if (number) number.textContent = piece ? String(index + 1).padStart(2, "0") : String(index + 1).padStart(2, "0");
    });
    if (!selection.length) {
      selectedList.innerHTML = '<p class="empty-selection">Seleccione sus piezas<br>para comenzar.</p>';
      return;
    }
    selectedList.innerHTML = selection.map((piece, index) =>
      `<div class="selected-item"><span>${String(index + 1).padStart(2, "0")} &nbsp; ${piece.name}</span><span>${piece.price} € <button type="button" aria-label="Quitar ${piece.name}" data-remove="${index}">×</button></span></div>`
    ).join("");
    selectedList.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.remove);
        document.querySelectorAll(".box-slot").forEach((slot) => {
          if (Number(slot.dataset.slot) >= index) slot.classList.add("is-removing");
        });
        selectedList.querySelectorAll("[data-remove]").forEach((removeButton) => {
          removeButton.disabled = true;
        });
        window.setTimeout(() => {
          selection.splice(index, 1);
          renderBox();
          document.querySelectorAll(".box-slot.is-removing").forEach((slot) => {
            window.setTimeout(() => slot.classList.remove("is-removing"), 320);
          });
        }, 280);
      });
    });
  };

  document.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => {
      const piece = pieces[button.dataset.add];
      if (!piece) return;
      if (selection.length >= 6) {
        const builder = document.querySelector("#configurador");
        if (builder) {
          builder.classList.add("capacity-reached");
          window.setTimeout(() => builder.classList.remove("capacity-reached"), 450);
        }
        return;
      }
      selection.push(piece);
      renderBox();
      button.classList.add("piece-added");
      window.setTimeout(() => button.classList.remove("piece-added"), 500);
    });
  });
  renderBox();

  const modal = document.querySelector("#reservation-modal");
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };
  const makeConfetti = () => {
    const colors = ["#a68953", "#d4bd87", "#eae6df", "#754a2e"];
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 42; i += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.setProperty("--fall", `${2.1 + Math.random() * 1.8}s`);
      piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 170}px`);
      piece.style.animationDelay = `${Math.random() * 0.4}s`;
      fragment.appendChild(piece);
    }
    document.body.appendChild(fragment);
    window.setTimeout(() => document.querySelectorAll(".confetti-piece").forEach((item) => item.remove()), 4600);
  };
  if (reserveButton && modal) {
    reserveButton.addEventListener("click", () => {
      if (selection.length !== 6) return;
      makeConfetti();
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      const close = modal.querySelector(".modal-close");
      if (close) close.focus();
    });
    modal.querySelectorAll(".modal-close, .modal-done").forEach((button) => button.addEventListener("click", closeModal));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
  }

  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      item.classList.toggle("is-open", open);
    });
  });

  const contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      const response = contactForm.querySelector(".form-response");
      if (response) response.textContent = "Solicitud recibida. Habla directamente con el chico nuevo de la mesa para gestionar el pedido.";
      contactForm.reset();
    });
  }

  const founderPhoto = document.querySelector(".founder-photo");
  if (founderPhoto) {
    founderPhoto.addEventListener("error", () => {
      founderPhoto.classList.add("photo-missing");
      founderPhoto.hidden = true;
    }, { once: true });
  }
})();
