import { motion } from "framer-motion";

export const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0 },
};

export default function Reveal({
    children,
    delay = 0,
    className = "",
    ...props
}) {
    return (
        <motion.div
            className={className}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
            {...props}
        >
            {children}
        </motion.div>
    );
}
