/**
 * Poll-specific functionality
 */
import { getDirectoryListing } from '../data-loader.js';
import { setActiveLoaderButton } from '../ui.js';

/**
 * Get available poll files
 * @returns {Promise<string[]>} Array of poll filenames
 */
export async function getPollFiles() {
    const files = await getDirectoryListing('graphs/jm/polls/');
    
    if (!files.length) {
        console.warn('Directory listing failed, falling back to hardcoded list');
        return [
            'ipsos_202409.json','ipsos_202410.json','ipsos_202411.json','ipsos_202501.json',
            'ipsos_202502.json','ipsos_202503.json','ipsos_202504.json','ipsos_202505.json',
            'ipsos_202506.json','ipsos_202507.json'
        ];
    }
    
    return files.filter(name => /ipsos_\d{6}\.json$/.test(name));
}

/**
 * Initialize the polls section
 * @param {Function} fetchAndRenderInto - Function to fetch and render plots
 * @param {Array} loaderButtons - Reference to all loader buttons
 */
export async function initPolls(fetchAndRenderInto, loaderButtons) {
    const controlWrap = document.getElementById('jm-survey-controls');
    if (!controlWrap) return;
    
    const files = await getPollFiles();
    if (!files.length) return;
    
    // Latest first because YYYYMM format
    files.sort((a, b) => b.localeCompare(a));
    
    files.forEach((file, idx) => {
        const btn = document.createElement('button');
        btn.className = 'mv-btn mv-btn--pill';
        btn.setAttribute('data-target', 'jm-survey-plot');
        btn.setAttribute('data-src', `graphs/jm/polls/${file}`);
        
        const dateLabel = (file.match(/_(\d{6})/)||[])[1] || file;
        btn.textContent = dateLabel.replace(/^(\d{4})(\d{2})$/,'$1-$2');
        
        controlWrap.appendChild(btn);

        btn.addEventListener('click', () => {
            fetchAndRenderInto('jm-survey-plot', `graphs/jm/polls/${file}`);
            setActiveLoaderButton(btn, loaderButtons);
        });

        loaderButtons.push(btn);

        // First (latest) plot load
        if (idx === 0) {
            btn.classList.add('mv-btn--primary');
            fetchAndRenderInto('jm-survey-plot', `graphs/jm/polls/${file}`);
        }
    });
}
