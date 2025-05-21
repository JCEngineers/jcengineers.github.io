// System to convert dropped folder into JSON structure as described
// The output JSON is an array of objects, each like:
// [
//   {
//     "name": "config.json",      // The file name only
//     "location": "main"          // "main" if in root, or "subfolder" (no trailing slash, no file name)
//     "merge": true               // true if .json or .mcmeta, false otherwise
//   },
//   ...
// ]

// Set this to your desired version integer, or prompt the user for it
let manifestVersion = 1;

// Utility: fetch and log manifest.json for each array element
async function fetchAndLogManifests(array) {
    for (const el of array) {
        // Build path: packs/{name}/manifest.json
        const manifestPath = `packs/${el.name}/manifest.json`;
        try {
            const resp = await fetch(manifestPath);
            if (!resp.ok) {
                console.warn(`No manifest found at ${manifestPath}`);
                continue;
            }
            const manifest = await resp.json();
            console.log(`Manifest for ${el.name}:`, manifest);
        } catch (err) {
            console.error(`Error loading ${manifestPath}:`, err);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.body;
    const output = document.getElementById('json-output');
    const copyBtn = document.getElementById('copy-json');

    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.style.background = '#222'; // visual feedback
    });
    dropZone.addEventListener('dragleave', e => {
        e.preventDefault();
        dropZone.style.background = '';
    });
    dropZone.addEventListener('drop', async e => {
        e.preventDefault();
        dropZone.style.background = '';
        const items = e.dataTransfer.items;
        if (!items) return;

        async function traverseFileTree(item, path = '') {
            let files = [];
            if (item.isFile) {
                files.push(await new Promise(resolve => {
                    item.file(file => {
                        resolve({
                            file,
                            fullPath: path + file.name
                        });
                    });
                }));
            } else if (item.isDirectory) {
                const dirReader = item.createReader();
                const entries = await new Promise(resolve => dirReader.readEntries(resolve));
                for (const entry of entries) {
                    files = files.concat(await traverseFileTree(entry, path + item.name + '/'));
                }
            }
            return files;
        }

        // Collect all files from dropped folders, and get base folder name
        let allFiles = [];
        let baseFolder = '';
        for (const item of items) {
            const entry = item.webkitGetAsEntry && item.webkitGetAsEntry();
            if (entry) {
                if (!baseFolder && entry.isDirectory) baseFolder = entry.name + '/';
                const files = await traverseFileTree(entry);
                allFiles = allFiles.concat(files);
            }
        }
        if (!baseFolder && allFiles.length > 0) {
            // fallback: find common prefix
            let paths = allFiles.map(f => f.fullPath);
            if (paths.length > 1) {
                let prefix = paths[0];
                for (let i = 1; i < paths.length; i++) {
                    while (!paths[i].startsWith(prefix) && prefix.length > 0) {
                        prefix = prefix.slice(0, -1);
                    }
                }
                if (prefix.endsWith('/')) baseFolder = prefix;
            }
        }

        // Helper to get location as per requirements
        // - If file is in root: "main"
        // - If file is in subfolder: "subfolder" (no leading/trailing slash, no file name)
        function getLocation(fullPath) {
            let rel = baseFolder && fullPath.startsWith(baseFolder)
                ? fullPath.slice(baseFolder.length)
                : fullPath;
            const idx = rel.lastIndexOf('/');
            if (idx === -1) return "main";
            let folder = rel.slice(0, idx);
            if (!folder || folder === "") return "main";
            return folder; // no leading slash
        }

        function shouldMerge(name) {
            const ext = name.split('.').pop().toLowerCase();
            return ext === "json" || ext === "mcmeta";
        }

        const result = allFiles.map(({ file, fullPath }) => ({
            name: file.name,
            location: getLocation(fullPath),
            merge: shouldMerge(file.name),
            version: manifestVersion
        }));

        output.textContent = JSON.stringify(result, null, 2);

        fetchAndLogManifests(result);
    });

    copyBtn.addEventListener('click', () => {
        if (!output.textContent) return;
        navigator.clipboard.writeText(output.textContent);
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy JSON"; }, 1200);
    });
});
