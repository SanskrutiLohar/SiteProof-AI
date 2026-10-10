import React from 'react';

/**
 * Image Utilities and Bulletproof Fallbacks for SiteProof AI
 */

// SVG Blueprint vector graphic as 100% reliable offline fallback
export const BLUEPRINT_FALLBACK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230b1329"/><g stroke="%231e3a8a" stroke-width="1.5" opacity="0.6"><path d="M0,50 H800 M0,100 H800 M0,150 H800 M0,200 H800 M0,250 H800 M0,300 H800 M0,350 H800 M0,400 H800 M0,450 H800"/><path d="M50,0 V500 M100,0 V500 M150,0 V500 M200,0 V500 M250,0 V500 M300,0 V500 M350,0 V500 M400,0 V500 M450,0 V500 M500,0 V500 M550,0 V500 M600,0 V500 M650,0 V500 M700,0 V500 M750,0 V500"/></g><rect x="80" y="80" width="640" height="340" fill="none" stroke="%233b82f6" stroke-width="2.5" stroke-dasharray="10 5"/><rect x="120" y="120" width="560" height="260" fill="%231e293b" fill-opacity="0.5" stroke="%2360a5fa" stroke-width="1.5"/><circle cx="400" cy="250" r="70" fill="none" stroke="%23f59e0b" stroke-width="2"/><line x1="400" y1="120" x2="400" y2="380" stroke="%233b82f6" stroke-width="1.5" stroke-dasharray="4 4"/><line x1="120" y1="250" x2="680" y2="250" stroke="%233b82f6" stroke-width="1.5" stroke-dasharray="4 4"/><text x="400" y="242" font-family="sans-serif" font-size="22" fill="%23f8fafc" text-anchor="middle" font-weight="900" letter-spacing="1">PROJECT MASTER VIADUCT MODEL</text><text x="400" y="272" font-family="monospace" font-size="14" fill="%2338bdf8" text-anchor="middle">VLM Ground Truth Structural Scope • IS 456 / IS 1786</text></svg>`;

// Verified high-resolution Unsplash images for CAD blueprints and master plans
export const DEFAULT_CAD_DRAWING_URL = 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80';
export const DEFAULT_MASTER_BLUEPRINT_URL = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80';
export const DEFAULT_SITE_PHOTO_URL = 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1200&q=80';

/**
 * Handle image loading failure gracefully by applying fallback URL or SVG blueprint
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = DEFAULT_MASTER_BLUEPRINT_URL
) {
  const target = e.currentTarget;
  if (target.src === fallbackUrl || target.src === BLUEPRINT_FALLBACK_SVG) {
    target.src = BLUEPRINT_FALLBACK_SVG;
    return;
  }
  target.src = fallbackUrl;
}
