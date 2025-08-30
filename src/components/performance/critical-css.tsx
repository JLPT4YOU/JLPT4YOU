/**
 * Critical CSS Component
 * Inlines critical CSS for above-the-fold content to eliminate render-blocking
 */

export function CriticalCSS() {
  return (
    <style jsx global>{`
      /* Critical CSS for above-the-fold content */
      
      /* Reset and base styles */
      * {
        box-sizing: border-box;
      }
      
      html {
        line-height: 1.15;
        -webkit-text-size-adjust: 100%;
      }
      
      body {
        margin: 0;
        font-family: var(--font-noto-sans-jp), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: hsl(var(--foreground));
        background-color: hsl(var(--background));
      }
      
      /* Header critical styles */
      .header {
        position: sticky;
        top: 0;
        z-index: 50;
        width: 100%;
        border-bottom: 1px solid hsl(var(--border));
        background-color: hsl(var(--background) / 0.95);
        backdrop-filter: blur(8px);
      }
      
      .header-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      
      /* Logo critical styles */
      .logo {
        font-size: 1.5rem;
        font-weight: 700;
        color: hsl(var(--foreground));
        text-decoration: none;
      }
      
      /* Navigation critical styles */
      .nav-menu {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      /* Button critical styles */
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
        border: 1px solid transparent;
        cursor: pointer;
        text-decoration: none;
      }
      
      .btn-primary {
        background-color: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
      }
      
      .btn-primary:hover {
        background-color: hsl(var(--primary) / 0.9);
      }
      
      .btn-secondary {
        background-color: hsl(var(--secondary));
        color: hsl(var(--secondary-foreground));
      }
      
      .btn-ghost {
        background-color: transparent;
        color: hsl(var(--foreground));
      }
      
      .btn-ghost:hover {
        background-color: hsl(var(--accent));
        color: hsl(var(--accent-foreground));
      }
      
      /* Loading states */
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
      }
      
      .spinner {
        width: 2rem;
        height: 2rem;
        border: 2px solid hsl(var(--border));
        border-top: 2px solid hsl(var(--primary));
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Hero section critical styles */
      .hero {
        min-height: 60vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 2rem 1rem;
      }
      
      .hero-content {
        max-width: 800px;
        margin: 0 auto;
      }
      
      .hero-title {
        font-size: 2.5rem;
        font-weight: 800;
        line-height: 1.2;
        margin-bottom: 1rem;
        color: hsl(var(--foreground));
      }
      
      .hero-subtitle {
        font-size: 1.25rem;
        color: hsl(var(--muted-foreground));
        margin-bottom: 2rem;
      }
      
      /* Container critical styles */
      .container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
      
      .section {
        padding: 3rem 0;
      }
      
      /* Grid critical styles */
      .grid {
        display: grid;
        gap: 1.5rem;
      }
      
      .grid-cols-1 {
        grid-template-columns: repeat(1, minmax(0, 1fr));
      }
      
      .grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      
      .grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      
      /* Card critical styles */
      .card {
        background-color: hsl(var(--card));
        border: 1px solid hsl(var(--border));
        border-radius: 0.5rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      }
      
      .card-header {
        margin-bottom: 1rem;
      }
      
      .card-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }
      
      .card-description {
        color: hsl(var(--muted-foreground));
        font-size: 0.875rem;
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .hero-title {
          font-size: 2rem;
        }
        
        .hero-subtitle {
          font-size: 1.125rem;
        }
        
        .grid-cols-2 {
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        
        .grid-cols-3 {
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        
        .header-container {
          padding: 0.5rem 1rem;
        }
        
        .nav-menu {
          gap: 0.5rem;
        }
      }
      
      @media (min-width: 768px) {
        .grid-cols-md-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        
        .grid-cols-md-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      
      @media (min-width: 1024px) {
        .grid-cols-lg-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        
        .grid-cols-lg-4 {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        :root {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 210 40% 98%;
          --primary-foreground: 222.2 84% 4.9%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 212.7 26.8% 83.9%;
        }
      }
      
      /* Focus styles for accessibility */
      .btn:focus-visible,
      a:focus-visible,
      button:focus-visible {
        outline: 2px solid hsl(var(--ring));
        outline-offset: 2px;
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}
