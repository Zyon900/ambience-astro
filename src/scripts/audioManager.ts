// Audio manager for mix playback, previews, and persistence.
export interface Sound {
	id: string;
	name: string;
	thumbnail: string;
	file: string;
	source?: string;
	license?: string;
}

export class AudioManager {
	private sounds: Map<string, HTMLAudioElement> = new Map();
	private previewSounds: Map<string, HTMLAudioElement> = new Map();
	private masterVolume: number = this.loadMasterVolume();
	private masterPlaying: boolean = false;
	private soundVolumes: Map<string, number> = new Map();
	private soundMuted: Map<string, boolean> = new Map();

	constructor() {
		this.loadSoundVolumes();
		this.loadActiveSounds();
	}

	private loadActiveSounds(): void {
		const activeSounds = this.getActiveSounds();
		activeSounds.forEach((sound) => {
			this.addSound(sound);
		});
	}

	getActiveSounds(): Sound[] {
		const stored = localStorage.getItem('activeSounds');
		return stored ? JSON.parse(stored) : [];
	}

	saveActiveSounds(sounds: Sound[]): void {
		localStorage.setItem('activeSounds', JSON.stringify(sounds));
	}

	private getSoundVolumes(): Record<string, number> {
		const stored = localStorage.getItem('soundVolumes');
		return stored ? JSON.parse(stored) : {};
	}

	private saveSoundVolumes(): void {
		const volumes: Record<string, number> = {};
		this.soundVolumes.forEach((volume, soundId) => {
			volumes[soundId] = volume;
		});
		localStorage.setItem('soundVolumes', JSON.stringify(volumes));
	}

	private loadSoundVolumes(): void {
		const stored = this.getSoundVolumes();
		Object.keys(stored).forEach((soundId) => {
			this.soundVolumes.set(soundId, stored[soundId]);
		});
	}

	addSound(sound: Sound): void {
		if (this.sounds.has(sound.id)) {
			return; // Sound already added
		}

		const previewAudio = this.previewSounds.get(sound.id);
		if (previewAudio) {
			const wasPlaying = !previewAudio.paused;
			previewAudio.pause();
			previewAudio.src = '';
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
					console.error('Error playing audio:', error);
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

		// Add to active sounds in localStorage
		const activeSounds = this.getActiveSounds();
		if (!activeSounds.find((s) => s.id === sound.id)) {
			activeSounds.push(sound);
			this.saveActiveSounds(activeSounds);
		}
	}

	removeSound(soundId: string): void {
		const audio = this.sounds.get(soundId);
		if (audio) {
			audio.pause();
			audio.src = '';
			this.sounds.delete(soundId);
			this.soundVolumes.delete(soundId);
			this.soundMuted.delete(soundId);

			// Remove from active sounds in localStorage
			const activeSounds = this.getActiveSounds().filter((s) => s.id !== soundId);
			this.saveActiveSounds(activeSounds);
		}
	}

	setMasterVolume(volume: number): void {
		this.masterVolume = Math.max(0, Math.min(1, volume));
		this.saveMasterVolume();
		this.updateAllVolumes();
	}

	private loadMasterVolume(): number {
		const stored = localStorage.getItem('masterVolume');
		return stored ? parseFloat(stored) : 1.0;
	}

	private saveMasterVolume(): void {
		localStorage.setItem('masterVolume', this.masterVolume.toString());
	}

	getMasterVolume(): number {
		return this.masterVolume;
	}

	setSoundVolume(soundId: string, volume: number): void {
		const clampedVolume = Math.max(0, Math.min(1, volume));
		this.soundVolumes.set(soundId, clampedVolume);
		this.saveSoundVolumes();
		this.updateSoundVolume(soundId);

		const previewAudio = this.previewSounds.get(soundId);
		if (previewAudio) {
			previewAudio.volume = clampedVolume * this.masterVolume;
		}
	}

	getSoundVolume(soundId: string): number {
		return this.soundVolumes.get(soundId) ?? 0.5;
	}

	toggleMute(soundId: string): void {
		const isMuted = this.soundMuted.get(soundId) ?? false;
		this.soundMuted.set(soundId, !isMuted);
		this.updateSoundVolume(soundId);
	}

	isMuted(soundId: string): boolean {
		return this.soundMuted.get(soundId) ?? false;
	}

	private updateSoundVolume(soundId: string): void {
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

	private updateAllVolumes(): void {
		this.sounds.forEach((audio, soundId) => {
			this.updateSoundVolume(soundId);
		});

		this.previewSounds.forEach((audio, soundId) => {
			const volume = this.soundVolumes.get(soundId) ?? 0.5;
			audio.volume = volume * this.masterVolume;
		});
	}

	async playAll(): Promise<void> {
		if (this.masterPlaying) return;

		const playPromises: Promise<void>[] = [];
		this.sounds.forEach((audio) => {
			const promise = audio.play().catch((error) => {
				console.error('Error playing audio:', error);
			});
			playPromises.push(promise);
		});

		await Promise.all(playPromises);
		this.masterPlaying = true;
	}

	pauseAll(): void {
		this.sounds.forEach((audio) => {
			audio.pause();
		});
		this.masterPlaying = false;
	}

	async toggleMasterPlay(): Promise<void> {
		if (this.masterPlaying) {
			this.pauseAll();
		} else {
			await this.playAll();
		}
	}

	isMasterPlaying(): boolean {
		return this.masterPlaying;
	}

	playSound(soundId: string): void {
		const audio = this.sounds.get(soundId);
		if (audio) {
			audio.play().catch((error) => {
				console.error('Error playing audio:', error);
			});
		}
	}

	pauseSound(soundId: string): void {
		const audio = this.sounds.get(soundId);
		if (audio) {
			audio.pause();
		}
	}

	previewSound(soundId: string, file: string): void {
		if (this.sounds.has(soundId)) {
			this.playSound(soundId);
			return;
		}

		if (!this.previewSounds.has(soundId)) {
			const audio = new Audio(file);
			audio.loop = true;
			const volume = this.getSoundVolume(soundId);
			audio.volume = volume * this.masterVolume;
			this.previewSounds.set(soundId, audio);
		}

		const audio = this.previewSounds.get(soundId);
		if (audio) {
			audio.play().catch((error) => {
				console.error('Error playing preview audio:', error);
			});
		}
	}

	pausePreview(soundId: string): void {
		const audio = this.previewSounds.get(soundId);
		if (audio) {
			audio.pause();
		}
	}

	isPreviewPlaying(soundId: string): boolean {
		const audio = this.previewSounds.get(soundId);
		return audio ? !audio.paused : false;
	}

	isSoundPlaying(soundId: string): boolean {
		const audio = this.sounds.get(soundId);
		if (audio) {
			return !audio.paused;
		}
		const previewAudio = this.previewSounds.get(soundId);
		return previewAudio ? !previewAudio.paused : false;
	}

	toggleSound(soundId: string): void {
		if (this.isSoundPlaying(soundId)) {
			this.pauseSound(soundId);
		} else {
			this.playSound(soundId);
		}
	}

	togglePreview(soundId: string, file: string): void {
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

	cleanup(): void {
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
