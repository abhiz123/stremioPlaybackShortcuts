# Stremio PlayBack Shortcuts

A plugin for Stremio Enhanced that adds convenient keyboard shortcuts for playback control.

## Features

- **Speed Control**: Increase/decrease playback speed
- **Time Skipping**: Jump forward/backward in the video
- **Episode Navigation**: Skip to the next episode automatically

## Screenshots

![Plugin in Action](screenshots/speed.png)
*The plugin displays on-screen notifications for speed control, time skipping, and episode navigation.*

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `S` | Decrease playback speed |
| `D` | Increase playback speed |
| `Z` | Skip backward 5 seconds |
| `X` | Skip forward 5 seconds |
| `N` | Next episode (works anytime) |

## Playback Speeds

The plugin cycles through these speeds:
- 0.25x
- 0.5x
- 0.75x
- 1.0x (normal)
- 1.25x
- 1.5x
- 1.75x
- 2.0x

## Installation

### Prerequisites
- [Stremio Enhanced](https://github.com/REVENGE977/stremio-enhanced-community) must be installed

### Install Steps

1. Download `PlayBackShortcuts.plugin.js` from this repository
2. Copy the file to your Stremio Enhanced plugins directory:
   - **macOS**: `~/Library/Application Support/stremio-enhanced/plugins/`
   - **Windows**: `%APPDATA%\stremio-enhanced\plugins\`
   - **Linux**: `~/.config/stremio-enhanced/plugins/`
3. Restart Stremio
4. Go to **Settings** → **Enhanced** → **Plugins**
5. Enable **PlayBackShortcuts** from the plugins list
6. The shortcuts should now be active during video playback

## Usage

Simply press the keyboard shortcuts while watching a video. The plugin will display on-screen notifications to confirm your actions:
- Speed changes show the new playback rate
- Time skips show the seconds jumped
- Episode navigation shows the next episode info

## Notes

- Shortcuts work during video playback and override default Stremio shortcuts
- The 'S' key overrides the default subtitle menu shortcut
- Episode navigation requires you to be watching a series

## Credits

Original plugin by REVENGE977, modified for Stremio Enhanced.

## License

MIT License
