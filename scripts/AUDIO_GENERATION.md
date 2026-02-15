# zKube Audio Generation — WSL Laptop Setup

Generate all 100 audio files (30 music + 70 SFX) locally on your RTX 3070 laptop using ACE-Step.

## Prerequisites

- Windows 11 with WSL2 (Ubuntu 22.04+ recommended)
- NVIDIA GPU drivers installed on **Windows** (latest Game Ready or Studio)
- ~15GB free disk space (7GB model + generated files)

## Step 1: Verify GPU in WSL

Open your WSL terminal:

```bash
nvidia-smi
```

You should see your RTX 3070 listed. If not, update your Windows NVIDIA drivers and ensure WSL2 is using the latest kernel (`wsl --update` from PowerShell).

## Step 2: Install Conda (if not already)

```bash
# Download and install Miniconda
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh -b
~/miniconda3/bin/conda init bash
source ~/.bashrc
```

## Step 3: Create environment and install ACE-Step

```bash
# Create isolated Python 3.10 env
conda create -n ace_step python=3.10 -y
conda activate ace_step

# Install PyTorch with CUDA (adjust cu126 if your driver supports different CUDA)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu126

# Install ACE-Step from the reference copy in our repo
cd ~/projects/zkube/references/ACE-Step
pip install -e .

# Install ffmpeg for audio processing
sudo apt-get install -y ffmpeg
```

## Step 4: Test the setup

```bash
# Quick test — should print GPU info and download model (~7GB first time)
cd ~/projects/zkube/references/ACE-Step
python -c "
from acestep.pipeline_ace_step import ACEStepPipeline
p = ACEStepPipeline(dtype='bfloat16', cpu_offload=True, overlapped_decode=True)
print('Pipeline created, model will download on first generate call')
print('CUDA available:', __import__('torch').cuda.is_available())
print('GPU:', __import__('torch').cuda.get_device_name(0))
"
```

Expected output:
```
CUDA available: True
GPU: NVIDIA GeForce RTX 3070 Laptop GPU
```

## Step 5: Generate audio

### Dry run first (see what will be generated)

```bash
cd ~/projects/zkube
conda activate ace_step
python scripts/generate_audio.py --dry-run
```

### Generate everything (~15-20 min)

```bash
python scripts/generate_audio.py
```

### Generate only one theme (to test quality first)

```bash
python scripts/generate_audio.py --theme theme-1
```

### Generate only music or only SFX

```bash
python scripts/generate_audio.py --only music
python scripts/generate_audio.py --only sfx
```

### Resume after interruption

The script skips files that already exist. Just re-run the same command — it picks up where it left off.

## Step 6: Convert WAV to MP3

ACE-Step outputs WAV. The game expects MP3. Convert in bulk:

```bash
cd ~/projects/zkube

# Install lame encoder if not present
sudo apt-get install -y lame

# Convert all generated WAVs to MP3 (192kbps) in-place
find mobile-app/public/assets/theme-*/sounds -name "*.wav" | while read f; do
    mp3="${f%.wav}.mp3"
    if [ ! -f "$mp3" ]; then
        echo "Converting: $f -> $mp3"
        lame -b 192 --quiet "$f" "$mp3"
    fi
done

# Optional: remove WAV originals after verifying MP3s sound good
# find mobile-app/public/assets/theme-*/sounds -name "*.wav" -delete
```

## Step 7: Trim SFX (optional but recommended)

SFX are generated at 3-5s but the actual sound is often shorter. Trim silence:

```bash
# Install sox for audio trimming
sudo apt-get install -y sox libsox-fmt-mp3

# Trim leading/trailing silence from all SFX MP3s
find mobile-app/public/assets/theme-*/sounds/effects -name "*.mp3" | while read f; do
    echo "Trimming: $f"
    sox "$f" "${f%.mp3}_trimmed.mp3" silence 1 0.01 0.5% reverse silence 1 0.01 0.5% reverse
    mv "${f%.mp3}_trimmed.mp3" "$f"
done
```

## Step 8: Normalize loudness

```bash
# Install ffmpeg-normalize
pip install ffmpeg-normalize

# Normalize music to -14 LUFS
find mobile-app/public/assets/theme-*/sounds/musics -name "*.mp3" -exec \
    ffmpeg-normalize {} -o {} -f -t -14 -ar 44100 \;

# Normalize SFX to -12 LUFS (slightly louder)
find mobile-app/public/assets/theme-*/sounds/effects -name "*.mp3" -exec \
    ffmpeg-normalize {} -o {} -f -t -12 -ar 44100 \;
```

## Output structure

After generation, your files will be at:

```
mobile-app/public/assets/
├── theme-1/sounds/
│   ├── musics/
│   │   ├── track-1.mp3    # Main theme (menu)
│   │   ├── track-2.mp3    # Regular level
│   │   └── track-3.mp3    # Boss level
│   └── effects/
│       ├── break.mp3      # Line clear
│       ├── explode.mp3    # Multi-line combo
│       ├── move.mp3       # Block slide
│       ├── new.mp3        # New row
│       ├── start.mp3      # Level start
│       ├── swipe.mp3      # Block swipe
│       └── over.mp3       # Game over
├── theme-2/sounds/...
├── ...
└── theme-10/sounds/...
```

File names match the `AssetId` catalog in `mobile-app/src/pixi/assets/catalog.ts` exactly.

## Troubleshooting

### "CUDA out of memory"
The script already uses `cpu_offload=True`. If you still OOM:
- Close other GPU-using apps (browser, games)
- Reduce `infer_step` from 27 to 20 in the script (lower quality but less VRAM)

### "torch.cuda.is_available() returns False"
- Update Windows NVIDIA drivers to latest
- Run `wsl --update` from PowerShell
- Restart WSL: `wsl --shutdown` then reopen terminal

### Model download fails
- Check internet connection
- Set `HF_HUB_ENABLE_HF_TRANSFER=1` for faster downloads:
  ```bash
  pip install hf_transfer
  export HF_HUB_ENABLE_HF_TRANSFER=1
  ```

### Generation quality issues
- SFX too long/has music: ACE-Step is primarily a music model. For SFX, you may need to trim aggressively or regenerate with different seeds
- Music doesn't loop: Edit loop points manually in Audacity (crossfade the end into the beginning)
- Wrong style: Adjust the `prompt` tags in `generate_audio.py` — ACE-Step responds well to genre tags

## Using Claude Code on the laptop

If you run Claude Code on this same WSL instance:

```bash
# Activate the env first
conda activate ace_step

# Then run the generation directly or ask Claude Code to run it
python ~/projects/zkube/scripts/generate_audio.py --theme theme-1
```

Claude Code can tweak prompts in `generate_audio.py`, re-run generation, and listen to results interactively.
