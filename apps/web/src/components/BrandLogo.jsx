export function BrandLogo({ appearance = "light" }) {
    return (<span className={appearance === "dark"
            ? "inline-flex rounded-lg bg-white p-1.5"
            : "inline-flex"}>
      <img src="/learnhub-logo.png" alt="LearnHUB — Learn Anything. Grow Everywhere." className="h-auto w-36 sm:w-48 md:w-52"/>
    </span>);
}
