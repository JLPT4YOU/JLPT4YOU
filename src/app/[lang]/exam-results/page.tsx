import {
  createMetadataGenerator,
  createProtectedPageComponent,
  generateLanguageStaticParams
} from '@/lib/protected-page-utils'
import { ExamResultsPageContent } from '@/components/exam-results/exam-results-page-content'

// Generate static params for all languages
export const generateStaticParams = generateLanguageStaticParams

// Generate metadata with localized titles and SEO
export const generateMetadata = createMetadataGenerator(
  'pageTitle.examResults',
  'pageDescription.examResults',
  '/exam-results'
)

// Main page component
export default createProtectedPageComponent(ExamResultsPageContent)

// Enable static generation
export const dynamic = 'force-static'
