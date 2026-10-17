const OPTIMIZED_IMAGE = /^\/(hero|projects)\/.+\.(jpe?g|png)$/i;

export function optimizedImage(src, width = 1600) {
    if (!src || !OPTIMIZED_IMAGE.test(src)) return src;
    return src.replace(/\.(jpe?g|png)$/i, `-${width}.webp`);
}

export function optimizedSrcSet(src) {
    if (!src || !OPTIMIZED_IMAGE.test(src)) return undefined;
    return `${optimizedImage(src, 768)} 768w, ${optimizedImage(src, 1600)} 1600w`;
}
