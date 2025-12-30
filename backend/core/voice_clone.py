"""ElevenLabs voice cloning and speech generation.

Provides voice cloning from audio samples and text-to-speech
generation using cloned or preset voices.
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Preset voices available without cloning
PRESET_VOICES = {
    "jessica": {
        "id": "cgSgspJ2msm6clMCkdW9",
        "name": "Jessica",
        "description": "Young American woman, playful and warm",
        "gender": "female",
        "age": "young"
    },
    "sarah": {
        "id": "EXAVITQu4vr4xnSDxMaL",
        "name": "Sarah",
        "description": "Mature American woman, professional",
        "gender": "female",
        "age": "young"
    },
    "laura": {
        "id": "FGY2WhTYpPnrIDTdsKH5",
        "name": "Laura",
        "description": "American woman, enthusiastic and quirky",
        "gender": "female",
        "age": "young"
    },
    "alice": {
        "id": "Xb7hH8MSUJpSbSDYk0k2",
        "name": "Alice",
        "description": "British woman, clear educator voice",
        "gender": "female",
        "age": "middle_aged"
    },
    "charlie": {
        "id": "IKne3meq5aSn9XLyUdCD",
        "name": "Charlie",
        "description": "Australian man, casual and friendly",
        "gender": "male",
        "age": "young"
    },
    "james": {
        "id": "ZQe5CZNOzWyzPSCn5a3c",
        "name": "James",
        "description": "Australian man, calm narrator",
        "gender": "male",
        "age": "middle_aged"
    }
}


class VoiceCloner:
    """ElevenLabs voice cloning and TTS.

    Features:
    - Clone voice from audio sample
    - Generate speech with cloned or preset voices
    - List available preset voices
    - Adjustable voice settings
    """

    def __init__(self, api_key: str):
        """Initialize voice cloner.

        Args:
            api_key: ElevenLabs API key
        """
        if not api_key:
            raise ValueError("ElevenLabs API key is required")

        self.api_key = api_key
        self._client = None

    @property
    def client(self):
        """Lazy-load ElevenLabs client."""
        if self._client is None:
            try:
                from elevenlabs import ElevenLabs
                self._client = ElevenLabs(api_key=self.api_key)
            except ImportError:
                raise RuntimeError("elevenlabs package required. Install with: pip install elevenlabs")
        return self._client

    def list_preset_voices(self) -> List[Dict[str, Any]]:
        """Get list of available preset voices.

        Returns:
            List of voice info dicts
        """
        return list(PRESET_VOICES.values())

    def get_preset_voice(self, name: str) -> Optional[Dict[str, Any]]:
        """Get preset voice by name.

        Args:
            name: Voice name (case-insensitive)

        Returns:
            Voice info dict or None
        """
        return PRESET_VOICES.get(name.lower())

    def clone_voice(
        self,
        audio_path: Path,
        voice_name: str,
        description: Optional[str] = None
    ) -> str:
        """Clone voice from audio sample.

        Args:
            audio_path: Path to audio sample (30s-5min recommended)
            voice_name: Name for the cloned voice
            description: Optional description

        Returns:
            Voice ID for use in speech generation
        """
        audio_path = Path(audio_path)

        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        logger.info(f"Cloning voice from {audio_path.name}...")

        with open(audio_path, 'rb') as f:
            audio_data = f.read()

        try:
            voice = self.client.voices.ivc.create(
                name=voice_name,
                description=description or f"Cloned from {audio_path.name}",
                files=[audio_data]
            )

            logger.info(f"Voice cloned: {voice_name} (ID: {voice.voice_id})")
            return voice.voice_id

        except Exception as e:
            logger.error(f"Voice cloning failed: {e}")
            raise RuntimeError(f"Failed to clone voice: {e}")

    def generate_speech(
        self,
        text: str,
        output_path: Path,
        voice_id: Optional[str] = None,
        voice_name: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        style: float = 0.3
    ) -> Path:
        """Generate speech from text.

        Args:
            text: Text to convert to speech
            output_path: Path for output audio file
            voice_id: Voice ID (from clone or preset)
            voice_name: Preset voice name (alternative to voice_id)
            stability: Voice stability (0-1)
            similarity_boost: Similarity to original (0-1)
            style: Style expressiveness (0-1)

        Returns:
            Path to generated audio
        """
        from elevenlabs import VoiceSettings

        output_path = Path(output_path)

        # Resolve voice ID
        if voice_id is None:
            if voice_name:
                preset = self.get_preset_voice(voice_name)
                if preset:
                    voice_id = preset["id"]
                else:
                    raise ValueError(f"Unknown preset voice: {voice_name}")
            else:
                # Default to Jessica
                voice_id = PRESET_VOICES["jessica"]["id"]

        output_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info(f"Generating speech: {len(text)} chars, voice={voice_id[:8]}...")

        try:
            audio_gen = self.client.text_to_speech.convert(
                voice_id=voice_id,
                text=text,
                model_id="eleven_multilingual_v2",
                voice_settings=VoiceSettings(
                    stability=stability,
                    similarity_boost=similarity_boost,
                    style=style,
                    use_speaker_boost=True
                )
            )

            with open(output_path, 'wb') as f:
                for chunk in audio_gen:
                    f.write(chunk)

            logger.info(f"Speech generated: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Speech generation failed: {e}")
            raise RuntimeError(f"Failed to generate speech: {e}")

    def delete_voice(self, voice_id: str) -> bool:
        """Delete a cloned voice.

        Args:
            voice_id: Voice ID to delete

        Returns:
            True if deleted successfully
        """
        try:
            self.client.voices.delete(voice_id=voice_id)
            logger.info(f"Voice deleted: {voice_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete voice: {e}")
            return False


def create_voice_cloner(api_key: str) -> VoiceCloner:
    """Factory function to create VoiceCloner.

    Args:
        api_key: ElevenLabs API key

    Returns:
        Configured VoiceCloner instance
    """
    return VoiceCloner(api_key)
