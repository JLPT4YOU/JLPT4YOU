import { useState, useEffect } from 'react'

/**
 * Hook to fetch PDF with authentication and return a blob URL
 * This works around react-pdf not properly sending cookies
 */
export function usePDFWithAuth(pdfUrl: string | null) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {

    }

    if (!pdfUrl) {
      if (process.env.NODE_ENV === 'development') {

      }
      setBlobUrl(null)
      return
    }

    let objectUrl: string | null = null
    const controller = new AbortController()

    const fetchPDF = async () => {
      try {
        setLoading(true)
        setError(null)

        // Only log in development
        if (process.env.NODE_ENV === 'development') {

        }

        // Fetch with credentials explicitly included
        const response = await fetch(pdfUrl, {
          method: 'GET',
          credentials: 'include', // This ensures cookies are sent
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/pdf',
          },
          signal: controller.signal,
        })

        // Only log in development
        if (process.env.NODE_ENV === 'development') {

        }

        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = `Failed to fetch PDF: ${response.status}`
          
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.error || errorJson.message || errorMessage
          } catch {
            // If not JSON, use the text directly
            if (errorText) {
              errorMessage = errorText
            }
          }
          
          throw new Error(errorMessage)
        }

        // Convert response to blob
        const blob = await response.blob()
        
        // Create object URL from blob
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
        
        // Only log success in development
        if (process.env.NODE_ENV === 'development') {

        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          if (process.env.NODE_ENV === 'development') {

          }
          return
        }

        // Always log errors (but only in development for detailed info)
        if (process.env.NODE_ENV === 'development') {
          console.error('[usePDFWithAuth] Error fetching PDF:', err)
        }
        setError(err instanceof Error ? err : new Error('Failed to fetch PDF'))
        setBlobUrl(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPDF()

    // Cleanup function
    return () => {
      controller.abort()
      if (objectUrl) {
        if (process.env.NODE_ENV === 'development') {

        }
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [pdfUrl])

  return { blobUrl, loading, error }
}
