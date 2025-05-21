import argparse
import base64
import os
import time
from pathlib import Path

from openai import OpenAI


def main():
    parser = argparse.ArgumentParser(description="Generate an image from a recipe file")
    parser.add_argument(
        "recipe_name", help="Name of the recipe file (without extension)"
    )
    args = parser.parse_args()

    print(f"🔍 Processing recipe: {args.recipe_name}")

    # Set up file paths
    recipe_file = Path(f"_recipes/{args.recipe_name}.md")
    output_dir = Path("assets/img")
    output_file = output_dir / f"{args.recipe_name}.png"

    # Ensure output directory exists
    print(f"📁 Checking output directory: {output_dir}")
    os.makedirs(output_dir, exist_ok=True)

    # Read recipe content as prompt
    if not recipe_file.exists():
        print(f"❌ Error: Recipe file '{recipe_file}' not found.")
        return

    print(f"📄 Reading recipe content from: {recipe_file}")
    with open(recipe_file, "r") as f:
        prompt = f.read()
    print(f"📝 Loaded {len(prompt)} characters for prompt")

    # Add a header to the prompt
    header = """
    Generate a picture of a dish or food item based on
    the following recipe description
    (in Swedish), as if it was intended for a cookbook or 
    recipe site. You can be imaginative with the choice of background, but try to
    keep it neutral. The image should have square or
    almost square format. The actual recipe text should not
    be included in the image.

    """

    prompt = header + prompt

    # Initialize OpenAI client
    print("🔄 Initializing OpenAI client")
    client = OpenAI()

    # Generate the image
    print(f"🎨 Generating image for '{args.recipe_name}' recipe...")
    start_time = time.time()
    result = client.images.generate(model="gpt-image-1", prompt=prompt)
    end_time = time.time()
    print(f"✅ Image generation completed in {end_time - start_time:.2f} seconds")

    # Process the image if b64_json is available
    if result.data and result.data[0].b64_json is not None:
        print("📦 Decoding image data")
        image_base64 = result.data[0].b64_json
        image_bytes = base64.b64decode(image_base64)

        # Save the image to a file
        print(f"💾 Saving image to {output_file}")
        with open(output_file, "wb") as f:
            f.write(image_bytes)

        print(f"✨ Success! Image saved to {output_file}")
    else:
        print("❌ Error: No image data returned from the API")


if __name__ == "__main__":
    main()
