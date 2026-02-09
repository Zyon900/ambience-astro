// Client-side logic for the sounds catalog page.
import soundsData from '../data/sounds.json';
import { AudioManager } from './audioManager';

const audioManager = new AudioManager();
const allSounds = soundsData.sounds;

function isSoundActive(soundId: string) {
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
				card.classList.add('border-accent');
				card.classList.remove('border-gray-700');
				btn.textContent = 'Already Added';
				btn.classList.add('opacity-50', 'cursor-not-allowed');
				btn.classList.add('bg-accent', 'hover:bg-accent-600');
				btn.classList.remove('bg-gray-600', 'hover:bg-gray-500');
			} else {
				card.classList.remove('border-accent');
				card.classList.add('border-gray-700');
				btn.textContent = 'Add to Mix';
				btn.classList.remove('opacity-50', 'cursor-not-allowed');
				btn.classList.add('bg-accent', 'hover:bg-accent-600');
				btn.classList.remove('bg-gray-600', 'hover:bg-gray-500');
			}
		}
	});
}

function attachEventListeners() {
	document.querySelectorAll('.sound-play-btn').forEach((btn) => {
		btn.addEventListener('click', (e) => {
			const target = e.currentTarget as HTMLElement;
			const soundId = target.dataset.soundId;
			if (!soundId) return;
			const sound = allSounds.find((s) => s.id === soundId);
			if (sound) {
				audioManager.togglePreview(soundId, sound.file);
				updatePlayButton(soundId);
			}
		});
	});

	document.querySelectorAll('.sound-volume-slider').forEach((slider) => {
		slider.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			const soundId = target.dataset.soundId;
			if (!soundId) return;
			const volume = parseFloat(target.value);
			audioManager.setSoundVolume(soundId, volume);
			updateVolumeDisplay(soundId);
			updateVolumeIcon(soundId);
		});
	});

	document.querySelectorAll('.sound-add-btn').forEach((btn) => {
		btn.addEventListener('click', (e) => {
			const target = e.currentTarget as HTMLElement;
			const soundId = target.dataset.soundId;
			if (!soundId) return;
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

function updatePlayButton(soundId: string) {
	const btn = document.querySelector(`.sound-play-btn[data-sound-id="${soundId}"]`);
	if (btn) {
		const playIcon = btn.querySelector('.play-icon');
		const pauseIcon = btn.querySelector('.pause-icon');
		if (playIcon && pauseIcon) {
			if (audioManager.isSoundPlaying(soundId)) {
				playIcon.classList.add('hidden');
				pauseIcon.classList.remove('hidden');
			} else {
				playIcon.classList.remove('hidden');
				pauseIcon.classList.add('hidden');
			}
		}
	}
}

function updateVolumeDisplay(soundId: string) {
	const volumeValue = document.querySelector(`.sound-volume-value[data-sound-id="${soundId}"]`);
	if (volumeValue) {
		const volume = audioManager.getSoundVolume(soundId);
		volumeValue.textContent = `${Math.round(volume * 100)}%`;
	}
}

function updateVolumeIcon(soundId: string) {
	const speakerIcon = document.querySelector(`.volume-speaker-icon[data-sound-id="${soundId}"]`);
	const mutedIcon = document.querySelector(`.volume-muted-icon[data-sound-id="${soundId}"]`);
	if (speakerIcon && mutedIcon) {
		const isMuted = audioManager.isMuted(soundId);
		const volume = audioManager.getSoundVolume(soundId);
		const shouldShowMuted = isMuted || volume === 0;

		if (shouldShowMuted) {
			speakerIcon.classList.add('hidden');
			mutedIcon.classList.remove('hidden');
		} else {
			speakerIcon.classList.remove('hidden');
			mutedIcon.classList.add('hidden');
		}
	}
}

function updateSoundCardState(soundId: string) {
	const card = document.querySelector(`[data-sound-id="${soundId}"]`);
	const btn = document.querySelector(`.sound-add-btn[data-sound-id="${soundId}"]`);
	const isActive = isSoundActive(soundId);

	if (isActive) {
		card?.classList.add('border-accent');
		card?.classList.remove('border-gray-700');
	} else {
		card?.classList.remove('border-accent');
		card?.classList.add('border-gray-700');
	}

	if (btn) {
		if (isActive) {
			btn.textContent = 'Already Added';
			btn.classList.add('opacity-50', 'cursor-not-allowed');
			btn.classList.add('bg-accent', 'hover:bg-accent-600');
			btn.classList.remove('bg-gray-600', 'hover:bg-gray-500');
		} else {
			btn.textContent = 'Add to Mix';
			btn.classList.remove('opacity-50', 'cursor-not-allowed');
			btn.classList.add('bg-accent', 'hover:bg-accent-600');
			btn.classList.remove('bg-gray-600', 'hover:bg-gray-500');
		}
	}
}

function initialize() {
	attachEventListeners();
	initializeCardStates();

	allSounds.forEach((sound) => {
		const slider = document.querySelector(`.sound-volume-slider[data-sound-id="${sound.id}"]`) as HTMLInputElement | null;
		if (slider) {
			const volume = audioManager.getSoundVolume(sound.id);
			slider.value = String(volume);
		}
		updateVolumeDisplay(sound.id);
		updateVolumeIcon(sound.id);
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initialize);
} else {
	initialize();
}

window.addEventListener('beforeunload', () => {
	audioManager.cleanup();
});
