// Maintain a global array of selected card keys (not element IDs)
window.selected = [];

// Maintain a global array of selected version keys
window.selectedVersions = [];

function getCardKey(card) {
    // Use data-key if present, otherwise fallback to id
    return card.getAttribute('data-key') || card.id || null;
}

function updateSelected(card) {
    const key = getCardKey(card);
    if (!key) return;
    if (card.classList.contains('active')) {
        if (!window.selected.includes(key)) {
            window.selected.push(key);
        }
    } else {
        window.selected = window.selected.filter(selKey => selKey !== key);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Initialize selectedVersions based on selected header-buttons
    window.selectedVersions = [];
    document.querySelectorAll('.header-button.selected').forEach(btn => {
        let version = btn.getAttribute('data-key') || btn.getAttribute('data-selected-version');
        if (version === "1.21.x") version = "21";
        else if (version === "1.20.x") version = "20";
        if (version && !window.selectedVersions.includes(version)) {
            window.selectedVersions.push(version);
        }
    });

    const collapsibles = document.querySelectorAll(".collapsible");

    collapsibles.forEach(button => {
        button.addEventListener("click", () => {
            button.classList.toggle("active");
            const content = button.nextElementSibling;

            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    // Example: set data-key="fresh_crops" on the card in your HTML
    const freshCropsCard = document.getElementById("fresh-crops-card");
    freshCropsCard.setAttribute("data-key", "fresh_crops");
    freshCropsCard.addEventListener("click", () => {
        freshCropsCard.classList.toggle('active');
        updateSelected(freshCropsCard);
    });

    // Support for grand world card
    const grandWorldCard = document.getElementById("grand-world-card");
    if (grandWorldCard) {
        grandWorldCard.setAttribute("data-key", "grand_world");
        grandWorldCard.addEventListener("click", () => {
            grandWorldCard.classList.toggle('active');
            updateSelected(grandWorldCard);
        });
    }

    // Log data-log property on hover for all cards with data-log
    document.querySelectorAll('.card[data-log]').forEach(card => {
        card.addEventListener('mouseenter', () => {
            console.log(card.getAttribute('data-log'));
        });
    });

    // Log HTML property on hover for all cards with .card-log
    document.querySelectorAll('.card .card-log').forEach(logElem => {
        const card = logElem.closest('.card');
        if (card) {
            card.addEventListener('mouseenter', () => {
                console.log(logElem.innerHTML);
            });
        }
    });

    // Sidebar hover log with 200ms delay, keep text until overwritten
    document.querySelectorAll('.card .card-log').forEach(logElem => {
        const card = logElem.closest('.card');
        if (card) {
            let hoverTimeout;
            card.addEventListener('mouseenter', () => {
                hoverTimeout = setTimeout(() => {
                    const sidebarContent = document.querySelector('.sidebar-content');
                    if (sidebarContent) {
                        sidebarContent.innerHTML = logElem.innerHTML;
                    }
                }, 200);
            });
            card.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimeout);
                // Do not reset sidebar text here; leave as is until another card overwrites it
            });
        }
    });

    // Version button selection logic
    document.querySelectorAll('.header-button').forEach(btn => {
        // Ensure all version buttons have a data-key attribute
        if (!btn.hasAttribute('data-key')) {
            // Map button text to version number
            let version = btn.getAttribute('data-selected-version');
            if (version === "1.21.x") version = "21";
            else if (version === "1.20.x") version = "20";
            btn.setAttribute('data-key', version);
        }
        btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
            const key = btn.getAttribute('data-key');
            if (!key) return;
            if (btn.classList.contains('selected')) {
                if (!window.selectedVersions.includes(key)) {
                    window.selectedVersions.push(key);
                }
            } else {
                window.selectedVersions = window.selectedVersions.filter(k => k !== key);
            }
        });
    });

    // Modal open/close logic (restore old structure)
    const downloadBtn = document.getElementById("open-modal");
    const modal = document.getElementById("modal");
    const modalOverlay = document.querySelector(".modal-overlay");
    const cancelBtn = document.querySelector(".cancel-button");

    function openModal() {
        if (modal && modalOverlay) {
            modal.style.display = "block";
            modalOverlay.style.display = "block";
        }
        // Trigger manifest fetch for selected packs
        fetchAndLogManifests(window.selected);
        // Generate and download the zip archive
        generateAndDownloadZip(window.selected);
    }
    function closeModal() {
        if (modal && modalOverlay) {
            modal.style.display = "none";
            modalOverlay.style.display = "none";
        }
    }

    if (downloadBtn && modal && modalOverlay) {
        downloadBtn.addEventListener("click", openModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener("click", closeModal);
    }
    document.addEventListener("keydown", (e) => {
        if (modal.style.display === "block" && (e.key === "Escape" || e.key === "Esc")) {
            closeModal();
        }
    });

    // Initialize JSZip archive
    window.zip = new JSZip();
});

