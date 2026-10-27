// Native audio playback with an honest fallback when a browser blocks autoplay.
(() => {
  const player = document.querySelector(".music-player");
  const audio = player.querySelector("audio");
  const toggle = player.querySelector(".music-toggle");
  const volume = player.querySelector("#musicVolume");
  const output = player.querySelector("output");
  const status = player.querySelector("#musicStatus");
  const volumeMenu = player.querySelector("details");
  const english = document.documentElement.lang === "en";
  const labels = english
    ? {
        play: "Play deep house",
        pause: "Pause deep house",
        playing: "Deep house is playing.",
        waiting: "Click or tap to start the music.",
        paused: "Music is paused.",
        loading: "Loading music.",
        error: "Music could not load. Press play to try again.",
      }
    : {
        play: "딥하우스 재생",
        pause: "딥하우스 일시정지",
        playing: "딥하우스가 재생 중입니다.",
        waiting: "클릭하거나 터치하면 음악이 시작됩니다.",
        paused: "음악이 정지되었습니다.",
        loading: "음악을 불러오고 있습니다.",
        error: "음악을 불러오지 못했습니다. 재생 버튼으로 다시 시도해 주세요.",
      };
  const storageKey = "jy-studio-music-v1";
  let settings = {};
  try {
    settings = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
  } catch {
    /* Private mode can block storage. */
  }
  const savedVolume = Number(settings.volume);
  const savedPosition = Number(settings.position);
  audio.volume = Number.isFinite(savedVolume)
    ? Math.min(1, Math.max(0, savedVolume))
    : 0.25;
  let wantsPlayback = settings.mode !== "paused";
  let position =
    Number.isFinite(savedPosition) && savedPosition >= 0 ? savedPosition : 0;
  let attempt = 0;
  let pending = false;
  let state = wantsPlayback ? "waiting" : "paused";
  let lastSaved = 0;

  function save() {
    if (audio.readyState >= 1) position = audio.currentTime;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          mode: wantsPlayback ? "playing" : "paused",
          volume: audio.volume,
          position,
        }),
      );
    } catch {
      /* Playback remains available without storage. */
    }
  }
  function render() {
    const playing = !audio.paused && !audio.ended;
    player.dataset.state = playing ? "playing" : state;
    toggle.setAttribute("aria-pressed", String(playing));
    toggle.setAttribute(
      "aria-label",
      playing || pending ? labels.pause : labels.play,
    );
    toggle.title = playing || pending ? labels.pause : labels.play;
    status.textContent = playing ? labels.playing : labels[state];
    volume.value = String(Math.round(audio.volume * 100));
    output.value = `${volume.value}%`;
    volume.setAttribute("aria-valuetext", `${volume.value}%`);
  }
  async function play(explicit = false) {
    if (pending || !audio.paused || document.hidden) return;
    wantsPlayback = true;
    if (explicit) save();
    const currentAttempt = ++attempt;
    pending = true;
    state = "loading";
    render();
    try {
      if (audio.error) audio.load();
      await audio.play();
      if (currentAttempt !== attempt) return;
      state = "playing";
      save();
    } catch (error) {
      if (currentAttempt !== attempt) return;
      state =
        error.name === "NotAllowedError" || error.name === "AbortError"
          ? "waiting"
          : "error";
    } finally {
      if (currentAttempt === attempt) {
        pending = false;
        render();
      }
    }
  }
  function pause() {
    ++attempt;
    pending = false;
    wantsPlayback = false;
    state = "paused";
    audio.pause();
    save();
    render();
  }
  toggle.addEventListener("click", () => {
    if (!audio.paused || pending) pause();
    else play(true);
  });
  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value) / 100;
    render();
  });
  volume.addEventListener("change", save);
  audio.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = position % audio.duration;
    }
  });
  audio.addEventListener("playing", () => {
    if (audio.paused || !wantsPlayback) return;
    state = "playing";
    save();
    render();
  });
  audio.addEventListener("pause", () => {
    if (!audio.paused) return;
    // Respect an OS/browser pause as well as the on-page stop control.
    if (!document.hidden && !pending) wantsPlayback = false;
    state = "paused";
    save();
    render();
  });
  audio.addEventListener("error", () => {
    state = "error";
    pending = false;
    render();
  });
  audio.addEventListener("volumechange", render);
  audio.addEventListener("timeupdate", () => {
    if (performance.now() - lastSaved > 4000) {
      save();
      lastSaved = performance.now();
    }
  });

  // The first trusted action can unlock sound; an explicit pause always wins.
  function unlock(event) {
    if (
      !event.isTrusted ||
      player.contains(event.target) ||
      !wantsPlayback ||
      pending ||
      !audio.paused
    )
      return;
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    play();
  }
  document.addEventListener("click", unlock);
  document.addEventListener("keydown", unlock);
  document.addEventListener("click", (event) => {
    if (!volumeMenu.contains(event.target)) volumeMenu.open = false;
  });
  player.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && volumeMenu.open) {
      volumeMenu.open = false;
      volumeMenu.querySelector("summary").focus();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      ++attempt;
      pending = false;
      audio.pause();
      save();
      render();
    } else if (wantsPlayback && audio.paused) {
      play();
    }
  });
  window.addEventListener("pagehide", save);
  window.addEventListener("pageshow", () => {
    if (wantsPlayback && audio.paused) play();
  });
  player.hidden = false;
  render();
  if (wantsPlayback) play();
})();
