/**
 * Skip to main content link for accessibility
 * Allows keyboard users to skip navigation
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        absolute top-0 left-0 z-50
        px-4 py-2 bg-primary-600 text-white
        -translate-y-full focus:translate-y-0
        transition-transform duration-200
      "
    >
      Skip to main content
    </a>
  );
}
