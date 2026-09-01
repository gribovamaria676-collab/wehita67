const menuBtn = document.querySelector(".menu");
const nav = document.querySelector(".top nav");
if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    const on = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", on ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }));
}

const loader = document.getElementById("loader");
const hero = document.querySelector(".hero");
const yarn = document.getElementById("yarn");
const titleDot = document.getElementById("title-dot");
const seenLoader = sessionStorage.getItem("mg-seen-loader") === "1";
const startedAt = Date.now();

if (hero) hero.classList.add("is-waiting");
document.body.classList.add("is-loading");

const revealHero = () => {
  document.body.classList.remove("is-loading");
  if (hero) {
    hero.classList.remove("is-waiting");
    hero.classList.add("is-in");
  }
};

const hideLoader = () => {
  if (!loader || loader.classList.contains("off")) return;
  loader.classList.add("off");
  setTimeout(() => loader.remove(), 500);
};

const flyYarnToDot = () => {
  if (!yarn || !titleDot) return Promise.resolve();
  const y = yarn.getBoundingClientRect();
  const d = titleDot.getBoundingClientRect();
  yarn.style.animation = "none";
  yarn.style.position = "fixed";
  yarn.style.left = y.left + "px";
  yarn.style.top = y.top + "px";
  yarn.style.transition = "left .7s cubic-bezier(.22,.7,.2,1), top .7s cubic-bezier(.22,.7,.2,1), width .7s ease, height .7s ease, border-radius .7s ease";
  requestAnimationFrame(() => {
    yarn.style.left = d.left + d.width / 2 - 8 + "px";
    yarn.style.top = d.top + d.height / 2 - 8 + "px";
    yarn.style.width = "16px";
    yarn.style.height = "16px";
  });
  return new Promise((res) => setTimeout(res, 720));
};

const exitLoader = async () => {
  if (!loader || loader.classList.contains("exit")) return;
  loader.classList.add("exit");
  sessionStorage.setItem("mg-seen-loader", "1");
  await flyYarnToDot();
  revealHero();
  hideLoader();
};

if (!loader) {
  revealHero();
} else if (seenLoader) {
  loader.remove();
  revealHero();
} else {
  const ready = new Promise((res) => {
    if (document.readyState === "complete") res();
    else window.addEventListener("load", res, { once: true });
  });
  Promise.all([ready, new Promise((r) => setTimeout(r, 1800))]).then(exitLoader);
  setTimeout(exitLoader, 8000);
}

const float = document.querySelector(".float");
if (float) {
  float.addEventListener("mousemove", (e) => {
    const r = float.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    float.querySelectorAll("figure").forEach((fig, i) => {
      const d = (i + 1) * 10;
      fig.style.transform = `translate(${x * d}px, ${y * d}px) rotate(${[-6, 0, 4, -2][i]}deg)`;
    });
  });
  float.addEventListener("mouseleave", () => {
    float.querySelectorAll("figure").forEach((fig, i) => {
      fig.style.transform = `rotate(${[-6, 0, 4, -2][i]}deg)`;
    });
  });
}

let scrollDir = 1;
let lastY = window.scrollY;
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  scrollDir = y > lastY ? 1 : -1;
  lastY = y;
}, { passive: true });

document.querySelectorAll(".about, .case, .services, .contact, .clients").forEach((el) => {
  el.classList.add("reveal");
});
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const el = entry.target;
    if (entry.isIntersecting) {
      el.classList.remove("from-up", "from-down");
      el.classList.add(scrollDir > 0 ? "from-down" : "from-up", "in");
    } else {
      el.classList.remove("in");
    }
  });
}, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

const chips = document.querySelectorAll(".filters button");
const cards = document.querySelectorAll(".case");
chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("on"));
    chip.classList.add("on");
    const f = chip.dataset.filter;
    cards.forEach((card) => {
      card.style.display = f === "all" || card.dataset.type === f ? "" : "none";
    });
  });
});

