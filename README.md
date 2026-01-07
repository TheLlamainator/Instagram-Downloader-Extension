# IGDown

**📸 Download Instagram images, videos & reels instantly**

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-4285F4?style=for-the-badge&logo=googlechrome)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-00C853?style=for-the-badge)](manifest.json)

> A lightweight, privacy-focused Chrome extension that makes downloading Instagram media effortless. No login required, no external servers.

## ✨ Features

- 🎯 **Current Video Focus** - Shows only the video/post you're currently viewing
- 📸 **High-Quality Downloads** - Images, videos, and reels in their original quality
- 🔒 **Privacy First** - All processing happens locally in your browser
- ⚡ **One-Click Save** - Simple interface with instant downloads
- 🎠 **Carousel Support** - Download all media from multi-image posts
- 🚫 **Smart Filtering** - Automatically excludes thumbnails under 121x121px
- 📱 **Works with Reels** - Full support for Instagram Reels and video posts

## 🚀 Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (coming soon)
2. Click "Add to Chrome"
3. Confirm installation

### Manual Installation
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the extension folder
5. The IGDown icon will appear in your toolbar

## 📋 Usage

1. **Navigate to Instagram** - Go to any Instagram post or reel
2. **Click the IGDown icon** - The extension will detect available media
3. **Download** - Click "Save" for individual items or "Download All" for multiple media

### 🎥 For Videos/Reels
- Make sure the video is visible on screen
- For best results, let the video load completely
- Some protected streams may require refreshing the page

## ⚠️ Limitations

- Cannot bypass DRM or server-side protection
- Some videos may use streaming-only (blob) URLs and cannot be downloaded
- Works best on direct post/reel URLs
- Requires standard Instagram web layout

## 🛡️ Privacy & Permissions

This extension is designed with privacy in mind:

- **No data collection** - Your information stays on your device
- **No external servers** - All processing happens locally
- **Minimal permissions** - Only accesses Instagram pages when you use it
- **No login required** - Works without Instagram authentication

### Required Permissions
- `activeTab` - Access the current Instagram tab
- `downloads` - Save files to your device  
- `scripting` - Extract media URLs from the page
- `host_permissions` - Access Instagram domains

## 🔧 Technical Details

- **Manifest Version**: V3 (latest Chrome extension standard)
- **Languages**: JavaScript, HTML, CSS
- **Size**: < 100KB
- **Chrome Version**: 88+

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

Having issues? Please check:
1. Make sure you're on an Instagram post/reel page
2. Try refreshing the page
3. Check that the extension is enabled

For bugs and feature requests, please [open an issue](https://github.com/yourusername/IGDown/issues).

## ⚖️ Legal

This extension is for personal use only. Please respect Instagram's Terms of Service and only download content you have permission to save. The developers are not responsible for any misuse of this tool.

---

<p align="center">Made with ❤️ for the Instagram community</p>
  <tr>
    <td>🎨</td>
    <td><strong>Beautiful UI</strong></td>
    <td>Modern, dark-themed interface with smooth animations</td>
  </tr>
  <tr>
    <td>🔒</td>
    <td><strong>Privacy First</strong></td>
    <td>No data collection, no tracking, no accounts needed</td>
  </tr>
</table>

---

## 📥 Installation

### From Source (Developer Mode)

1. **Clone or Download** this repository
   ```bash
   git clone https://github.com/yourusername/IGDown.git
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)

3. **Load the Extension**
   - Click **Load unpacked**
   - Select the `IGDown` folder

4. **Done!** 🎉 You'll see the IGDown icon in your toolbar

---

## 🚀 Usage

<table>
  <tr>
    <td width="60"><h3>1️⃣</h3></td>
    <td>Navigate to any Instagram post, reel, or profile</td>
  </tr>
  <tr>
    <td><h3>2️⃣</h3></td>
    <td>Click the <strong>IGDown</strong> extension icon in your toolbar</td>
  </tr>
  <tr>
    <td><h3>3️⃣</h3></td>
    <td>Preview the available media with thumbnails</td>
  </tr>
  <tr>
    <td><h3>4️⃣</h3></td>
    <td>Click <strong>Save</strong> to download individual items, or <strong>Download All</strong></td>
  </tr>
</table>

---

## 📸 Screenshots

<p align="center">
  <i>Clean, modern interface with media previews</i>
</p>

```
┌─────────────────────────────────┐
│     📸 IGDown                   │
│   Instagram Media Downloader    │
├─────────────────────────────────┤
│  Found 3 media item(s)          │
│                                 │
│  ┌─────┐                        │
│  │ 📷  │  Image 1    [⬇️ Save]  │
│  └─────┘                        │
│  ┌─────┐                        │
│  │ 📷  │  Image 2    [⬇️ Save]  │
│  └─────┘                        │
│  ┌─────┐                        │
│  │ 🎥  │  Video 1    [⬇️ Save]  │
│  └─────┘                        │
│                                 │
│     [⬇️ Download All]           │
└─────────────────────────────────┘
```

---

## 📁 Project Structure

```
IGDown/
├── 📄 manifest.json      # Chrome extension configuration
├── 📄 popup.html         # Extension popup interface
├── 📄 popup.js           # Main application logic
├── 🖼️ icon16.png         # Toolbar icon
├── 🖼️ icon48.png         # Extension page icon
├── 🖼️ icon128.png        # Chrome Web Store icon
└── 📄 README.md          # You are here!
```

---

## 🛡️ Privacy & Security

- ✅ **No data collection** - Your browsing data stays on your device
- ✅ **No external servers** - Everything runs locally in your browser
- ✅ **No accounts required** - Just install and use
- ✅ **Open source** - Audit the code yourself
- ✅ **Minimal permissions** - Only requests what's necessary

---

## ⚠️ Disclaimer

This extension is for **personal use only**. Please respect copyright and Instagram's Terms of Service:

- Only download content you have permission to use
- Do not redistribute copyrighted content
- Respect content creators' rights

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. 🍴 Fork the repository
2. 🔧 Make your changes
3. 📫 Submit a pull request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Made with ❤️ for the community</sub>
</p>

<p align="center">
  <a href="#igdown">⬆️ Back to Top</a>
</p>
