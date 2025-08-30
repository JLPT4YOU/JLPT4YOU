// Test file for console wrapping
export function TestComponent() {
  if (process.env.NODE_ENV === 'development') {
    console.log('This should be wrapped')
  }
  console.error('This should NOT be wrapped')
  console.warn('This should NOT be wrapped')
  if (process.env.NODE_ENV === 'development') {
    console.info('This should be wrapped')
  }
  if (process.env.NODE_ENV === 'development') {
    console.debug('This should be wrapped')
  }
  
  // console.log('This is commented, should not be wrapped')
  
  if (true) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Indented log should be wrapped')
    }
    console.error('Indented error should NOT be wrapped')
  }
  
  return <div>Test</div>
}
