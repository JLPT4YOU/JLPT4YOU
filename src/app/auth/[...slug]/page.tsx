import { redirect } from 'next/navigation'

// Catch-all route for invalid auth paths
export default async function AuthCatchAllPage({
  params
}: {
  params: Promise<{ slug: string[] }>
}) {
  // Extract the slug segments
  const { slug } = await params
  const [lang, ...rest] = slug || []
  
  // Valid languages
  const validLanguages = ['vn', 'jp', 'en']
  
  // Valid auth pages
  const validAuthPages = ['login', 'register', 'forgot-password']
  
  // Check if we have a valid language
  if (validLanguages.includes(lang)) {
    // If there's a second segment, check if it's valid
    const authPage = rest[0]
    
    if (authPage && validAuthPages.includes(authPage)) {
      // Valid auth route, let it through
      redirect(`/auth/${lang}/${authPage}`)
    } else if (authPage === '$1' || !authPage) {
      // Handle $1 or missing auth page - redirect to login
      redirect(`/auth/${lang}/login`)
    } else {
      // Invalid auth page - redirect to login
      redirect(`/auth/${lang}/login`)
    }
  } else {
    // Invalid or missing language - redirect to default Vietnamese login
    redirect('/auth/vn/login')
  }
}

export const dynamic = 'force-dynamic'
