// -----------------------------
// RÉCUPÉRATION DES ÉLÉMENTS HTML
// -----------------------------

const input = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");

const framesContainer = document.getElementById("frames");
const fileInfo = document.getElementById("fileInfo");

const playerCanvas = document.getElementById("playerCanvas");
const playerCtx = playerCanvas.getContext("2d");

const playPauseBtn = document.getElementById("playPause");
const nextBtn = document.getElementById("nextFrame");
const prevBtn = document.getElementById("prevFrame");

const playerControls = document.getElementById("playerControls");

const captureBtn = document.getElementById("captureBtn");
const copyBtn = document.getElementById("copyBtn");

const timeline = document.getElementById("timeline");
const timelineContainer = document.getElementById("timelineContainer");
const timelineInfo = document.getElementById("timelineInfo");

// -----------------------------
// VARIABLES GLOBALES
// -----------------------------

let canvases = []; // stocke toutes les frames du GIF
let frameDurations = []; // durée réelle de chaque frame

let currentFrame = 0;

let playing = false;
let playTimeout;

let currentFileName = "";

// -----------------------------
// CONVERTIR LA TAILLE DU FICHIER
// -----------------------------

function formatSize(bytes) {
  return (bytes / 1024).toFixed(2) + " Ko";
}

// -----------------------------
// DÉCODER ET ANALYSER LE GIF
// -----------------------------

async function processGIF(file) {
  currentFileName = file.name.replace(/\.[^/.]+$/, "");

  const buffer = await file.arrayBuffer();

  const decoder = new ImageDecoder({
    data: buffer,
    type: "image/gif",
  });

  await decoder.tracks.ready;

  const track = decoder.tracks.selectedTrack;

  const frameCount = track.frameCount;

  canvases = [];
  frameDurations = [];

  framesContainer.innerHTML = "";

  let width;
  let height;

  // -----------------------------
  // DÉCODER CHAQUE FRAME
  // -----------------------------

  for (let i = 0; i < frameCount; i++) {
    const result = await decoder.decode({ frameIndex: i });
    const image = result.image;

    // récupérer la taille sur la première frame

    if (i === 0) {
      width = image.displayWidth;
      height = image.displayHeight;

      playerCanvas.width = width;
      playerCanvas.height = height;
    }

    // créer un canvas pour stocker la frame

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = image.displayWidth;
    canvas.height = image.displayHeight;

    ctx.drawImage(image, 0, 0);

    framesContainer.appendChild(canvas);

    canvases.push(canvas);

    // -----------------------------
    // RÉCUPÉRER LA DURÉE RÉELLE
    // -----------------------------

    let duration = image.duration;

    // image.duration est souvent en microsecondes
    if (duration) {
      duration = duration / 1000;
    }

    // fallback si durée absente
    if (!duration || duration <= 0) {
      duration = 100;
    }

    // minimum recommandé (évite les GIF trop rapides)
    duration = Math.max(duration, 20);

    frameDurations.push(duration);

    image.close();
  }

  // -----------------------------
  // AFFICHER INFOS DU GIF
  // -----------------------------

  fileInfo.innerHTML =
    "Nom : <span>" +
    file.name +
    " | </span>Poids : <span>" +
    formatSize(file.size) +
    " | </span>Taille : <span>" +
    width +
    "x" +
    height +
    " | </span>Frames : <span>" +
    frameCount +
    "</span>";

  // -----------------------------
  // TIMELINE
  // -----------------------------

  timeline.max = canvases.length - 1;
  timeline.value = 0;

  timelineContainer.style.display = "block";

  // afficher les contrôles quand le GIF est prêt

  playerCanvas.style.display = "block";
  playerControls.style.display = "flex";

  captureBtn.style.display = "inline-block";
  copyBtn.style.display = "inline-block";

  // lancer lecture automatiquement

  currentFrame = 0;
  playing = true;

  playPauseBtn.textContent = "⏸";

  play();
}

// -----------------------------
// AFFICHER UNE FRAME
// -----------------------------

function showFrame(index) {
  if (index < 0) index = canvases.length - 1;
  if (index >= canvases.length) index = 0;

  currentFrame = index;

  playerCtx.clearRect(0, 0, playerCanvas.width, playerCanvas.height);

  playerCtx.drawImage(canvases[currentFrame], 0, 0);

  timeline.value = currentFrame;

  timelineInfo.textContent =
    "Frame " + (currentFrame + 1) + " / " + canvases.length;

  const percent = (currentFrame / (canvases.length - 1)) * 100;

  timeline.style.background = `linear-gradient(to right,
#ff0000 0%,
#ff0000 ${percent}%,
#444 ${percent}%,
#444 100%)`;
}

// -----------------------------
// LECTURE DU GIF AVEC VRAI TIMING
// -----------------------------

function play() {
  if (!playing) return;

  showFrame(currentFrame);

  const delay = frameDurations[currentFrame];

  playTimeout = setTimeout(() => {
    currentFrame++;

    if (currentFrame >= canvases.length) {
      currentFrame = 0;
    }

    play();
  }, delay);
}

// -----------------------------
// PLAY / PAUSE
// -----------------------------

playPauseBtn.onclick = () => {
  playing = !playing;

  if (playing) {
    playPauseBtn.textContent = "⏸";
    play();
  } else {
    playPauseBtn.textContent = "▶";
    clearTimeout(playTimeout);
  }
};

