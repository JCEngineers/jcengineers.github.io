window.onload = function() {
    const canvas = document.getElementById('unitCircle');
    const ctx = canvas.getContext('2d');
    // Always use classic mode, remove all mode logic

    function resizeCanvas() {
        // Set canvas size to match CSS pixel size, and scale for devicePixelRatio for sharpness
        const dpr = window.devicePixelRatio || 1;
        // Use 100vw x 100vh for full window, minus scrollbars
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
        ctx.scale(dpr, dpr);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let zoom = 1;

    // Mouse wheel zoom handler
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        const zoomIntensity = 0.1;
        if (e.deltaY < 0) {
            zoom *= (1 + zoomIntensity);
        } else {
            zoom /= (1 + zoomIntensity);
        }
        // Clamp zoom to reasonable range (reduce min zoom from 0.2 to 0.5)
        zoom = Math.max(0.5, Math.min(zoom, 10));
    }, { passive: false });

    // --- Sidebar logic ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarTab = document.getElementById('sidebarTab');

    function showSidebar() {
        sidebar.classList.remove('collapsed');
        document.body.classList.add('sidebar-open');
    }
    function hideSidebar() {
        sidebar.classList.add('collapsed');
        document.body.classList.remove('sidebar-open');
    }

    sidebarToggle.onclick = hideSidebar;
    sidebarTab.onclick = showSidebar;

    // --- Rotation speed and direction toggle logic ---
    let speed = 0.02;
    let direction = 1;
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    const directionToggle = document.getElementById('directionToggle');
    const directionIcon = document.getElementById('directionIcon');

    function updateSpeedDisplay() {
        speedValue.textContent = speed.toFixed(3);
    }
    function updateDirectionDisplay() {
        directionIcon.textContent = direction === 1 ? "→" : "←";
        directionToggle.classList.toggle('active', direction === -1);
    }

    speedSlider.value = speed;
    updateSpeedDisplay();
    speedSlider.addEventListener('input', function() {
        speed = parseFloat(speedSlider.value);
        updateSpeedDisplay();
    });

    updateDirectionDisplay();
    directionToggle.addEventListener('click', function() {
        direction *= -1;
        updateDirectionDisplay();
    });

    // Ratio visibility state
    const ratioState = {
        sine: true,
        cosine: true,
        tangent: true,
        secant: true,
        cosecant: true,
        cotangent: true
    };

    // Checkbox event listeners
    function setupCheckbox(id, key) {
        const el = document.getElementById(id);
        el.checked = ratioState[key];
        el.addEventListener('change', () => {
            ratioState[key] = el.checked;
        });
    }
    setupCheckbox('showSine', 'sine');
    setupCheckbox('showCosine', 'cosine');
    setupCheckbox('showTangent', 'tangent');
    setupCheckbox('showSecant', 'secant');
    setupCheckbox('showCosecant', 'cosecant');
    setupCheckbox('showCotangent', 'cotangent');

    // --- Shader Mode toggle logic ---
    let shaderMode = false;
    const shaderModeToggle = document.getElementById('shaderModeToggle');
    shaderModeToggle.checked = false;
    shaderModeToggle.addEventListener('change', function() {
        shaderMode = shaderModeToggle.checked;
        document.body.classList.toggle('shader-mode', shaderMode);
    });

    function getGlowOsc(angle, freq = 1, min = 0, max = 1) {
        // angle is in radians, freq is cycles per revolution
        // returns a value in [min, max] that loops every 2π
        const t = angle % (2 * Math.PI);
        const osc = (Math.sin(freq * t) + 1) / 2; // [0,1]
        return min + (max - min) * osc;
    }

    function drawCircle(ctxParam, centerX, centerY, radius, angle = 0) {
        ctxParam.save();
        if (shaderMode) {
            // Oscillate alpha and blur with theta for subtle effect
            const osc = getGlowOsc(angle, 1, 0.18, 0.32);
            const blur = getGlowOsc(angle + 1, 1, 4, 10); // phase offset for variety
            ctxParam.shadowColor = `rgba(0,255,255,${osc})`;
            ctxParam.shadowBlur = blur;
        }
        ctxParam.beginPath();
        ctxParam.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctxParam.strokeStyle = '#888';
        ctxParam.lineWidth = getLineWidth(2);
        ctxParam.stroke();
        ctxParam.restore();
    }

    function drawAxes(ctxParam, centerX, centerY, radius, angle = 0) {
        ctxParam.save();
        if (shaderMode) {
            const osc = getGlowOsc(angle + 2, 1, 0.12, 0.22);
            const blur = getGlowOsc(angle + 3, 1, 2, 7);
            ctxParam.shadowColor = `rgba(0,255,255,${osc})`;
            ctxParam.shadowBlur = blur;
        }
        ctxParam.beginPath();
        ctxParam.moveTo(0, centerY);
        ctxParam.lineTo(canvas.width, centerY);
        ctxParam.strokeStyle = '#333';
        ctxParam.lineWidth = getLineWidth(2);
        ctxParam.stroke();

        ctxParam.beginPath();
        ctxParam.moveTo(centerX, 0);
        ctxParam.lineTo(centerX, canvas.height);
        ctxParam.strokeStyle = '#333';
        ctxParam.lineWidth = getLineWidth(2);
        ctxParam.stroke();
        ctxParam.restore();
    }

    function drawSineWaveClassic(ctxParam, centerX, centerY, radius, angle) {
        ctxParam.save();
        applyGlow(ctxParam, "#2ECC40", 14);
        ctxParam.strokeStyle = '#2ECC40';
        ctxParam.lineWidth = getLineWidth(2);
        ctxParam.beginPath();
        for (let x = 0; x < canvas.width - centerX; x += 2) {
            const theta = angle + x / 80;
            const y = centerY - radius * Math.sin(theta);
            if (x === 0) ctxParam.moveTo(centerX + x, y);
            else ctxParam.lineTo(centerX + x, y);
        }
        ctxParam.stroke();
        ctxParam.restore();
    }

    function drawCosineWaveClassic(ctxParam, centerX, centerY, radius, angle) {
        ctxParam.save();
        applyGlow(ctxParam, "#FF4136", 14);
        ctxParam.strokeStyle = '#FF4136';
        ctxParam.lineWidth = getLineWidth(2);
        ctxParam.beginPath();
        for (let y = 0; y < centerY; y += 2) {
            const theta = angle + y / 80;
            const x = centerX + radius * Math.cos(theta);
            if (y === 0) ctxParam.moveTo(x, centerY - y);
            else ctxParam.lineTo(x, centerY - y);
        }
        ctxParam.stroke();
        ctxParam.restore();
    }

    function drawTangentWaveClassic(ctxParam, centerX, centerY, radius, angle) {
        ctxParam.save();
        applyGlow(ctxParam, "#FFD700", 14);
        ctxParam.strokeStyle = '#FFD700';
        ctxParam.lineWidth = getLineWidth(2);
        ctxParam.beginPath();
        let started = false;
        for (let x = 0; x < canvas.width - centerX; x += 2) {
            const theta = angle + x / 80;
            if (Math.abs(Math.cos(theta)) < 0.05) {
                started = false;
                continue;
            }
            const yTan = centerY - radius * Math.tan(theta);
            if (!started) {
                ctxParam.moveTo(centerX + x, yTan);
                started = true;
            } else {
                ctxParam.lineTo(centerX + x, yTan);
            }
        }
        ctxParam.stroke();
        ctxParam.restore();
    }

    function drawSecantWaveClassic(ctxParam, centerX, centerY, radius, angle) {
        ctxParam.save();
        applyGlow(ctxParam, "#A020F0", 14);
        ctxParam.strokeStyle = '#A020F0';
        ctxParam.lineWidth = getLineWidth(2);
        ctxParam.beginPath();
        let started = false;
        for (let y = 0; y < centerY; y += 2) {
            const theta = angle + y / 80;
            const cosTheta = Math.cos(theta);
            if (Math.abs(cosTheta) < 0.015 || Math.abs(1 / cosTheta) > 100) {
                started = false;
                continue;
            }
            const xSec = centerX + radius / cosTheta;
            if (!started) {
                ctxParam.moveTo(xSec, centerY - y);
                started = true;
            } else {
                ctxParam.lineTo(xSec, centerY - y);
            }
        }
        ctxParam.stroke();
        ctxParam.restore();
    }

    function drawCosecantWaveClassic(ctxParam, centerX, centerY, radius, angle) {
        ctxParam.save();
        applyGlow(ctxParam, "#20B2AA", 14);
        ctxParam.strokeStyle = '#20B2AA';
        ctxParam.lineWidth = getLineWidth(2);
        ctxParam.beginPath();
        let started = false;
        for (let x = 0; x < canvas.width - centerX; x += 2) {
            const theta = angle + x / 80;
            const sinTheta = Math.sin(theta);
            if (Math.abs(sinTheta) < 0.05 || Math.abs(1 / sinTheta) > 100) {
                started = false;
                continue;
            }
            const yCsc = centerY - radius / sinTheta;
            if (!started) {
                ctxParam.moveTo(centerX + x, yCsc);
                started = true;
            } else {
                ctxParam.lineTo(centerX + x, yCsc);
            }
        }
        ctxParam.stroke();
        ctxParam.restore();
    }

    function drawCotangentWaveClassic(ctxParam, centerX, centerY, radius, angle) {
        ctxParam.save();
        applyGlow(ctxParam, "#FF851B", 14);
        ctxParam.strokeStyle = '#FF851B';
        ctxParam.lineWidth = getLineWidth(2);
        ctxParam.beginPath();
        let started = false;
        for (let y = 0; y < centerY; y += 2) {
            const theta = angle + y / 80;
            const sinTheta = Math.sin(theta);
            if (Math.abs(sinTheta) < 0.015 || Math.abs(1 / Math.tan(theta)) > 100) {
                started = false;
                continue;
            }
            const xCot = centerX + radius / Math.tan(theta);
            if (!started) {
                ctxParam.moveTo(xCot, centerY - y);
                started = true;
            } else {
                ctxParam.lineTo(xCot, centerY - y);
            }
        }
        ctxParam.stroke();
        ctxParam.restore();
    }

    // Helper to apply glow to lines in shader mode
    function applyGlow(ctxParam, color, blur = 16) {
        if (shaderMode) {
            ctxParam.shadowColor = color;
            ctxParam.shadowBlur = blur;
        }
    }

    // Helper to get line width based on shader mode
    function getLineWidth(base = 2) {
        return shaderMode ? base + 1.5 : base;
    }

    function drawSineCosine(ctxParam, centerX, centerY, radius, angle) {
        // Point on circle (for reference)
        const xRay = centerX + radius * Math.cos(angle);
        const yRay = centerY - radius * Math.sin(angle);

        // --- Draw all lines and shapes first ---

        const baseRadius = Math.min(window.innerHeight, window.innerWidth) / 4 - 40;
        const maxLegLength = baseRadius * 6; // Clamp secant/cotangent/cosecant to 6x base radius

        // --- Secant triangle (already present) ---
        let secantPoint = null;
        if (ratioState.secant) {
            let secLength = radius / Math.cos(angle);
            if (Math.abs(secLength) > maxLegLength) {
                secLength = Math.sign(secLength) * maxLegLength;
            }
            const xSecant = centerX + secLength;
            ctxParam.save();
            ctxParam.beginPath();
            ctxParam.moveTo(centerX, centerY);
            ctxParam.lineTo(xSecant, centerY);
            ctxParam.strokeStyle = '#A020F0'; // purple for secant
            ctxParam.setLineDash([]); // solid
            ctxParam.lineWidth = getLineWidth(2);
            ctxParam.stroke();
            ctxParam.restore();

            // Save secant endpoint for later point drawing
            secantPoint = { x: xSecant, y: centerY };

            // --- Draw vertical line at xSecant, spanning only from centerY to intersection --- (purple, dotted)
            const dx = Math.cos(angle);
            const dy = -Math.sin(angle);
            let yIntersect = null;
            if (Math.abs(dx) > 1e-6) {
                const tIntersect = (xSecant - centerX) / dx;
                yIntersect = centerY + tIntersect * dy;

                ctxParam.save();
                ctxParam.beginPath();
                ctxParam.moveTo(xSecant, centerY);
                ctxParam.lineTo(xSecant, yIntersect);
                ctxParam.strokeStyle = '#A020F0'; // purple
                ctxParam.setLineDash([6, 4]); // dotted
                ctxParam.lineWidth = getLineWidth(2);
                ctxParam.stroke();
                ctxParam.restore();

                // Draw hypotenuse (origin to intersection) as solid blue (exception)
                ctxParam.save();
                ctxParam.beginPath();
                ctxParam.moveTo(centerX, centerY);
                ctxParam.lineTo(xSecant, yIntersect);
                ctxParam.strokeStyle = '#0074D9'; // blue
                ctxParam.lineWidth = getLineWidth(2);
                ctxParam.setLineDash([]); // solid
                ctxParam.stroke();
                ctxParam.restore();

                // Save intersection point for later point drawing
                secantPoint.intersection = { x: xSecant, y: yIntersect };

                // --- Draw secant text following the secant line ---
                ctxParam.save();
                ctxParam.font = "16px sans-serif";
                ctxParam.fillStyle = '#A020F0';
                const secantLabelX = (centerX + xSecant) / 2 + 10;
                const secantLabelY = centerY - 10;
                ctxParam.fillText('sec(θ)', secantLabelX, secantLabelY);
                ctxParam.restore();
            }
        }

        // --- Cosecant triangle (axes reversed) ---
        let cosecantPoint = null;
        if (ratioState.cosecant && Math.abs(Math.sin(angle)) > 0.05) {
            let cscLength = radius / Math.sin(angle);
            if (Math.abs(cscLength) > maxLegLength) {
                cscLength = Math.sign(cscLength) * maxLegLength;
            }
            const yCosecant = centerY - cscLength;

            // Draw vertical leg (from center to yCosecant, on axis, solid, teal)
            ctxParam.save();
            ctxParam.beginPath();
            ctxParam.moveTo(centerX, centerY);
            ctxParam.lineTo(centerX, yCosecant);
            ctxParam.strokeStyle = '#20B2AA'; // teal for cosecant
            ctxParam.setLineDash([]); // solid
            ctxParam.lineWidth = getLineWidth(2);
            ctxParam.stroke();
            ctxParam.restore();

            // (Removed: Draw white point at (centerX, yCosecant) with black halo)

            // Draw horizontal leg (from (centerX, yCosecant) to intersection, dotted, teal)
            const dx = Math.cos(angle);
            const dy = -Math.sin(angle);
            let xIntersect = null;
            if (Math.abs(dy) > 1e-6) {
                const tIntersect = (yCosecant - centerY) / dy;
                xIntersect = centerX + tIntersect * dx;

                ctxParam.save();
                ctxParam.beginPath();
                ctxParam.moveTo(centerX, yCosecant);
                ctxParam.lineTo(xIntersect, yCosecant);
                ctxParam.strokeStyle = '#20B2AA';
                ctxParam.setLineDash([6, 4]);
                ctxParam.lineWidth = getLineWidth(2);
                ctxParam.stroke();
                ctxParam.restore();

                // Draw hypotenuse (from center to intersection, solid blue)
                ctxParam.save();
                ctxParam.beginPath();
                ctxParam.moveTo(centerX, centerY);
                ctxParam.lineTo(xIntersect, yCosecant);
                ctxParam.strokeStyle = '#0074D9'; // blue
                ctxParam.lineWidth = getLineWidth(2);
                ctxParam.setLineDash([]);
                ctxParam.stroke();
                ctxParam.restore();

                // Save intersection point for later point drawing
                cosecantPoint = { x: xIntersect, y: yCosecant };

                // Draw cosecant label at midpoint of vertical leg
                ctxParam.save();
                ctxParam.font = "16px sans-serif";
                ctxParam.fillStyle = '#20B2AA';
                const cosecantLabelX = centerX + 10;
                const cosecantLabelY = (centerY + yCosecant) / 2;
                ctxParam.fillText('csc(θ)', cosecantLabelX, cosecantLabelY);
                ctxParam.restore();
            }
        }

        // --- Cotangent triangle (axes reversed from tangent) ---
        let cotangentPoint = null;
        if (ratioState.cotangent && Math.abs(Math.sin(angle)) > 0.05) {
            let cotLength = radius / Math.tan(angle);
            if (Math.abs(cotLength) > maxLegLength) {
                cotLength = Math.sign(cotLength) * maxLegLength;
            }
            const xCotangent = centerX + cotLength;

            ctxParam.save();
            ctxParam.beginPath();
            ctxParam.moveTo(centerX, centerY);
            ctxParam.lineTo(xCotangent, centerY);
            ctxParam.strokeStyle = '#FF851B'; // orange for cotangent
            ctxParam.setLineDash([]); // solid
            ctxParam.lineWidth = getLineWidth(2);
            ctxParam.stroke();
            ctxParam.restore();

            // Save cotangent endpoint for later point drawing
            cotangentPoint = { x: xCotangent, y: centerY };

            // Draw vertical leg (from (xCotangent, centerY) to intersection, dotted, orange)
            const dx = Math.cos(angle);
            const dy = -Math.sin(angle);
            let yIntersect = null;
            if (Math.abs(dx) > 1e-6) {
                const tIntersect = (xCotangent - centerX) / dx;
                yIntersect = centerY + tIntersect * dy;

                ctxParam.save();
                ctxParam.beginPath();
                ctxParam.moveTo(xCotangent, centerY);
                ctxParam.lineTo(xCotangent, yIntersect);
                ctxParam.strokeStyle = '#FF851B';
                ctxParam.setLineDash([6, 4]);
                ctxParam.lineWidth = getLineWidth(2);
                ctxParam.stroke();
                ctxParam.restore();

                // Draw hypotenuse (from center to intersection, solid blue)
                ctxParam.save();
                ctxParam.beginPath();
                ctxParam.moveTo(centerX, centerY);
                ctxParam.lineTo(xCotangent, yIntersect);
                ctxParam.strokeStyle = '#0074D9'; // blue
                ctxParam.lineWidth = getLineWidth(2);
                ctxParam.setLineDash([]);
                ctxParam.stroke();
                ctxParam.restore();

                // Save intersection point for later point drawing
                cotangentPoint.intersection = { x: xCotangent, y: yIntersect };

                // Draw cotangent label at midpoint of horizontal leg
                ctxParam.save();
                ctxParam.font = "16px sans-serif";
                ctxParam.fillStyle = '#FF851B';
                const cotangentLabelX = (centerX + xCotangent) / 2;
                const cotangentLabelY = centerY - 10;
                ctxParam.fillText('cot(θ)', cotangentLabelX, cotangentLabelY);
                ctxParam.restore();
            }
        }

        // Draw tangent (classic mode only)
        let tangentPoint = null;
        if (ratioState.tangent && Math.abs(Math.cos(angle)) > 0.05) {
            const tanLength = radius * Math.tan(angle);
            const xTangent = centerX + radius;
            const yTangent = centerY - tanLength;

            ctxParam.save();
            ctxParam.beginPath();
            ctxParam.moveTo(xRay, yRay);
            ctxParam.lineTo(xTangent, yTangent);
            ctxParam.strokeStyle = '#FFD700'; // gold for tangent
            ctxParam.setLineDash([6, 4]);
            ctxParam.lineWidth = getLineWidth(2);
            ctxParam.stroke();
            ctxParam.restore();

            ctxParam.save();
            ctxParam.beginPath();
            ctxParam.moveTo(centerX, yTangent);
            ctxParam.lineTo(centerX, centerY);
            ctxParam.strokeStyle = '#FFD700'; // gold
            ctxParam.setLineDash([]); // solid (on axis)
            ctxParam.lineWidth = getLineWidth(2);
            ctxParam.stroke();
            ctxParam.restore();

            ctxParam.save();
            ctxParam.beginPath();
            ctxParam.moveTo(centerX, yTangent);
            ctxParam.lineTo(xTangent, yTangent);
            ctxParam.strokeStyle = '#FFD700'; // gold
            ctxParam.setLineDash([6, 4]); // dotted (not on axis)
            ctxParam.lineWidth = getLineWidth(2);
            ctxParam.stroke();
            ctxParam.restore();

            ctxParam.save();
            ctxParam.beginPath();
            ctxParam.moveTo(centerX, centerY);
            ctxParam.lineTo(xTangent, yTangent);
            ctxParam.strokeStyle = '#0074D9'; // blue
            ctxParam.lineWidth = getLineWidth(2);
            ctxParam.setLineDash([]); // solid
            ctxParam.stroke();
            ctxParam.restore();

            tangentPoint = { x: xTangent, y: yTangent };
        }

        // Draw waves
        if (ratioState.sine) drawSineWaveClassic(ctxParam, centerX, centerY, radius, angle);   // green
        if (ratioState.cosine) drawCosineWaveClassic(ctxParam, centerX, centerY, radius, angle); // red
        if (ratioState.tangent) drawTangentWaveClassic(ctxParam, centerX, centerY, radius, angle); // gold
        if (ratioState.secant) drawSecantWaveClassic(ctxParam, centerX, centerY, radius, angle); // purple
        if (ratioState.cosecant) drawCosecantWaveClassic(ctxParam, centerX, centerY, radius, angle); // teal
        if (ratioState.cotangent) drawCotangentWaveClassic(ctxParam, centerX, centerY, radius, angle); // orange

        // Green leg: from y-axis (centerX, yRay) to (xRay, yRay) - dotted (not on axis)
        if (ratioState.sine) {
            ctxParam.save();
            ctxParam.beginPath();
            ctxParam.moveTo(centerX, yRay);
            ctxParam.lineTo(xRay, yRay);
            ctxParam.strokeStyle = '#2ECC40'; // green
            ctxParam.lineWidth = getLineWidth(2);
            ctxParam.setLineDash([6, 4]);
            ctxParam.stroke();
            ctxParam.restore();
        }
        // Green leg extension: from (centerX, centerY) to (centerX, yRay) - solid (on axis)
        if (ratioState.sine) {
            ctxParam.save();
            ctxParam.beginPath();
            ctxParam.moveTo(centerX, centerY);
            ctxParam.lineTo(centerX, yRay);
            ctxParam.strokeStyle = '#2ECC40'; // green
            ctxParam.lineWidth = getLineWidth(2);
            ctxParam.setLineDash([]); // solid
            ctxParam.stroke();
            ctxParam.restore();
        }
        // Red leg: from x-axis (xRay, centerY) to (xRay, yRay) - dotted (not on axis)
        if (ratioState.cosine) {
            ctxParam.save();
            ctxParam.beginPath();
            ctxParam.moveTo(xRay, centerY);
            ctxParam.lineTo(xRay, yRay);
            ctxParam.strokeStyle = '#FF4136'; // red
            ctxParam.lineWidth = getLineWidth(2);
            ctxParam.setLineDash([6, 4]);
            ctxParam.stroke();
            ctxParam.restore();
        }
        // Red leg extension: from (centerX, centerY) to (xRay, centerY) - solid (on axis)
        if (ratioState.cosine) {
            ctxParam.save();
            ctxParam.beginPath();
            ctxParam.moveTo(centerX, centerY);
            ctxParam.lineTo(xRay, centerY);
            ctxParam.strokeStyle = '#FF4136'; // red
            ctxParam.lineWidth = getLineWidth(2);
            ctxParam.setLineDash([]); // solid
            ctxParam.stroke();
            ctxParam.restore();
        }

        // Draw hypotenuse (origin to circle point) - blue (draw last so it's on top)
        ctxParam.save();
        if (shaderMode) {
            const osc = getGlowOsc(angle + 0.5, 2, 0.55, 1.0); // more intense, 2 cycles per loop
            const blur = getGlowOsc(angle + 1.5, 2, 16, 28);
            ctxParam.shadowColor = `rgba(0,224,255,${osc})`;
            ctxParam.shadowBlur = blur;
        }
        ctxParam.beginPath();
        ctxParam.moveTo(centerX, centerY);
        ctxParam.lineTo(xRay, yRay);
        ctxParam.strokeStyle = '#0074D9'; // blue
        ctxParam.lineWidth = getLineWidth(2);
        ctxParam.stroke();
        ctxParam.restore();

        // --- Draw intersection points for the graphs ---
        // Helper for glowing points
        function drawGlowingPoint(x, y, color, radius = 7, glowColor = null, glowBlur = 18, angle = 0, oscPhase = 0) {
            ctxParam.save();
            if (shaderMode) {
                // Oscillate glow alpha and blur for points
                const osc = getGlowOsc(angle + oscPhase, 2, 0.5, 1.0);
                const blur = getGlowOsc(angle + oscPhase + 1, 2, glowBlur * 0.7, glowBlur * 1.3);
                ctxParam.shadowColor = (glowColor || color).replace(/rgba?\([^)]+\)|#[0-9a-fA-F]+/, c => {
                    // If color is hex or rgb, convert to rgba with osc alpha
                    if (c.startsWith('#')) {
                        // crude hex to rgb
                        let r = parseInt(c.substr(1,2),16), g = parseInt(c.substr(3,2),16), b = parseInt(c.substr(5,2),16);
                        return `rgba(${r},${g},${b},${osc})`;
                    }
                    if (c.startsWith('rgb(')) {
                        return c.replace('rgb(', 'rgba(').replace(')', `,${osc})`);
                    }
                    if (c.startsWith('rgba(')) {
                        return c.replace(/,[^,)]*\)$/, `,${osc})`);
                    }
                    return c;
                });
                ctxParam.shadowBlur = blur;
                ctxParam.beginPath();
                ctxParam.arc(x, y, radius, 0, 2 * Math.PI);
                ctxParam.fillStyle = color;
                ctxParam.fill();
            } else {
                ctxParam.beginPath();
                ctxParam.arc(x, y, radius, 0, 2 * Math.PI);
                ctxParam.fillStyle = color;
                ctxParam.strokeStyle = '#111';
                ctxParam.lineWidth = getLineWidth(2);
                ctxParam.fill();
                ctxParam.stroke();
            }
            ctxParam.restore();
        }

        // Sine wave: point where it touches the y axis (x = centerX)
        if (ratioState.sine) {
            drawGlowingPoint(
                centerX,
                centerY - radius * Math.sin(angle),
                '#2ECC40',
                6,
                '#2ECC40',
                 18,
                angle,
                0.1
            );
        }
        // Cosine wave: point where it touches the x axis (y = centerY)
        if (ratioState.cosine) {
            drawGlowingPoint(
                centerX + radius * Math.cos(angle),
                centerY,
                '#FF4136',
                6,
                '#FF4136',
                18,
                angle,
                0.2
            );
        }
        // Cosecant wave: point where it touches the y axis (x = centerX)
        if (ratioState.cosecant && Math.abs(Math.sin(angle)) > 0.05 && Math.abs(1 / Math.sin(angle)) < 100) {
            drawGlowingPoint(
                centerX,
                centerY - radius / Math.sin(angle),
                '#20B2AA',
                6,
                '#20B2AA',
                18,
                angle,
                0.3
            );
        }

        // --- Draw all points last so they're on top ---

        // Point on circle (white with black halo or glow)
        drawGlowingPoint(
            xRay,
            yRay,
            '#fff',
            7,
            shaderMode ? '#0ff' : '#111',
            shaderMode ? 22 : 0,
            angle,
            0.4
        );

        // Point at origin (white with black halo or glow)
        drawGlowingPoint(
            centerX,
            centerY,
            '#fff',
            7,
            shaderMode ? '#0ff' : '#111',
            shaderMode ? 22 : 0,
            angle,
            0.5
        );

        // Tangent triangle endpoint (if exists)
        if (tangentPoint && ratioState.tangent) {
            // Draw intersection with y-axis (x = centerX)
            drawGlowingPoint(
                centerX,
                tangentPoint.y,
                '#FFD700',
                6,
                '#FFD700',
                18,
                angle,
                0.6
            );
            // Draw endpoint at (xTangent, yTangent) as before
            drawGlowingPoint(
                tangentPoint.x,
                tangentPoint.y,
                '#fff',
                7,
                shaderMode ? '#FFD700' : '#111',
                shaderMode ? 22 : 0,
                angle,
                0.7
            );
        }

        // Secant triangle endpoints
        if (secantPoint && ratioState.secant) {
            // Endpoint on x-axis
            drawGlowingPoint(
                secantPoint.x,
                secantPoint.y,
                '#A020F0',
                6,
                '#A020F0',
                18,
                angle,
                0.8
            );
            // Intersection point (if exists)
            if (secantPoint.intersection) {
                drawGlowingPoint(
                    secantPoint.intersection.x,
                    secantPoint.intersection.y,
                    '#fff',
                    7,
                    shaderMode ? '#A020F0' : '#111',
                    shaderMode ? 22 : 0,
                    angle,
                    0.9
                );
            }
        }

        // Cotangent triangle endpoints
        if (cotangentPoint && ratioState.cotangent) {
            // Endpoint on y-axis
            drawGlowingPoint(
                cotangentPoint.x,
                cotangentPoint.y,
                '#FF851B',
                6,
                '#FF851B',
                18,
                angle,
                1.0
            );
            // Intersection point (if exists)
            if (cotangentPoint.intersection) {
                drawGlowingPoint(
                    cotangentPoint.intersection.x,
                    cotangentPoint.intersection.y,
                    '#fff',
                    7,
                    shaderMode ? '#FF851B' : '#111',
                    shaderMode ? 22 : 0,
                    angle,
                    1.1
                );
            }
        }

        // Cosecant intersection point (if exists)
        if (cosecantPoint && ratioState.cosecant) {
            drawGlowingPoint(
                cosecantPoint.x,
                cosecantPoint.y,
                '#fff',
                7,
                shaderMode ? '#20B2AA' : '#111',
                shaderMode ? 22 : 0,
                angle,
                1.2
            );
        }

        // --- Draw all text last so it's on top ---
        if (ratioState.cosine) {
            ctxParam.font = "16px sans-serif";
            ctxParam.fillStyle = '#FF4136';
            ctxParam.fillText('cos(θ)', (centerX + xRay) / 2 - 30, centerY - 10);
        }
        if (ratioState.sine) {
            ctxParam.font = "16px sans-serif";
            ctxParam.fillStyle = '#2ECC40';
            ctxParam.fillText('sin(θ)', xRay + 10, (centerY + yRay) / 2);
        }
        if (tangentPoint && ratioState.tangent) {
            ctxParam.save();
            ctxParam.font = "16px sans-serif";
            ctxParam.fillStyle = '#FFD700';
            ctxParam.fillText('tan(θ)', tangentPoint.x + 10, (centerY + tangentPoint.y) / 2);
            ctxParam.restore();
        }
    }

    let angle = 0;
    function animate() {
        resizeCanvas();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Use CSS pixels for layout, not device pixels
        const width = window.innerWidth;
        const height = window.innerHeight;
        const centerX = Math.floor(width / 3);
        const centerY = Math.floor(height / 2);
        const baseRadius = Math.min(height, width) / 4 - 40;
        const radius = baseRadius * zoom;

        drawCircle(ctx, centerX, centerY, radius, angle);
        drawAxes(ctx, centerX, centerY, radius, angle);
        drawSineCosine(ctx, centerX, centerY, radius, angle);

        angle += speed * direction;
        requestAnimationFrame(animate);
    }

    animate();

    // --- GIF rendering logic ---
    const gifButton = document.getElementById('gifButton');
    let isRenderingGif = false;
    // Add: get the quality selector
    const gifQualitySelect = document.getElementById('gifQuality');

    gifButton.addEventListener('click', function() {
        if (isRenderingGif) return;
        isRenderingGif = true;
        gifButton.disabled = true;
        gifButton.textContent = "Rendering...";
        console.log("GIF rendering started");

        // Parameters
        const delay = Math.round(1000 / 60); // 60fps, ~16.67ms per frame
        // Calculate frameCount so that a full revolution takes the same time as the live animation
        const frameCount = Math.round((2 * Math.PI) / Math.abs(speed));
        const angleStep = (2 * Math.PI) / frameCount;
        const initialAngle = angle;
        const currentDirection = direction;

        // Get quality from selector (default to 4 if not found)
        let quality = 4;
        if (gifQualitySelect && gifQualitySelect.value) {
            quality = parseInt(gifQualitySelect.value, 10);
            if (isNaN(quality) || quality < 1 || quality > 20) quality = 4;
        }

        // Create GIF
        const gif = new window.GIF({
            workers: 2,
            quality: quality,
            width: canvas.width,
            height: canvas.height,
            workerScript: 'gif.worker.js'
        });

        // --- Register event handlers BEFORE adding frames ---
        gif.on('finished', function(blob) {
            console.log("GIF rendering finished, starting download", blob);
            // Download
            const url = URL.createObjectURL(blob);
            console.log("GIF URL:", url);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'unit-circle.gif';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 1000);
            gifButton.disabled = false;
            gifButton.textContent = "Render GIF & Download";
            isRenderingGif = false;
            // Fallback: open in new tab if download fails
            setTimeout(() => {
                if (isRenderingGif) return; // already handled
                window.open(url, '_blank');
            }, 2000);
        });

        gif.on('abort', function() {
            console.error("GIF rendering aborted");
            gifButton.disabled = false;
            gifButton.textContent = "Render GIF & Download";
            isRenderingGif = false;
        });

        gif.on('error', function(err) {
            console.error("GIF rendering error:", err);
            gifButton.disabled = false;
            gifButton.textContent = "Render GIF & Download";
            isRenderingGif = false;
        });

        gif.on('progress', function(p) {
            console.log(`GIF progress: ${(p * 100).toFixed(1)}%`);
        });

        // We'll render frames offscreen to avoid flicker
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        // Use willReadFrequently to avoid browser warning
        const offctx = offscreen.getContext('2d', { willReadFrequently: true });

        // Helper: draw one frame at a given angle
        function drawFrameToOffscreen(angleValue, frameIdx) {
            // Use CSS pixels for layout, not device pixels
            const width = window.innerWidth;
            const height = window.innerHeight;
            const centerX = Math.floor(width / 3);
            const centerY = Math.floor(height / 2);
            const baseRadius = Math.min(height, width) / 4 - 40;
            const radius = baseRadius * zoom;

            offctx.setTransform(1, 0, 0, 1, 0, 0);
            offctx.clearRect(0, 0, offscreen.width, offscreen.height);

            // --- Fix: always reset shadow state before drawing ---
            offctx.shadowBlur = 0;
            offctx.shadowColor = "rgba(0,0,0,0)";

            // --- Fix: use fixed devicePixelRatio for GIF rendering for consistency ---
            // Comment out or remove the following line to use 1:1 pixel mapping for GIFs:
            // const dpr = window.devicePixelRatio || 1;
            // offctx.scale(dpr, dpr);

            // Instead, always use dpr = 1 for GIF rendering:
            // (If you want to keep high-res GIFs, you can set dpr = 2, but for smoothness, 1 is best)
            // No scaling needed

            drawCircle(offctx, centerX, centerY, radius, angleValue);
            drawAxes(offctx, centerX, centerY, radius, angleValue);
            drawSineCosine(offctx, centerX, centerY, radius, angleValue);

            if (frameIdx % 10 === 0) {
                console.log(`Rendered frame ${frameIdx + 1}/${frameCount}`);
            }
        }

        // Render frames for a full revolution (0 to 2π)
        try {
            for (let i = 0; i < frameCount; ++i) {
                // θ goes from initialAngle to initialAngle + 2π * direction
                const theta = initialAngle + (2 * Math.PI) * (i / frameCount) * currentDirection;
                drawFrameToOffscreen(theta, i);
                gif.addFrame(offscreen, {copy: true, delay: delay});
            }
        } catch (err) {
            console.error("Error during GIF frame rendering:", err);
            gifButton.disabled = false;
            gifButton.textContent = "Render GIF & Download";
            isRenderingGif = false;
            return;
        }

        console.log("Starting gif.render()");
        gif.render();
    });
};
