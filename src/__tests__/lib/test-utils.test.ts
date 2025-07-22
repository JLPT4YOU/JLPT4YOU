/**
 * Unit Tests for Test Utils
 * Tests shared test utilities to ensure reliability
 */

import {
  calculateTimeLimit,
  getDefaultTimeLimit,
  getTestSections,
  calculateTotalDefaultTime,
  generateExamTitle,
  validateTestConfig,
  getQuestionCount,
  generateTestUrl,
  formatTime,
  TestConfig
} from '@/lib/test-utils'

describe('calculateTimeLimit', () => {
  it('should return 999 for unlimited time mode', () => {
    const config: TestConfig = {
      type: 'jlpt',
      level: 'n1',
      timeMode: 'unlimited'
    }
    
    expect(calculateTimeLimit(config)).toBe(999)
  })

  it('should return custom time when specified', () => {
    const config: TestConfig = {
      type: 'jlpt',
      level: 'n1',
      timeMode: 'custom',
      customTime: 120
    }
    
    expect(calculateTimeLimit(config)).toBe(120)
  })

  it('should return default time for JLPT levels', () => {
    const configs = [
      { type: 'jlpt' as const, level: 'n1', timeMode: 'default' as const, expected: 170 },
      { type: 'jlpt' as const, level: 'n2', timeMode: 'default' as const, expected: 155 },
      { type: 'jlpt' as const, level: 'n3', timeMode: 'default' as const, expected: 140 },
      { type: 'jlpt' as const, level: 'n4', timeMode: 'default' as const, expected: 125 },
      { type: 'jlpt' as const, level: 'n5', timeMode: 'default' as const, expected: 105 }
    ]
    
    configs.forEach(({ type, level, timeMode, expected }) => {
      expect(calculateTimeLimit({ type, level, timeMode })).toBe(expected)
    })
  })

  it('should return default time for challenge levels', () => {
    const config: TestConfig = {
      type: 'challenge',
      level: 'n1',
      timeMode: 'default'
    }
    
    expect(calculateTimeLimit(config)).toBe(170)
  })

  it('should return default time for driving levels', () => {
    const configs = [
      { type: 'driving' as const, level: 'honmen', timeMode: 'default' as const, expected: 50 },
      { type: 'driving' as const, level: 'karimen', timeMode: 'default' as const, expected: 30 }
    ]
    
    configs.forEach(({ type, level, timeMode, expected }) => {
      expect(calculateTimeLimit({ type, level, timeMode })).toBe(expected)
    })
  })

  it('should fallback to 105 minutes for unknown levels', () => {
    const config: TestConfig = {
      type: 'jlpt',
      level: 'unknown',
      timeMode: 'default'
    }
    
    expect(calculateTimeLimit(config)).toBe(105)
  })
})

describe('getDefaultTimeLimit', () => {
  it('should return correct time limits for all test types', () => {
    expect(getDefaultTimeLimit('jlpt', 'n1')).toBe(170)
    expect(getDefaultTimeLimit('challenge', 'n2')).toBe(155)
    expect(getDefaultTimeLimit('driving', 'honmen')).toBe(50)
    expect(getDefaultTimeLimit('driving', 'karimen')).toBe(30)
  })

  it('should handle case insensitive levels', () => {
    expect(getDefaultTimeLimit('jlpt', 'N1')).toBe(170)
    expect(getDefaultTimeLimit('jlpt', 'N5')).toBe(105)
  })

  it('should fallback to 105 for unknown combinations', () => {
    expect(getDefaultTimeLimit('unknown', 'level')).toBe(105)
    expect(getDefaultTimeLimit('jlpt', 'unknown')).toBe(105)
  })
})

describe('getTestSections', () => {
  it('should return JLPT sections for jlpt type', () => {
    const sections = getTestSections('jlpt')
    
    expect(sections).toHaveLength(4)
    expect(sections.map(s => s.id)).toEqual(['vocabulary', 'grammar', 'reading', 'listening'])
  })

  it('should return challenge sections for challenge type', () => {
    const sections = getTestSections('challenge')
    
    expect(sections).toHaveLength(4)
    expect(sections.map(s => s.id)).toEqual(['vocabulary', 'grammar', 'reading', 'listening'])
  })

  it('should return driving sections for driving type', () => {
    const sections = getTestSections('driving')
    
    expect(sections).toHaveLength(3)
    expect(sections.map(s => s.id)).toEqual(['traffic-rules', 'road-signs', 'safety'])
  })

  it('should fallback to JLPT sections for unknown type', () => {
    const sections = getTestSections('unknown')
    
    expect(sections).toHaveLength(4)
    expect(sections.map(s => s.id)).toEqual(['vocabulary', 'grammar', 'reading', 'listening'])
  })
})

describe('calculateTotalDefaultTime', () => {
  it('should calculate total time for JLPT sections', () => {
    const sections = getTestSections('jlpt')
    const totalTime = calculateTotalDefaultTime(sections)
    
    // vocabulary(25) + grammar(30) + reading(60) + listening(40) = 155
    expect(totalTime).toBe(155)
  })

  it('should calculate total time for driving sections', () => {
    const sections = getTestSections('driving')
    const totalTime = calculateTotalDefaultTime(sections)
    
    // traffic-rules(20) + road-signs(15) + safety(15) = 50
    expect(totalTime).toBe(50)
  })
})