const form = document.getElementById("lead-form");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const note = document.getElementById("form-note");
    const btn = form.querySelector("button[type=submit]");
    const data = new FormData(form);
    if (!form.reportValidity()) return;
    btn.disabled = true;
    note.hidden = false;
    note.textContent = "Отправляю заявку…";
    const payload = {
      name: data.get("name"),
      contact: data.get("contact"),
      task: data.get("task"),
      _subject: "Заявка с сайта Марии Грибовой",
      _template: "table",
      _captcha: "false",
    };
    try {
      const res = await fetch("https://formsubmit.co/ajax/m9ribova@yandex.ru", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json.success === "true" || json.success === true || res.status === 200)) {
        note.textContent = "Заявка ушла на m9ribova@yandex.ru. Если это первое письмо с сайта — подтвердите адрес в письме от FormSubmit.";
        form.reset();
      } else {
        throw new Error(json.message || "fail");
      }
    } catch (err) {
      const text = [
        "Заявка с сайта Марии Грибовой",
        "Имя: " + data.get("name"),
        "Контакт: " + data.get("contact"),
        "Задача: " + data.get("task"),
      ].join("\n");
      window.location.href = "mailto:m9ribova@yandex.ru?subject=" + encodeURIComponent("Заявка с сайта") + "&body=" + encodeURIComponent(text);
      note.textContent = "Откроется почтовый клиент на m9ribova@yandex.ru. Можно также написать в Telegram.";
    } finally {
      btn.disabled = false;
    }
  });
}

const cookieBox = document.getElementById("cookie");
if (cookieBox && !localStorage.getItem("mg_cookie")) cookieBox.hidden = false;
const hideCookie = (mode) => {
  if (!cookieBox) return;
  localStorage.setItem("mg_cookie", mode);
  cookieBox.hidden = true;
  cookieBox.style.display = "none";
};
document.getElementById("cookie-on")?.addEventListener("click", () => hideCookie("all"));
document.getElementById("cookie-off")?.addEventListener("click", () => hideCookie("needed"));

const pauseMedia = (exceptVideo) => {
  document.querySelectorAll("video").forEach((other) => {
    if (other !== exceptVideo) other.pause();
  });
  document.querySelectorAll("audio").forEach((a) => {
    a.pause();
    a.currentTime = 0;
  });
  document.querySelectorAll("[data-audio]").forEach((b) => (b.textContent = "▶"));
};

document.querySelectorAll("video").forEach((video) => {
  video.addEventListener("play", () => pauseMedia(video));
});

document.querySelectorAll("[data-audio]").forEach((btn) => {
  const audio = document.getElementById(btn.dataset.audio);
  btn.addEventListener("click", () => {
    pauseMedia();
    if (audio.paused) {
      audio.play();
      btn.textContent = "❚❚";
    } else {
      audio.pause();
      btn.textContent = "▶";
    }
    audio.onended = () => (btn.textContent = "▶");
  });
});

document.querySelectorAll("[data-carousel]").forEach((root) => {
  const slides = [...root.querySelectorAll(".slide")];
  const thumbs = [...root.querySelectorAll("[data-thumbs] button")];
  const titleEl = root.querySelector("[data-slider-title]");
  const countEl = root.querySelector("[data-slider-count]");
  const titles = ["Садовая мебель", "Письменный стол · сентябрь", "Кухни · распродажа", "Папасан · погода"];
  let i = 0;
  const go = (n) => {
    slides[i].querySelectorAll("video").forEach((v) => { v.pause(); v.currentTime = 0; });
    i = (n + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle("is-on", idx === i));
    thumbs.forEach((d, idx) => d.classList.toggle("on", idx === i));
    if (titleEl) titleEl.textContent = titles[i] || "";
    if (countEl) countEl.textContent = (i + 1) + " / " + slides.length;
  };
  thumbs.forEach((btn) => btn.addEventListener("click", () => go(Number(btn.dataset.goto))));
  root.querySelector(".carousel-prev")?.addEventListener("click", () => go(i - 1));
  root.querySelector(".carousel-next")?.addEventListener("click", () => go(i + 1));
});

const lb = document.getElementById("lightbox");
if (lb) {
  const lbImg = lb.querySelector("img");
  const lbCap = lb.querySelector("p");
  const shots = [...document.querySelectorAll(".case-media img, .about-photo img, .float img")];
  let idx = 0;
  const open = (n) => {
    idx = n;
    const img = shots[idx];
    lbImg.src = img.currentSrc || img.src;
    lbCap.textContent = img.alt || "";
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    lb.hidden = true;
    document.body.style.overflow = "";
  };
  shots.forEach((img, n) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => open(n));
  });
  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-prev").addEventListener("click", () => open((idx - 1 + shots.length) % shots.length));
  lb.querySelector(".lb-next").addEventListener("click", () => open((idx + 1) % shots.length));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") open((idx - 1 + shots.length) % shots.length);
    if (e.key === "ArrowRight") open((idx + 1) % shots.length);
  });
}
