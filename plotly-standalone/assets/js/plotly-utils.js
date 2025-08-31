/**
 * Plotly visualization utilities
 */

/**
 * Create a fullscreen button for Plotly's modebar
 * @returns {Object} Button configuration for Plotly
 */
export function buildFullscreenButton() {
    return {
        name: 'Fullscreen',
        title: 'Basculer en plein écran',
        icon: {
            width: 857.1,
            height: 857.1,
            path: 'M0 214.3V0h214.3v61.9H61.9v152.4H0zm0 642.8V642.8h61.9v152.4H214.3v61.9H0zM642.8 0h214.3v214.3h-61.9V61.9H642.8V0zm152.4 642.8h61.9v214.3H642.8v-61.9h152.4V642.8z'
        },
        click: (gd) => {
            const el = gd;
            if (!document.fullscreenElement) {
                (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen || el.mozRequestFullScreen).call(el);
            } else {
                (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen || document.mozCancelFullScreen).call(document);
            }
            setTimeout(() => window.Plotly.Plots.resize(gd), 300);
        }
    };
}

/**
 * Create a fullscreen button for Plotly's modebar that also tries to lock orientation.
 * This is intended for mobile devices.
 * @returns {Object} Button configuration for Plotly
 */
function buildSmartFullscreenButton() {
    return {
        name: 'Fullscreen',
        title: 'Plein écran et paysage',
        icon: {
            width: 857.1,
            height: 857.1,
            path: 'M0 214.3V0h214.3v61.9H61.9v152.4H0zm0 642.8V642.8h61.9v152.4H214.3v61.9H0zM642.8 0h214.3v214.3h-61.9V61.9H642.8V0zm152.4 642.8h61.9v214.3H642.8v-61.9h152.4V642.8z'
        },
        click: async (gd) => {
            const el = gd; // The graph div
            if (!document.fullscreenElement) {
                try {
                    // Use the same fullscreen logic as the desktop version for better compatibility
                    (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen || el.mozRequestFullScreen).call(el);
                    
                    // Try to lock orientation after a brief delay to ensure fullscreen is active
                    setTimeout(async () => {
                        if (screen.orientation && screen.orientation.lock) {
                            try {
                                await screen.orientation.lock('landscape');
                                console.log("Orientation verrouillée en paysage");
                            } catch (err) {
                                console.log("Verrouillage de l'orientation non supporté:", err.message);
                            }
                        } else {
                            console.log("API d'orientation non supportée sur ce navigateur");
                        }
                    }, 500);
                    
                } catch (err) {
                    console.error("Erreur mode plein écran:", err);
                }
            } else {
                (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen || document.mozCancelFullScreen).call(document);
                // When exiting, unlock orientation
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
            }
            // Resize the plot after fullscreen change
            setTimeout(() => window.Plotly.Plots.resize(gd), 300);
        }
    };
}

/**
 * Render a Plotly graph from a JSON specification
 * @param {HTMLElement} container - DOM element to render into
 * @param {Object} spec - Plotly graph specification
 */
export function renderFromJsonSpecInto(container, spec) {
    try {
        const data = spec.data || [];
        const layout = spec.layout || {};
        const isMobile = window.innerWidth <= 960;

        const config = {
            responsive: true,
            displaylogo: false,
        };

        if (isMobile) {
            // On mobile, disable hover and show only essential buttons
            config.displayModeBar = true;
            config.modeBarButtonsToAdd = ['toImage', buildSmartFullscreenButton()];
            // Explicitly remove all other interactive tools
            config.modeBarButtonsToRemove = ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian'];
            layout.hovermode = false; // Disable hover text
        } else {
            // On desktop, show the full experience
            config.displayModeBar = true;
            config.modeBarButtonsToAdd = ['toImage', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', buildFullscreenButton()];
            config.modeBarButtonsToRemove = ['hoverClosestCartesian', 'hoverCompareCartesian'];
        }

        Plotly.react(container, data, layout, config);
    } catch (err) {
        console.error('Erreur rendu Plotly:', err);
    }
}

/**
 * Fetch and render a Plotly graph from a JSON URL
 * @param {string} containerId - ID of the container element
 * @param {string} url - URL to fetch the graph JSON from
 * @returns {Promise<void>}
 */
export async function fetchAndRenderInto(containerId, url) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const spec = await res.json();
        renderFromJsonSpecInto(el, spec);
    } catch (err) {
        console.error('Erreur chargement JSON:', url, err);
    }
}
