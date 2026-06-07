/*
 * @namespace L.Wrapped
 * Utility functions to perform calculations not always supported by the
 * standard Javascript Math namespace.
 */

/**
 * Returns NaN for non-numbers, 0 for 0, -1 for negative numbers,
 * 1 for positive numbers
 * 
 * @param {number} x
 * @returns {number}
 */
export function sign(x: number): number {
    return typeof x === 'number' ? (x ? (x < 0 ? -1 : 1) : 0) : NaN;
}
