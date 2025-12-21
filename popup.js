// Popup script for Instagram Post Downloader

let mediaItems = [];

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading');
  const status = document.getElementById('status');
  const mediaList = document.getElementById('mediaList');
  const downloadAllBtn = document.getElementById('downloadAll');

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('instagram.com')) {
      showStatus('Please navigate to Instagram to use this extension', true);
      return;
    }

    // Inject script to extract media from the page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractMedia
    });

    const media = results[0]?.result || [];
    mediaItems = media;

    loading.style.display = 'none';

    if (media.length === 0) {
      showStatus('No media found on this post. Make sure you\'re viewing an Instagram post.', false);
      return;
    }

    // Show media count
    const mediaCount = document.getElementById('mediaCount');
    const countNum = document.getElementById('countNum');
    mediaCount.style.display = 'block';
    countNum.textContent = media.length;

    // Display media items
    mediaList.style.display = 'flex';
    media.forEach((item, index) => {
      const mediaElement = createMediaElement(item, index);
      mediaList.appendChild(mediaElement);
    });

    // Show download all button if multiple items
    if (media.length > 1) {
      downloadAllBtn.style.display = 'block';
      downloadAllBtn.addEventListener('click', downloadAll);
    }

  } catch (error) {
    console.error('Error:', error);
    showStatus('Error extracting media. Please refresh the page and try again.', true);
  }
});

function showStatus(message, isError = false) {
  const loading = document.getElementById('loading');
  const status = document.getElementById('status');
  const statusIcon = status.querySelector('.status-icon');
  const statusText = status.querySelector('.status-text');
  
  loading.style.display = 'none';
  status.style.display = 'block';
  statusText.textContent = message;
  
  if (isError) {
    status.classList.add('error');
    statusIcon.textContent = '😕';
  } else {
    statusIcon.textContent = '🔍';
  }
}

function createMediaElement(item, index) {
  const div = document.createElement('div');
  div.className = 'media-item';
  
  // Preview container with badge
  const previewContainer = document.createElement('div');
  previewContainer.className = 'media-preview-container';
  
  const preview = document.createElement('img');
  preview.className = 'media-preview';
  preview.src = item.thumbnail || item.url;
  preview.alt = `Media ${index + 1}`;
  preview.onerror = () => { preview.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; };
  
  const badge = document.createElement('div');
  badge.className = `media-type-badge ${item.type === 'video' ? 'video' : ''}`;
  badge.textContent = item.type === 'video' ? '🎥 VID' : '📷 IMG';
  
  previewContainer.appendChild(preview);
  previewContainer.appendChild(badge);
  
  const info = document.createElement('div');
  info.className = 'media-info';
  
  const indexLabel = document.createElement('div');
  indexLabel.className = 'media-index';
  indexLabel.textContent = item.type === 'video' ? `Video ${index + 1}` : `Image ${index + 1}`;
  
  const sizeLabel = document.createElement('div');
  sizeLabel.className = 'media-size';
  sizeLabel.textContent = item.type === 'video' ? 'Tap to download video' : 'Tap to download image';
  
  info.appendChild(indexLabel);
  info.appendChild(sizeLabel);
  
  const btn = document.createElement('button');
  btn.className = 'download-btn';
  
  // Handle blob-only videos that can't be downloaded
  if (item.isBlobOnly) {
    btn.innerHTML = '<span>⚠️</span> Retry';
    btn.title = 'Play the video fully, then try again';
    btn.classList.add('warning');
    btn.addEventListener('click', () => {
      alert('Instagram loads videos dynamically. Please:\n\n1. Play the video/reel completely\n2. Click the extension again\n\nThis helps load the actual video URL.');
    });
  } else {
    btn.innerHTML = '<span>⬇️</span> Save';
    btn.addEventListener('click', () => downloadMedia(item, index, btn));
  }
  
  div.appendChild(previewContainer);
  div.appendChild(info);
  div.appendChild(btn);
  
  return div;
}

