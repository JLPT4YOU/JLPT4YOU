import {
  createMetadataGenerator,
  createProtectedPageComponent,
  generateLanguageStaticParams
} from '@/lib/protected-page-utils'
import { ReviewAnswersPageContent } from '@/components/review/review-answers-page-content'

// Generate static params for all languages
export const generateStaticParams = generateLanguageStaticParams

// Generate metadata with localized titles and SEO
export const generateMetadata = createMetadataGenerator(
  'pageTitle.reviewAnswers',
  'pageDescription.reviewAnswers',
  '/review-answers'
)

// Main page component
export default createProtectedPageComponent(ReviewAnswersPageContent)

// Enable static generation
export const dynamic = 'force-static'