// -----------------------------
// NAVIGATION MANUELLE
// -----------------------------

nextBtn.onclick = () => {
  // mettre la lecture en pause si elle est active
  if (playing) {
    playing = false;
    clearTimeout(playTimeout);
    playPauseBtn.textContent = "▶";
  }

  // afficher la frame suivante
  showFrame(currentFrame + 1);
};

prevBtn.onclick = () => {
  // mettre la lecture en pause si elle est active
  if (playing) {
    playing = false;
    clearTimeout(playTimeout);
    playPauseBtn.textContent = "▶";
  }

  // afficher la frame précédente
  showFrame(currentFrame - 1);
};

// -----------------------------
// UPLOAD FICHIER
// -----------------------------
input.addEventListener("change", () => {
  const file = input.files[0];

  if (file && file.type === "image/gif") {
    processGIF(file);
  }
});
// -----------------------------
// 👉 CLICK : bouton upload
// -----------------------------
uploadBtn.addEventListener("click", () => {
  input.click();
});

// -----------------------------
// DRAG & DROP SUR LE BOUTON
// -----------------------------

uploadBtn.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadBtn.classList.add("drag");
});

uploadBtn.addEventListener("dragleave", () => {
  uploadBtn.classList.remove("drag");
});

uploadBtn.addEventListener("drop", (e) => {
  e.preventDefault();

  uploadBtn.classList.remove("drag");

  const file = e.dataTransfer.files[0];

  if (file && file.type === "image/gif") {
    processGIF(file);
  }
});

// -----------------------------
// DRAG & DROP SUR TOUTE LA PAGE
// -----------------------------

document.addEventListener("dragover", (e) => {
  e.preventDefault();
});

document.addEventListener("drop", (e) => {
  e.preventDefault();

  const file = e.dataTransfer.files[0];

  if (file && file.type === "image/gif") {
    processGIF(file);
  }
});

// -----------------------------
// CRÉER UNE SPRITESHEET
// -----------------------------

function createSpritesheet() {
  const frameWidth = canvases[0].width;
  const frameHeight = canvases[0].height;

  const totalFrames = canvases.length;

  const gap = 14;

  const cols = Math.ceil(Math.sqrt(totalFrames));
  const rows = Math.ceil(totalFrames / cols);

  const finalCanvas = document.createElement("canvas");
  const ctx = finalCanvas.getContext("2d");

  finalCanvas.width = cols * frameWidth + (cols - 1) * gap;
  finalCanvas.height = rows * frameHeight + (rows - 1) * gap;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

  canvases.forEach((canvas, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = col * (frameWidth + gap);
    const y = row * (frameHeight + gap);

    ctx.drawImage(canvas, x, y);
  });

  return finalCanvas;
}

// -----------------------------
// TÉLÉCHARGER SPRITESHEET
// -----------------------------

captureBtn.addEventListener("click", () => {
  const finalCanvas = createSpritesheet();

  const link = document.createElement("a");

  link.download = currentFileName + "-sequences.png";
  link.href = finalCanvas.toDataURL("image/png");

  link.click();
});

// -----------------------------
// COPIER SPRITESHEET
// -----------------------------

copyBtn.addEventListener("click", async () => {
  const finalCanvas = createSpritesheet();

  finalCanvas.toBlob(async (blob) => {
    const item = new ClipboardItem({
      "image/png": blob,
    });

    await navigator.clipboard.write([item]);

    alert("Image copiée dans le presse-papier");
  });
});

// -----------------------------
// TIMELINE
// -----------------------------

timeline.addEventListener("input", () => {
  const frame = parseInt(timeline.value);

  // pause si lecture active
  if (playing) {
    playing = false;
    clearTimeout(playTimeout);

    playPauseBtn.textContent = "▶";
  }

  showFrame(frame);
});

// -----------------------------
// THEME CLAI OU SOMBRE
// -----------------------------
// bouton thème
const themeToggle = document.getElementById("themeToggle");

// fonction pour lire un cookie
function getCookie(name) {
  const cookies = document.cookie.split(";");

  for (let c of cookies) {
    c = c.trim();

    if (c.startsWith(name + "=")) {
      return c.substring(name.length + 1);
    }
  }

  return null;
}

// fonction pour écrire un cookie
function setCookie(name, value, days) {
  const date = new Date();

  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie =
    name + "=" + value + ";expires=" + date.toUTCString() + ";path=/";
}

// appliquer thème sauvegardé

const savedTheme = getCookie("theme");

if (savedTheme === "dark") {
  // ☀️
  document.body.classList.add("dark");
  animation.goToAndStop(14, true);
}

// toggle bouton

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");

  const darkMode = document.body.classList.contains("dark");

  if (darkMode) {
    // ☀️
    animation.playSegments([0, 14], true);
    setCookie("theme", "dark", 365);
  } else {
    // 🌙
    animation.playSegments([14, 28], true);
    setCookie("theme", "light", 365);
  }
};

// -----------------------------
// STICKY
// -----------------------------
const body = document.querySelector("body");

window.addEventListener("scroll", () => {
  if (window.scrollY > 0) {
    body.classList.add("scrolled");
  } else {
    body.classList.remove("scrolled");
  }
});

document.querySelector("button").addEventListener("click", (e) => {
  e.currentTarget.firstElementChild.classList.toggle(
    "dark-mode-toggle__icon--moon",
  );
  document.body.classList.toggle("theme--dark");
});
