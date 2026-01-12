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
	private masterVolume: number = 1.0;
	private masterPlaying: boolean = false;
	private soundVolumes: Map<string, number> = new Map();
	private soundMuted: Map<string, boolean> = new Map();

	constructor() {
		// Load active sounds from localStorage
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

	addSound(sound: Sound): void {
		if (this.sounds.has(sound.id)) {
			return; // Sound already added
		}

		const audio = new Audio(sound.file);
		audio.loop = true;
		audio.volume = 0.5; // Default volume
		this.sounds.set(sound.id, audio);
		this.soundVolumes.set(sound.id, 0.5);
		this.soundMuted.set(sound.id, false);

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
		this.updateAllVolumes();
	}

	getMasterVolume(): number {
		return this.masterVolume;
	}

	setSoundVolume(soundId: string, volume: number): void {
		const clampedVolume = Math.max(0, Math.min(1, volume));
		this.soundVolumes.set(soundId, clampedVolume);
		this.updateSoundVolume(soundId);
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

	toggleMasterPlay(): void {
		if (this.masterPlaying) {
			this.pauseAll();
		} else {
			this.playAll();
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

	isSoundPlaying(soundId: string): boolean {
		const audio = this.sounds.get(soundId);
		return audio ? !audio.paused : false;
	}

	toggleSound(soundId: string): void {
		if (this.isSoundPlaying(soundId)) {
			this.pauseSound(soundId);
		} else {
			this.playSound(soundId);
		}
	}

	cleanup(): void {
		this.sounds.forEach((audio) => {
			audio.pause();
			audio.src = '';
		});
		this.sounds.clear();
		this.soundVolumes.clear();
		this.soundMuted.clear();
	}
}
