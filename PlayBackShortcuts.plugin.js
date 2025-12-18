/**
 * @name PlayBackShortcuts
 * @description Adds hotkeys for playback control. S (-speed), D (+speed), Z (-5s), X (+5s), N (next episode - works anytime).
 * @updateUrl https://raw.githubusercontent.com/REVENGE977/PlayBackShortcuts/main/PlayBackShortcuts.plugin.js
 * @version 1.4.0
 * @author REVENGE977 (Modified for Stremio Enhanced)
 */

(function() {
  "use strict";

  let video = null;
  let keyHandlerAttached = false;

  // Available playback rates (matching common Stremio rates)
  const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  function getCurrentRateIndex() {
    if (!video) return PLAYBACK_RATES.indexOf(1.0);

    // Find the closest rate to current playback rate
    const currentRate = video.playbackRate;
    let closestIndex = 0;
    let minDiff = Math.abs(PLAYBACK_RATES[0] - currentRate);

    for (let i = 1; i < PLAYBACK_RATES.length; i++) {
      const diff = Math.abs(PLAYBACK_RATES[i] - currentRate);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  function changePlaybackSpeed(direction) {
    if (!video) {
      console.warn("[PlayBackShortcuts] No video element found");
      return;
    }

    const currentIndex = getCurrentRateIndex();
    let newIndex;

    if (direction === "increase") {
      // Increase speed (move right in array)
      newIndex = Math.min(currentIndex + 1, PLAYBACK_RATES.length - 1);
    } else {
      // Decrease speed (move left in array)
      newIndex = Math.max(currentIndex - 1, 0);
    }

    const newRate = PLAYBACK_RATES[newIndex];

    if (newRate !== video.playbackRate) {
      video.playbackRate = newRate;
      console.log(`[PlayBackShortcuts] ${direction === "increase" ? "Increasing" : "Decreasing"} playback speed to ${newRate}x`);

      // Show notification to user
      showSpeedNotification(newRate);
    }
  }

  function showSpeedNotification(rate) {
    // Remove existing notification if any
    const existing = document.getElementById("playback-speed-notification");
    if (existing) existing.remove();

    // Create notification element
    const notification = document.createElement("div");
    notification.id = "playback-speed-notification";
    notification.textContent = `Speed: ${rate}x`;

    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "12px 24px",
      background: "rgba(15, 13, 32, 0.95)",
      color: "#fff",
      borderRadius: "8px",
      fontSize: "18px",
      fontWeight: "bold",
      zIndex: 10000,
      pointerEvents: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      animation: "fadeInOut 1.5s ease-in-out"
    });

    // Add fade animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after animation
    setTimeout(() => {
      notification.remove();
    }, 1500);
  }

  function skipTime(seconds) {
    if (!video) {
      console.warn("[PlayBackShortcuts] No video element found");
      return;
    }

    const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    video.currentTime = newTime;
    console.log(`[PlayBackShortcuts] Skipping ${seconds > 0 ? "forward" : "backward"} ${Math.abs(seconds)}s to ${newTime.toFixed(2)}s`);
    showSkipNotification(seconds);
  }

  async function getPlayerState() {
    let state = null;
    while (!state?.metaItem?.content) {
      state = await _eval("window.services.core.transport.getState('player')");
      if (!state?.metaItem?.content) {
        await new Promise(r => setTimeout(r, 300));
      }
    }
    return { seriesInfo: state.seriesInfo, meta: state.metaItem.content };
  }

  async function nextEpisode() {
    console.log("[PlayBackShortcuts] Attempting to skip to next episode");

    try {
      // Search for ALL clickable elements (not just buttons)
      const clickableSelectors = [
        'button', 'a', 'div[role="button"]',
        '[onclick]', '[class*="button"]', '[class*="control"]',
        '[class*="next"]', '[data-action]'
      ];

      const allClickable = document.querySelectorAll(clickableSelectors.join(', '));
      console.log(`[PlayBackShortcuts] Found ${allClickable.length} clickable elements`);

      // Log details of first 30 elements
      let count = 0;
      for (const el of allClickable) {
        const className = (el.className || '').toString();
        const title = el.getAttribute('title') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const role = el.getAttribute('role') || '';
        const dataAction = el.getAttribute('data-action') || '';
        const innerHTML = (el.innerHTML || '').substring(0, 150);
        const tagName = el.tagName.toLowerCase();

        if (count++ < 30) {
          console.log(`[PlayBackShortcuts] Element ${count} (${tagName}):`, {
            class: className.substring(0, 100),
            title,
            ariaLabel,
            role,
            dataAction,
            innerHTML
          });
        }

        // Check if this element is the "next" button
        const searchText = `${className} ${title} ${ariaLabel} ${role} ${dataAction} ${innerHTML}`.toLowerCase();

        if (searchText.includes('next') &&
            (searchText.includes('video') || searchText.includes('episode') || searchText.includes('track'))) {
          console.log(`[PlayBackShortcuts] Found potential next button at element ${count}:`, {
            tagName, className, title, ariaLabel
          });
          el.click();
          showNextEpisodeNotification("Next Episode");
          return;
        }
      }

      // If still not found, look for common control bar patterns
      const controlBars = document.querySelectorAll('[class*="control"]');
      console.log(`[PlayBackShortcuts] Found ${controlBars.length} control bar elements`);

      for (const bar of controlBars) {
        console.log("[PlayBackShortcuts] Control bar class:", bar.className);
        const children = bar.querySelectorAll('*');
        console.log(`[PlayBackShortcuts] Control bar has ${children.length} children`);

        for (let i = 0; i < Math.min(20, children.length); i++) {
          const child = children[i];
          console.log(`[PlayBackShortcuts] Control child ${i+1}:`, {
            tag: child.tagName,
            class: child.className,
            title: child.getAttribute('title')
          });
        }
      }

      console.warn("[PlayBackShortcuts] Next episode button not found after all strategies");
      showDebugNotification("Next button not found!");

    } catch (err) {
      console.error("[PlayBackShortcuts] Error navigating to next episode:", err);
      showDebugNotification("Error: " + err.message);
    }
  }


  function showDebugNotification(message) {
    const existing = document.getElementById("playback-debug-notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.id = "playback-debug-notification";
    notification.textContent = message;

    Object.assign(notification.style, {
      position: "fixed",
      top: "60px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "8px 16px",
      background: "rgba(255, 100, 0, 0.95)",
      color: "#fff",
      borderRadius: "6px",
      fontSize: "14px",
      zIndex: 10000,
      pointerEvents: "none",
      maxWidth: "80%",
      wordWrap: "break-word"
    });

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  function _eval(js) {
    return new Promise((resolve) => {
      const event = "playback-shortcuts-eval";
      const script = document.createElement("script");
      window.addEventListener(event, (e) => {
        script.remove();
        resolve(e.detail);
      }, { once: true });
      script.textContent = `
        (async () => {
          try {
            const res = ${js};
            if (res instanceof Promise) res.then(r => window.dispatchEvent(new CustomEvent('${event}', { detail: r })));
            else window.dispatchEvent(new CustomEvent('${event}', { detail: res }));
          } catch (err) {
            console.error(err);
            window.dispatchEvent(new CustomEvent('${event}', { detail: null }));
          }
        })();`;
      document.head.appendChild(script);
    });
  }

  function showNextEpisodeNotification(episodeInfo = "") {
    // Remove existing notification if any
    const existing = document.getElementById("playback-next-notification");
    if (existing) existing.remove();

    // Create notification element
    const notification = document.createElement("div");
    notification.id = "playback-next-notification";
    notification.textContent = episodeInfo ? `Next Episode: ${episodeInfo}` : "Next Episode";

    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "12px 24px",
      background: "rgba(15, 13, 32, 0.95)",
      color: "#fff",
      borderRadius: "8px",
      fontSize: "18px",
      fontWeight: "bold",
      zIndex: 10000,
      pointerEvents: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      animation: "fadeInOut 1.5s ease-in-out"
    });

    document.body.appendChild(notification);

    // Remove after animation
    setTimeout(() => {
      notification.remove();
    }, 1500);
  }

  function showSkipNotification(seconds) {
    // Remove existing notification if any
    const existing = document.getElementById("playback-skip-notification");
    if (existing) existing.remove();

    // Create notification element
    const notification = document.createElement("div");
    notification.id = "playback-skip-notification";
    notification.textContent = `${seconds > 0 ? "+" : ""}${seconds}s`;

    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "12px 24px",
      background: "rgba(15, 13, 32, 0.95)",
      color: "#fff",
      borderRadius: "8px",
      fontSize: "18px",
      fontWeight: "bold",
      zIndex: 10000,
      pointerEvents: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      animation: "fadeInOut 1.5s ease-in-out"
    });

    document.body.appendChild(notification);

    // Remove after animation
    setTimeout(() => {
      notification.remove();
    }, 1500);
  }

  function attachKeyboardHandler() {
    if (keyHandlerAttached) return;

    document.addEventListener("keydown", (e) => {
      // Ignore if user is typing in an input field
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
        return;
      }

      // 'd' key - increase speed
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        changePlaybackSpeed("increase");
      }
      // 's' key - decrease speed (override subtitle menu)
      else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        e.stopPropagation();
        changePlaybackSpeed("decrease");
      }
      // 'x' key - skip forward 5 seconds
      else if (e.key === "x" || e.key === "X") {
        e.preventDefault();
        e.stopPropagation();
        skipTime(5);
      }
      // 'z' key - skip backward 5 seconds
      else if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        e.stopPropagation();
        skipTime(-5);
      }
      // 'n' key - next episode
      else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        e.stopPropagation();
        nextEpisode();
      }
    }, true); // Use capture phase to intercept before other handlers

    keyHandlerAttached = true;
    console.log("[PlayBackShortcuts] Keyboard shortcuts initialized (S: -speed, D: +speed, Z: -5s, X: +5s, N: next episode - works anytime)");
  }

  function attachVideoListener() {
    const newVideo = document.querySelector("video");
    if (!newVideo || newVideo === video) return;

    video = newVideo;
    console.log("[PlayBackShortcuts] Video element detected");

    // Ensure keyboard handler is attached
    attachKeyboardHandler();
  }

  // Use MutationObserver to watch for video elements
  const observer = new MutationObserver(() => {
    attachVideoListener();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also attach keyboard handler immediately in case video already exists
  attachKeyboardHandler();

  console.log("[PlayBackShortcuts] Plugin loaded successfully");
})();
