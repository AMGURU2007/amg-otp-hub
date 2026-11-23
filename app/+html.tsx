import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.0, user-scalable=no" />
        <title>AMG OTP Hub - Local-First Multi-Account Workspace</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              min-height: 100vh;
              background-color: #07101d;
              color: #edf5ff;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              overflow-x: hidden;
            }
            #root {
              display: flex;
              flex-direction: column;
              min-height: 100vh;
              height: 100%;
              background-color: #07101d;
            }
            /* Custom dark scrollbar */
            ::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            ::-webkit-scrollbar-track {
              background: #07101d;
            }
            ::-webkit-scrollbar-thumb {
              background: #203750;
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #365fc0;
            }

            /* Vivid Click / Active Glow Effect on All Interactive Elements */
            @keyframes clickGlowPulse {
              0% {
                box-shadow: 0 0 0 0 var(--theme-glow-color, #00f2fe);
              }
              50% {
                box-shadow: 0 0 32px 8px var(--theme-glow-color, #00f2fe), inset 0 0 16px var(--theme-glow-color, #00f2fe);
              }
              100% {
                box-shadow: 0 0 22px 5px var(--theme-glow-color, #00f2fe), inset 0 0 12px var(--theme-glow-color, #00f2fe);
              }
            }

            .glow-on-click,
            button,
            [role="button"],
            .interactive-card,
            .feature-card {
              transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease !important;
            }

            .glow-on-click:active,
            button:active,
            [role="button"]:active,
            .glow-on-click[data-selected="true"],
            [data-active="true"],
            .card-clicked-glow {
              box-shadow: 0 0 28px 6px var(--theme-glow-color, rgba(0, 242, 254, 0.7)), inset 0 0 14px var(--theme-glow-color, rgba(0, 242, 254, 0.45)) !important;
              border-color: var(--theme-accent, #00f2fe) !important;
              transform: scale(0.98) !important;
            }

            /* ShatterType Glass-Shard Splash Stage */
            .shatter-stage {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              user-select: none;
              -webkit-user-select: none;
              transition: opacity 0.4s ease-in-out;
            }

            .shatter-stage--exiting {
              opacity: 0;
              pointer-events: none;
            }

            .shatter-canvas {
              position: relative;
              z-index: 2;
              display: block;
              max-width: 100vw;
              max-height: 75vh;
              cursor: pointer;
              touch-action: manipulation;
            }

            .shatter-sub {
              position: relative;
              z-index: 3;
              margin-top: 14px;
              font-size: clamp(11px, 2vw, 14px);
              font-weight: 700;
              letter-spacing: 0.28em;
              text-transform: uppercase;
              opacity: 0;
              transform: translateY(10px);
              animation: shatterSubReveal 0.8s 0.9s forwards ease-out;
            }

            @keyframes shatterSubReveal {
              to {
                opacity: 0.85;
                transform: translateY(0);
              }
            }

            /* Anti-Screen Capture & Text Protection */
            .otp-code-secure, [data-secure-otp="true"] {
              user-select: none !important;
              -webkit-user-select: none !important;
              -ms-user-select: none !important;
            }

            @media print {
              body, html {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
