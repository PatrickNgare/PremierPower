import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/layout/ScrollToTop'
import FloatingActions from '@/components/layout/FloatingActions'
import DemoRibbon from '@/components/layout/DemoRibbon'
import ExitIntentPopup from '@/components/ui/ExitIntentPopup'
import Spinner from '@/components/ui/Spinner'

const Home = lazy(() => import('@/pages/Home'))
const Services = lazy(() => import('@/pages/Services'))
const Portfolio = lazy(() => import('@/pages/Portfolio'))
const Safety = lazy(() => import('@/pages/Safety'))
const About = lazy(() => import('@/pages/About'))
const Testimonials = lazy(() => import('@/pages/Testimonials'))
const FAQ = lazy(() => import('@/pages/FAQ'))
const Contact = lazy(() => import('@/pages/Contact'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export default function App() {
  return (
    <>
      <a href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-secondary-dark focus:px-4 focus:py-2 focus:font-semibold focus:text-white">
        Skip to content
      </a>
      <ScrollToTop />
      <DemoRibbon />
      <Navbar />
      <main id="main">
        <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-neutral-400" aria-busy="true"><Spinner size={26} /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/about" element={<About />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <FloatingActions />
      <ExitIntentPopup />
    </>
  )
}
