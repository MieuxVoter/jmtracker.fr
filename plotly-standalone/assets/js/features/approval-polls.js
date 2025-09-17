/**
 * Approval voting polls functionality
 */
import { getDirectoryListing } from '../data-loader.js';
import { setActiveLoaderButton } from '../ui.js';

/**
 * Get available approval poll files
 * @returns {Promise<string[]>} Array of approval poll filenames
 */
export async function getApprovalPollFiles() {
    const files = await getDirectoryListing('graphs/approbation/polls/');
    
    if (!files.length) {
        console.warn('Approval polls directory listing failed, falling back to hardcoded list');
        return [
            'ipsos_202409.json','ipsos_202410.json','ipsos_202411.json','ipsos_202501.json',
            'ipsos_202502.json','ipsos_202503.json','ipsos_202504.json','ipsos_202505.json',
            'ipsos_202506.json','ipsos_202507.json'
        ];
    }
    
    return files.filter(name => /ipsos_\d{6}\.json$/.test(name));
}

/**
 * Initialize the approval polls section
 * @param {Function} fetchAndRenderInto - Function to fetch and render plots
 * @param {Array} loaderButtons - Reference to all loader buttons
 */
export async function initApprovalPolls(fetchAndRenderInto, loaderButtons) {
    const controlWrap = document.getElementById('approval-survey-controls');
    if (!controlWrap) return;
    
    const files = await getApprovalPollFiles();
    if (!files.length) return;
    
    // Latest first because YYYYMM format
    files.sort((a, b) => b.localeCompare(a));
    
    files.forEach((file, idx) => {
        const btn = document.createElement('button');
        btn.className = 'mv-btn mv-btn--pill';
        btn.setAttribute('data-target', 'approval-survey-plot');
        btn.setAttribute('data-src', `graphs/approbation/polls/${file}`);
        
        const dateLabel = (file.match(/_(\d{6})/)||[])[1] || file;
        btn.textContent = dateLabel.replace(/^(\d{4})(\d{2})$/,'$1-$2');
        
        controlWrap.appendChild(btn);

        btn.addEventListener('click', () => {
            fetchAndRenderInto('approval-survey-plot', `graphs/approbation/polls/${file}`);
            setActiveLoaderButton(btn, loaderButtons);
        });

        loaderButtons.push(btn);

        // First (latest) plot load
        if (idx === 0) {
            btn.classList.add('mv-btn--primary');
            fetchAndRenderInto('approval-survey-plot', `graphs/approbation/polls/${file}`);
        }
    });
}
