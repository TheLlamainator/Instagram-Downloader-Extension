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
  preview.alt = `Media ${index + 1}`;
  
  // Set thumbnail with better fallback handling
  if (item.thumbnail && item.thumbnail.length > 0) {
    preview.src = item.thumbnail;
  } else if (item.type === 'image' && item.url) {
    preview.src = item.url;
  } else {
    // No thumbnail available - show gradient placeholder
    preview.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    preview.style.display = 'flex';
    preview.style.alignItems = 'center';
    preview.style.justifyContent = 'center';
  }
  
  preview.onerror = () => { 
    preview.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    preview.src = '';
  };
  
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
    btn.innerHTML = '<span>⚠️</span> Help';
    btn.title = 'Video uses blob URL - click for instructions';
    btn.classList.add('warning');
    btn.addEventListener('click', () => {
      alert('This video uses a protected stream (blob URL).\n\nTo download it:\n\n1. Scroll up so the video is fully visible\n2. Play the video/reel completely (let it load)\n3. Pause at the end\n4. Click this extension again\n\nIf it still doesn\'t work:\n• Try refreshing the page first\n• Make sure you\'re on the direct post/reel URL\n• Some videos may be DRM protected');
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
    
    // Helper to decode and clean URL
    function decodeUrl(url) {
      return url
        .replace(/\\u0026/g, '&')
        .replace(/\\u003C/g, '<')
        .replace(/\\u003E/g, '>')
        .replace(/\\\//g, '/')
        .replace(/\\/g, '');
    }
    
    // Helper to check if URL is a valid video URL
    function isValidVideoUrl(url) {
      return url && 
        (url.includes('.mp4') || url.includes('video')) &&
        (url.includes('cdninstagram.com') || url.includes('fbcdn.net') || url.includes('scontent'));
    }
    
    // Method 1: Look in script tags for video_url (application/json)
    const scripts = document.querySelectorAll('script[type="application/json"]');
    scripts.forEach(script => {
      try {
        const text = script.textContent;
        // Look for video URLs in the JSON
        const videoMatches = text.match(/"video_url":"([^"]+)"/g);
        if (videoMatches) {
          videoMatches.forEach(match => {
            const url = match.match(/"video_url":"([^"]+)"/)[1];
            const decodedUrl = decodeUrl(url);
            if (!videoUrls.includes(decodedUrl)) {
              videoUrls.push(decodedUrl);
            }
          });
        }
      } catch (e) {}
    });
    
    // Method 2: Look in all scripts for video URLs with multiple patterns
    const allScripts = document.querySelectorAll('script');
    allScripts.forEach(script => {
      try {
        const text = script.textContent || '';
        // Extended patterns for Instagram video CDN URLs
        const patterns = [
          /"src":"(https:\/\/[^"]*?\.mp4[^"]*)"/g,
          /"video_url":"([^"]+)"/g,
          /video_versions.*?"url":"([^"]+)"/g,
          /"playback_url":"([^"]+)"/g,
          /"progressive_url":"([^"]+)"/g,
          /"base_url":"([^"]+\.mp4[^"]*)"/g,
          /"url":"(https:\/\/[^"]*scontent[^"]*\.mp4[^"]*)"/g,
          /"url":"(https:\/\/[^"]*cdninstagram[^"]*\.mp4[^"]*)"/g,
          /"url":"(https:\/\/[^"]*fbcdn[^"]*\.mp4[^"]*)"/g
        ];
        
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(text)) !== null) {
            let url = decodeUrl(match[1]);
            if (isValidVideoUrl(url) && !videoUrls.includes(url)) {
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
    
    // Method 5: Check window.__additionalData for reels
    try {
      if (window.__additionalData) {
        const dataStr = JSON.stringify(window.__additionalData);
        const videoMatches = dataStr.match(/"video_url":"([^"]+)"/g);
        if (videoMatches) {
          videoMatches.forEach(match => {
            const url = match.match(/"video_url":"([^"]+)"/)[1];
            const decodedUrl = decodeUrl(url);
            if (!videoUrls.includes(decodedUrl)) {
              videoUrls.push(decodedUrl);
            }
          });
        }
      }
    } catch (e) {}
    
    // Method 6: Check for data in window._sharedData
    try {
      if (window._sharedData) {
        const dataStr = JSON.stringify(window._sharedData);
        const videoMatches = dataStr.match(/"video_url":"([^"]+)"/g);
        if (videoMatches) {
          videoMatches.forEach(match => {
            const url = match.match(/"video_url":"([^"]+)"/)[1];
            const decodedUrl = decodeUrl(url);
            if (!videoUrls.includes(decodedUrl)) {
              videoUrls.push(decodedUrl);
            }
          });
        }
      }
    } catch (e) {}
    
    // Method 7: Search in __NEXT_DATA__ for Next.js based pages
    try {
      const nextDataScript = document.getElementById('__NEXT_DATA__');
      if (nextDataScript) {
        const text = nextDataScript.textContent;
        const videoMatches = text.match(/"video_url":"([^"]+)"/g);
        if (videoMatches) {
          videoMatches.forEach(match => {
            const url = match.match(/"video_url":"([^"]+)"/)[1];
            const decodedUrl = decodeUrl(url);
            if (!videoUrls.includes(decodedUrl)) {
              videoUrls.push(decodedUrl);
            }
          });
        }
      }
    } catch (e) {}
    
    // Method 8: Check for preload links
    const preloadLinks = document.querySelectorAll('link[rel="preload"][as="video"], link[rel="preload"][href*=".mp4"]');
    preloadLinks.forEach(link => {
      if (link.href && !videoUrls.includes(link.href)) {
        videoUrls.push(link.href);
      }
    });
    
    // Method 9: Deep search in page HTML for video URLs
    try {
      const htmlContent = document.documentElement.innerHTML;
      const urlPatterns = [
        /https:\/\/[^"'\s]*?scontent[^"'\s]*?\.mp4[^"'\s]*/g,
        /https:\/\/[^"'\s]*?cdninstagram[^"'\s]*?\.mp4[^"'\s]*/g,
        /https:\/\/[^"'\s]*?fbcdn[^"'\s]*?\.mp4[^"'\s]*/g
      ];
      
      urlPatterns.forEach(pattern => {
        const matches = htmlContent.match(pattern);
        if (matches) {
          matches.forEach(url => {
            const decodedUrl = decodeUrl(url);
            if (!videoUrls.includes(decodedUrl)) {
              videoUrls.push(decodedUrl);
            }
          });
        }
      });
    } catch (e) {}
    
    return videoUrls;
  }
  
  // Helper function to check if element is visible in viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // Check if at least 50% of the element is visible
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
    const elementArea = rect.width * rect.height;
    const visibleArea = Math.max(0, visibleHeight) * Math.max(0, visibleWidth);
    
    return elementArea > 0 && (visibleArea / elementArea) > 0.3;
  }
  
  // Find the currently visible video element
  function findCurrentVideo() {
    const allVideos = document.querySelectorAll('video');
    
    // First, try to find a video that's currently playing
    for (const video of allVideos) {
      if (!video.paused && isElementInViewport(video)) {
        return video;
      }
    }
    
    // If no playing video, find the most visible one
    let bestVideo = null;
    let bestVisibility = 0;
    
    for (const video of allVideos) {
      if (isElementInViewport(video)) {
        const rect = video.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const visibility = visibleHeight / rect.height;
        
        if (visibility > bestVisibility) {
          bestVisibility = visibility;
          bestVideo = video;
        }
      }
    }
    
    return bestVideo;
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

  // Find the current visible video
  const currentVideo = findCurrentVideo();
  
  // Get video URLs from page data
  const allVideoUrls = findVideoUrls();
  
  // Check if there's a video element visible (indicates this is a video/reel)
  const hasVideo = currentVideo !== null;
  
  // Helper function to find video thumbnail
  function findVideoThumbnail(videoElement) {
    // Try poster attribute first
    if (videoElement?.poster) {
      return videoElement.poster;
    }
    
    // Try to find thumbnail from nearby image in the same container
    const container = videoElement?.closest('div[role="button"], article, div[class*="video"], section');
    if (container) {
      // Look for a large image near the video (often used as cover)
      const nearbyImg = container.querySelector('img[src*="fbcdn.net"], img[src*="cdninstagram.com"], img[src*="scontent"]');
      if (nearbyImg && nearbyImg.src && !nearbyImg.src.includes('profile') && !nearbyImg.src.includes('44x44')) {
        return nearbyImg.src;
      }
    }
    
    // Try to find thumbnail from og:image meta tag
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage?.content) {
      return ogImage.content;
    }
    
    // Try to find display_url from page data
    try {
      const scripts = document.querySelectorAll('script[type="application/json"]');
      for (const script of scripts) {
        const text = script.textContent || '';
        const displayMatch = text.match(/"display_url":"([^"]+)"/);
        if (displayMatch) {
          return displayMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
        }
        const thumbnailMatch = text.match(/"thumbnail_src":"([^"]+)"/);
        if (thumbnailMatch) {
          return thumbnailMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
        }
      }
    } catch (e) {}
    
    // Try to find any large visible image on the page as fallback
    const allImages = document.querySelectorAll('img[src*="fbcdn.net"], img[src*="cdninstagram.com"]');
    for (const img of allImages) {
      if (img.width >= 200 && img.height >= 200 && !img.src.includes('profile')) {
        return img.src;
      }
    }
    
    return '';
  }
  
  // Add only the current video URL (limit to 1)
  if (hasVideo && allVideoUrls.length > 0) {
    // Get thumbnail using multiple methods
    const thumbnail = findVideoThumbnail(currentVideo);
    
    // Only add the first/best matching video URL
    const videoUrl = allVideoUrls[0];
    if (videoUrl) {
      media.push({
        type: 'video',
        url: videoUrl,
        thumbnail: thumbnail
      });
    }
  }

  // Look for images (high quality ones) - Instagram uses fbcdn.net URLs
  const images = targetArticle.querySelectorAll('img[src*="fbcdn.net"], img[src*="cdninstagram.com"], img[src*="scontent"]');
  images.forEach((img) => {
    const imgUrl = img.src;
    
    // Skip small images (profile pics, icons) and already added
    // Minimum resolution: 121x121
    if (imgUrl && 
        !imgUrl.includes('150x150') && 
        !imgUrl.includes('44x44') &&
        !imgUrl.includes('profile') &&
        !imgUrl.includes('s150x150') &&
        img.width >= 121 &&
        img.height >= 121 &&
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
    // Skip small images under 121x121 resolution
    if (imgUrl && !imgUrl.includes('profile') && img.width >= 121 && img.height >= 121 && !media.some(m => m.url === imgUrl)) {
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
      // Skip small images under 121x121 resolution
      if (imgUrl && !imgUrl.includes('profile') && img.width >= 121 && img.height >= 121 && !media.some(m => m.url === imgUrl)) {
        media.push({
          type: 'image',
          url: imgUrl,
          thumbnail: imgUrl
        });
      }
    });
  }
  
  // If still nothing found but there's a current visible video with blob URL, try harder to find the actual URL
  if (media.length === 0 && currentVideo && currentVideo.src && currentVideo.src.startsWith('blob:')) {
    const thumbnail = findVideoThumbnail(currentVideo);
    
    // Try multiple data sources for the video URL (only get first match for current video)
    const dataSources = [
      window._sharedData,
      window.__initialData,
      window.__additionalData,
      window.__PRELOADED_QUERIES__
    ];
    
    for (const dataSource of dataSources) {
      if (media.length > 0) break;
      try {
        if (dataSource) {
          const jsonStr = JSON.stringify(dataSource);
          const videoMatch = jsonStr.match(/"video_url":"([^"]+)"/);
          if (videoMatch) {
            const url = videoMatch[1]
              .replace(/\\u0026/g, '&')
              .replace(/\\/g, '');
            media.push({
              type: 'video',
              url: url,
              thumbnail: thumbnail
            });
            break; // Only get the first video URL for the current video
          }
        }
      } catch(e) {}
    }
    
    // Try to extract from meta tags (og:video)
    if (media.length === 0) {
      try {
        const ogVideo = document.querySelector('meta[property="og:video"]');
        const ogVideoUrl = document.querySelector('meta[property="og:video:url"]');
        const ogVideoSecure = document.querySelector('meta[property="og:video:secure_url"]');
        
        const videoUrl = ogVideoSecure?.content || ogVideoUrl?.content || ogVideo?.content;
        if (videoUrl && !videoUrl.startsWith('blob:')) {
          media.push({
            type: 'video',
            url: videoUrl,
            thumbnail: thumbnail
          });
        }
      } catch(e) {}
    }
    
    // Try to get from data attributes on video element
    if (media.length === 0) {
      try {
        const parent = currentVideo.closest('[data-video-url]');
        if (parent) {
          const url = parent.getAttribute('data-video-url');
          if (url) {
            media.push({
              type: 'video',
              url: url,
              thumbnail: thumbnail
            });
          }
        }
      } catch(e) {}
    }
    
    // If still nothing, add a placeholder to indicate video was found but needs user action
    if (media.length === 0) {
      media.push({
        type: 'video',
        url: 'BLOB_VIDEO',
        thumbnail: thumbnail,
        isBlobOnly: true
      });
    }
  }

  return media;
}
