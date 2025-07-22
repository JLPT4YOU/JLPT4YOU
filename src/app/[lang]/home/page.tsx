import {
  createMetadataGenerator,
  createProtectedPageComponent,
  generateLanguageStaticParams
} from '@/lib/protected-page-utils'
import { HomePageContent } from '@/components/home/home-page-content'

// Generate static params for all languages (including backward compatibility)
export async function generateStaticParams() {
  return [
    { lang: 'vn' }, // Vietnamese (primary)
    { lang: 'jp' }, // Japanese (primary)
    { lang: 'en' }, // English (primary)
    { lang: '1' },  // Vietnamese (backward compatibility)
    { lang: '2' },  // Japanese (backward compatibility)
    { lang: '3' }   // English (backward compatibility)
  ]
}

// Generate metadata with localized titles and SEO
export const generateMetadata = createMetadataGenerator(
  'pageTitle.home',
  'pageDescription.home',
  '/home'
)

// Main page component
export default createProtectedPageComponent(HomePageContent)

// Enable static generation
export const dynamic = 'force-static'
