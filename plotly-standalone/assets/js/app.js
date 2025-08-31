/**
 * Main application entry point
 */
import { initializeBasicUI, setupTabs, registerLoaderButtons, setupResizeHandler } from './ui.js';
import { fetchAndRenderInto } from './plotly-utils.js';
import { loadInitialPlotsForTab } from './data-loader.js';
import { initPolls } from './features/polls.js';
import { initCandidates } from './features/candidates.js';

(function() {
    'use strict';

    // Global state
    let loaderButtons = [];

    // Initialize basic UI elements
    initializeBasicUI();

    // Set up tabs
    const { activateTab } = setupTabs((tabId) => {
        loadInitialPlotsForTab(tabId, fetchAndRenderInto);
    });

    // Register static loader buttons
    loaderButtons = registerLoaderButtons(
        document.querySelectorAll('[data-target][data-src]'),
        (btn) => {
            fetchAndRenderInto(btn.getAttribute('data-target'), btn.getAttribute('data-src'));
        }
    );

    // Initialize dynamic features
    initPolls(fetchAndRenderInto, loaderButtons);
    initCandidates(fetchAndRenderInto, loaderButtons);

    // Set up window resize handler
    setupResizeHandler();
})(); 