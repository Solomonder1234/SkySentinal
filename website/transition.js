/**
 * SkyAlert Network - Global Route Interceptor
 * Handles the 'Make it Rain' 0.6s programmatic transition.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject the Rain Overlay into the DOM if it doesn't exist
    if (!document.getElementById('rain-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'rain-overlay';

        // Generate 30 random raindrops
        for (let i = 0; i < 30; i++) {
            const drop = document.createElement('div');
            drop.className = 'raindrop';
            drop.style.left = `${Math.random() * 100}vw`;
            drop.style.animationDelay = `${Math.random() * 0.4}s`;
            drop.style.opacity = '0';
            overlay.appendChild(drop);
        }

        document.body.appendChild(overlay);
    }

    const rainOverlay = document.getElementById('rain-overlay');

    // 2. Intercept Anchor Clicks
    document.querySelectorAll('a').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            // Ignore strictly external links or hard redirects (like target blanks)
            if (anchor.target === '_blank' || anchor.getAttribute('href').startsWith('mailto:')) return;
            if (anchor.href.startsWith(window.location.origin) || !anchor.href.includes('http')) {
                e.preventDefault();
                const targetUrl = anchor.href;

                // Trigger Rain Overlay
                rainOverlay.classList.add('active');

                // Wait exactly 600ms matching the CSS transition, then route
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 600);
            }
        });
    });
});
