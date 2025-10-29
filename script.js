// ---------------- Slideshow (unchanged) ----------------
let index = 0;
showSlides();

function showSlides() {
  const images = document.getElementsByClassName("image");
  if (images.length === 0) return;

  for (let i = 0; i < images.length; i++) images[i].style.display = "none";
  images[index].style.display = "block";
  index = (index + 1) % images.length;
  setTimeout(showSlides, 3000);
}

// ---------------- Members (guarded & fixed) ----------------
document.addEventListener("DOMContentLoaded", () => {
  const memberList = document.getElementById("memberList");
  const addBtn = document.getElementById("addBtn");
  const memberNameInput = document.getElementById("memberName");

  if (memberList && addBtn && memberNameInput) {
    let members = ["SaintlessShroud","YMaccusY","FunnyBones","Kallari","Five Nine","Sir Spicous","Felix the Brat","Praetorian","KraftKraken","Mister Magic Man","Oneflame","Djgrey","Xordon","Shiro","Slap","Stomp"];

    function displayMembers() {
      memberList.innerHTML = "";
      members.forEach((member, index) => {
        const li = document.createElement("li");
        li.className = "member-item";
        li.innerHTML = `
          <span class="member-name">${member}</span>
          <button class="removeBtn" type="button">✖</button>
        `;
        li.querySelector(".removeBtn").addEventListener("click", () => {
          members.splice(index, 1);
          displayMembers();
        });
        memberList.appendChild(li);
      });
    }

    addBtn.addEventListener("click", () => {
      const newMember = memberNameInput.value.trim();
      if (newMember && !members.includes(newMember)) {
        members.push(newMember);
        displayMembers();
        memberNameInput.value = "";
      }
    });

    displayMembers();
  }
});

// ---------------- Moments (thumbnails ↔ video) ----------------
// Toggle autoplay for YouTube iframes and HTML5 <video>
const ADD_AUTOPLAY = false; // turn off to test Error 153