async function downloadMedia(item, index, btn) {
  const filename = `instagram_${item.type}_${Date.now()}_${index + 1}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
  
  try {
    btn.innerHTML = '<span>⏳</span> ...';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    
    await chrome.downloads.download({
      url: item.url,
      filename: filename,
      saveAs: false
    });
    
    btn.innerHTML = '<span>✅</span> Done';
    btn.classList.add('downloaded');
    btn.style.opacity = '1';
  } catch (error) {
    console.error('Download error:', error);
    btn.innerHTML = '<span>❌</span> Error';
    btn.style.opacity = '1';
    setTimeout(() => {
      btn.innerHTML = '<span>🔄</span> Retry';
      btn.disabled = false;
    }, 2000);
  }
}

async function downloadAll() {
  const buttons = document.querySelectorAll('.download-btn');
  for (let i = 0; i < mediaItems.length; i++) {
    await downloadMedia(mediaItems[i], i, buttons[i]);
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
  }
}

// This function runs in the context of the Instagram page
function extractMedia() {
  const media = [];
  
  // Try to get video URL from page data (for reels and videos)
  function findVideoUrls() {
    const videoUrls = [];
    
    // Method 1: Look in script tags for video_url
    const scripts = document.querySelectorAll('script[type="application/json"]');
    scripts.forEach(script => {
      try {
        const text = script.textContent;
        // Look for video URLs in the JSON
        const videoMatches = text.match(/"video_url":"([^"]+)"/g);
        if (videoMatches) {
          videoMatches.forEach(match => {
            const url = match.match(/"video_url":"([^"]+)"/)[1];
            const decodedUrl = url.replace(/\\u0026/g, '&').replace(/\\/g, '');
            if (!videoUrls.includes(decodedUrl)) {
              videoUrls.push(decodedUrl);
            }
          });
        }
      } catch (e) {}
    });
    
    // Method 2: Look in all scripts for video URLs
    const allScripts = document.querySelectorAll('script');
    allScripts.forEach(script => {
      try {
        const text = script.textContent || '';
        // Pattern for Instagram video CDN URLs
        const patterns = [
          /"src":"(https:\/\/[^"]*?\.mp4[^"]*)"/g,
          /"video_url":"([^"]+)"/g,
          /video_versions.*?"url":"([^"]+)"/g
        ];
        
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(text)) !== null) {
            let url = match[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
            if (url.includes('.mp4') && !videoUrls.includes(url)) {
              videoUrls.push(url);
            }
          }
        });
      } catch (e) {}
    });
    
    // Method 3: Check for video elements with actual src (not blob)
    const videos = document.querySelectorAll('video[src]');
    videos.forEach(video => {
      if (video.src && !video.src.startsWith('blob:')) {
        if (!videoUrls.includes(video.src)) {
          videoUrls.push(video.src);
        }
      }
    });
    
    // Method 4: Check source elements
    const sources = document.querySelectorAll('video source[src]');
    sources.forEach(source => {
      if (source.src && !source.src.startsWith('blob:')) {
        if (!videoUrls.includes(source.src)) {
          videoUrls.push(source.src);
        }
      }
    });
    
    return videoUrls;
  }
  
  // Find the main post container - look for article elements
  const articles = document.querySelectorAll('article[role="presentation"]');
  
  // If we're on a post page (URL contains /p/ or /reel/)
  const isPostPage = window.location.pathname.includes('/p/') || window.location.pathname.includes('/reel/');
  
  // Get the relevant article (first one for post pages, or the one in view)
  let targetArticle = articles[0];
  
  if (!targetArticle && isPostPage) {
    // Try to find media directly on post pages
    targetArticle = document.querySelector('main');
  }
  
  // For reels, use the whole document if no article found
  if (!targetArticle) {
    targetArticle = document.body;
  }

  // Get video URLs from page data
  const videoUrls = findVideoUrls();
  
  // Check if there's a video element visible (indicates this is a video/reel)
  const hasVideo = targetArticle.querySelector('video') !== null;
  
  // Add found video URLs
  if (hasVideo && videoUrls.length > 0) {
    // Get thumbnail from video poster or nearby image
    const videoElement = targetArticle.querySelector('video');
    const thumbnail = videoElement?.poster || '';
    
    videoUrls.forEach((url, index) => {
      if (!media.some(m => m.url === url)) {
        media.push({
          type: 'video',
          url: url,
          thumbnail: thumbnail
        });
      }
    });
  }

  // Look for images (high quality ones) - Instagram uses fbcdn.net URLs
  const images = targetArticle.querySelectorAll('img[src*="fbcdn.net"], img[src*="cdninstagram.com"], img[src*="scontent"]');
  images.forEach((img) => {
    const imgUrl = img.src;
    
    // Skip small images (profile pics, icons) and already added
    if (imgUrl && 
        !imgUrl.includes('150x150') && 
        !imgUrl.includes('44x44') &&
        !imgUrl.includes('profile') &&
        !imgUrl.includes('s150x150') &&
        (img.width > 100 || img.classList.contains('x5yr21d')) &&
        !media.some(m => m.url === imgUrl)) {
      media.push({
        type: 'image',
        url: imgUrl,
        thumbnail: imgUrl
      });
    }
  });

  // Also check for carousel images in different structure
  const carouselImages = targetArticle.querySelectorAll('div[role="button"] img[src*="fbcdn.net"], div[role="button"] img[src*="cdninstagram.com"]');
  carouselImages.forEach((img) => {
    const imgUrl = img.src;
    if (imgUrl && !imgUrl.includes('profile') && !media.some(m => m.url === imgUrl)) {
      media.push({
        type: 'image',
        url: imgUrl,
        thumbnail: imgUrl
      });
    }
  });
  
  // Fallback: look for any large images with the specific Instagram image classes
  if (media.length === 0) {
    const allImages = document.querySelectorAll('img.x5yr21d[src*="fbcdn.net"]');
    allImages.forEach((img) => {
      const imgUrl = img.src;
      if (imgUrl && !imgUrl.includes('profile') && !media.some(m => m.url === imgUrl)) {
        media.push({
          type: 'image',
          url: imgUrl,
          thumbnail: imgUrl
        });
      }
    });
  }
  
  // If still nothing found but there's a video with blob URL, indicate we found a video but can't download
  if (media.length === 0) {
    const blobVideos = document.querySelectorAll('video[src^="blob:"]');
    if (blobVideos.length > 0) {
      // Try one more time to get the URL from the shared data
      try {
        const sharedData = window._sharedData || window.__initialData;
        if (sharedData) {
          const jsonStr = JSON.stringify(sharedData);
          const videoMatch = jsonStr.match(/"video_url":"([^"]+)"/);
          if (videoMatch) {
            const url = videoMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
            media.push({
              type: 'video',
              url: url,
              thumbnail: blobVideos[0].poster || ''
            });
          }
        }
      } catch(e) {}
      
      // If still nothing, add a placeholder to indicate video was found
      if (media.length === 0) {
        media.push({
          type: 'video',
          url: 'BLOB_VIDEO',
          thumbnail: blobVideos[0].poster || '',
          isBlobOnly: true
        });
      }
    }
  }

  return media;
}
