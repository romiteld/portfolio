# Generative AI Demo

This demo lets you create text or images from a single prompt using OpenAI models. It now features a tabbed interface with separate controls for text and image generation.
You can adjust temperature, max length and specify negative prompts for images. A history panel stores previous generations for easy comparison.

## Usage
1. Pick the **Text Generation** or **Image Generation** tab.
2. Enter a prompt describing what you want.
3. Tweak the parameters such as temperature, max length or image size.
4. Click **Generate** to see the result and browse it later in the history panel.

The server route `/api/generative-ai` handles the request using GPT-4 for text and DALL·E for images.
