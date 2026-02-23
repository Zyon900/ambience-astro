// src/data/sounds.json
var sounds_default = {
  sounds: [
    {
      id: "european_forest",
      name: "European Forest",
      thumbnail: "/images/european_forest-thumb.jpg",
      file: "/sounds/european_forest.mp3",
      source: "https://mixkit.co/free-sound-effects/ambience/",
      license: "Mixkit Sound Effects Free License"
    },
    {
      id: "farm_animals",
      name: "Farm Animals",
      thumbnail: "/images/farm_animals-thumb.jpg",
      file: "/sounds/farm_animals.mp3",
      source: "https://mixkit.co/free-sound-effects/ambience/",
      license: "Mixkit Sound Effects Free License"
    },
    {
      id: "forest_birds",
      name: "Forest Birds",
      thumbnail: "/images/forest_birds-thumb.jpg",
      file: "/sounds/forest_birds.mp3",
      source: "https://mixkit.co/free-sound-effects/ambience/",
      license: "Mixkit Sound Effects Free License"
    },
    {
      id: "heavy_rain",
      name: "Heavy Rain",
      thumbnail: "/images/heavy_rain-thumb.jpg",
      file: "/sounds/heavy_rain.mp3",
      source: "https://mixkit.co/free-sound-effects/ambience/",
      license: "Mixkit Sound Effects Free License"
    },
    {
      id: "light_rain",
      name: "Light Rain",
      thumbnail: "/images/light_rain-thumb.jpg",
      file: "/sounds/light_rain.mp3",
      source: "https://mixkit.co/free-sound-effects/ambience/",
      license: "Mixkit Sound Effects Free License"
    },
    {
      id: "night_crickets",
      name: "Night Crickets",
      thumbnail: "/images/night_crickets-thumb.jpg",
      file: "/sounds/night_crickets.mp3",
      source: "https://mixkit.co/free-sound-effects/ambience/",
      license: "Mixkit Sound Effects Free License"
    },
    {
      id: "office_ambience",
      name: "Office Ambience",
      thumbnail: "/images/office_ambience-thumb.jpg",
      file: "/sounds/office_ambience.mp3",
      source: "https://mixkit.co/free-sound-effects/ambience/",
      license: "Mixkit Sound Effects Free License"
    },
    {
      id: "summer_night_crickets",
      name: "Summer Night Crickets",
      thumbnail: "/images/summer_night_crickets-thumb.jpg",
      file: "/sounds/summer_night_crickets.mp3",
      source: "https://mixkit.co/free-sound-effects/ambience/",
      license: "Mixkit Sound Effects Free License"
    },
    {
      id: "windy_campfire",
      name: "Windy Campfire",
      thumbnail: "/images/windy_campfire-thumb.jpg",
      file: "/sounds/windy_campfire.mp3",
      source: "https://mixkit.co/free-sound-effects/ambience/",
      license: "Mixkit Sound Effects Free License"
    },
    {
      id: "white_noise",
      name: "White Noise",
      thumbnail: "/images/white_noise-thumb.jpg",
      file: "/sounds/white_noise.mp3",
      source: "https://www.ffmpeg.org/",
      license: "No License"
    },
    {
      id: "pink_noise",
      name: "Pink Noise",
      thumbnail: "/images/pink_noise-thumb.jpg",
      file: "/sounds/pink_noise.mp3",
      source: "https://www.ffmpeg.org/",
      license: "No License"
    },
    {
      id: "brown_noise",
      name: "Brown Noise",
      thumbnail: "/images/brown_noise-thumb.jpg",
      file: "/sounds/brown_noise.mp3",
      source: "https://www.ffmpeg.org/",
      license: "No License"
    }
  ]
};

