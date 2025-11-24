/**
 * Ad Configuration
 * Replace the placeholder values with your actual Google AdSense information
 */

const AD_CONFIG = {
    // Your Google AdSense Publisher ID (starts with ca-pub-)
    PUBLISHER_ID: 'ca-pub-1825149073731971',
    
    // Ad Slot IDs from AdSense account
    LEFT_AD_SLOT: '1125853752',
    RIGHT_AD_SLOT: '8812772081',
    
    // Ad dimensions
    AD_WIDTH: 160,
    AD_HEIGHT: 600,
    
    // Enable/disable ads
    ENABLED: true,
    
    // Check if ads are properly configured
    isConfigured() {
        return this.ENABLED && 
               this.PUBLISHER_ID && 
               !this.PUBLISHER_ID.includes('YOUR_PUBLISHER_ID') &&
               this.LEFT_AD_SLOT && 
               !this.LEFT_AD_SLOT.includes('YOUR') &&
               this.RIGHT_AD_SLOT && 
               !this.RIGHT_AD_SLOT.includes('YOUR');
    }
};

/**
 * Hide placeholder when ad loads
 */
function hidePlaceholder(adElement) {
    const placeholder = adElement.nextElementSibling;
    if (placeholder && placeholder.classList.contains('ad-placeholder')) {
        placeholder.style.display = 'none';
    }
}

/**
 * Monitor ad loading status
 */
function monitorAdLoading() {
    const adElements = document.querySelectorAll('.adsbygoogle');
    adElements.forEach((adElement) => {
        // Check if ad has loaded
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'data-adsbygoogle-status') {
                    const status = adElement.getAttribute('data-adsbygoogle-status');
                    if (status === 'done' || status === 'filled') {
                        hidePlaceholder(adElement);
                        observer.disconnect();
                    }
                }
            });
        });
        
        observer.observe(adElement, {
            attributes: true,
            attributeFilter: ['data-adsbygoogle-status']
        });
        
        // Also check immediately
        const status = adElement.getAttribute('data-adsbygoogle-status');
        if (status === 'done' || status === 'filled') {
            hidePlaceholder(adElement);
        }
    });
}

/**
 * Update AdSense script src with publisher ID (no longer needed - script is in HTML)
 */
function updateAdSenseScript() {
    // Script is now loaded directly in HTML with publisher ID
    // This function kept for backwards compatibility but does nothing
}

/**
 * Initialize ads after page load
 */