// Utility: fetch and log manifest.json for each array element
// Accepts an array of keys (e.g. ["fresh_crops", ...])
async function fetchAndLogManifests(keys) {
    if (!Array.isArray(keys)) {
        console.warn("fetchAndLogManifests expects an array of keys.");
        return;
    }
    for (const key of keys) {
        if (!key) continue;
        const manifestPath = `packs/${key}/manifest.json`;
        try {
            const resp = await fetch(manifestPath);
            if (!resp.ok) {
                console.warn(`No manifest found at ${manifestPath}`);
                continue;
            }
            const manifest = await resp.json();
            console.log(`Manifest for ${key}:`, manifest);
        } catch (err) {
            console.error(`Error loading ${manifestPath}:`, err);
        }
    }
}

// Add all files from manifest.json to the JSZip archive, preserving structure
async function addPackToZip(zip, key) {
    const basePath = `packs/${key}/`;
    const selectedVersions = (window.selectedVersions || []).map(Number).sort((a, b) => a - b).map(String);
    console.log(`[addPackToZip] key:`, key, 'selectedVersions:', selectedVersions);

    // This approach is efficient for up to ~10 versions.
    // It tries at most (MAX_VERSION - selectedVersions.length + 1) * (10 - selectedVersions.length + 1) fetches per pack.
    // For typical use (few versions, few packs), performance impact is negligible.
    // If you ever have hundreds of versions or thousands of packs, consider optimization.
    // For your current use case, this is fine.

    // We'll try all folders with up to 10 versions, and pick the best match
    const MAX_VERSION = 30; // adjust if you ever have more than 30
    let bestFolder = null;
    let bestFolderVersionCount = Infinity;

    // Try all possible folders with up to MAX_VERSION versions
    for (let vCount = selectedVersions.length; vCount <= 10; vCount++) {
        // For each possible combination of vCount versions (sequential, ascending)
        for (let start = 0; start <= MAX_VERSION - vCount; start++) {
            const folderVersions = [];
            for (let i = 0; i < vCount; i++) {
                folderVersions.push(String(start + i));
            }
            // Only consider folders that contain all selectedVersions
            if (selectedVersions.every(v => folderVersions.includes(v))) {
                const folder = folderVersions.join('_');
                const manifestPath = `${basePath}${folder}/manifest.json`;
                // eslint-disable-next-line no-await-in-loop
                const resp = await fetch(manifestPath);
                if (resp.ok) {
                    // Prefer the folder with the least extra versions
                    if (folderVersions.length < bestFolderVersionCount) {
                        bestFolder = folder;
                        bestFolderVersionCount = folderVersions.length;
                    }
                }
            }
        }
        if (bestFolder) break; // Found the best match for this vCount
    }

    if (!bestFolder) {
        console.log(`[addPackToZip] No suitable folder found for versions:`, selectedVersions);
        return;
    }

    const manifestPath = `${basePath}${bestFolder}/manifest.json`;
    console.log(`[addPackToZip] Using folder: ${bestFolder}, manifestPath: ${manifestPath}`);
    try {
        const resp = await fetch(manifestPath);
        if (!resp.ok) {
            console.log(`[addPackToZip] No manifest at:`, manifestPath);
            return;
        }
        const manifest = await resp.json();
        if (!Array.isArray(manifest)) {
            console.log(`[addPackToZip] Manifest not array at:`, manifestPath);
            return;
        }
        console.log(`[addPackToZip] Found manifest at:`, manifestPath, manifest);
        for (const entry of manifest) {
            if (!entry.name) continue;
            // Use location if present, otherwise just name
            let relPath;
            if (entry.location) {
                const cleanLocation = entry.location.replace(/^\/+/, '').replace(/\/+$/, '');
                const cleanName = entry.name.replace(/^\/+/, '');
                relPath = `${cleanLocation}/${cleanName}`;
            } else {
                const cleanName = entry.name.replace(/^\/+/, '');
                relPath = `${cleanName}`;
            }
            const fullPath = basePath + bestFolder + '/' + relPath;
            console.log(`[addPackToZip] Fetching file: relPath=${relPath}, fullPath=${fullPath}`);
            try {
                const fileResp = await fetch(fullPath);
                if (!fileResp.ok) {
                    console.log(`[addPackToZip] File not found:`, fullPath);
                    continue;
                }
                const blob = await fileResp.blob();
                zip.file(relPath, blob); // Do NOT include version folder in zip path
                console.log(`[addPackToZip] Added file:`, relPath);
            } catch (err) {
                console.error(`Error fetching file ${fullPath}:`, err);
            }
        }
    } catch (err) {
        console.log(`[addPackToZip] Error fetching manifest:`, manifestPath, err);
    }
}

// Generate and download the zip archive with all selected packs
async function generateAndDownloadZip(selectedKeys) {
    const zip = new JSZip();
    for (const key of selectedKeys) {
        await addPackToZip(zip, key);
    }
    // Generate zip and trigger download
    zip.generateAsync({ type: "blob" }).then(content => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = "tinkercraft_packs.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}