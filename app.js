// Hugging Face and OpenAI API keys
const hfApiKey = "your-hugging-face-api-key";
const openaiApiKey = "sk-svcacct-your-openai-api-key";

// HTML element descriptions
const htmlElementDescriptions = {
  button: "A clickable button, often used for submitting forms or triggering actions.",
  input: "A text input field for the user to enter data, such as name or email.",
  link: "A clickable link that navigates to another page.",
  image: "An image displayed on the webpage.",
  navbar: "A navigation bar containing links to important sections of the site.",
};

// Function to extract the dominant color (using a lightweight canvas method)
async function getDominantColor(image) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1;
    canvas.height = 1;
    ctx.drawImage(image, 0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    resolve(`${r},${g},${b}`);
  });
}

// Function to find the best matching description using Hugging Face
async function getDescriptionFromImage(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch("https://api-inference.huggingface.co/models/openai/clip-vit-base-patch16", {
    method: "POST",
    headers: { Authorization: `Bearer ${hfApiKey}` },
    body: formData,
  });

  const result = await response.json();
  const bestMatchIdx = result.labels.reduce(
    (bestIdx, label, idx) =>
      label.score > result.labels[bestIdx].score ? idx : bestIdx,
    0
  );

  const description = Object.keys(htmlElementDescriptions)[bestMatchIdx];
  return description;
}

// Function to generate HTML and CSS using OpenAI
async function generateHtmlCss(description, color) {
  const prompt = `
    Create an HTML and CSS snippet based on the following details:
    - Element: ${description}
    - Color: rgb(${color})
  `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful web development assistant." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Integrate into existing UI
document.getElementById("confirm-upload").addEventListener("click", async () => {
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];
  const uploadedImage = document.getElementById("uploaded-image");

  if (!file || !uploadedImage) {
    alert("Please upload an image first!");
    return;
  }

  try {
    const dominantColor = await getDominantColor(uploadedImage);
    const description = await getDescriptionFromImage(file);
    const generatedCode = await generateHtmlCss(description, dominantColor);

    document.getElementById("code-display").innerHTML += `<pre>${generatedCode}</pre>`;
    document.getElementById("chat-box").innerHTML += `<div>AI: Generated code for a ${description}.</div>`;
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while generating the code.");
  }
});
