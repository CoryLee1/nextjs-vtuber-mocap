# Echuu - AI VTuber Auto-Live System

> Powered by **Gemini 3** - The Next Generation AI for Natural Content Generation

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)
[![Gemini 3](https://img.shields.io/badge/Gemini%203-Flash%20%2B%20Pro-orange.svg)](https://aistudio.google.com/)

**Echuu** is an AI-powered VTuber auto-live system that generates natural, spontaneous streaming content. Built with **Gemini 3's advanced reasoning capabilities**, it creates authentic-feeling broadcasts with multi-language support, user memory, and real-time danmaku interaction.

## Highlights for Gemini 3 Dev Hackathon

### 1. Gemini 3 Thinking Mode Integration

Leverage Gemini 3's revolutionary **Thinking Mode** to control reasoning depth:

```python
from echuu import create_llm_client

# High thinking mode for complex content generation
client = create_llm_client(
    provider="gemini",
    model="gemini-3-flash-preview",
    thinking_level="high"  # Maximum reasoning depth
)
```

**Thinking Levels:**
- `high` - Maximum reasoning depth (default, best for content creation)
- `medium` - Balanced reasoning and speed (Flash only)
- `low` - Minimal latency for quick responses
- `minimal` - Fastest, basic processing (Flash only)

### 2. Multi-Language Live Streaming

Auto-detect and generate content in any language:

```python
from echuu import EchuuLiveEngine

engine = EchuuLiveEngine()
engine.setup(
    name="Sakura",
    persona="Anime-loving VTuber",
    topic="That time I went to Akihabara",  # Auto-detects Japanese
)
```

**Supported Languages:**
- Chinese (zh)
- Japanese (ja)
- English (en)
- Auto-detection from input topic

### 3. User Memory & Bonding System

Build relationships with viewers over time:

```python
# Tracks interaction history
# "小明" -> "眼熟" -> "老观众" -> "核心粉丝"
viewer = engine.state.memory.get_or_create_user("小明")
print(viewer.get_bonding_description())  # "老观众 (5+ interactions)"
```

**Bonding Levels:**
- New viewer (新观众) - First interaction
- Familiar (眼熟) - 2-3 interactions
- Regular (老观众) - 4-9 interactions
- Core fan (核心粉丝) - 10+ interactions

### 4. Natural Danmaku Interaction

Smart response system that knows when to engage:

```python
# Evaluates urgency vs interruption cost
decision_value = urgency - cost
# Positive -> respond, Negative -> continue story
```

### 5. VRM Avatar Control

Generate expressions and gestures for virtual avatars:

```python
# PerformerCue outputs for VRM/Unity
{
  "emotion": {"key": "happy", "intensity": 0.9},
  "gesture": {"clip": "react_laugh", "duration": 1.5},
  "look": {"target": "camera", "strength": 0.8}
}
```

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Keys

Copy `.env.example` to `.env` and add your keys:

```bash
cp .env.example .env
```

Get your free Gemini API key at: https://aistudio.google.com/apikey

### 3. Run Demo

```bash
# Basic streaming demo
python examples/demo.py --streaming

# Generate MP3 only
python examples/demo.py --mp3

# Multi-language test
python examples/test_multilingual.py

# User memory demo
python examples/test_user_memory.py
```

### 4. Use in Your Code

```python
from echuu import EchuuLiveEngine

engine = EchuuLiveEngine()
engine.setup(
    name="Your VTuber Name",
    persona="Energetic and friendly streamer",
    topic="A funny story from today",
)

for step in engine.run(max_steps=10):
    print(f"[{step['stage']}] {step['speech']}")
    if step.get('audio'):
        # Save or play audio
        pass
```

## Example Output

### Generated Script Sample

```
[Step 0] Hook
诶，你们知道吗，我刚才突然想起来一件事...

[Step 1] Build-up
就是今天去食堂的时候，我遇到个特别有趣的事...

[Step 2] Climax
结果你猜怎么着？那个打饭的阿姨居然认出我了！
```

### Audio Sample

See `output/examples/` for multilingual TTS audio samples:
- `example_chinese_canteen_audio.mp3` - Chinese
- `example_japanese_akihabara_audio.mp3` - Japanese
- `example_english_algorithm_audio.mp3` - English

## Architecture Overview

```
User Input (topic, persona)
         |
         v
+-------------------------+
|  Gemini 3 Thinking Mode  |  <-- Deep reasoning for content
+-------------------------+
         |
         v
+-------------------------+
|   Story Nucleus Gen     |  <-- "分享欲 + 反常 + 内心戏"
+-------------------------+
         |
         v
+-------------------------+
|   Script Generator      |  <-- Natural dialogue with stage cues
+-------------------------+
         |
         v
+-------------------------+
|   Performer Engine      |  <-- Real-time execution + TTS
+-------------------------+
         |
         v
Output: Speech + Audio + VRM Cues
```

## Project Structure

```
echuu/
├── core/           # Core AI components
│   ├── story_nucleus.py       # Story pattern generation
│   ├── emotion_mixer.py       # Emotion modeling
│   ├── performer_cue.py       # VRM control signals
│   └── ...
├── generators/     # Content generators
│   ├── script_generator_v4.py # Main script generator
│   └── example_sampler.py     # Few-shot learning
├── live/           # Runtime engine
│   ├── engine.py              # Main engine
│   ├── gemini_client.py       # Gemini 3 client
│   ├── tts_client.py          # Text-to-speech
│   ├── state.py               # User memory & state
│   └── danmaku.py             # Chat interaction
└── vrm/            # Avatar control
    ├── mapper.py              # VRM expression mapping
    └── presets.py             # Gesture library
```

## Gemini 3 Features Demo

### Thinking Mode Control

```python
# For complex storytelling
client.call(prompt, thinking_level="high")

# For quick chat responses
client.call(prompt, thinking_level="low")
```

### Image Generation (Pro Image Model)

```python
from echuu import GeminiClient

client = GeminiClient(model="gemini-3-pro-image-preview")
image = client.generate_image(
    prompt="Cozy cafe with sunlight",
    aspect_ratio="16:9",
    use_search=True  # Google Search integration
)
```

### Vision Understanding

```python
text = client.call_with_image(
    prompt="Describe this image",
    image_data=open("photo.jpg", "rb").read(),
    media_resolution="media_resolution_high"
)
```

## Requirements

- Python 3.10+
- Google Gemini API Key
- (Optional) DashScope API Key for TTS

## License

Apache-2.0 License - see [LICENSE](LICENSE) for details.

**Copyright © 2026 Anngel LLC. All rights reserved.**

## Contact

- **GitHub**: [@CoryLee1](https://github.com/CoryLee1)
- **Email**: cory@anngel.live
- **Email**: cory958014884@gmail.com

## Acknowledgments

Built for **Gemini 3 Dev Hackathon 2026**

This project showcases the innovative use of Gemini 3's:
- Thinking Mode for controlled reasoning depth
- Multi-language understanding and generation
- Vision capabilities for future features
- Flash model for cost-effective, high-speed generation
