'use client'

import { DictionaryPage } from '@/components/dict/dictionary-page'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'

export default function DictPage() {
  return (
    <LanguagePageWrapper>
      {(translations) => (
        <DictionaryPage />
      )}
    </LanguagePageWrapper>
  )
}
