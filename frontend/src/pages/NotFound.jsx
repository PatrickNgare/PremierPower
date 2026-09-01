import { Helmet } from 'react-helmet-async'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <>
      <Helmet><title>Page not found | Premier Power</title><meta name="robots" content="noindex" /></Helmet>
      <div className="container-x flex min-h-[60vh] flex-col justify-center py-20">
        <span className="eyebrow">404</span>
        <h1 className="mt-3 font-heading text-4xl font-bold text-body">This circuit is dead.</h1>
        <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-neutral-600">
          The page you asked for is not here. The work, the licence details, and the
          assessment booking all still are.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button to="/">Back to the start</Button>
          <Button to="/contact" variant="outline">Book an assessment</Button>
        </div>
      </div>
    </>
  )
}
