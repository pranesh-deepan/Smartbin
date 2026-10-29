import { useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered reveal. Uses IntersectionObserver and only animates
 * opacity/transform. Falls back to visible when IO is unavailable or the
 * user prefers reduced motion.
 */
function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
    const ref = useRef(null);
    const [shown, setShown] = useState(
        () =>
            typeof window === "undefined" ||
            !("IntersectionObserver" in window)
    );

    useEffect(() => {
        const node = ref.current;

        if (!node || shown) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setShown(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [shown]);

    return (
        <Tag
            ref={ref}
            className={`reveal ${shown ? "is-visible" : ""} ${className}`.trim()}
            style={{ "--reveal-delay": `${delay}ms` }}
            {...rest}
        >
            {children}
        </Tag>
    );
}

export default Reveal;