describe('generateExamTitle', () => {
  it('should generate correct titles for JLPT', () => {
    expect(generateExamTitle({ type: 'jlpt', level: 'n1', timeMode: 'default' }))
      .toBe('JLPT N1 Practice Test')
    
    expect(generateExamTitle({ type: 'jlpt', level: 'n5', timeMode: 'default' }))
      .toBe('JLPT N5 Practice Test')
  })

  it('should generate correct titles for challenge', () => {
    expect(generateExamTitle({ type: 'challenge', level: 'n2', timeMode: 'default' }))
      .toBe('JLPT N2 Challenge')
  })

  it('should generate correct titles for driving', () => {
    expect(generateExamTitle({ type: 'driving', level: 'honmen', timeMode: 'default' }))
      .toBe('Honmen - Main Theory Test')
    
    expect(generateExamTitle({ type: 'driving', level: 'karimen', timeMode: 'default' }))
      .toBe('Karimen - Provisional Test')
    
    expect(generateExamTitle({ type: 'driving', level: 'other', timeMode: 'default' }))
      .toBe('Driving Theory Test')
  })
})

describe('validateTestConfig', () => {
  it('should validate correct JLPT config', () => {
    const config: TestConfig = {
      type: 'jlpt',
      level: 'n1',
      timeMode: 'default'
    }
    
    expect(validateTestConfig(config)).toBe(true)
  })

  it('should validate correct challenge config', () => {
    const config: TestConfig = {
      type: 'challenge',
      level: 'n3',
      timeMode: 'custom',
      customTime: 90
    }
    
    expect(validateTestConfig(config)).toBe(true)
  })

  it('should validate correct driving config', () => {
    const config: TestConfig = {
      type: 'driving',
      level: 'honmen',
      timeMode: 'unlimited'
    }
    
    expect(validateTestConfig(config)).toBe(true)
  })

  it('should reject invalid test type', () => {
    const config = {
      type: 'invalid',
      level: 'n1',
      timeMode: 'default'
    } as TestConfig
    
    expect(validateTestConfig(config)).toBe(false)
  })

  it('should reject invalid time mode', () => {
    const config = {
      type: 'jlpt',
      level: 'n1',
      timeMode: 'invalid'
    } as TestConfig
    
    expect(validateTestConfig(config)).toBe(false)
  })

  it('should reject custom time mode without customTime', () => {
    const config: TestConfig = {
      type: 'jlpt',
      level: 'n1',
      timeMode: 'custom'
    }
    
    expect(validateTestConfig(config)).toBe(false)
  })

  it('should reject custom time mode with invalid customTime', () => {
    const config: TestConfig = {
      type: 'jlpt',
      level: 'n1',
      timeMode: 'custom',
      customTime: 0
    }
    
    expect(validateTestConfig(config)).toBe(false)
  })

  it('should reject invalid JLPT level', () => {
    const config: TestConfig = {
      type: 'jlpt',
      level: 'invalid',
      timeMode: 'default'
    }
    
    expect(validateTestConfig(config)).toBe(false)
  })

  it('should reject invalid driving level', () => {
    const config: TestConfig = {
      type: 'driving',
      level: 'invalid',
      timeMode: 'default'
    }
    
    expect(validateTestConfig(config)).toBe(false)
  })
})

describe('getQuestionCount', () => {
  it('should return total question count for all sections', () => {
    const config: TestConfig = {
      type: 'jlpt',
      level: 'n1',
      timeMode: 'default'
    }
    
    // vocabulary(20) + grammar(25) + reading(15) + listening(20) = 80
    expect(getQuestionCount(config)).toBe(80)
  })

  it('should return question count for selected sections', () => {
    const config: TestConfig = {
      type: 'jlpt',
      level: 'n1',
      timeMode: 'default',
      sections: ['vocabulary', 'grammar']
    }
    
    // vocabulary(20) + grammar(25) = 45
    expect(getQuestionCount(config)).toBe(45)
  })

  it('should handle driving test question count', () => {
    const config: TestConfig = {
      type: 'driving',
      level: 'honmen',
      timeMode: 'default'
    }
    
    // traffic-rules(30) + road-signs(20) + safety(20) = 70
    expect(getQuestionCount(config)).toBe(70)
  })
})

describe('generateTestUrl', () => {
  it('should generate JLPT test URL', () => {
    const config: TestConfig = {
      type: 'jlpt',
      level: 'n1',
      timeMode: 'default'
    }
    
    expect(generateTestUrl(config)).toBe('/jlpt/official/n1/test?timeMode=default')
  })

  it('should generate challenge test URL', () => {
    const config: TestConfig = {
      type: 'challenge',
      level: 'n2',
      timeMode: 'custom',
      customTime: 120
    }
    
    expect(generateTestUrl(config)).toBe('/challenge/n2/test?timeMode=custom&customTime=120')
  })

  it('should generate driving test URL', () => {
    const config: TestConfig = {
      type: 'driving',
      level: 'honmen',
      timeMode: 'unlimited'
    }
    
    expect(generateTestUrl(config)).toBe('/driving/honmen/test?timeMode=unlimited')
  })

  it('should include sections in URL', () => {
    const config: TestConfig = {
      type: 'jlpt',
      level: 'n3',
      timeMode: 'default',
      sections: ['vocabulary', 'grammar']
    }
    
    expect(generateTestUrl(config)).toBe('/jlpt/official/n3/test?timeMode=default&sections=vocabulary%2Cgrammar')
  })
})

describe('formatTime', () => {
  it('should format unlimited time', () => {
    expect(formatTime(999)).toBe('Unlimited')
  })

  it('should format minutes only', () => {
    expect(formatTime(45)).toBe('45m')
    expect(formatTime(1)).toBe('1m')
  })

  it('should format hours and minutes', () => {
    expect(formatTime(60)).toBe('1h')
    expect(formatTime(90)).toBe('1h 30m')
    expect(formatTime(120)).toBe('2h')
    expect(formatTime(150)).toBe('2h 30m')
  })
})
