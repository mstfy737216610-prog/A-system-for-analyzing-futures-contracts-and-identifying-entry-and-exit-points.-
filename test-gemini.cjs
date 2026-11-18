const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    await model.generateContent("hello");
    console.log("gemini-1.5-flash works");
  } catch(e) { console.error("flash error", e.message); }
  
  try {
    const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    await model2.generateContent("hello");
    console.log("gemini-1.5-pro works");
  } catch(e) { console.error("pro 1.5 error", e.message); }

  try {
    const model3 = genAI.getGenerativeModel({ model: "gemini-pro" });
    await model3.generateContent("hello");
    console.log("gemini-pro works");
  } catch(e) { console.error("pro error", e.message); }
}
run();
