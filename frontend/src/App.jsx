import { Suspense, lazy } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/layout/ScrollToTop'
import FloatingActions from '@/components/layout/FloatingActions'
import ExitIntentPopup from '@/components/ui/ExitIntentPopup'
import Spinner from '@/components/ui/Spinner'
import PageTransition from '@/components/layout/PageTransition'

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
  const location = useLocation()

  return (
    <>
      <a href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-secondary-dark focus:px-4 focus:py-2 focus:font-semibold focus:text-white">
        Skip to content
      </a>
      <ScrollToTop />
      <Navbar />
      <main id="main">
        <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-neutral-400" aria-busy="true"><Spinner size={26} /></div>}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/services" element={<PageTransition><Services /></PageTransition>} />
            <Route path="/portfolio" element={<PageTransition><Portfolio /></PageTransition>} />
            <Route path="/safety" element={<PageTransition><Safety /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/testimonials" element={<PageTransition><Testimonials /></PageTransition>} />
            <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      <Footer />
      <FloatingActions />
      <ExitIntentPopup />
    </>
  )
}