// src/scripts/audioManager.ts
class AudioManager {
  sounds = new Map;
  previewSounds = new Map;
  masterVolume = this.loadMasterVolume();
  masterPlaying = false;
  soundVolumes = new Map;
  soundMuted = new Map;
  constructor() {
    this.loadSoundVolumes();
    this.loadActiveSounds();
  }
  loadActiveSounds() {
    const activeSounds = this.getActiveSounds();
    activeSounds.forEach((sound) => {
      this.addSound(sound);
    });
  }
  getActiveSounds() {
    const stored = localStorage.getItem("activeSounds");
    return stored ? JSON.parse(stored) : [];
  }
  saveActiveSounds(sounds) {
    localStorage.setItem("activeSounds", JSON.stringify(sounds));
  }
  getSoundVolumes() {
    const stored = localStorage.getItem("soundVolumes");
    return stored ? JSON.parse(stored) : {};
  }
  saveSoundVolumes() {
    const volumes = {};
    this.soundVolumes.forEach((volume, soundId) => {
      volumes[soundId] = volume;
    });
    localStorage.setItem("soundVolumes", JSON.stringify(volumes));
  }
  loadSoundVolumes() {
    const stored = this.getSoundVolumes();
    Object.keys(stored).forEach((soundId) => {
      this.soundVolumes.set(soundId, stored[soundId]);
    });
  }
  addSound(sound) {
    if (this.sounds.has(sound.id)) {
      return;
    }
    const previewAudio = this.previewSounds.get(sound.id);
    if (previewAudio) {
      const wasPlaying = !previewAudio.paused;
      previewAudio.pause();
      previewAudio.src = "";
      this.previewSounds.delete(sound.id);
      const audio = new Audio(sound.file);
      audio.loop = true;
      const storedVolume = this.soundVolumes.get(sound.id) ?? 0.5;
      audio.volume = storedVolume;
      this.sounds.set(sound.id, audio);
      this.soundVolumes.set(sound.id, storedVolume);
      this.soundMuted.set(sound.id, false);
      this.updateSoundVolume(sound.id);
      if (wasPlaying) {
        audio.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    } else {
      const audio = new Audio(sound.file);
      audio.loop = true;
      const storedVolume = this.soundVolumes.get(sound.id) ?? 0.5;
      audio.volume = storedVolume;
      this.sounds.set(sound.id, audio);
      this.soundVolumes.set(sound.id, storedVolume);
      this.soundMuted.set(sound.id, false);
      this.updateSoundVolume(sound.id);
    }
    const activeSounds = this.getActiveSounds();
    if (!activeSounds.find((s) => s.id === sound.id)) {
      activeSounds.push(sound);
      this.saveActiveSounds(activeSounds);
    }
  }
  removeSound(soundId) {
    const audio = this.sounds.get(soundId);
    if (audio) {
      audio.pause();
      audio.src = "";
      this.sounds.delete(soundId);
      this.soundVolumes.delete(soundId);
      this.soundMuted.delete(soundId);
      const activeSounds = this.getActiveSounds().filter((s) => s.id !== soundId);
      this.saveActiveSounds(activeSounds);
    }
  }
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.saveMasterVolume();
    this.updateAllVolumes();
  }
  loadMasterVolume() {
    const stored = localStorage.getItem("masterVolume");
    return stored ? parseFloat(stored) : 1;
  }
  saveMasterVolume() {
    localStorage.setItem("masterVolume", this.masterVolume.toString());
  }
  getMasterVolume() {
    return this.masterVolume;
  }
  setSoundVolume(soundId, volume) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.soundVolumes.set(soundId, clampedVolume);
    this.saveSoundVolumes();
    this.updateSoundVolume(soundId);
    const previewAudio = this.previewSounds.get(soundId);
    if (previewAudio) {
      previewAudio.volume = clampedVolume * this.masterVolume;
    }
  }
  getSoundVolume(soundId) {
    return this.soundVolumes.get(soundId) ?? 0.5;
  }
  toggleMute(soundId) {
    const isMuted = this.soundMuted.get(soundId) ?? false;
    this.soundMuted.set(soundId, !isMuted);
    this.updateSoundVolume(soundId);
  }
  isMuted(soundId) {
    return this.soundMuted.get(soundId) ?? false;
  }
  updateSoundVolume(soundId) {
    const audio = this.sounds.get(soundId);
    if (!audio)
      return;
    const isMuted = this.soundMuted.get(soundId) ?? false;
    const soundVolume = this.soundVolumes.get(soundId) ?? 0.5;
    if (isMuted) {
      audio.volume = 0;
    } else {
      audio.volume = soundVolume * this.masterVolume;
    }
  }
  updateAllVolumes() {
    this.sounds.forEach((audio, soundId) => {
      this.updateSoundVolume(soundId);
    });
    this.previewSounds.forEach((audio, soundId) => {
      const volume = this.soundVolumes.get(soundId) ?? 0.5;
      audio.volume = volume * this.masterVolume;
    });
  }
  async playAll() {
    if (this.masterPlaying)
      return;
    const playPromises = [];
    this.sounds.forEach((audio) => {
      const promise = audio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
      playPromises.push(promise);
    });
    await Promise.all(playPromises);
    this.masterPlaying = true;
  }
  pauseAll() {
    this.sounds.forEach((audio) => {
      audio.pause();
    });
    this.masterPlaying = false;
  }
  async toggleMasterPlay() {
    if (this.masterPlaying) {
      this.pauseAll();
    } else {
      await this.playAll();
    }
  }
  isMasterPlaying() {
    return this.masterPlaying;
  }
  playSound(soundId) {
    const audio = this.sounds.get(soundId);
    if (audio) {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  }
  pauseSound(soundId) {
    const audio = this.sounds.get(soundId);
    if (audio) {
      audio.pause();
    }
  }
  previewSound(soundId, file) {
    if (this.sounds.has(soundId)) {
      this.playSound(soundId);
      return;
    }
    if (!this.previewSounds.has(soundId)) {
      const audio2 = new Audio(file);
      audio2.loop = true;
      const volume = this.getSoundVolume(soundId);
      audio2.volume = volume * this.masterVolume;
      this.previewSounds.set(soundId, audio2);
    }
    const audio = this.previewSounds.get(soundId);
    if (audio) {
      audio.play().catch((error) => {
        console.error("Error playing preview audio:", error);
      });
    }
  }
  pausePreview(soundId) {
    const audio = this.previewSounds.get(soundId);
    if (audio) {
      audio.pause();
    }
  }
  isPreviewPlaying(soundId) {
    const audio = this.previewSounds.get(soundId);
    return audio ? !audio.paused : false;
  }
  isSoundPlaying(soundId) {
    const audio = this.sounds.get(soundId);
    if (audio) {
      return !audio.paused;
    }
    const previewAudio = this.previewSounds.get(soundId);
    return previewAudio ? !previewAudio.paused : false;
  }
  toggleSound(soundId) {
    if (this.isSoundPlaying(soundId)) {
      this.pauseSound(soundId);
    } else {
      this.playSound(soundId);
    }
  }
  togglePreview(soundId, file) {
    if (this.sounds.has(soundId)) {
      this.toggleSound(soundId);
    } else {
      if (this.isPreviewPlaying(soundId)) {
        this.pausePreview(soundId);
      } else {
        this.previewSound(soundId, file);
      }
    }
  }
  cleanup() {
    this.sounds.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });
    this.previewSounds.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });
    this.sounds.clear();
    this.previewSounds.clear();
    this.soundVolumes.clear();
    this.soundMuted.clear();
  }
}

