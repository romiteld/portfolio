# Generative AI Demo

This demo lets you create text or images from a single prompt using OpenAI models. You can tweak the text generation temperature or pick an output image size.

## Usage
1. Select whether you want text or an image.
2. Enter a prompt describing what you want.
3. Adjust the temperature for text or choose an image size.
4. Click **Generate** to see the result.

The server route `/api/generative-ai` handles the request using GPT-4 for text and DALL·E for images.
