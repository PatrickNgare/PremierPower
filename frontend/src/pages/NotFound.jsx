import { Helmet } from 'react-helmet-async'
import Button from '../components/Button'

export default function NotFound() {
  return (
    <>
      <Helmet><title>Page not found | PremierPower</title><meta name="robots" content="noindex" /></Helmet>
      <div className="mx-auto flex min-h-[55vh] max-w-2xl flex-col justify-center px-5 py-20 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-wider text-graphite-400">404</p>
        <h1 className="mt-3 text-4xl text-graphite-900">This circuit is dead.</h1>
        <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-graphite-500">
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
