import { Link } from 'react-router-dom'
import Seo from '@/components/Seo'
import { useSite } from '@/hooks/useSite'
import { isPending, value } from '@/config/site'
import { analyticsConfigured, reopenConsent } from '@/utils/analytics'

/**
 * What the site collects, why, and who else handles it, written against what
 * the code actually does (ContactForm, utils/analytics.js, the API). If any of
 * that changes, this page changes with it.
 */
const UPDATED = '26 November 2026'

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-body">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-body-soft">{children}</div>
    </section>
  )
}

export default function Privacy() {
  const site = useSite()
  const email = isPending(site.email) ? null : value(site.email)
  const name = isPending(site.legalName) ? site.name : value(site.legalName)
  const mail = email
    ? <a href={`mailto:${email}`} className="font-semibold text-accent underline-offset-2 hover:underline">{email}</a>
    : 'the email address on our contact page'

  return (
    <>
      <Seo />
      <article className="container-x pb-20 pt-28 sm:pt-32">
        <div className="max-w-3xl">
          <p className="eyebrow">Privacy</p>
          <h1 className="mt-3 text-[clamp(2rem,4.4vw,3rem)] font-extrabold text-body">Privacy policy</h1>
          <p className="mt-3 text-sm text-muted">Last updated {UPDATED}</p>
          <p className="mt-6 text-lg leading-relaxed text-body">
            {name} ("we") runs premierpower.co.ke. This page explains what personal
            information the website collects, why, and what you can ask us to do with it,
            in line with Kenya's Data Protection Act, 2019.
          </p>

          <Section title="When you send an enquiry">
            <p>
              The enquiry and quote forms ask for your name and phone number, and
              optionally your company, email, location, project type, a message and up
              to three attached files (drawings or documents). We use this only to reply,
              prepare a quotation and carry out work you ask us for.
            </p>
            <p>
              Attached files are stored privately: only signed-in members of our team
              can open them. A copy of each enquiry is sent to our team by email.
            </p>
            <p>
              To stop automated spam, the server briefly notes the internet address an
              enquiry came from. It is held in memory for about an hour and not saved
              with the enquiry.
            </p>
          </Section>

          <Section title="Analytics cookies">
            <p>
              With your agreement, we use Google Analytics to count visits, see which
              pages are read, and note when someone taps to call, WhatsApp or email us,
              or sends an enquiry. It sets cookies named <code>_ga</code> and{' '}
              <code>_ga_…</code>, and Google receives your browser and device details and
              an approximate location. We do not send Google your name, phone number,
              email or the content of your enquiry.
            </p>
            <p>
              Nothing is loaded and no analytics cookie is set unless you choose
              "Accept" in the cookie notice. You can change your mind at any time.
              Google keeps this data for no longer than 14 months.
            </p>
            {analyticsConfigured && (
              <p>
                <button type="button" onClick={reopenConsent}
                  className="font-semibold text-accent underline-offset-2 hover:underline">
                  Change cookie settings
                </button>
              </p>
            )}
          </Section>

          <Section title="Settings kept in your browser">
            <p>
              The site remembers a few choices in your own browser: light or dark mode,
              your cookie choice, and whether you have closed the pop-up offering a site
              visit. These stay on your device and are not sent to us.
            </p>
          </Section>

          <Section title="Who else handles it">
            <p>We use these services to run the site, and they process data on our behalf:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Vercel, which serves the website pages;</li>
              <li>Render, which hosts our server and database in Frankfurt, Germany;</li>
              <li>Cloudinary, which stores photographs and the files attached to enquiries;</li>
              <li>Google, for analytics, only if you accept;</li>
              <li>our email provider, which delivers enquiry notifications to our team.</li>
            </ul>
            <p>
              Some of these store data outside Kenya. We do not sell personal information,
              and we do not share it with anyone else except where the law requires.
            </p>
          </Section>

          <Section title="How long we keep it">
            <p>
              We keep enquiries for as long as we need them to respond, quote, carry out
              work and keep proper business records, and then delete them. You can ask us
              to delete yours sooner.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              You can ask to see the personal information we hold about you, to correct
              it, to delete it, or to object to how we use it. Email {mail} and we will
              respond as soon as we can.
            </p>
            <p>
              If you are not satisfied with our response, you can complain to the{' '}
              <a href="https://www.odpc.go.ke/" target="_blank" rel="noopener noreferrer"
                className="font-semibold text-accent underline-offset-2 hover:underline">
                Office of the Data Protection Commissioner
              </a>.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this policy: {mail}, or see the{' '}
              <Link to="/contact" className="font-semibold text-accent underline-offset-2 hover:underline">contact page</Link>.
            </p>
          </Section>
        </div>
      </article>
    </>
  )
}
