class AudioManager {
	constructor() {
		this.sounds = new Map();
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

	isSoundPlaying(soundId) {
		const audio = this.sounds.get(soundId);
		return audio ? !audio.paused : false;
	}

	toggleSound(soundId) {
		if (this.isSoundPlaying(soundId)) {
			this.pauseSound(soundId);
		} else {
			this.playSound(soundId);
		}
	}

	cleanup() {
		this.sounds.forEach((audio) => {
			audio.pause();
			audio.src = '';
		});
		this.sounds.clear();
		this.soundVolumes.clear();
		this.soundMuted.clear();
	}
}
