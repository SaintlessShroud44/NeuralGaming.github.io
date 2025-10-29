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
document.addEventListener("DOMContentLoaded", () => {
  let activeVideo = null, activeMedia = null;
  const CONTROL_BAR_HEIGHT = 80;

  const isInControlBar = (e, video) => {
    const rect = video.getBoundingClientRect();
    return e.clientY > (rect.bottom - CONTROL_BAR_HEIGHT);
  };

  const attachThumbHandler = (img) => {
    img.addEventListener("click", () => toVideo(img));
  };

  const toVideo = (img) => {
    const wrapper = img.closest(".video");
    const media = wrapper.querySelector(".video-media") || wrapper; // fallback
    const videoSrc = img.dataset.video;

    // reset any other active video
    if (activeVideo && activeMedia && activeMedia !== media) {
      toThumbnail(activeMedia, activeVideo);
      activeVideo = activeMedia = null;
    }

    const video = document.createElement("video");
    video.src = videoSrc;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.style.width = "100%";
    video.style.borderRadius = "12px";

    video.dataset.thumb = img.src;
    video.dataset.alt = img.alt || "";
    video.dataset.video = videoSrc;

    const btn = document.createElement("button");
    btn.className = "play-toggle hidden";
    btn.type = "button";
    btn.textContent = "▶";

    // allow slider interaction
    video.addEventListener("click", (e) => {
      if (isInControlBar(e, video)) return;
      video.paused ? video.play() : video.pause();
    });
    btn.addEventListener("click", () => (video.paused ? video.play() : video.pause()));

    video.addEventListener("play", () => { btn.classList.add("hidden"); btn.textContent = "❚❚"; });
    video.addEventListener("pause", () => { btn.classList.remove("hidden"); btn.textContent = "▶"; });

    // restore only when finished (so scrubbing doesn't kill it)
    video.addEventListener("ended", () => {
      toThumbnail(media, video);
      if (activeVideo === video) activeVideo = activeMedia = null;
    });

    // 🔁 swap ONLY the media container contents
    media.innerHTML = "";
    media.appendChild(video);
    media.appendChild(btn);

    activeVideo = video;
    activeMedia = media;

    const p = video.play();
    if (p && p.catch) p.catch(() => btn.classList.remove("hidden"));
  };

  const toThumbnail = (media, video) => {
    const img = document.createElement("img");
    img.className = "thumbnail";
    img.src = video.dataset.thumb;
    img.alt = video.dataset.alt || "";
    img.dataset.video = video.dataset.video;

    const icon = document.createElement("div");
    icon.className = "thumb-play-icon";
    icon.textContent = "▶";

    attachThumbHandler(img);

    media.innerHTML = "";
    media.appendChild(img);
    media.appendChild(icon);
  };

  // init thumbnails + overlay
  document.querySelectorAll(".thumbnail").forEach((img) => {
    attachThumbHandler(img);
  });
  document.querySelectorAll(".video").forEach((wrap) => {
    const media = wrap.querySelector(".video-media") || wrap;
    if (!media.querySelector(".thumb-play-icon") && media.querySelector(".thumbnail")) {
      const icon = document.createElement("div");
      icon.className = "thumb-play-icon";
      icon.textContent = "▶";
      media.appendChild(icon);
    }
  });
});