// src/scripts/index.ts
var audioManager = new AudioManager;
var allSounds = sounds_default.sounds;
var masterPlayBtn = document.getElementById("master-play-btn");
var masterVolumeSlider = document.getElementById("master-volume-slider");
var masterVolumeValue = document.getElementById("master-volume-value");
var activeSoundsContainer = document.getElementById("active-sounds-container");
var noSoundsMessage = document.getElementById("no-sounds-message");
if (!masterPlayBtn || !masterVolumeSlider || !masterVolumeValue || !activeSoundsContainer || !noSoundsMessage) {} else {
  let updateMasterVolumeDisplay = function() {
    const volume = audioManager.getMasterVolume();
    masterVolumeValueEl.textContent = `${Math.round(volume * 100)}%`;
    updateMasterVolumeIcon();
  }, updateMasterVolumeIcon = function() {
    const speakerIcon = document.getElementById("master-volume-speaker-icon");
    const mutedIcon = document.getElementById("master-volume-muted-icon");
    const volume = audioManager.getMasterVolume();
    if (speakerIcon && mutedIcon) {
      if (volume === 0) {
        speakerIcon.classList.add("hidden");
        mutedIcon.classList.remove("hidden");
      } else {
        speakerIcon.classList.remove("hidden");
        mutedIcon.classList.add("hidden");
      }
    }
  }, updateMasterPlayButton = function() {
    const playIcon = document.getElementById("master-play-icon");
    const pauseIcon = document.getElementById("master-pause-icon");
    if (playIcon && pauseIcon) {
      if (audioManager.isMasterPlaying()) {
        playIcon.classList.add("hidden");
        pauseIcon.classList.remove("hidden");
      } else {
        playIcon.classList.remove("hidden");
        pauseIcon.classList.add("hidden");
      }
    }
  }, renderActiveSounds = function() {
    const activeSounds = audioManager.getActiveSounds();
    if (activeSounds.length === 0) {
      activeSoundsContainerEl.innerHTML = "";
      noSoundsMessageEl.classList.remove("hidden");
      return;
    }
    noSoundsMessageEl.classList.add("hidden");
    activeSoundsContainerEl.innerHTML = "";
    activeSounds.forEach((sound) => {
      const soundCard = document.createElement("div");
      soundCard.innerHTML = `
				<div class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-accent transition-colors" data-sound-id="${sound.id}">
					<div class="flex items-center gap-4">
						<div class="flex-1 min-w-0">
							<h3 class="text-lg font-semibold text-gray-100 truncate">${sound.name}</h3>
							<div class="mt-2 space-y-2">
								<div class="flex items-center gap-2">
									<button type="button" class="sound-mute-btn px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors flex-shrink-0" data-sound-id="${sound.id}">
										<span class="mute-text">Mute</span>
									</button>
									<label class="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
										<svg class="volume-speaker-icon w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" data-sound-id="${sound.id}">
											<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
										</svg>
										<svg class="volume-muted-icon w-4 h-4 text-gray-400 flex-shrink-0 hidden" fill="currentColor" viewBox="0 0 24 24" data-sound-id="${sound.id}">
											<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
										</svg>
										<input type="range" min="0" max="1" step="0.01" value="${audioManager.getSoundVolume(sound.id)}" class="sound-volume-slider flex-1 min-w-0 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent" data-sound-id="${sound.id}" />
										<span class="sound-volume-value text-xs text-gray-400 w-8 text-right flex-shrink-0" data-sound-id="${sound.id}">${Math.round(audioManager.getSoundVolume(sound.id) * 100)}%</span>
									</label>
								</div>
								<button type="button" class="sound-remove-btn w-full px-3 py-2 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors" data-sound-id="${sound.id}">
									Remove
								</button>
							</div>
						</div>
					</div>
				</div>
			`;
      activeSoundsContainerEl.appendChild(soundCard);
    });
    document.querySelectorAll(".sound-mute-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.currentTarget;
        const soundId = target.dataset.soundId;
        if (!soundId)
          return;
        audioManager.toggleMute(soundId);
        updateMuteButton(soundId);
      });
    });
    document.querySelectorAll(".sound-volume-slider").forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const target = e.target;
        const soundId = target.dataset.soundId;
        if (!soundId)
          return;
        const volume = parseFloat(target.value);
        audioManager.setSoundVolume(soundId, volume);
        updateVolumeDisplay(soundId);
        updateVolumeIcon(soundId);
      });
    });
    document.querySelectorAll(".sound-remove-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.currentTarget;
        const soundId = target.dataset.soundId;
        if (!soundId)
          return;
        audioManager.removeSound(soundId);
        renderActiveSounds();
        updateMasterPlayButton();
      });
    });
  }, updateMuteButton = function(soundId) {
    const btn = document.querySelector(`.sound-mute-btn[data-sound-id="${soundId}"]`);
    if (btn) {
      const muteText = btn.querySelector(".mute-text");
      if (muteText) {
        if (audioManager.isMuted(soundId)) {
          muteText.textContent = "Unmute";
          btn.classList.add("bg-red-600", "hover:bg-red-700");
          btn.classList.remove("bg-gray-700", "hover:bg-gray-600");
        } else {
          muteText.textContent = "Mute";
          btn.classList.remove("bg-red-600", "hover:bg-red-700");
          btn.classList.add("bg-gray-700", "hover:bg-gray-600");
        }
      }
    }
    updateVolumeIcon(soundId);
  }, updateVolumeIcon = function(soundId) {
    const speakerIcon = document.querySelector(`.volume-speaker-icon[data-sound-id="${soundId}"]`);
    const mutedIcon = document.querySelector(`.volume-muted-icon[data-sound-id="${soundId}"]`);
    if (speakerIcon && mutedIcon) {
      const isMuted = audioManager.isMuted(soundId);
      const volume = audioManager.getSoundVolume(soundId);
      const shouldShowMuted = isMuted || volume === 0;
      if (shouldShowMuted) {
        speakerIcon.classList.add("hidden");
        mutedIcon.classList.remove("hidden");
      } else {
        speakerIcon.classList.remove("hidden");
        mutedIcon.classList.add("hidden");
      }
    }
  }, updateVolumeDisplay = function(soundId) {
    const volumeValue = document.querySelector(`.sound-volume-value[data-sound-id="${soundId}"]`);
    if (volumeValue) {
      const volume = audioManager.getSoundVolume(soundId);
      volumeValue.textContent = `${Math.round(volume * 100)}%`;
    }
  };
  const masterVolumeSliderEl = masterVolumeSlider;
  const masterVolumeValueEl = masterVolumeValue;
  const activeSoundsContainerEl = activeSoundsContainer;
  const noSoundsMessageEl = noSoundsMessage;
  masterPlayBtn.addEventListener("click", async () => {
    await audioManager.toggleMasterPlay();
    updateMasterPlayButton();
  });
  masterVolumeSliderEl.addEventListener("input", (e) => {
    const target = e.target;
    const volume = parseFloat(target.value);
    audioManager.setMasterVolume(volume);
    updateMasterVolumeDisplay();
  });
  masterVolumeSliderEl.value = String(audioManager.getMasterVolume());
  updateMasterVolumeDisplay();
  updateMasterPlayButton();
  renderActiveSounds();
  audioManager.getActiveSounds().forEach((sound) => {
    updateVolumeIcon(sound.id);
  });
  window.addEventListener("beforeunload", () => {
    audioManager.cleanup();
  });
}
