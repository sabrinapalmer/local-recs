/**
 * Google Consent Mode v2 Implementation
 * GDPR/CCPA compliant consent management for AdSense
 */

// Initialize Google Consent Mode before any other scripts
window.dataLayer = window.dataLayer || [];
function gtag() {
    dataLayer.push(arguments);
}

// Set default consent state to 'denied' (GDPR requirement)
gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'wait_for_update': 500
});

/**
 * Consent Management Platform
 */
const ConsentManager = {
    COOKIE_NAME: 'consent_preferences',
    COOKIE_EXPIRY_DAYS: 365,
    
    /**
     * Check if user has already given consent
     */
    hasConsent() {
        return this.getCookie(this.COOKIE_NAME) !== null;
    },
    
    /**
     * Get consent preferences from cookie
     */
    getConsentPreferences() {
        const cookie = this.getCookie(this.COOKIE_NAME);
        if (cookie) {
            try {
                return JSON.parse(decodeURIComponent(cookie));
            } catch (e) {
                return null;
            }
        }
        return null;
    },
    
    /**
     * Save consent preferences
     */
    saveConsentPreferences(preferences) {
        const expiryDate = new Date();
        expiryDate.setTime(expiryDate.getTime() + (this.COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
        const cookieValue = encodeURIComponent(JSON.stringify(preferences));
        document.cookie = `${this.COOKIE_NAME}=${cookieValue};expires=${expiryDate.toUTCString()};path=/;SameSite=Lax`;
        
        // Update Google Consent Mode
        this.updateConsentMode(preferences);
    },
    
    /**
     * Update Google Consent Mode based on user preferences
     */
    updateConsentMode(preferences) {
        const consent = preferences.consent === true ? 'granted' : 'denied';
        
        gtag('consent', 'update', {
            'ad_storage': consent,
            'ad_user_data': consent,
            'ad_personalization': consent,
            'analytics_storage': consent
        });
        
        // If consent granted, reload ads
        if (consent === 'granted') {
            // Trigger ad initialization
            if (typeof initializeAds === 'function') {
                initializeAds();
            }
        }
    },
    
    /**
     * Get cookie value
     */
    getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },
    
    /**
     * Show consent banner
     */
    showBanner() {
        const banner = document.getElementById('consentBanner');
        if (banner) {
            banner.style.display = 'block';
            // Add animation
            setTimeout(() => {
                banner.classList.add('show');
            }, 10);
        }
    },
    
    /**
     * Hide consent banner
     */
    hideBanner() {
        const banner = document.getElementById('consentBanner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.style.display = 'none';
            }, 300);
        }
    },
    
    /**
     * Handle consent acceptance
     */
    acceptConsent() {
        const preferences = {
            consent: true,
            timestamp: new Date().toISOString()
        };
        this.saveConsentPreferences(preferences);
        this.hideBanner();
    },
    
    /**
     * Handle consent rejection
     */
    rejectConsent() {
        const preferences = {
            consent: false,
            timestamp: new Date().toISOString()
        };
        this.saveConsentPreferences(preferences);
        this.hideBanner();
    },
    
    /**
     * Show manage options modal
     */
    showManageOptions() {
        const modal = document.getElementById('consentModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        }
    },
    
    /**
     * Hide manage options modal
     */
    hideManageOptions() {
        const modal = document.getElementById('consentModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    },
    
    /**
     * Initialize consent management
     */
    init() {
        // Check if user is in EEA, UK, or Switzerland (simplified check)
        // In production, you might want to use a geolocation service
        const preferences = this.getConsentPreferences();
        
        if (!preferences) {
            // Show banner if no consent given
            this.showBanner();
        } else {
            // Update consent mode with saved preferences
            this.updateConsentMode(preferences);
        }
        
        // Set up event listeners
        this.setupEventListeners();
    },
    
    /**
     * Setup event listeners for consent buttons
     */
    setupEventListeners() {
        // Accept button
        const acceptBtn = document.getElementById('consentAccept');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => this.acceptConsent());
        }
        
        // Reject button
        const rejectBtn = document.getElementById('consentReject');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => this.rejectConsent());
        }
        
        // Manage options button
        const manageBtn = document.getElementById('consentManage');
        if (manageBtn) {
            manageBtn.addEventListener('click', () => this.showManageOptions());
        }
        
        // Close modal button
        const closeModal = document.getElementById('consentModalClose');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideManageOptions());
        }
        
        // Save preferences in modal
        const saveBtn = document.getElementById('consentSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const consent = document.getElementById('consentCheckbox').checked;
                const preferences = {
                    consent: consent,
                    timestamp: new Date().toISOString()
                };
                this.saveConsentPreferences(preferences);
                this.hideManageOptions();
                this.hideBanner();
            });
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ConsentManager.init();
    });
} else {
    ConsentManager.init();
}

