# Quick Start Guide - Gemini 3 Hackathon

Get Echuu running in 5 minutes with Gemini 3!

## 1. Get Your Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

## 2. Install Dependencies

```bash
cd public
pip install -r requirements.txt
```

## 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
GEMINI_API_KEY=your-actual-api-key-here
```

## 4. Run Your First Stream

```bash
python examples/demo.py --mp3
```

This will generate a 10-step streaming script with audio!

## 5. Try Multi-Language

```bash
python examples/test_multilingual.py
```

See Echuu generate content in Chinese, Japanese, and English!

## 6. Explore User Memory

```bash
python examples/test_user_memory.py
```

Watch the VTuber build relationships with viewers over time.

## What's Happening?

When you run `demo.py`, Echuu:

1. **Detects language** from your topic
2. **Generates a script** using Gemini 3 Flash with high thinking mode
3. **Creates TTS audio** for each line
4. **Saves compressed MP3** files to `output/scripts/`

## Hackathon Demo Ideas

### Idea 1: Multi-Language VTuber

```python
from echuu import EchuuLiveEngine

engine = EchuuLiveEngine()

# Chinese content
engine.setup(name="Lin", topic="今天遇到的趣事", language="zh")
for step in engine.run(max_steps=5): print(step['speech'])

# Japanese content (same engine!)
engine.setup(name="Sakura", topic="今日の出来事", language="ja")
for step in engine.run(max_steps=5): print(step['speech'])
```

### Idea 2: Interactive Storytelling

```python
from echuu import EchuuLiveEngine
from echuu.live.state import Danmaku

engine = EchuuLiveEngine()
engine.setup(name="Alex", topic="My adventure yesterday")

# Simulate chat messages
danmaku_sim = [
    {"step": 1, "text": "Then what happened??", "user": "Viewer1"},
    {"step": 3, "text": "lol that's funny", "user": "Viewer2"},
]

for step in engine.run(max_steps=5, danmaku_sim=danmaku_sim):
    print(f"[{step['stage']}] {step['speech']}")
```

### Idea 3: Thinking Mode Comparison

```python
from echuu import create_llm_client

# Low thinking - fast but simple
fast_client = create_llm_client(
    provider="gemini",
    model="gemini-3-flash-preview",
    thinking_level="low"
)

# High thinking - slower but deeper
deep_client = create_llm_client(
    provider="gemini",
    model="gemini-3-flash-preview",
    thinking_level="high"
)
```

## Troubleshooting

**"No module named 'google'"**
```bash
pip install google-genai
```

**"GEMINI_API_KEY not set"**
- Make sure you created `.env` file
- Check the API key is correct (no extra spaces)

**Empty response from Gemini**
- Try increasing `thinking_level` to `"high"`
- Check your API key has quota remaining

## Next Steps

1. Read `GEMINI3_FEATURES.md` for detailed feature explanations
2. Explore `output/examples/` for sample outputs
3. Check `echuu/` directory for source code
4. Customize persona and topics for your demo!

## Hackathon Tips

- **Focus on Thinking Mode** - This is Gemini 3's unique feature
- **Show Multi-Language** - Impresses judges with versatility
- **Demo User Memory** - Shows sophisticated state management
- **Keep it Simple** - A working demo beats complex broken code

Good luck with the hackathon!
