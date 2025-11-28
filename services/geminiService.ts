import { GoogleGenerativeAI } from "@google/generative-ai";

// Với Vite, biến môi trường phải prefix VITE_
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// Safely initialize GenAI (only if we have apiKey)
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const generateMenuDescription = async (itemName: string, category: string): Promise<string> => {
  if (!apiKey) return "Vui lòng cấu hình API Key để sử dụng tính năng AI.";

  try {
    const prompt = `Viết một mô tả ngắn gọn, hấp dẫn và ngon miệng (khoảng 1-2 câu) bằng tiếng Việt cho món ăn tên là "${itemName}" thuộc danh mục "${category}". Không dùng dấu ngoặc kép.`;

    if (!genAI) return "Không thể khởi tạo Gemini AI.";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return text || "Không thể tạo mô tả lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lỗi khi gọi AI.";
  }
};

export const suggestChefRecommendation = async (menuItems: {name: string, category: string}[], currentCart: string[]): Promise<string> => {
    if (!apiKey) return "";

    try {
        const menuStr = menuItems.map(m => `- ${m.name} (${m.category})`).join('\n');
        const cartStr = currentCart.join(', ');
        
        const prompt = `Dưới đây là thực đơn nhà hàng:
${menuStr}

Khách hàng đang có các món này trong giỏ: ${cartStr}.

Hãy đóng vai một đầu bếp trưởng, gợi ý 1 món ăn hoặc đồ uống khác từ thực đơn để ăn kèm hợp lý nhất. Trả lời ngắn gọn dưới 30 từ, giọng điệu thân thiện.`;

        if (!genAI) return "";

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return text || "";

    } catch (e) {
        return "";
    }
}