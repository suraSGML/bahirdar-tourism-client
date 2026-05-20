import { useState, useEffect, useRef } from 'react';

export default function LazyImage({ src, alt, className = '', placeholder = 'bg-gray-200' }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
              observer.unobserve(entry.target);
            };
            img.onerror = () => {
              setError(true);
              setIsLoading(false);
              observer.unobserve(entry.target);
            };
            img.src = src;
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <div
      ref={imgRef}
      className={`${className} ${isLoading ? placeholder : ''} transition-opacity duration-300`}
    >
      {imageSrc && !error && (
        <img
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
      {error && (
        <div className="w-full h-full flex items-center justify-center bg-gray-300">
          <span className="text-gray-500">Failed to load image</span>
        </div>
      )}
      {isLoading && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
