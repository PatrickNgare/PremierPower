/**
 * What the CMS knows about each content type.
 *
 * The backend builds every content endpoint from one router factory; this is
 * the same idea on the front. A content type is a list of columns and a list
 * of fields, and one generic screen renders both. Adding a type to the CMS is
 * an entry here, not a new screen.
 *
 * Field types:
 *   text | slug | url | textarea | lines | number | switch | select | image
 *
 * `lines` is a textarea the API exposes as an array — the client types one
 * item per line and never meets a repeater widget.
 */

export const FIELD = {
  text: 'text', slug: 'slug', url: 'url', textarea: 'textarea', lines: 'lines',
  number: 'number', switch: 'switch', select: 'select', image: 'image',
}

const published = { name: 'published', label: 'Published', type: FIELD.switch,
  help: 'Off keeps this a draft. Drafts are invisible on the site but you can still preview them.' }

export const collections = {
  banners: {
    path: '/banners',
    title: 'Hero slides',
    singular: 'slide',
    group: 'Pages',
    blurb: 'The rotating slides at the top of the home page.',
    orderable: true,
    columns: [
      { name: 'image_url', label: '', type: 'thumb' },
      { name: 'headline', label: 'Slide', primary: true },
      { name: 'eyebrow', label: 'Label' },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'eyebrow', label: 'Small label above the headline', type: FIELD.text,
        placeholder: 'Hospitality' },
      { name: 'headline', label: 'Headline', type: FIELD.text, required: true,
        placeholder: 'Nashulai Mara Safari Lodge' },
      { name: 'body', label: 'Supporting line', type: FIELD.textarea, rows: 2 },
      { name: 'image_url', label: 'Background photograph', type: FIELD.image },
      { name: 'image_alt', label: 'Describe the photograph', type: FIELD.text,
        help: 'Read aloud by screen readers, and shown if the image fails to load.' },
      { section: 'The card beside the headline' },
      { name: 'card_label', label: 'Card label', type: FIELD.text, placeholder: 'Lighting installation' },
      { name: 'card_title', label: 'Card title', type: FIELD.text, placeholder: 'Hotels & lodges' },
      { name: 'card_line', label: 'Card line', type: FIELD.textarea, rows: 2 },
      { section: 'Button (optional)' },
      { name: 'cta_label', label: 'Button text', type: FIELD.text },
      { name: 'cta_href', label: 'Button link', type: FIELD.url, placeholder: '/contact' },
      published,
    ],
  },

  sectors: {
    path: '/sectors',
    title: 'Sectors',
    singular: 'sector',
    group: 'Content',
    blurb: 'The markets you work in. Used by the solutions strip and the sectors grid.',
    orderable: true,
    columns: [
      { name: 'image_url', label: '', type: 'thumb' },
      { name: 'title', label: 'Sector', primary: true },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'title', label: 'Sector', type: FIELD.text, required: true },
      { name: 'slug', label: 'Web address', type: FIELD.slug, from: 'title', required: true },
      { name: 'line', label: 'One line, for the solutions strip', type: FIELD.textarea, rows: 2 },
      { name: 'body', label: 'Short paragraph, for the sectors grid', type: FIELD.textarea, rows: 3 },
      { name: 'image_url', label: 'Photograph', type: FIELD.image },
      { name: 'image_alt', label: 'Describe the photograph', type: FIELD.text },
      published,
    ],
  },

  services: {
    path: '/services',
    title: 'Services',
    singular: 'service',
    group: 'Content',
    blurb: 'Your service lines, as covered by the NCA registration.',
    orderable: true,
    columns: [
      { name: 'title', label: 'Service', primary: true },
      { name: 'slug', label: 'Web address' },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'title', label: 'Service', type: FIELD.text, required: true },
      { name: 'slug', label: 'Web address', type: FIELD.slug, from: 'title', required: true },
      { name: 'lede', label: 'Short summary', type: FIELD.textarea, rows: 2,
        help: 'One or two sentences. This is what shows on the services list.' },
      { name: 'body', label: 'Full description', type: FIELD.textarea, rows: 6 },
      { name: 'signs', label: 'Bullet points', type: FIELD.lines,
        help: 'One per line.' },
      { name: 'image_url', label: 'Photograph', type: FIELD.image },
      published,
    ],
  },

  projects: {
    path: '/projects',
    title: 'Installations',
    singular: 'installation',
    group: 'Content',
    blurb: 'Completed and ongoing projects.',
    orderable: true,
    columns: [
      { name: 'image_open_url', label: '', type: 'thumb' },
      { name: 'title', label: 'Project', primary: true },
      { name: 'location', label: 'Location' },
      { name: 'year', label: 'Status' },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'title', label: 'Project', type: FIELD.text, required: true },
      { name: 'slug', label: 'Web address', type: FIELD.slug, from: 'title', required: true },
      { name: 'location', label: 'Location', type: FIELD.text, placeholder: 'Maiyan, Nanyuki, Laikipia' },
      { name: 'year', label: 'Year or status', type: FIELD.text, placeholder: 'Complete, Ongoing, 2024' },
      { name: 'summary', label: 'Summary', type: FIELD.textarea, rows: 3 },
      { name: 'body', label: 'Full description', type: FIELD.textarea, rows: 6 },
      { section: 'Photographs' },
      { name: 'image_open_url', label: 'Main photograph', type: FIELD.image },
      { name: 'image_open_alt', label: 'Describe the main photograph', type: FIELD.text },
      { name: 'image_finished_url', label: 'Second photograph', type: FIELD.image },
      { name: 'image_finished_alt', label: 'Describe the second photograph', type: FIELD.text },
      { section: 'Visibility' },
      { name: 'featured', label: 'Feature this project', type: FIELD.switch },
      published,
    ],
  },

  'product-categories': {
    path: '/product-categories',
    title: 'Product categories',
    singular: 'category',
    group: 'Catalogue',
    blurb: 'Groupings for the product catalogue.',
    orderable: true,
    columns: [
      { name: 'image_url', label: '', type: 'thumb' },
      { name: 'name', label: 'Category', primary: true },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'name', label: 'Category', type: FIELD.text, required: true },
      { name: 'slug', label: 'Web address', type: FIELD.slug, from: 'name', required: true },
      { name: 'description', label: 'Description', type: FIELD.textarea, rows: 3 },
      { name: 'image_url', label: 'Photograph', type: FIELD.image },
      published,
    ],
  },

  products: {
    path: '/products',
    title: 'Products',
    singular: 'product',
    group: 'Catalogue',
    blurb: 'What you supply and install.',
    orderable: true,
    columns: [
      { name: 'image_url', label: '', type: 'thumb' },
      { name: 'name', label: 'Product', primary: true },
      { name: 'brand', label: 'Brand' },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'name', label: 'Product', type: FIELD.text, required: true },
      { name: 'slug', label: 'Web address', type: FIELD.slug, from: 'name', required: true },
      { name: 'category_id', label: 'Category', type: FIELD.select,
        optionsFrom: { path: '/product-categories/all', value: 'id', label: 'name' },
        help: 'Leave blank if it does not belong to one yet.' },
      { name: 'brand', label: 'Brand', type: FIELD.text },
      { name: 'summary', label: 'Short summary', type: FIELD.textarea, rows: 2 },
      { name: 'body', label: 'Full description', type: FIELD.textarea, rows: 6 },
      { name: 'specs', label: 'Specifications', type: FIELD.lines,
        help: 'One per line, written as "Label: value".' },
      { name: 'price_note', label: 'Price note', type: FIELD.text, placeholder: 'POA',
        help: 'Free text, not a number — this trade quotes per project.' },
      { section: 'Photograph' },
      { name: 'image_url', label: 'Photograph', type: FIELD.image },
      { name: 'image_alt', label: 'Describe the photograph', type: FIELD.text },
      { section: 'Visibility' },
      { name: 'featured', label: 'Feature this product', type: FIELD.switch },
      published,
    ],
  },

  testimonials: {
    path: '/testimonials',
    title: 'Reviews',
    singular: 'review',
    group: 'Content',
    blurb: 'What clients have said. Only publish reviews you actually received.',
    orderable: true,
    columns: [
      { name: 'name', label: 'Client', primary: true },
      { name: 'job', label: 'Project' },
      { name: 'rating', label: 'Rating' },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'name', label: 'Client name', type: FIELD.text, required: true },
      { name: 'job', label: 'Project or role', type: FIELD.text },
      { name: 'location', label: 'Location', type: FIELD.text },
      { name: 'quote', label: 'What they said', type: FIELD.textarea, rows: 4, required: true },
      { name: 'rating', label: 'Rating out of 5', type: FIELD.number, min: 1, max: 5 },
      { name: 'mentions_safety', label: 'Mentions delivery or reliability', type: FIELD.switch,
        help: 'These are shown first — they carry more weight than praise for looks.' },
      published,
    ],
  },

  faqs: {
    path: '/faqs',
    title: 'FAQs',
    singular: 'question',
    group: 'Content',
    blurb: 'Questions and answers shown on the FAQ page.',
    orderable: true,
    columns: [
      { name: 'question', label: 'Question', primary: true },
      { name: 'category', label: 'Category' },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'question', label: 'Question', type: FIELD.text, required: true },
      { name: 'answer', label: 'Answer', type: FIELD.textarea, rows: 5, required: true },
      { name: 'category', label: 'Category', type: FIELD.text, placeholder: 'general' },
      published,
    ],
  },

  blog: {
    path: '/blog',
    title: 'News',
    singular: 'article',
    group: 'Content',
    blurb: 'Articles and company news.',
    columns: [
      { name: 'cover_url', label: '', type: 'thumb' },
      { name: 'title', label: 'Article', primary: true },
      { name: 'author', label: 'Author' },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: FIELD.text, required: true },
      { name: 'slug', label: 'Web address', type: FIELD.slug, from: 'title', required: true },
      { name: 'excerpt', label: 'Summary', type: FIELD.textarea, rows: 2 },
      { name: 'body', label: 'Article', type: FIELD.textarea, rows: 12 },
      { name: 'author', label: 'Author', type: FIELD.text },
      { name: 'read_minutes', label: 'Reading time (minutes)', type: FIELD.number, min: 1, max: 60 },
      { section: 'Cover image' },
      { name: 'cover_url', label: 'Cover photograph', type: FIELD.image },
      { name: 'cover_alt', label: 'Describe the cover', type: FIELD.text },
      published,
    ],
  },

  team: {
    path: '/team',
    title: 'Team',
    singular: 'team member',
    group: 'Content',
    blurb: 'People shown on the about page.',
    orderable: true,
    columns: [
      { name: 'photo_url', label: '', type: 'thumb' },
      { name: 'name', label: 'Name', primary: true },
      { name: 'role', label: 'Role' },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: FIELD.text, required: true },
      { name: 'role', label: 'Role', type: FIELD.text },
      { name: 'bio', label: 'Short biography', type: FIELD.textarea, rows: 4 },
      { name: 'photo_url', label: 'Photograph', type: FIELD.image },
      { name: 'licence_number', label: 'Their registration or licence number', type: FIELD.text },
      published,
    ],
  },

  documents: {
    path: '/documents',
    title: 'Documents',
    singular: 'document',
    group: 'Content',
    blurb: 'Downloadable PDFs — the company profile, certificates, spec sheets.',
    orderable: true,
    upload: 'document',
    columns: [
      { name: 'title', label: 'Document', primary: true },
      { name: 'category', label: 'Category' },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: FIELD.text, required: true,
        help: 'What a visitor sees. Not the filename.' },
      { name: 'description', label: 'Description', type: FIELD.textarea, rows: 2 },
      { name: 'category', label: 'Category', type: FIELD.text, placeholder: 'general' },
      published,
    ],
  },

  social: {
    path: '/social',
    title: 'Social links',
    singular: 'link',
    group: 'Site',
    blurb: 'Where your social profiles are linked from the footer.',
    orderable: true,
    columns: [
      { name: 'platform', label: 'Platform', primary: true },
      { name: 'url', label: 'Address' },
      { name: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { name: 'platform', label: 'Platform', type: FIELD.select, required: true,
        options: ['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok', 'whatsapp'] },
      { name: 'url', label: 'Address', type: FIELD.url, required: true,
        placeholder: 'https://www.linkedin.com/company/…' },
      published,
    ],
  },

  seo: {
    path: '/seo',
    title: 'SEO',
    singular: 'page',
    group: 'Site',
    blurb: 'The title and description each page shows in Google and when shared.',
    columns: [
      { name: 'path', label: 'Page', primary: true },
      { name: 'title', label: 'Search title' },
      { name: 'noindex', label: 'Hidden', type: 'status', invert: true },
    ],
    fields: [
      { name: 'path', label: 'Page address', type: FIELD.text, required: true, placeholder: '/services' },
      { name: 'title', label: 'Search title', type: FIELD.text,
        help: 'Google shows roughly 60 characters.' },
      { name: 'description', label: 'Search description', type: FIELD.textarea, rows: 3,
        help: 'Roughly 155 characters.' },
      { name: 'og_image_url', label: 'Sharing image', type: FIELD.image,
        help: 'Shown when the page is shared on WhatsApp, LinkedIn or Facebook.' },
      { name: 'canonical', label: 'Canonical address', type: FIELD.url },
      { name: 'noindex', label: 'Hide from search engines', type: FIELD.switch },
    ],
  },
}

/** Sidebar grouping, in the order the groups should appear. */
export const GROUPS = ['Pages', 'Content', 'Catalogue', 'Site']
