class AudioManager {
	constructor() {
		this.sounds = new Map();
		this.masterVolume = 1.0;
		this.masterPlaying = false;
		this.soundVolumes = new Map();
		this.soundMuted = new Map();
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

	addSound(sound) {
		if (this.sounds.has(sound.id)) {
			return;
		}

		const audio = new Audio(sound.file);
		audio.loop = true;
		audio.volume = 0.5;
		this.sounds.set(sound.id, audio);
		this.soundVolumes.set(sound.id, 0.5);
		this.soundMuted.set(sound.id, false);

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
		this.updateAllVolumes();
	}

	getMasterVolume() {
		return this.masterVolume;
	}

	setSoundVolume(soundId, volume) {
		const clampedVolume = Math.max(0, Math.min(1, volume));
		this.soundVolumes.set(soundId, clampedVolume);
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
