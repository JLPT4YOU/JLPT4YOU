#!/usr/bin/env python3
import json
import os

def add_irin_section_to_vn():
    """Add missing irin section to Vietnamese translation"""
    
    irin_vn = {
        "aiLanguage": {
            "title": "Bạn muốn iRIN sử dụng ngôn ngữ nào để giao tiếp với bạn?",
            "placeholder": "Chọn ngôn ngữ",
            "options": {
                "auto": "Tự động phát hiện",
                "vietnamese": "Tiếng Việt",
                "english": "Tiếng Anh",
                "japanese": "Tiếng Nhật",
                "custom": "Tùy chỉnh"
            },
            "customPlaceholder": "Nhập ngôn ngữ mong muốn (ví dụ: Tiếng Hàn, Tiếng Pháp, Tiếng Tây Ban Nha...)"
        },
        "personalization": {
            "title": "Cài đặt cá nhân hóa",
            "preferredName": {
                "label": "Bạn muốn iRIN gọi bạn là gì?",
                "placeholder": "Tên hoặc biệt danh bạn muốn iRIN sử dụng"
            },
            "desiredTraits": {
                "label": "Bạn muốn iRIN có những đặc điểm gì?",
                "placeholder": "Mô tả tính cách và đặc điểm bạn muốn ở iRIN"
            },
            "personalInfo": {
                "label": "Bạn muốn iRIN biết gì thêm về bạn?",
                "placeholder": "Thông tin cá nhân để iRIN hỗ trợ bạn tốt hơn (tùy chọn)"
            },
            "additionalRequests": {
                "label": "Yêu cầu bổ sung",
                "placeholder": "Điều gì khác bạn muốn iRIN ghi nhớ? (tùy chọn)"
            }
        },
        "generate": {
            "title": "Tạo Prompt tùy chỉnh",
            "description": "Sử dụng AI để tạo prompt phù hợp dựa trên thông tin của bạn",
            "button": "Tạo Prompt",
            "buttonLoading": "Đang tạo..."
        },
        "generated": {
            "title": "Prompt đã tạo",
            "description": "Đây là prompt tùy chỉnh được tạo cho bạn"
        },
        "footer": {
            "note": "Cài đặt được lưu cục bộ và sẽ được giữ qua các phiên làm việc"
        },
        "buttons": {
            "reset": "Đặt lại",
            "save": "Lưu"
        },
        "resetDialog": {
            "title": "Đặt lại tất cả prompt và cài đặt",
            "description": "Bạn có chắc muốn đặt lại tất cả prompt và cài đặt? Điều này sẽ: Xóa tất cả prompt tùy chỉnh, Đặt lại cài đặt ngôn ngữ AI, Đặt lại form về mặc định. Prompt cốt lõi của iRIN sẽ được giữ nguyên.",
            "confirm": "Đặt lại tất cả",
            "successMessage": "✅ Đặt lại thành công!\n\n• Prompt tùy chỉnh: Đã xóa\n• Cài đặt ngôn ngữ: Đã đặt lại\n• iRIN cốt lõi: Được giữ nguyên"
        },
        "loading": "Đang tải iRIN...",
        "languages": {
            "auto": "Tự động phát hiện ngôn ngữ",
            "vietnamese": "Tiếng Việt",
            "english": "Tiếng Anh",
            "japanese": "日本語",
            "custom": "Tùy chỉnh"
        },
        "aiResponse": "Xin chào! Tôi là iRIN từ nền tảng JLPT4YOU. Mặc dù chuyên môn của tôi là tiếng Nhật, tôi có thể thảo luận về bất kỳ chủ đề nào bạn quan tâm. Bạn đã hỏi: \"{{question}}\". Hôm nay bạn muốn nói về điều gì?",
        "aiAssistant": "Trợ lý AI"
    }
    
    # Read existing vn.json
    with open('src/translations/vn.json', 'r', encoding='utf-8') as f:
        vn_data = json.load(f)
    
    # Add irin section if missing
    if 'irin' not in vn_data:
        vn_data['irin'] = irin_vn
        
        # Write back
        with open('src/translations/vn.json', 'w', encoding='utf-8') as f:
            json.dump(vn_data, f, ensure_ascii=False, indent=2)
        
        print("✅ Added irin section to vn.json")
    else:
        print("⚠️ irin section already exists in vn.json")