document.addEventListener("DOMContentLoaded", () => {
  let activePlayer = null;   // <video> or <iframe>
  let activeMedia  = null;   // .video-media element
  const CONTROL_BAR_HEIGHT = 80;

  /* ================= Helpers ================= */
  const isYouTubeUrl = (url) =>
    /^(https?:)?\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url);

  // Build a privacy-friendly YouTube embed with correct origin
  const toYouTubeEmbed = (url) => {
    try {
      const u = new URL(url, window.location.href);
      let id = null;

      if (u.hostname.includes("youtu.be")) {
        id = u.pathname.slice(1);
      } else if (u.hostname.includes("youtube.com")) {
        if (u.pathname.startsWith("/embed/")) {
          id = u.pathname.split("/").pop();
        } else if (u.pathname === "/watch" && u.searchParams.get("v")) {
          id = u.searchParams.get("v");
        }
      }
      if (!id) return url;

      const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);

      // carry common params if present
      ["start", "si", "list", "index", "t"].forEach((k) => {
        if (u.searchParams.has(k)) embed.searchParams.set(k, u.searchParams.get(k));
      });

      // sensible defaults
      embed.searchParams.set("playsinline", "1");
      embed.searchParams.set("rel", "0");
      embed.searchParams.set("modestbranding", "1");

      // important: provide origin when served via http(s)
      if (location.origin && location.origin.startsWith("http")) {
        embed.searchParams.set("origin", location.origin);
      }
      return embed.toString();
    } catch {
      return url;
    }
  };

  const addAutoplayParam = (url) =>
    ADD_AUTOPLAY ? url + (url.includes("?") ? "&" : "?") + "autoplay=1" : url;

  const isInControlBar = (e, videoEl) => {
    const rect = videoEl.getBoundingClientRect();
    return e.clientY > (rect.bottom - CONTROL_BAR_HEIGHT);
  };

  const ensurePlayOverlay = (mediaEl) => {
    if (!mediaEl) return;
    if (!mediaEl.querySelector(".thumb-play-icon") && mediaEl.querySelector(".thumbnail")) {
      const icon = document.createElement("div");
      icon.className = "thumb-play-icon";
      icon.textContent = "▶";
      mediaEl.appendChild(icon);
    }
  };

  /* ================= Builders ================= */
  const buildIframe = (src) => {
    const iframe = document.createElement("iframe");
    iframe.className = "video-frame";
    iframe.src = addAutoplayParam(src);
    iframe.title = "Video player";
    iframe.frameBorder = "0";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    requestAnimationFrame(() => iframe.classList.add("active")); // for CSS fade-in
    return iframe;
  };

  const buildHTML5Video = (src) => {
    const video = document.createElement("video");
    video.src = src;
    video.controls = true;
    video.autoplay = ADD_AUTOPLAY;
    video.playsInline = true;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.borderRadius = "12px";
    return video;
  };

  const buildPlayToggleBtn = () => {
    const btn = document.createElement("button");
    btn.className = "play-toggle hidden";
    btn.type = "button";
    btn.textContent = "▶";
    return btn;
  };

  /* ================= Swapping ================= */
  const toPlayer = (img) => {
    const wrapper = img.closest(".video");
    const media = wrapper.querySelector(".video-media") || wrapper;
    const rawSrc = img.dataset.video;
    if (!rawSrc) return;

    // Close any other active player
    if (activePlayer && activeMedia && activeMedia !== media) {
      toThumbnail(activeMedia);
      activePlayer = activeMedia = null;
    }

    // save for restore
    media.dataset.thumb = img.src;
    media.dataset.alt = img.alt || "";
    media.dataset.video = rawSrc;

    let playerEl;

    if (isYouTubeUrl(rawSrc)) {
      const embed = toYouTubeEmbed(rawSrc);
      playerEl = buildIframe(embed);
      media.innerHTML = "";
      media.appendChild(playerEl);
    } else {
      // Local MP4 (or other non-YouTube source)
      const video = buildHTML5Video(rawSrc);
      const btn = buildPlayToggleBtn();

      video.addEventListener("click", (e) => {
        if (isInControlBar(e, video)) return;
        video.paused ? video.play() : video.pause();
      });
      btn.addEventListener("click", () => (video.paused ? video.play() : video.pause()));

      video.addEventListener("play", () => {
        btn.classList.add("hidden");
        btn.textContent = "❚❚";
      });
      video.addEventListener("pause", () => {
        btn.classList.remove("hidden");
        btn.textContent = "▶";
      });
      video.addEventListener("ended", () => {
        toThumbnail(media);
        if (activePlayer === video) activePlayer = activeMedia = null;
      });

      media.innerHTML = "";
      media.appendChild(video);
      media.appendChild(btn);

      const p = video.play();
      if (p && p.catch) p.catch(() => btn.classList.remove("hidden"));
      playerEl = video;
    }

    activePlayer = playerEl;
    activeMedia = media;
  };

  const toThumbnail = (media) => {
    const thumbSrc = media.dataset.thumb;
    const alt = media.dataset.alt || "";
    theDataVideo = media.dataset.video;

    if (!thumbSrc || !theDataVideo) {
      media.innerHTML = "";
      return;
    }

    const img = document.createElement("img");
    img.className = "thumbnail";
    img.src = thumbSrc;
    img.alt = alt;
    img.dataset.video = theDataVideo;
    img.addEventListener("click", () => toPlayer(img));

    media.innerHTML = "";
    media.appendChild(img);

    const icon = document.createElement("div");
    icon.className = "thumb-play-icon";
    icon.textContent = "▶";
    media.appendChild(icon);
  };

  /* ================= Init ================= */
  document.querySelectorAll(".thumbnail").forEach((img) => {
    img.addEventListener("click", () => toPlayer(img));
    ensurePlayOverlay(img.closest(".video-media") || img.closest(".video"));
  });

  document.querySelectorAll(".video").forEach((wrap) => {
    ensurePlayOverlay(wrap.querySelector(".video-media") || wrap);
  });
});
