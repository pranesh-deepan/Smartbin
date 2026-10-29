import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Animates a numeric value from its previous value to the new one.
 * Non-numeric values (e.g. "..." while loading) are rendered as-is,
 * so existing loading/placeholder behaviour is preserved.
 */
function CountUp({ value, duration = 900 }) {
    const isNumber = typeof value === "number" && Number.isFinite(value);
    const [display, setDisplay] = useState(value);
    const previous = useRef(0);

    useEffect(() => {
        if (!isNumber) {
            return undefined;
        }

        if (prefersReducedMotion() || value === previous.current) {
            previous.current = value;
            const t = setTimeout(() => setDisplay(value), 0);
            return () => clearTimeout(t);
        }

        const from = previous.current;
        const start = performance.now();
        let frame;

        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(from + (value - from) * eased));

            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            } else {
                previous.current = value;
            }
        };

        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [value, duration, isNumber]);

    return <>{isNumber ? display : value}</>;
}

export default CountUp;
