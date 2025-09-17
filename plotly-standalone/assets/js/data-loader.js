/**
 * Data loading utilities
 */

/**
 * Attempt to get a directory listing from a URL
 * @param {string} url - Directory URL to fetch
 * @returns {Promise<string[]>} Array of filenames
 */
export async function getDirectoryListing(url) {
    try {
    const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + 'v=' + new Date().getTime();
    const res = await fetch(cacheBustedUrl);
        if (!res.ok) throw new Error('dir list');
        const text = await res.text();
        const matches = [...text.matchAll(/href=\"([^\"]+\.json)\"/g)];
        return matches.map(m => m[1]);
    } catch(e) {
        console.warn(`Directory listing failed for ${url}`, e);
        return [];
    }
}

/**
 * Load initial plots for a tab
 * @param {string} tabId - Tab ID
 * @param {Function} fetchAndRender - Function to fetch and render a plot
 */
export function loadInitialPlotsForTab(tabId, fetchAndRender) {
    const panel = document.getElementById(tabId);
    if (!panel) return;

    console.log(`Loading initial plots for ${tabId}`);
    // Find buttons marked as primary to load their graphs by default
    const defaultButtons = panel.querySelectorAll('.mv-btn--primary[data-target][data-src]');
    defaultButtons.forEach(btn => {
        fetchAndRender(btn.getAttribute('data-target'), btn.getAttribute('data-src'));
    });
}