function initializeAds() {
    if (!AD_CONFIG.ENABLED) {
        console.log('Ads are disabled');
        // Hide placeholders if ads are disabled
        document.querySelectorAll('.ad-placeholder').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('.ad-frame').forEach(el => {
            el.style.display = 'none';
        });
        return;
    }
    
    // Update AdSense script src if configured
    updateAdSenseScript();
    
    // Check if ads are properly configured
    if (!AD_CONFIG.isConfigured()) {
        console.log('AdSense not fully configured. Showing demo placeholders.');
        console.log('To enable real ads, update ads-config.js with your AdSense Publisher ID and Slot IDs.');
        // Show placeholders since ads aren't configured
        showDemoAds();
        return;
    }
    
    // Wait for AdSense script to load
    async function tryInitialize() {
        if (typeof adsbygoogle === 'undefined') {
            console.log('Waiting for AdSense script to load...');
            setTimeout(tryInitialize, 500);
            return;
        }
        
        // Push ads to AdSense
        try {
            // Determine if we should show two ads (tall screen) or one ad
            const screenHeight = window.innerHeight;
            const showTwoAds = screenHeight >= 1200;
            
            // Get visible ad elements based on screen height
            // IMPORTANT: Show/hide units BEFORE getting elements to ensure they have width
            let adElements;
            if (showTwoAds) {
                // Show top and bottom ads, hide single ad
                document.querySelectorAll('.ad-unit-single').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.ad-unit-top, .ad-unit-bottom').forEach(el => el.style.display = 'flex');
                // Wait a moment for display to take effect so ads have width
                await new Promise(resolve => setTimeout(resolve, 100));
                adElements = document.querySelectorAll('.ad-unit-top .adsbygoogle, .ad-unit-bottom .adsbygoogle');
            } else {
                // Show single ad, hide top and bottom ads
                document.querySelectorAll('.ad-unit-top, .ad-unit-bottom').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.ad-unit-single').forEach(el => el.style.display = 'flex');
                // Wait a moment for display to take effect so ads have width
                await new Promise(resolve => setTimeout(resolve, 100));
                adElements = document.querySelectorAll('.ad-unit-single .adsbygoogle');
            }
            
            if (adElements.length === 0) {
                console.warn('No ad elements found');
                return;
            }
            
            adElements.forEach((element) => {
                // Check if ad is already initialized
                const status = element.getAttribute('data-adsbygoogle-status');
                if (status === 'done' || status === 'filled' || status === 'unfilled') {
                    return; // Already initialized
                }
                
                // Skip if element is not visible (has no width)
                if (element.offsetWidth === 0) {
                    console.warn('Skipping ad element with no width');
                    return;
                }
                
            // Ad client and slot are already set in HTML, just verify they're correct
            // Only set if not already present (they should be set in HTML)
            if (!element.getAttribute('data-ad-client')) {
                element.setAttribute('data-ad-client', AD_CONFIG.PUBLISHER_ID);
            }
            
            const isLeftAd = element.closest('.ad-left');
            const slotId = isLeftAd ? AD_CONFIG.LEFT_AD_SLOT : AD_CONFIG.RIGHT_AD_SLOT;
            if (!element.getAttribute('data-ad-slot')) {
                element.setAttribute('data-ad-slot', slotId);
            }
            
            // Add non-personalized ads parameter if consent not granted
            // This ensures non-personalized ads show before consent or if consent denied
            const consentManager = window.ConsentManager;
            if (consentManager) {
                const preferences = consentManager.getConsentPreferences();
                if (!preferences || preferences.consent !== true) {
                    // Show non-personalized ads
                    element.setAttribute('data-npa', '1');
                } else {
                    // Remove npa attribute for personalized ads
                    element.removeAttribute('data-npa');
                }
            } else {
                // Default to non-personalized if consent manager not ready
                element.setAttribute('data-npa', '1');
            }
                
                // Only push if not already pushed
                if (!element.hasAttribute('data-adsbygoogle-status')) {
                    try {
                        (adsbygoogle = window.adsbygoogle || []).push({});
                        console.log(`Initializing ${isLeftAd ? 'left' : 'right'} ad (${showTwoAds ? 'two ads' : 'single ad'}) with slot: ${slotId}`);
                    } catch (error) {
                        console.warn('Error pushing ad:', error);
                    }
                }
            });
            
            // Start monitoring ad loading
            monitorAdLoading();
            
            console.log('AdSense ads initialization complete. Ads should appear shortly.');
        } catch (error) {
            console.error('Error initializing ads:', error);
        }
    }
    
    // Start trying to initialize
    tryInitialize();
}

/**
 * Show demo/placeholder ads when AdSense is not configured
 */
function showDemoAds() {
    // Always show single ad unit for demo
    document.querySelectorAll('.ad-unit-top, .ad-unit-bottom').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.ad-unit-single').forEach(el => el.style.display = 'flex');
    
    const placeholders = document.querySelectorAll('.ad-placeholder');
    placeholders.forEach(placeholder => {
        placeholder.style.display = 'block';
        // Use full window height with minimal margins - closer to edges
        const margin = 5; // 5px margin on all sides (reduced from 20px)
        const adHeight = `calc(100vh - ${margin * 2}px)`;
        placeholder.innerHTML = `
            <div style="width: calc(100% - ${margin * 2}px); max-width: calc(60px - ${margin * 2}px); 
                        height: ${adHeight}; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        border-radius: 4px; display: flex; flex-direction: column; 
                        align-items: center; justify-content: center; 
                        color: white; font-size: 10px; text-align: center; 
                        padding: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        margin: ${margin}px auto;">
                <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 11px;">Ad</p>
                <p style="margin: 0; font-size: 9px; opacity: 0.9; line-height: 1.3;">
                    Demo<br/>Space
                </p>
                <p style="margin: 8px 0 0 0; font-size: 8px; opacity: 0.7; line-height: 1.2;">
                    Configure<br/>AdSense
                </p>
            </div>
        `;
    });
}

// Initialize ads when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeAds, 500);
    });
} else {
    setTimeout(initializeAds, 500);
}

// Also try after a longer delay in case AdSense script loads later
setTimeout(initializeAds, 2000);

