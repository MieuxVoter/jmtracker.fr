(function() {
	'use strict';

	const currentYearSpan = document.getElementById('mv-year');
	if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

	// Tabs handling
	const tabButtons = Array.from(document.querySelectorAll('[data-tab]'));
	const tabPanels = Array.from(document.querySelectorAll('.mv-tabcontent'));
	function activateTab(targetId) {
		tabButtons.forEach(btn => {
			const isActive = btn.getAttribute('data-tab') === targetId;
			btn.classList.toggle('mv-btn--primary', isActive);
			btn.setAttribute('aria-selected', String(isActive));
		});
		tabPanels.forEach(panel => {
			panel.classList.toggle('is-active', panel.id === targetId);
		});
	}
	tabButtons.forEach(btn => {
		btn.addEventListener('click', () => activateTab(btn.getAttribute('data-tab')));
	});
	// default
	if (tabButtons.length) activateTab(tabButtons[0].getAttribute('data-tab'));

	// Plotly helpers
	function buildFullscreenButton() {
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
				setTimeout(() => Plotly.Plots.resize(gd), 300);
			}
		};
	}

	function renderFromJsonSpecInto(container, spec) {
		try {
			const data = spec.data || [];
			const layout = spec.layout || {};
			const config = {
				displayModeBar: true,
				modeBarButtonsToAdd: ['toImage', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', buildFullscreenButton()],
				modeBarButtonsToRemove: ['hoverClosestCartesian', 'hoverCompareCartesian'],
				responsive: true,
				displaylogo: false
			};
			Plotly.react(container, data, layout, config);
		} catch (err) {
			console.error('Erreur rendu Plotly:', err);
		}
	}

	async function fetchAndRenderInto(containerId, url) {
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

	// Buttons to load specific graphs into specific containers
	const loaderButtons = Array.from(document.querySelectorAll('[data-target][data-src]'));

	function setActiveLoaderButton(clicked) {
		const target = clicked.getAttribute('data-target');
		loaderButtons.forEach(b => {
			if (b.getAttribute('data-target') === target) {
				b.classList.toggle('mv-btn--primary', b === clicked);
			}
		});
	}

	loaderButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			fetchAndRenderInto(btn.getAttribute('data-target'), btn.getAttribute('data-src'));
			setActiveLoaderButton(btn);
		});
	});

	// Mark the first button of each target as active by default so it matches the initial render
	const firstButtonPerTarget = {};
	loaderButtons.forEach(btn => {
		const t = btn.getAttribute('data-target');
		if (!firstButtonPerTarget[t]) firstButtonPerTarget[t] = btn;
	});
	Object.values(firstButtonPerTarget).forEach(btn => {
	btn.classList.add('mv-btn--primary');
	btn.setAttribute('aria-selected','true');
});

	// Initial renders for JM tab (except survey, which is dynamic)
	fetchAndRenderInto('jm-ranking-plot', 'graphs/jm/ranking_plot_IPSOS.json');
	fetchAndRenderInto('jm-grid-plot', 'graphs/jm/ranked_time_merit_profile_IPSOS.json');

	// Dynamic polls (JM survey section)
	async function getPollFiles() {
		try {
			const res = await fetch('graphs/jm/polls/');
			if (!res.ok) throw new Error('dir list');
			const text = await res.text();
			const matches = [...text.matchAll(/href=\"([^\"]+\.json)\"/g)];
			return matches.map(m => m[1]).filter(name => /ipsos_\d{6}\.json$/.test(name));
		} catch(e) {
			console.warn('Directory listing failed, falling back to hardcoded list');
			return [
				'ipsos_202409.json','ipsos_202410.json','ipsos_202411.json','ipsos_202501.json','ipsos_202502.json','ipsos_202503.json','ipsos_202504.json','ipsos_202505.json','ipsos_202506.json','ipsos_202507.json'
			];
		}
	}

	async function initPolls() {
		const controlWrap = document.getElementById('jm-survey-controls');
		if (!controlWrap) return;
		const files = await getPollFiles();
		if (!files.length) return;
		files.sort((a,b)=>b.localeCompare(a)); // latest first because YYYYMM
		files.forEach((file, idx) => {
			const btn = document.createElement('button');
			btn.className = 'mv-btn mv-btn--pill';
			btn.setAttribute('data-target','jm-survey-plot');
			btn.setAttribute('data-src',`graphs/jm/polls/${file}`);
			const dateLabel = (file.match(/_(\d{6})/)||[])[1] || file;
			btn.textContent = dateLabel.replace(/^(\d{4})(\d{2})$/,'$1-$2');
			controlWrap.appendChild(btn);

			btn.addEventListener('click', ()=>{
				fetchAndRenderInto('jm-survey-plot', `graphs/jm/polls/${file}`);
				setActiveLoaderButton(btn);
			});

			loaderButtons.push(btn);

			// first (latest) plot load
			if (idx===0) {
				btn.classList.add('mv-btn--primary');
				fetchAndRenderInto('jm-survey-plot', `graphs/jm/polls/${file}`);
			}
		});
	}

	initPolls();

	// Dynamic candidate profiles
	async function getCandidateFiles() {
		try {
			const res = await fetch('graphs/jm/time_merite_profil_candidates/');
			if (!res.ok) throw new Error('dir list');
			const text = await res.text();
			const matches = [...text.matchAll(/href=\"([^\"]+\.json)\"/g)];
			return matches.map(m=>m[1]).filter(name=>name.startsWith('time_merit_profile_') && name.endsWith('_IPSOS.json'));
		} catch(e) {
			console.warn('Candidate dir listing failed, using fallback');
			return [
				"time_merit_profile_Eric Ciotti_IPSOS.json",
				"time_merit_profile_Marine Le Pen_IPSOS.json",
				"time_merit_profile_Jean-Luc Mélenchon_IPSOS.json"
			];
		}
	}

	function labelFromCandidateFile(file) {
		// Extract candidate name from filename and decode URI encodings
		const m = file.match(/time_merit_profile_(.+)_IPSOS\.json/);
		const slug = m ? m[1] : file;
		return decodeURIComponent(slug.replace(/_/g, ' '));
	}

	async function initCandidates() {
		const wrap = document.getElementById('jm-candidate-controls');
		if (!wrap) return;
		const files = await getCandidateFiles();
		if (!files.length) return;
		files.sort(); // alphabetical
		files.forEach((file, idx) => {
			const btn = document.createElement('button');
			btn.className = 'mv-btn mv-btn--pill';
			btn.setAttribute('data-target','jm-candidate-plot');
			btn.setAttribute('data-src',`graphs/jm/time_merite_profil_candidates/${file}`);
			btn.textContent = labelFromCandidateFile(file);
			wrap.appendChild(btn);

			btn.addEventListener('click', ()=>{
				fetchAndRenderInto('jm-candidate-plot', `graphs/jm/time_merite_profil_candidates/${file}`);
				setActiveLoaderButton(btn);
			});

			loaderButtons.push(btn);

			if (idx===0) {
				btn.classList.add('mv-btn--primary');
				fetchAndRenderInto('jm-candidate-plot', `graphs/jm/time_merite_profil_candidates/${file}`);
			}
		});
	}

	initCandidates();

	// Global resize handler
	window.addEventListener('resize', () => {
		// Resize visible plots only
		document.querySelectorAll('.mv-tabcontent.is-active .mv-plot').forEach(div => {
			Plotly.Plots.resize(div);
		});
	});
})(); 