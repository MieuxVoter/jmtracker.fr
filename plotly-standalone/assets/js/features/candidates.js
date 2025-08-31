/**
 * Candidate-specific functionality
 */
import { getDirectoryListing } from '../data-loader.js';
import { setActiveLoaderButton } from '../ui.js';

/**
 * Get available candidate files
 * @returns {Promise<string[]>} Array of candidate filenames
 */
export async function getCandidateFiles() {
    const files = await getDirectoryListing('graphs/jm/time_merite_profil_candidates/');
    
    if (!files.length) {
        console.warn('Candidate dir listing failed, using fallback');
        return [
            "time_merit_profile_Eric Ciotti_IPSOS.json",
            "time_merit_profile_Marine Le Pen_IPSOS.json",
            "time_merit_profile_Jean-Luc Mélenchon_IPSOS.json"
        ];
    }
    
    return files.filter(name => name.startsWith('time_merit_profile_') && name.endsWith('_IPSOS.json'));
}

/**
 * Extract candidate name from filename
 * @param {string} file - Filename
 * @returns {string} Formatted candidate name
 */
function labelFromCandidateFile(file) {
    const m = file.match(/time_merit_profile_(.+)_IPSOS\.json/);
    const slug = m ? m[1] : file;
    return decodeURIComponent(slug.replace(/_/g, ' '));
}

/**
 * Initialize the candidates section
 * @param {Function} fetchAndRenderInto - Function to fetch and render plots
 * @param {Array} loaderButtons - Reference to all loader buttons
 */
export async function initCandidates(fetchAndRenderInto, loaderButtons) {
    const wrap = document.getElementById('jm-candidate-controls');
    if (!wrap) return;
    
    const files = await getCandidateFiles();
    if (!files.length) return;
    
    files.sort(); // alphabetical
    
    files.forEach((file, idx) => {
        const btn = document.createElement('button');
        btn.className = 'mv-btn mv-btn--pill';
        btn.setAttribute('data-target', 'jm-candidate-plot');
        btn.setAttribute('data-src', `graphs/jm/time_merite_profil_candidates/${file}`);
        btn.textContent = labelFromCandidateFile(file);
        
        wrap.appendChild(btn);

        btn.addEventListener('click', () => {
            fetchAndRenderInto('jm-candidate-plot', `graphs/jm/time_merite_profil_candidates/${file}`);
            setActiveLoaderButton(btn, loaderButtons);
        });

        loaderButtons.push(btn);

        if (idx === 0) {
            btn.classList.add('mv-btn--primary');
            fetchAndRenderInto('jm-candidate-plot', `graphs/jm/time_merite_profil_candidates/${file}`);
        }
    });
}
