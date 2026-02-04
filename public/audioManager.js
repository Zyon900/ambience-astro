class AudioManager {
	constructor() {
		// In-memory state for mix sounds and previews.
		this.sounds = new Map();
		// Temporary audio instances for preview on the Sounds page.
		this.previewSounds = new Map();
		// Master volume is persisted across sessions.
		this.masterVolume = this.loadMasterVolume();
		// Whether the master play button is currently playing.
		this.masterPlaying = false;
		// Per-sound volume and mute state (volume persisted).
		this.soundVolumes = new Map();
		this.soundMuted = new Map();
		this.loadSoundVolumes();
		// Restore any active sounds from localStorage.
		this.loadActiveSounds();
	}

	loadActiveSounds() {
		// Rehydrate active sounds from persisted data.
		const activeSounds = this.getActiveSounds();
		activeSounds.forEach((sound) => {
			this.addSound(sound);
		});
	}

	getActiveSounds() {
		// Read from localStorage to get the source of truth.
		const stored = localStorage.getItem('activeSounds');
		return stored ? JSON.parse(stored) : [];
	}

	saveActiveSounds(sounds) {
		// Persist active sounds so the mix survives reloads.
		localStorage.setItem('activeSounds', JSON.stringify(sounds));
	}

	getSoundVolumes() {
		// Read stored per-sound volume levels.
		const stored = localStorage.getItem('soundVolumes');
		return stored ? JSON.parse(stored) : {};
	}

	saveSoundVolumes() {
		// Persist per-sound volume levels.
		const volumes = {};
		this.soundVolumes.forEach((volume, soundId) => {
			volumes[soundId] = volume;
		});
		localStorage.setItem('soundVolumes', JSON.stringify(volumes));
	}

	loadSoundVolumes() {
		// Rehydrate per-sound volume levels into the Map.
		const stored = this.getSoundVolumes();
		Object.keys(stored).forEach((soundId) => {
			this.soundVolumes.set(soundId, stored[soundId]);
		});
	}

	addSound(sound) {
		// Prevent duplicates in the mix.
		if (this.sounds.has(sound.id)) {
			return;
		}

		// Clean up preview audio if it exists (switch to mix audio).
		const previewAudio = this.previewSounds.get(sound.id);
		if (previewAudio) {
			const wasPlaying = !previewAudio.paused;
			previewAudio.pause();
			previewAudio.src = '';
			this.previewSounds.delete(sound.id);
			
			// Create new audio for mix.
			const audio = new Audio(sound.file);
			audio.loop = true;
			
			// Use stored volume if available, otherwise default to 0.5.
			const storedVolume = this.soundVolumes.get(sound.id) ?? 0.5;
			audio.volume = storedVolume;
			this.sounds.set(sound.id, audio);
			this.soundVolumes.set(sound.id, storedVolume);
			this.soundMuted.set(sound.id, false);
			
			// Update the audio volume after setting it.
			this.updateSoundVolume(sound.id);
			
			// If preview was playing, start the mix audio.
			if (wasPlaying) {
				audio.play().catch((error) => {
					console.error('Error playing audio:', error);
				});
			}
		} else {
			const audio = new Audio(sound.file);
			audio.loop = true;
			
			// Use stored volume if available, otherwise default to 0.5.
			const storedVolume = this.soundVolumes.get(sound.id) ?? 0.5;
			audio.volume = storedVolume;
			this.sounds.set(sound.id, audio);
			this.soundVolumes.set(sound.id, storedVolume);
			this.soundMuted.set(sound.id, false);
			
			// Update the audio volume after setting it.
			this.updateSoundVolume(sound.id);
		}

		const activeSounds = this.getActiveSounds();
		if (!activeSounds.find((s) => s.id === sound.id)) {
			activeSounds.push(sound);
			this.saveActiveSounds(activeSounds);
		}
	}

	removeSound(soundId) {
		// Stop and remove a sound from the mix.
		const audio = this.sounds.get(soundId);
		if (audio) {
			audio.pause();
			audio.src = '';
			this.sounds.delete(soundId);
			this.soundVolumes.delete(soundId);
			this.soundMuted.delete(soundId);

			const activeSounds = this.getActiveSounds().filter((s) => s.id !== soundId);
			this.saveActiveSounds(activeSounds);
		}
	}

	setMasterVolume(volume) {
		// Clamp and persist master volume.
		this.masterVolume = Math.max(0, Math.min(1, volume));
		this.saveMasterVolume();
		this.updateAllVolumes();
	}

	loadMasterVolume() {
		// Restore master volume from localStorage.
		const stored = localStorage.getItem('masterVolume');
		return stored ? parseFloat(stored) : 1.0;
	}

	saveMasterVolume() {
		// Persist master volume.
		localStorage.setItem('masterVolume', this.masterVolume.toString());
	}

	getMasterVolume() {
		// Expose current master volume (0-1).
		return this.masterVolume;
	}

	setSoundVolume(soundId, volume) {
		// Clamp and persist per-sound volume, then apply to audio.
		const clampedVolume = Math.max(0, Math.min(1, volume));
		this.soundVolumes.set(soundId, clampedVolume);
		this.saveSoundVolumes();
		this.updateSoundVolume(soundId);
		
		// Also update preview volume if it exists.
		const previewAudio = this.previewSounds.get(soundId);
		if (previewAudio) {
			previewAudio.volume = clampedVolume * this.masterVolume;
		}
	}

	getSoundVolume(soundId) {
		// Default to 0.5 if we have no stored value.
		return this.soundVolumes.get(soundId) ?? 0.5;
	}

	toggleMute(soundId) {
		// Flip mute state and apply volume update.
		const isMuted = this.soundMuted.get(soundId) ?? false;
		this.soundMuted.set(soundId, !isMuted);
		this.updateSoundVolume(soundId);
	}

	isMuted(soundId) {
		// Return current mute state for a sound.
		return this.soundMuted.get(soundId) ?? false;
	}

	updateSoundVolume(soundId) {
		// Apply master + per-sound volume (or mute).
		const audio = this.sounds.get(soundId);
		if (!audio) return;

		const isMuted = this.soundMuted.get(soundId) ?? false;
		const soundVolume = this.soundVolumes.get(soundId) ?? 0.5;

		if (isMuted) {
			audio.volume = 0;
		} else {
			audio.volume = soundVolume * this.masterVolume;
		}
	}

	updateAllVolumes() {
		// Update all mix sounds based on master volume and mute state.
		this.sounds.forEach((audio, soundId) => {
			this.updateSoundVolume(soundId);
		});
		
		// Also update preview volumes.
		this.previewSounds.forEach((audio, soundId) => {
			const volume = this.soundVolumes.get(soundId) ?? 0.5;
			audio.volume = volume * this.masterVolume;
		});
	}

	async playAll() {
		// Play all mix sounds concurrently.
		if (this.masterPlaying) return;

		const playPromises = [];
		this.sounds.forEach((audio) => {
			const promise = audio.play().catch((error) => {
				console.error('Error playing audio:', error);
			});
			playPromises.push(promise);
		});

		await Promise.all(playPromises);
		this.masterPlaying = true;
	}

	pauseAll() {
		// Pause all mix sounds.
		this.sounds.forEach((audio) => {
			audio.pause();
		});
		this.masterPlaying = false;
	}

	async toggleMasterPlay() {
		// Toggle master play/pause for the mix.
		if (this.masterPlaying) {
			this.pauseAll();
		} else {
			await this.playAll();
		}
	}

	isMasterPlaying() {
		// Return master play state.
		return this.masterPlaying;
	}

	playSound(soundId) {
		// Play a single mix sound.
		const audio = this.sounds.get(soundId);
		if (audio) {
			audio.play().catch((error) => {
				console.error('Error playing audio:', error);
			});
		}
	}

	pauseSound(soundId) {
		// Pause a single mix sound.
		const audio = this.sounds.get(soundId);
		if (audio) {
			audio.pause();
		}
	}


	toggleSound(soundId) {
		// Toggle a single mix sound.
		if (this.isSoundPlaying(soundId)) {
			this.pauseSound(soundId);
		} else {
			this.playSound(soundId);
		}
	}

	// Preview methods for sounds not in the mix
	previewSound(soundId, file) {
		// If sound is already in mix, use regular play.
		if (this.sounds.has(soundId)) {
			this.playSound(soundId);
			return;
		}

		// Create temporary preview audio.
		if (!this.previewSounds.has(soundId)) {
			const audio = new Audio(file);
			audio.loop = true;
			const volume = this.getSoundVolume(soundId);
			audio.volume = volume * this.masterVolume;
			this.previewSounds.set(soundId, audio);
		}

		const audio = this.previewSounds.get(soundId);
		audio.play().catch((error) => {
			console.error('Error playing preview audio:', error);
		});
	}

	pausePreview(soundId) {
		// Pause a preview sound.
		const audio = this.previewSounds.get(soundId);
		if (audio) {
			audio.pause();
		}
	}

	isPreviewPlaying(soundId) {
		// Check playback state for preview audio.
		const audio = this.previewSounds.get(soundId);
		return audio ? !audio.paused : false;
	}

	togglePreview(soundId, file) {
		// Toggle preview vs. mix playback depending on active state.
		if (this.sounds.has(soundId)) {
			// Sound is in mix, use regular toggle.
			this.toggleSound(soundId);
		} else {
			// Sound is not in mix, use preview.
			if (this.isPreviewPlaying(soundId)) {
				this.pausePreview(soundId);
			} else {
				this.previewSound(soundId, file);
			}
		}
	}

	isSoundPlaying(soundId) {
		// Check both mix sounds and preview sounds.
		const audio = this.sounds.get(soundId);
		if (audio) {
			return !audio.paused;
		}
		const previewAudio = this.previewSounds.get(soundId);
		return previewAudio ? !previewAudio.paused : false;
	}

	cleanup() {
		// Stop and release audio resources on unload.
		this.sounds.forEach((audio) => {
			audio.pause();
			audio.src = '';
		});
		this.previewSounds.forEach((audio) => {
			audio.pause();
			audio.src = '';
		});
		this.sounds.clear();
		this.previewSounds.clear();
		this.soundVolumes.clear();
		this.soundMuted.clear();
	}
}
