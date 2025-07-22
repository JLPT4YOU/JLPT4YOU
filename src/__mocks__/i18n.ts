/**
 * Mock i18n utilities for testing
 */

export type Language = 'vn' | 'jp' | 'en'

export interface TranslationData {
  common: {
    appName: string
    home: string
  }
  jlpt: {
    page: {
      title: string
      subtitle: string
    }
    official: {
      page: {
        title: string
        subtitle: string
      }
    }
    custom: {
      page: {
        title: string
        subtitle: string
      }
    }
  }
  challenge: {
    page: {
      title: string
      subtitle: string
    }
    levels: {
      n1: string
      n2: string
      n3: string
      n4: string
      n5: string
    }
  }
  driving: {
    page: {
      title: string
      subtitle: string
    }
    levels: {
      honmen: string
      karimen: string
    }
  }
  auth: {
    titles: {
      login: string
      register: string
      forgotPassword: string
    }
    subtitles: {
      login: string
      register: string
      forgotPassword: string
    }
  }
}

// Mock translation data
const mockTranslations: Record<Language, TranslationData> = {
  vn: {
    common: {
      appName: 'JLPT4YOU',
      home: 'Trang chủ'
    },
    jlpt: {
      page: {
        title: 'Chọn loại đề thi JLPT',
        subtitle: 'Chuẩn bị cho kỳ thi năng lực tiếng Nhật'
      },
      official: {
        page: {
          title: 'JLPT - Đề thi chính thức',
          subtitle: 'Đề thi chính thức JLPT'
        }
      },
      custom: {
        page: {
          title: 'JLPT - Đề thi tùy chỉnh',
          subtitle: 'Đề thi JLPT tùy chỉnh'
        }
      }
    },
    challenge: {
      page: {
        title: 'Thử thách JLPT',
        subtitle: 'Chế độ thử thách với thời gian'
      },
      levels: {
        n1: 'Trình độ N1 - Chuyên gia',
        n2: 'Trình độ N2 - Nâng cao',
        n3: 'Trình độ N3 - Trung cấp',
        n4: 'Trình độ N4 - Cơ bản',
        n5: 'Trình độ N5 - Sơ cấp'
      }
    },
    driving: {
      page: {
        title: 'Chọn loại bài thi lái xe',
        subtitle: 'Thi lý thuyết lái xe'
      },
      levels: {
        honmen: 'Bằng lái chính thức',
        karimen: 'Bằng lái tạm thời'
      }
    },
    auth: {
      titles: {
        login: 'Đăng nhập',
        register: 'Đăng ký',
        forgotPassword: 'Quên mật khẩu'
      },
      subtitles: {
        login: 'Đăng nhập vào tài khoản của bạn',
        register: 'Tạo tài khoản mới',
        forgotPassword: 'Khôi phục mật khẩu'
      }
    }
  },
  jp: {
    common: {
      appName: 'JLPT4YOU',
      home: 'ホーム'
    },
    jlpt: {
      page: {
        title: 'JLPT練習',
        subtitle: '日本語能力試験の準備'
      },
      official: {
        page: {
          title: 'JLPT公式',
          subtitle: '公式JLPT試験'
        }
      },
      custom: {
        page: {
          title: 'JLPTカスタム',
          subtitle: 'カスタムJLPT試験'
        }
      }
    },
    challenge: {
      page: {
        title: 'チャレンジ',
        subtitle: '時間制限チャレンジモード'
      },
      levels: {
        n1: 'N1レベル - エキスパート',
        n2: 'N2レベル - 上級',
        n3: 'N3レベル - 中級',
        n4: 'N4レベル - 初級',
        n5: 'N5レベル - 入門'
      }
    },
    driving: {
      page: {
        title: '運転',
        subtitle: '運転理論試験'
      },
      levels: {
        honmen: '本免許',
        karimen: '仮免許'
      }
    },
    auth: {
      titles: {
        login: 'ログイン',
        register: '登録',
        forgotPassword: 'パスワードを忘れた'
      },
      subtitles: {
        login: 'アカウントにログイン',
        register: '新しいアカウントを作成',
        forgotPassword: 'パスワードを回復'
      }
    }
  },
  en: {
    common: {
      appName: 'JLPT4YOU',
      home: 'Home'
    },
    jlpt: {
      page: {
        title: 'JLPT Practice',
        subtitle: 'Japanese Language Proficiency Test preparation'
      },
      official: {
        page: {
          title: 'JLPT Official',
          subtitle: 'Official JLPT tests'
        }
      },
      custom: {
        page: {
          title: 'JLPT Custom',
          subtitle: 'Custom JLPT tests'
        }
      }
    },
    challenge: {
      page: {
        title: 'Challenge',
        subtitle: 'Timed challenge mode'
      },
      levels: {
        n1: 'N1 Level - Expert',
        n2: 'N2 Level - Advanced',
        n3: 'N3 Level - Intermediate',
        n4: 'N4 Level - Basic',
        n5: 'N5 Level - Beginner'
      }
    },
    driving: {
      page: {
        title: 'Driving',
        subtitle: 'Driving theory test'
      },
      levels: {
        honmen: 'Full License',
        karimen: 'Provisional License'
      }
    },
    auth: {
      titles: {
        login: 'Login',
        register: 'Register',
        forgotPassword: 'Forgot Password'
      },
      subtitles: {
        login: 'Sign in to your account',
        register: 'Create a new account',
        forgotPassword: 'Recover your password'
      }
    }
  }
}

// Mock loadTranslation function
export async function loadTranslation(language: Language): Promise<TranslationData> {
  return mockTranslations[language]
}

// Mock useTranslation hook
export function useTranslation(translations: TranslationData) {
  return {
    t: (key: string) => {
      const keys = key.split('.')
      let value: any = translations
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          return key
        }
      }
      
      return value || key
    }
  }
}
