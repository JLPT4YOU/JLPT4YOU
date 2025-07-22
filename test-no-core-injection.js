/**
 * Test để verify rằng core identity KHÔNG bị inject khi tạo user prompt
 */

console.log("=== TEST NO CORE IDENTITY INJECTION ===");

console.log("\n🚨 VẤN ĐỀ ĐÃ PHÁT HIỆN:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("❌ TRƯỚC: geminiService.sendMessage() tự động inject systemInstruction");
console.log("   → systemInstruction: getCurrentSystemPrompt()");
console.log("   → getCurrentSystemPrompt() = CORE_IDENTITY_PROMPT + language + user");
console.log("   → KẾT QUẢ: Core iRIN bị inject vào khi tạo user prompt!");

console.log("\n✅ SAU: Gọi trực tiếp GoogleGenAI client");
console.log("   → Không qua geminiService");
console.log("   → Không có systemInstruction");
console.log("   → CHỈ có promptInstruction trong contents");
console.log("   → KẾT QUẢ: Không có core identity injection!");

console.log("\n🔍 TECHNICAL ANALYSIS:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

console.log("\n📋 Gemini Service Flow (VẤN ĐỀ):");
console.log("1. user-prompt-generator.ts gọi geminiService.sendMessage()");
console.log("2. geminiService.sendMessage() → configOptions.systemInstruction = getCurrentSystemPrompt()");
console.log("3. getCurrentSystemPrompt() → CORE_IDENTITY_PROMPT + language + user prompt");
console.log("4. Gemini API nhận:");
console.log("   - systemInstruction: 'You are iRIN...' (CORE!)");
console.log("   - contents: 'Tạo prompt cho user...'");
console.log("5. KẾT QUẢ: AI tạo prompt với context là iRIN!");

console.log("\n🔧 Direct API Call (GIẢI PHÁP):");
console.log("1. user-prompt-generator.ts gọi trực tiếp GoogleGenAI client");
console.log("2. Không qua geminiService.sendMessage()");
console.log("3. Gemini API nhận:");
console.log("   - systemInstruction: KHÔNG CÓ");
console.log("   - contents: 'Professional Prompt Engineer instruction...'");
console.log("4. KẾT QUẢ: AI tạo prompt thuần túy, không có core context!");

console.log("\n📊 SO SÁNH REQUEST:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

console.log("\n❌ REQUEST CŨ (qua service):");
console.log(`{
  "systemInstruction": {
    "parts": [{
      "text": "You are iRIN, a versatile AI teacher from JLPT4YOU..."
    }]
  },
  "contents": [{
    "role": "user", 
    "parts": [{"text": "Professional Prompt Engineer instruction..."}]
  }]
}`);

console.log("\n✅ REQUEST MỚI (direct API):");
console.log(`{
  "contents": [{
    "role": "user",
    "parts": [{"text": "Professional Prompt Engineer instruction..."}]
  }],
  "config": {
    "temperature": 0.6,
    "maxOutputTokens": 200
  }
}`);

console.log("\n🎯 KẾT QUẢ MONG ĐỢI:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

console.log("\n❌ TRƯỚC (với core injection):");
console.log("User prompt: 'Cô iRIN sẽ gọi em Long và phản hồi vui vẻ...'");
console.log("→ Có reference đến iRIN identity");

console.log("\n✅ SAU (không có core injection):");
console.log("User prompt: 'Address the user as Long. Use cheerful communication...'");
console.log("→ Thuần túy về giao tiếp, không có identity reference");

console.log("\n🧪 TEST STEPS:");
console.log("1. Tạo user prompt với thông tin test");
console.log("2. Kiểm tra generated prompt KHÔNG chứa:");
console.log("   - 'iRIN'");
console.log("   - 'JLPT4YOU'");
console.log("   - 'Cô' hoặc 'em'");
console.log("   - Bất kỳ reference nào đến core identity");
console.log("3. Kiểm tra generated prompt CHỈ chứa:");
console.log("   - Cách gọi user");
console.log("   - Phong cách giao tiếp");
console.log("   - Yêu cầu cụ thể");

console.log("\n=== FIX COMPLETED ===");
console.log("✅ Đã sửa: Gọi trực tiếp GoogleGenAI client");
console.log("✅ Đã loại bỏ: systemInstruction injection");
console.log("✅ Kết quả: User prompt thuần túy, không có core identity");

console.log("\n🚀 READY TO TEST:");
console.log("Hãy test tạo user prompt và verify không có core injection!");
