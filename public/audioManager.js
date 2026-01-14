class AudioManager {
	constructor() {
		this.sounds = new Map();
		this.previewSounds = new Map(); // Temporary audio instances for preview
		this.masterVolume = this.loadMasterVolume();
		this.masterPlaying = false;
		this.soundVolumes = new Map();
		this.soundMuted = new Map();
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
		const stored = localStorage.getItem('activeSounds');
		return stored ? JSON.parse(stored) : [];
	}

	saveActiveSounds(sounds) {
		localStorage.setItem('activeSounds', JSON.stringify(sounds));
	}

	getSoundVolumes() {
		const stored = localStorage.getItem('soundVolumes');
		return stored ? JSON.parse(stored) : {};
	}

	saveSoundVolumes() {
		const volumes = {};
		this.soundVolumes.forEach((volume, soundId) => {
			volumes[soundId] = volume;
		});
		localStorage.setItem('soundVolumes', JSON.stringify(volumes));
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

		// Clean up preview audio if it exists
		const previewAudio = this.previewSounds.get(sound.id);
		if (previewAudio) {
			const wasPlaying = !previewAudio.paused;
			previewAudio.pause();
			previewAudio.src = '';
			this.previewSounds.delete(sound.id);
			
			// Create new audio for mix
			const audio = new Audio(sound.file);
			audio.loop = true;
			
			// Use stored volume if available, otherwise default to 0.5
			const storedVolume = this.soundVolumes.get(sound.id) ?? 0.5;
			audio.volume = storedVolume;
			this.sounds.set(sound.id, audio);
			this.soundVolumes.set(sound.id, storedVolume);
			this.soundMuted.set(sound.id, false);
			
			// Update the audio volume after setting it
			this.updateSoundVolume(sound.id);
			
			// If preview was playing, start the mix audio
			if (wasPlaying) {
				audio.play().catch((error) => {
					console.error('Error playing audio:', error);
				});
			}
		} else {
			const audio = new Audio(sound.file);
			audio.loop = true;
			
			// Use stored volume if available, otherwise default to 0.5
			const storedVolume = this.soundVolumes.get(sound.id) ?? 0.5;
			audio.volume = storedVolume;
			this.sounds.set(sound.id, audio);
			this.soundVolumes.set(sound.id, storedVolume);
			this.soundMuted.set(sound.id, false);
			
			// Update the audio volume after setting it
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
			audio.src = '';
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
		const stored = localStorage.getItem('masterVolume');
		return stored ? parseFloat(stored) : 1.0;
	}

	saveMasterVolume() {
		localStorage.setItem('masterVolume', this.masterVolume.toString());
	}

	getMasterVolume() {
		return this.masterVolume;
	}

	setSoundVolume(soundId, volume) {
		const clampedVolume = Math.max(0, Math.min(1, volume));
		this.soundVolumes.set(soundId, clampedVolume);
		this.saveSoundVolumes();
		this.updateSoundVolume(soundId);
		
		// Also update preview volume if it exists
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
		this.sounds.forEach((audio, soundId) => {
			this.updateSoundVolume(soundId);
		});
		
		// Also update preview volumes
		this.previewSounds.forEach((audio, soundId) => {
			const volume = this.soundVolumes.get(soundId) ?? 0.5;
			audio.volume = volume * this.masterVolume;
		});
	}

	async playAll() {
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
		this.sounds.forEach((audio) => {
			audio.pause();
		});
		this.masterPlaying = false;
	}

	toggleMasterPlay() {
		if (this.masterPlaying) {
			this.pauseAll();
		} else {
			this.playAll();
		}
	}

	isMasterPlaying() {
		return this.masterPlaying;
	}

	playSound(soundId) {
		const audio = this.sounds.get(soundId);
		if (audio) {
			audio.play().catch((error) => {
				console.error('Error playing audio:', error);
			});
		}
	}

	pauseSound(soundId) {
		const audio = this.sounds.get(soundId);
		if (audio) {
			audio.pause();
		}
	}


	toggleSound(soundId) {
		if (this.isSoundPlaying(soundId)) {
			this.pauseSound(soundId);
		} else {
			this.playSound(soundId);
		}
	}

	// Preview methods for sounds not in the mix
	previewSound(soundId, file) {
		// If sound is already in mix, use regular play
		if (this.sounds.has(soundId)) {
			this.playSound(soundId);
			return;
		}

		// Create temporary preview audio
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
		const audio = this.previewSounds.get(soundId);
		if (audio) {
			audio.pause();
		}
	}

	isPreviewPlaying(soundId) {
		const audio = this.previewSounds.get(soundId);
		return audio ? !audio.paused : false;
	}

	togglePreview(soundId, file) {
		if (this.sounds.has(soundId)) {
			// Sound is in mix, use regular toggle
			this.toggleSound(soundId);
		} else {
			// Sound is not in mix, use preview
			if (this.isPreviewPlaying(soundId)) {
				this.pausePreview(soundId);
			} else {
				this.previewSound(soundId, file);
			}
		}
	}

	isSoundPlaying(soundId) {
		// Check both mix sounds and preview sounds
		const audio = this.sounds.get(soundId);
		if (audio) {
			return !audio.paused;
		}
		const previewAudio = this.previewSounds.get(soundId);
		return previewAudio ? !previewAudio.paused : false;
	}

	cleanup() {
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
