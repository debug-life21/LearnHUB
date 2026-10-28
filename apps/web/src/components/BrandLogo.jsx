export function BrandLogo({ appearance = "light", className = "", imgClassName = "" }) {
    return (
        <span
            className={
                appearance === "dark"
                    ? `inline-flex rounded-xl bg-white p-2 shadow-sm ${className}`
                    : `inline-flex items-center ${className}`
            }
        >
            <img
                src="/tedbabelearnhub-logo.png"
                alt="TedbabeLearnHUB(TLH) — Learn Anything. Grow Everywhere."
                className={
                    imgClassName ||
                    "h-12 sm:h-14 md:h-16 w-auto max-w-[280px] sm:max-w-[340px] md:max-w-[380px] object-contain transition-transform duration-200"
                }
            />
        </span>
    );
}
