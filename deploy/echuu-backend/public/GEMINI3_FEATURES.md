# Gemini 3 Integration Features

This document highlights how Echuu leverages **Gemini 3's innovative capabilities** for the hackathon.

## 1. Thinking Mode - Controlled Reasoning Depth

Gemini 3 introduces a revolutionary **Thinking Mode** that allows precise control over the model's reasoning process. Echuu uses this to optimize different use cases.

### How It Works

```python
from echuu.live.gemini_client import GeminiClient

# Create client with thinking level
client = GeminiClient(
    model="gemini-3-flash-preview",
    thinking_level="high"  # Controls reasoning depth
)

# Override per request
response = client.call(
    prompt="Generate a funny story about...",
    thinking_level="medium"  # Dynamic adjustment
)
```

### Thinking Levels in Echuu

| Level | Use Case | Description |
|-------|----------|-------------|
| `high` | Content Generation | Maximum reasoning for script generation, story development |
| `medium` | Interactive | Balanced for danmaku responses |
| `low` | Quick Chat | Minimal latency for simple acknowledgments |
| `minimal` | Real-time | Fastest possible for time-sensitive interactions |

### Innovation: Adaptive Thinking

Echuu dynamically adjusts thinking levels based on context:

```python
# Complex story climax -> High thinking
if stage == "Climax":
    thinking_level = "high"

# Simple "thank you" -> Low thinking
if is_simple_acknowledgment():
    thinking_level = "low"
```

## 2. Multi-Language Streaming with Auto-Detection

Gemini 3's superior multilingual capabilities enable natural content generation across languages.

### Auto Language Detection

```python
from echuu.live.engine import EchuuLiveEngine

engine = EchuuLiveEngine()

# Topic in Chinese -> Chinese content
engine.setup(topic="今天遇到的趣事")  # Detects: zh

# Topic in Japanese -> Japanese content
engine.setup(topic="今日の出来事")  # Detects: ja

# Topic in English -> English content
engine.setup(topic="Today's story")  # Detects: en
```

### Language-Aware Prompts

The system automatically adapts prompts based on detected language:

```python
# Chinese prompt (simplified)
prompt_zh = "你是一个爱分享的主播，话题：食堂打饭..."

# Japanese prompt
prompt_ja = "あなたは共有好きなVTuber、話題：食堂での..."

# English prompt
prompt_en = "You are a sharing-loving streamer, topic: Cafeteria..."
```

### Bilingual Interaction

Supports mixed-language scenarios:

```python
# Chinese stream with English viewers
danmaku = [
    {"text": "hello everyone", "user": "John"},  # English
    {"text": "哈哈哈哈", "user": "小明"},         # Chinese
]
# VTuber responds in stream language (Chinese) but acknowledges English
```

## 3. User Memory & Relationship Building

Gemini 3's large context window and strong instruction following enable sophisticated user tracking.

### Bonding System

```python
from echuu.live.state import PerformerMemory, UserProfile

memory = PerformerMemory()
user = memory.get_or_create_user("小明")

# Track interactions
user.interaction_count += 1

# Get bonding description
print(user.get_bonding_description())
# "新观众" (1) -> "眼熟" (2-3) -> "老观众" (4-9) -> "核心粉丝" (10+)
```

### LLM Integration

User context is provided to Gemini for personalized responses:

```python
context = memory.get_active_users_context(limit=5)

# Sent to Gemini as:
"""
当前直播间熟悉观众:
- 小明: 老观众 (5次互动, 爱笑, 常催更)
- 小红: 眼熟 (2次互动, 很支持)
"""
```

## 4. Natural Content Generation

Gemini 3's improved instruction following enables more natural, human-like content.

### Story Nucleus Formula

```python
# Echuu's core formula for engaging content
精彩内容 = 分享欲 + 反常 + 内心戏

# Translated to Gemini prompts
prompt = f"""
Generate a story with:
1. Strong urge to share (分享欲)
2. Something unexpected (反常)
3. Internal thoughts visible (内心戏)

Topic: {topic}
Persona: {persona}
"""
```

### Structure Breaking

Intentionally breaks "AI-generated" patterns for authenticity:

```python
# Removes: "In conclusion", "This taught me that..."
# Adds: Digressions, number fuzzing, abrupt endings
```

## 5. Cost-Effective Flash Model

Gemini 3 Flash offers excellent performance at lower costs.

### Model Selection

```python
# Recommended for most use cases
model = "gemini-3-flash-preview"  # Fast + Smart + Affordable

# For complex reasoning
model = "gemini-3-pro-preview"  # Maximum capability
```

### Performance Comparison

| Model | Speed | Reasoning | Cost | Best For |
|-------|-------|-----------|------|----------|
| Gemini 3 Flash | Fast | High | Low | Streaming, real-time |
| Gemini 3 Pro | Medium | Very High | Medium | Complex stories |
| Gemini 2 Flash | Very Fast | Medium | Very Low | Simple chat |

## 6. Image Generation (Pro Image)

Integrated support for visual content creation.

```python
from echuu import GeminiClient

client = GeminiClient(model="gemini-3-pro-image-preview")

# Generate thumbnail
image = client.generate_image(
    prompt="Cozy streaming setup with RGB lighting",
    aspect_ratio="16:9",
    image_size="4K",
    use_search=True  # Google Search for accuracy
)

# Save image
with open("thumbnail.png", "wb") as f:
    f.write(image)
```

## 7. Vision Capabilities (Future Features)

Foundation for image-based interaction.

```python
# Future: Read viewer-submitted images
text = client.call_with_image(
    prompt="This viewer sent a photo of their cat. React naturally.",
    image_data=viewer_image,
    media_resolution="media_resolution_high"
)
```

## Code Examples

### Complete Setup

```python
import os
os.environ["GEMINI_API_KEY"] = "your-key-here"

from echuu import EchuuLiveEngine

engine = EchuuLiveEngine()

# Auto-detects language from topic
engine.setup(
    name="Akari",
    persona=" cheerful VTuber who loves sharing daily moments",
    topic="That time I got lost in Akihabara"
)

# Generate with thinking level control
for step in engine.run(max_steps=10):
    print(f"[{step['stage']}] {step['speech']}")
```

### Custom Thinking Control

```python
from echuu import create_llm_client

# Create client with custom thinking
llm = create_llm_client(
    provider="gemini",
    model="gemini-3-flash-preview",
    thinking_level="high"  # Maximum reasoning
)

# Use in custom generator
response = llm.call(
    prompt="Generate a dramatic climax for...",
    max_tokens=500
)
```

## Performance Metrics

Based on Echuu's testing with Gemini 3:

| Metric | Value |
|--------|-------|
| Avg. Script Generation | 3-5 seconds (10 steps) |
| Multi-Language Accuracy | 98%+ auto-detection |
| Context Window Used | Up to 32K tokens |
| Cost per 10-min Stream | ~$0.01 (Flash) |

## Why Gemini 3?

1. **Thinking Mode** - Unique control over reasoning depth
2. **Multilingual** - Superior cross-language understanding
3. **Flash Speed** - Real-time streaming without lag
4. **Large Context** - Remember user history and story continuity
5. **Cost Effective** - High quality at lower prices

Built specifically for the **Gemini 3 Dev Hackathon** to showcase these innovative features!
