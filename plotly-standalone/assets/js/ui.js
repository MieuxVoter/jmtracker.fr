/**
 * UI handling module
 */
export const loadedTabs = new Set();

/**
 * Initialize UI elements (year in footer, etc.)
 */
export function initializeBasicUI() {
    const currentYearSpan = document.getElementById('mv-year');
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
}

/**
 * Set up tab handling
 * @param {Function} onTabActivated - Callback when a tab is activated
 */
export function setupTabs(onTabActivated) {
    const tabButtons = Array.from(document.querySelectorAll('[data-tab]'));
    const tabPanels = Array.from(document.querySelectorAll('.mv-tabcontent'));

    function activateTab(targetId) {
        tabButtons.forEach(btn => {
            const isActive = btn.getAttribute('data-tab') === targetId;
            btn.classList.toggle('mv-btn--primary', isActive);
            btn.setAttribute('aria-selected', String(isActive));
        });

        tabPanels.forEach(panel => {
            const isActive = panel.id === targetId;
            panel.classList.toggle('is-active', isActive);
        });

        // Load content for the activated tab if it's the first time
        if (!loadedTabs.has(targetId)) {
            const panel = document.getElementById(targetId);
            // Wait for the transition to end before loading plots.
            const loadOnce = () => {
                // Ensure it only runs once, in case of race condition with timeout.
                if (loadedTabs.has(targetId)) return;
                onTabActivated(targetId);
                loadedTabs.add(targetId);
            };

            panel.addEventListener('transitionend', loadOnce, { once: true });
            // Fallback for browsers that don't fire transitionend or if there's no transition
            setTimeout(loadOnce, 300);
        }
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => activateTab(btn.getAttribute('data-tab')));
    });

    // Activate the first tab by default
    if (tabButtons.length) {
        activateTab(tabButtons[0].getAttribute('data-tab'));
    }

    return { tabButtons, tabPanels, activateTab };
}

/**
 * Register graph loader buttons
 * @param {Array} buttons - Array of button elements
 * @param {Function} onButtonClick - Callback when a button is clicked
 * @returns {Array} - All registered loader buttons
 */
export function registerLoaderButtons(buttons, onButtonClick) {
    const loaderButtons = Array.from(buttons);
    
    loaderButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            onButtonClick(btn);
            setActiveLoaderButton(btn, loaderButtons);
        });
    });
    
    return loaderButtons;
}

/**
 * Set a button as active among buttons targeting the same container
 * @param {HTMLElement} clicked - The clicked button
 * @param {Array} allButtons - Array of all loader buttons
 */
export function setActiveLoaderButton(clicked, allButtons = []) {
    const target = clicked.getAttribute('data-target');
    allButtons.forEach(b => {
        if (b.getAttribute('data-target') === target) {
            b.classList.toggle('mv-btn--primary', b === clicked);
        }
    });
}

/**
 * Handle global window resize events for Plotly
 */
export function setupResizeHandler() {
    window.addEventListener('resize', () => {
        // Resize visible plots only
        document.querySelectorAll('.mv-tabcontent.is-active .mv-plot').forEach(div => {
            if (window.Plotly) {
                window.Plotly.Plots.resize(div);
            }
        });
    });
}
