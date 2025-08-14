/**
 * Environment Configuration Utility
 * Handles environment variables for the JavaScript Playground
 */

// Environment variables (fallback to hardcoded values if env vars not available)
export const ENV = {
    // Google Analytics Configuration
    GA_MEASUREMENT_ID: import.meta.env?.VITE_GA_MEASUREMENT_ID,

    // Domain Configuration
    DOMAIN: import.meta.env?.VITE_DOMAIN,

    // Analytics Configuration
    ANALYTICS_ENABLED: import.meta.env?.VITE_ANALYTICS_ENABLED !== 'false',
    PRIVACY_MODE: import.meta.env?.VITE_PRIVACY_MODE === 'true',
    DEBUG_ANALYTICS: import.meta.env?.VITE_DEBUG_ANALYTICS === 'true',

    // Social Media Configuration
    TWITTER_HANDLE: import.meta.env?.VITE_TWITTER_HANDLE,

    // Development vs Production
    IS_DEVELOPMENT: import.meta.env?.MODE === 'development',
    IS_PRODUCTION: import.meta.env?.MODE === 'production'
};

// Validation function to ensure required environment variables are set
function validateEnvironment() {
    const requiredVars = [
        { key: 'GA_MEASUREMENT_ID', value: ENV.GA_MEASUREMENT_ID },
        { key: 'DOMAIN', value: ENV.DOMAIN },
        { key: 'TWITTER_HANDLE', value: ENV.TWITTER_HANDLE }
    ];

    const missingVars = requiredVars.filter(({ value }) => !value);
    if (missingVars.length > 0) {
        const missing = missingVars.map(({ key }) => `VITE_${key}`).join(', ');
        return false;
    }

    return true;
}

export const isEnvironmentValid = validateEnvironment;

// Utility functions
export function getGAMeasurementId() {
    return ENV.GA_MEASUREMENT_ID;
}

export function getTwitterHandle() {
    return ENV.TWITTER_HANDLE;
}

export function getDomain() {
    return ENV.DOMAIN;
}

export function isAnalyticsEnabled() {
    return ENV.ANALYTICS_ENABLED;
}

export function isPrivacyMode() {
    return ENV.PRIVACY_MODE;
}

export function isDebugMode() {
    return ENV.DEBUG_ANALYTICS || ENV.IS_DEVELOPMENT;
}

// Log environment configuration in development
if (ENV.IS_DEVELOPMENT || ENV.DEBUG_ANALYTICS) {
    console.log(' Environment Configuration:', ENV);
}