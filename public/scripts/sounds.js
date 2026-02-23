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

// src/scripts/sounds.ts
var audioManager = new AudioManager;
var allSounds = sounds_default.sounds;
function isSoundActive(soundId) {
  const activeSounds = audioManager.getActiveSounds();
  return activeSounds.some((s) => s.id === soundId);
}
function initializeCardStates() {
  allSounds.forEach((sound) => {
    const isActive = isSoundActive(sound.id);
    const card = document.querySelector(`[data-sound-id="${sound.id}"]`);
    const btn = document.querySelector(`.sound-add-btn[data-sound-id="${sound.id}"]`);
    if (card && btn) {
      if (isActive) {
        card.classList.add("border-accent");
        card.classList.remove("border-gray-700");
        btn.textContent = "Already Added";
        btn.classList.add("opacity-50", "cursor-not-allowed");
        btn.classList.add("bg-accent", "hover:bg-accent-600");
        btn.classList.remove("bg-gray-600", "hover:bg-gray-500");
      } else {
        card.classList.remove("border-accent");
        card.classList.add("border-gray-700");
        btn.textContent = "Add to Mix";
        btn.classList.remove("opacity-50", "cursor-not-allowed");
        btn.classList.add("bg-accent", "hover:bg-accent-600");
        btn.classList.remove("bg-gray-600", "hover:bg-gray-500");
      }
    }
  });
}
function attachEventListeners() {
  document.querySelectorAll(".sound-play-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget;
      const soundId = target.dataset.soundId;
      if (!soundId)
        return;
      const sound = allSounds.find((s) => s.id === soundId);
      if (sound) {
        audioManager.togglePreview(soundId, sound.file);
        updatePlayButton(soundId);
      }
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
  document.querySelectorAll(".sound-add-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget;
      const soundId = target.dataset.soundId;
      if (!soundId)
        return;
      const isActive = isSoundActive(soundId);
      if (isActive) {
        audioManager.removeSound(soundId);
      } else {
        const sound = allSounds.find((s) => s.id === soundId);
        if (sound) {
          audioManager.addSound(sound);
        }
      }
      updateSoundCardState(soundId);
    });
  });
}
function updatePlayButton(soundId) {
  const btn = document.querySelector(`.sound-play-btn[data-sound-id="${soundId}"]`);
  if (btn) {
    const playIcon = btn.querySelector(".play-icon");
    const pauseIcon = btn.querySelector(".pause-icon");
    if (playIcon && pauseIcon) {
      if (audioManager.isSoundPlaying(soundId)) {
        playIcon.classList.add("hidden");
        pauseIcon.classList.remove("hidden");
      } else {
        playIcon.classList.remove("hidden");
        pauseIcon.classList.add("hidden");
      }
    }
  }
}
function updateVolumeDisplay(soundId) {
  const volumeValue = document.querySelector(`.sound-volume-value[data-sound-id="${soundId}"]`);
  if (volumeValue) {
    const volume = audioManager.getSoundVolume(soundId);
    volumeValue.textContent = `${Math.round(volume * 100)}%`;
  }
}
function updateVolumeIcon(soundId) {
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
}
function updateSoundCardState(soundId) {
  const card = document.querySelector(`[data-sound-id="${soundId}"]`);
  const btn = document.querySelector(`.sound-add-btn[data-sound-id="${soundId}"]`);
  const isActive = isSoundActive(soundId);
  if (isActive) {
    card?.classList.add("border-accent");
    card?.classList.remove("border-gray-700");
  } else {
    card?.classList.remove("border-accent");
    card?.classList.add("border-gray-700");
  }
  if (btn) {
    if (isActive) {
      btn.textContent = "Already Added";
      btn.classList.add("opacity-50", "cursor-not-allowed");
      btn.classList.add("bg-accent", "hover:bg-accent-600");
      btn.classList.remove("bg-gray-600", "hover:bg-gray-500");
    } else {
      btn.textContent = "Add to Mix";
      btn.classList.remove("opacity-50", "cursor-not-allowed");
      btn.classList.add("bg-accent", "hover:bg-accent-600");
      btn.classList.remove("bg-gray-600", "hover:bg-gray-500");
    }
  }
}
function initialize() {
  attachEventListeners();
  initializeCardStates();
  allSounds.forEach((sound) => {
    const slider = document.querySelector(`.sound-volume-slider[data-sound-id="${sound.id}"]`);
    if (slider) {
      const volume = audioManager.getSoundVolume(sound.id);
      slider.value = String(volume);
    }
    updateVolumeDisplay(sound.id);
    updateVolumeIcon(sound.id);
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
window.addEventListener("beforeunload", () => {
  audioManager.cleanup();
});
