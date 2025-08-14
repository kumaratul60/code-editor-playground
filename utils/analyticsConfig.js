import {
    getGAMeasurementId,
    getDomain,
    getTwitterHandle,
    isAnalyticsEnabled,
    isPrivacyMode,
    isDebugMode,
    isEnvironmentValid
} from './env.js';


export const analyticsConfig = {
    // Google Analytics 4 Configuration
    googleAnalytics: {
        enabled: isAnalyticsEnabled(),
        measurementId: getGAMeasurementId(),
        config: {
            page_title: 'JavaScript Playground',
            send_page_view: true,
            custom_map: {
                'custom_parameter_1': 'editor_usage'
            }
        }
    },

    // Plausible Analytics (Privacy-focused alternative)
    plausible: {
        enabled: false, // Can be enabled via environment variable if needed
        domain: getDomain() ? getDomain().replace('https://', '') : null,
        apiHost: 'https://plausible.io'
    },

    // Simple Analytics (GDPR-ompliant)
    simpleAnalytics: {
        enabled: false, // Can be enabled via environment variable if needed
        hostname: 'scripts.simpleanalyticscdn.com'
    },

    // Custom Analytics Endpoint
    customAnalytics: {
        enabled: false,
        endpoint: '/api/analytics',
        batchEndpoint: '/api/analytics/batch',
        apiKey: import.meta.env?.VITE_CUSTOM_ANALYTICS_API_KEY
    },

    // Privacy Settings
    privacy: {
        respectDoNotTrack: true,
        anonymizeIp: true,
        cookieConsent: false,
        privacyMode: isPrivacyMode()
    },

    // Feature Tracking Settings
    tracking: {
        codeExecution: true,
        featureUsage: true,
        errorTracking: true,
        performanceMetrics: true,
        userEngagement: true,
        sessionMetrics: true
    },

    // Debug Settings
    debug: {
        enabled: isDebugMode(),
        logEvents: isDebugMode(),
        showAnalyticsData: isDebugMode()
    }
};

// SEO Configuration using environment variables
export const seoConfig = {
    // Basic SEO
    title: 'JavaScript Playground - Advanced Online Code Editor | Run JS Code Instantly',
    description: 'Professional JavaScript Playground with advanced DevInsights, real-time code analysis, syntax highlighting, and instant execution. Perfect for developers, students, and coding interviews.',
    keywords: 'javascript playground, online code editor, js editor, code runner, javascript compiler, web development, coding tool, syntax highlighting, devtools',
    author: 'JavaScript Playground',

    // Open Graph / Social Media
    openGraph: {
        type: 'website',
        siteName: 'JavaScript Playground',
        image: getDomain() ? `${getDomain()}/favicon.png` : '/favicon.png',
        imageAlt: 'JavaScript Playground - Advanced Code Editor'
    },

    // Twitter Card
    twitter: {
        card: 'summary_large_image',
        site: getTwitterHandle(),
        creator: getTwitterHandle()
    },

    // Structured Data
    structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'JavaScript Playground',
        url: getDomain(),
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web Browser',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
        },
        featureList: [
            'Real-time syntax highlighting',
            'Advanced DevInsights panel',
            'Code execution and analysis',
            'Performance metrics',
            'Memory tracking',
            'Error detection'
        ]
    }
};

// Analytics Provider Setup Functions
export function setupGoogleAnalytics() {
    if (!analyticsConfig.googleAnalytics.enabled) {
        return;
    }

    const measurementId = analyticsConfig.googleAnalytics.measurementId;

    if (!measurementId) {
        return;
    }

    if (analyticsConfig.debug.enabled) {
        console.log('📊 Setting up Google Analytics:', measurementId);
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', measurementId, analyticsConfig.googleAnalytics.config);

    window.gtag = gtag;
}

export function setupPlausible() {
    if (!analyticsConfig.plausible.enabled || !analyticsConfig.plausible.domain) {
        return;
    }

    const script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-domain', analyticsConfig.plausible.domain);
    script.src = `${analyticsConfig.plausible.apiHost}/js/plausible.js`;
    document.head.appendChild(script);
}

export function setupSimpleAnalytics() {
    if (!analyticsConfig.simpleAnalytics.enabled) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://${analyticsConfig.simpleAnalytics.hostname}/latest.js`;
    document.head.appendChild(script);
}

// Privacy Compliance Functions
export function checkDoNotTrack() {
    if (analyticsConfig.privacy.respectDoNotTrack) {
        return navigator.doNotTrack === '1' ||
            window.doNotTrack === '1' ||
            navigator.msDoNotTrack === '1';
    }
    return false;
}

export function showCookieConsent() {
    if (!analyticsConfig.privacy.cookieConsent) return;

    if (!localStorage.getItem('cookieConsent')) {
        const banner = document.createElement('div');
        banner.innerHTML = `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #333; color: white; padding: 1rem; z-index: 10000;">
                <p>This site uses cookies to improve your experience. 
                <button onclick="acceptCookies()" style="margin-left: 1rem; padding: 0.5rem 1rem; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">Accept</button>
                <button onclick="declineCookies()" style="margin-left: 0.5rem; padding: 0.5rem 1rem; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Decline</button>
                </p>
            </div>
        `;
        document.body.appendChild(banner);

        window.acceptCookies = () => {
            localStorage.setItem('cookieConsent', 'accepted');
            banner.remove();
            initializeAnalytics();
        };

        window.declineCookies = () => {
            localStorage.setItem('cookieConsent', 'declined');
            banner.remove();
            if (window.playgroundAnalytics) {
                window.playgroundAnalytics.enablePrivacyMode();
            }
        };
    }
}

// Initialize all analytics providers
export function initializeAnalytics() {
    // Check environment validation first
    if (!isEnvironmentValid) {
        return;
    }

    // Check privacy settings
    if (checkDoNotTrack()) {
        return;
    }

    const consent = localStorage.getItem('cookieConsent');
    if (analyticsConfig.privacy.cookieConsent && consent !== 'accepted') {
        showCookieConsent();
        return;
    }

    // Setup enabled providers
    setupGoogleAnalytics();
    setupPlausible();
    setupSimpleAnalytics();

    // Enable privacy mode if configured
    if (analyticsConfig.privacy.privacyMode && window.playgroundAnalytics) {
        window.playgroundAnalytics.enablePrivacyMode();
    }
}