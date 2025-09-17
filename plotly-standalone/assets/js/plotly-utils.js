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
        const isMobilePhone = window.innerWidth <= 640; // Small phones only
        const isTablet = window.innerWidth > 640 && window.innerWidth <= 960; // Tablets/iPads

        const config = {
            responsive: true,
            displaylogo: false,
        };

        if (isMobilePhone) {
            // On mobile phones, disable hover and show only essential buttons
            config.displayModeBar = true;
            config.modeBarButtonsToAdd = ['toImage', buildSmartFullscreenButton()];
            // Explicitly remove all other interactive tools
            config.modeBarButtonsToRemove = ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian'];
            layout.hovermode = false; // Disable hover text
        } else if (isTablet) {
            // On tablets, show simplified toolbar but keep some interactivity
            config.displayModeBar = true;
            config.modeBarButtonsToAdd = ['toImage', 'resetScale2d', buildSmartFullscreenButton()];
            config.modeBarButtonsToRemove = ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian'];
            // Keep hover on tablets as screens are larger
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
    
    // Check if we should show PNG on mobile phones for JM graphs
    const isMobilePhone = window.innerWidth <= 640;
    
    if (isMobilePhone && url.includes('/jm/')) {
        // Try to show PNG version on mobile phones for JM graphs only
        const pngUrl = url.replace('.json', '.png');
        showPngFallback(el, pngUrl, url);
        return;
    }

    // Otherwise, load the interactive graph
    try {
    const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + 'v=' + new Date().getTime();
    const res = await fetch(cacheBustedUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const spec = await res.json();
        renderFromJsonSpecInto(el, spec);
    } catch (err) {
        console.error('Erreur chargement JSON:', url, err);
    }
}

/**
 * Show PNG image for mobile devices
 * @param {HTMLElement} container - The container element
 * @param {string} pngUrl - URL to the PNG image
 * @param {string} jsonUrl - URL to the JSON data (for fallback if PNG fails)
 */
function showPngFallback(container, pngUrl, jsonUrl) {
    container.innerHTML = `
        <div class="mv-plot-static">
            <div class="mv-static-image-container">
                <img src="${pngUrl}" alt="Graphique statique" style="max-width: 100%; height: auto; border: 1px solid var(--mv-border); border-radius: 8px;" 
                     onerror="loadInteractiveGraph('${container.id}', '${jsonUrl}');">
                <button class="mv-static-fullscreen-btn" onclick="makeImageFullscreen('${container.id}')" title="Plein écran">
                    <svg width="16" height="16" viewBox="0 0 857.1 857.1" fill="currentColor">
                        <path d="M0 214.3V0h214.3v61.9H61.9v152.4H0zm0 642.8V642.8h61.9v152.4H214.3v61.9H0zM642.8 0h214.3v214.3h-61.9V61.9H642.8V0zm152.4 642.8h61.9v214.3H642.8v-61.9h152.4V642.8z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

/**
 * Load the interactive Plotly graph (used by PNG fallback buttons)
 * @param {string} containerId - The container element ID
 * @param {string} url - URL to fetch the graph JSON from
 */
async function loadInteractiveGraph(containerId, url) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<div class="mv-plot" style="min-height: 400px; display: flex; align-items: center; justify-content: center;">Chargement...</div>';
    
    try {
    const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + 'v=' + new Date().getTime();
    const res = await fetch(cacheBustedUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const spec = await res.json();
        renderFromJsonSpecInto(container, spec);
    } catch (err) {
        console.error('Erreur chargement graphique:', err);
        container.innerHTML = '<div class="mv-card mv-card--error"><strong>Erreur:</strong> Impossible de charger le graphique.</div>';
    }
}

// Make loadInteractiveGraph available globally for onclick handlers
window.loadInteractiveGraph = loadInteractiveGraph;

/**
 * Make an image go fullscreen with close button overlay
 * @param {string} containerId - The container ID containing the image
 */
function makeImageFullscreen(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const img = container.querySelector('.mv-static-image-container img');
    if (!img) return;
    
    if (!document.fullscreenElement) {
        // Create fullscreen container with close button
        const fullscreenContainer = document.createElement('div');
        fullscreenContainer.id = 'mv-fullscreen-image-container';
        fullscreenContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        // Clone the image for fullscreen
        const fullscreenImg = img.cloneNode();
        fullscreenImg.style.cssText = `
            max-width: 95vw;
            max-height: 95vh;
            object-fit: contain;
            border: none;
            border-radius: 0;
        `;
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        closeButton.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
            transition: background 0.2s ease;
        `;
        
        closeButton.onclick = () => {
            document.body.removeChild(fullscreenContainer);
            // Unlock orientation when closing
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        };
        
        // Close on background click
        fullscreenContainer.onclick = (e) => {
            if (e.target === fullscreenContainer) {
                closeButton.onclick();
            }
        };
        
        fullscreenContainer.appendChild(fullscreenImg);
        fullscreenContainer.appendChild(closeButton);
        document.body.appendChild(fullscreenContainer);
        
        // Try to lock orientation to landscape
        setTimeout(async () => {
            if (screen.orientation && screen.orientation.lock) {
                try {
                    await screen.orientation.lock('landscape');
                    console.log("Image en plein écran avec orientation paysage");
                } catch (err) {
                    console.log("Verrouillage de l'orientation non supporté:", err.message);
                }
            }
        }, 100);
    }
}

// Make makeImageFullscreen available globally for onclick handlers
window.makeImageFullscreen = makeImageFullscreen;
