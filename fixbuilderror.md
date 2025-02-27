

"use client";

import { useState } from "react";
import { useSpring, animated } from "@react-spring/web";

interface IImage {
  src: string;
  alt: string;
}

interface WoodworkingSliderProps {
  images: IImage[];
}

export default function WoodworkingSlider({ images }: WoodworkingSliderProps) {
  const [index, setIndex] = useState(0);

  // Define the spring animation
  const props = useSpring({
    opacity: 1,
    transform: "perspective(500px) rotateY(0deg)",
    from: {
      opacity: 0,
      transform: "perspective(500px) rotateY(180deg)",
    },
    config: { tension: 280, friction: 60 },
  });

  const nextSlide = () => {
    setIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto h-64 sm:h-80 md:h-96">
      <animated.div
        style={{
          opacity: props.opacity, // SpringValue<number> is fine here; animated.div handles it
          transform: props.transform.to((t) => t), // Use .to() to unwrap SpringValue<string>
        }}
        className="w-full h-full"
      >
        <img
          src={images[index].src || "/placeholder.svg"}
          alt={images[index].alt}
          className="object-cover w-full h-full rounded-lg shadow-md"
        />
      </animated.div>

      <div className="absolute top-1/2 -translate-y-1/2 left-4">
        <button
          onClick={prevSlide}
          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Prev
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-4">
        <button
          onClick={nextSlide}
          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
Key Fixes Applied
Avoid Passing props Directly:
Originally, you passed the entire props object (style={props}), which included SpringValue types that TypeScript couldn't reconcile with the style prop expectations.
Instead, we explicitly specify the style object and extract the individual animated values.
Handling opacity:
The animated.div component from @react-spring/web is designed to handle SpringValue<number> directly for properties like opacity. Thus, opacity: props.opacity works without further modification.
Handling transform with .to():
For transform, which is a SpringValue<string>, we use the .to() method (props.transform.to((t) => t)) to unwrap the animated value into a plain string. This ensures TypeScript sees it as a compatible type for the style prop.
Why This Works
animated Components: The animated wrapper from react-spring is built to interpret SpringValue types and apply them as CSS properties during animation. By passing props.opacity directly, we leverage this capability for opacity.
.to() Method: For properties like transform, the .to() method maps the animated value to its current state (a string in this case), satisfying TypeScript’s type requirements for the style prop.
Additional Steps (If Needed)
If the error persists after applying this fix, try the following:
Update @react-spring/web:
Ensure you’re using the latest version, as type definitions may have improved:
bash
bun add @react-spring/web@latest
Clean Build:
Clear any cached build files and restart the build process:
bash
rm -rf .next
bun run build
Check TypeScript Compatibility:
Verify that your TypeScript version aligns with the requirements of @react-spring/web. You can check this in the library’s documentation or package.json.
Temporary Type Assertion (Last Resort):
If TypeScript still complains, you can use a type assertion to bypass the error temporarily:
tsx
style={props as any}
