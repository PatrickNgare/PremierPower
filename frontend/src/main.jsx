import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { MotionConfig } from 'framer-motion'
import App from '@/App'
import { SiteProvider } from '@/hooks/useSite'
import { SeoProvider } from '@/hooks/useSeo'
import '@/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        {/* CSS covers transitions; this is what makes Framer Motion's
            JS-driven animations honour the same preference. */}
        <MotionConfig reducedMotion="user">
          {/* Company details are fetched once here rather than in each of the
              dozen components that show a phone number or a registration. */}
          <SiteProvider>
            {/* Per-route search metadata, fetched once for the same reason. */}
            <SeoProvider>
              <App />
            </SeoProvider>
          </SiteProvider>
        </MotionConfig>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