def add_irin_section_to_jp():
    """Add missing irin section to Japanese translation"""
    
    irin_jp = {
        "aiLanguage": {
            "title": "iRINにどの言語でコミュニケーションを取ってほしいですか？",
            "placeholder": "言語を選択",
            "options": {
                "auto": "自動検出",
                "vietnamese": "ベトナム語",
                "english": "英語",
                "japanese": "日本語",
                "custom": "カスタム"
            },
            "customPlaceholder": "希望する言語を入力（例：韓国語、フランス語、スペイン語...）"
        },
        "personalization": {
            "title": "パーソナライゼーション設定",
            "preferredName": {
                "label": "iRINにどう呼ばれたいですか？",
                "placeholder": "iRINに使ってほしい名前またはニックネーム"
            },
            "desiredTraits": {
                "label": "iRINにどんな特徴を持たせたいですか？",
                "placeholder": "iRINに望む性格や特徴を説明してください"
            },
            "personalInfo": {
                "label": "iRINに他に知っておいてほしいことは？",
                "placeholder": "より良いサポートのための個人情報（任意）"
            },
            "additionalRequests": {
                "label": "追加のリクエスト",
                "placeholder": "iRINに覚えておいてほしいことは他にありますか？（任意）"
            }
        },
        "generate": {
            "title": "カスタムプロンプトを生成",
            "description": "入力内容に基づいて適切なプロンプトをAIが作成します",
            "button": "プロンプトを生成",
            "buttonLoading": "生成中..."
        },
        "generated": {
            "title": "生成されたプロンプト",
            "description": "これはあなた用に生成されたカスタムプロンプトです"
        },
        "footer": {
            "note": "設定はローカルに保存され、セッション間で保持されます"
        },
        "buttons": {
            "reset": "リセット",
            "save": "保存"
        },
        "resetDialog": {
            "title": "すべてのプロンプトと設定をリセット",
            "description": "すべてのプロンプトと設定をリセットしてもよろしいですか？これにより：すべてのカスタムプロンプトが削除され、AI言語設定がリセットされ、フォームがデフォルトに戻ります。iRINのコアプロンプトは保持されます。",
            "confirm": "すべてリセット",
            "successMessage": "✅ リセット成功！\n\n• カスタムプロンプト：削除済み\n• 言語設定：リセット済み\n• コアiRIN：保持"
        },
        "loading": "iRINを読み込み中...",
        "languages": {
            "auto": "言語を自動検出",
            "vietnamese": "ベトナム語",
            "english": "英語",
            "japanese": "日本語",
            "custom": "カスタム"
        },
        "aiResponse": "こんにちは！JLPT4YOUプラットフォームのiRINです。私の専門は日本語ですが、あなたが興味のあるどんな話題でも話すことができます。「{{question}}」とお聞きになりましたね。今日は何について話しましょうか？",
        "aiAssistant": "AIアシスタント"
    }
    
    # Read existing jp.json
    with open('src/translations/jp.json', 'r', encoding='utf-8') as f:
        jp_data = json.load(f)
    
    # Add irin section if missing
    if 'irin' not in jp_data:
        jp_data['irin'] = irin_jp
        
        # Write back
        with open('src/translations/jp.json', 'w', encoding='utf-8') as f:
            json.dump(jp_data, f, ensure_ascii=False, indent=2)
        
        print("✅ Added irin section to jp.json")
    else:
        print("⚠️ irin section already exists in jp.json")

def check_translations():
    """Check translation file consistency"""
    print("\n=== Translation File Analysis ===")
    
    for lang in ['en', 'vn', 'jp']:
        filepath = f'src/translations/{lang}.json'
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            lines = len(f.read().splitlines())
        
        # Count total keys recursively
        def count_keys(obj, parent_key=''):
            count = 0
            if isinstance(obj, dict):
                for k, v in obj.items():
                    count += 1
                    count += count_keys(v, f"{parent_key}.{k}" if parent_key else k)
            return count
        
        key_count = count_keys(data)
        print(f"{lang}.json: {lines} lines, {key_count} keys, irin section: {'✓' if 'irin' in data else '✗'}")

if __name__ == "__main__":
    os.chdir('/Users/nguyenbahoanglong/Desktop/jlpt4you')
    
    # Check current status
    check_translations()
    
    # Add missing sections
    print("\n=== Adding Missing Sections ===")
    add_irin_section_to_vn()
    add_irin_section_to_jp()
    
    # Check again after fixes
    print("\n=== After Fixes ===")
    check_translations()
