/**
 * @namespace L.Wrapped
 * Utility functions to calculate various shared aspects of mapping a line
 * accross the antimeridian.
 */

import * as MathUtils from './Wrapped.MathUtils';
import * as L from 'leaflet';

/**
 * Returns the calculated latitude where a line drawn between
 * two Latitude/Longitude points will cross the antimeridian.
 * 
 * @param {L.LatLng} latLngA
 * @param {L.LatLng} latLngB
 * @returns {number}
 */
export function calculateAntimeridianLat(latLngA: L.LatLng, latLngB: L.LatLng): number {
    if (latLngA instanceof L.LatLng && latLngB instanceof L.LatLng) {
        // Ensure that the latitude A is less than latidue B. This will allow the
        // crossing point to be calculated based on the proportional similarity of
        // right triangles.

        // Locate which latitude is lower on the map. This will be the most
        // accute angle of the right triangle. If the lowest latitude is not latLngA
        // then swap the latlngs so it is.
        if (latLngA.lat > latLngB.lat) {
            const temp = latLngA;
            latLngA = latLngB;
            latLngB = temp;
        }

        // This gets the width of the distance between the two points
        // (The bottom of a large right triangle drawn between them)
        const A = 360 - Math.abs(latLngA.lng - latLngB.lng);
        // This gets the height of the of distance between the two points
        // (The vertical line of a large right triange drawn between them)
        const B = latLngB.lat - latLngA.lat;
        // This gets the bottom distance of a proportional triangle inside the large
        // trangle where the vertical line instead sits at the 180 mark.
        const a = Math.abs(180 - Math.abs(latLngA.lng));

        // Because triangle with identical angles must be proportional along the sides,
        // find the length of the vertical side of that inner triangle and then
        // add it to the lower point to predict the crossing point of the Antimeridian.
        return latLngA.lat + ((B * a) / A);
    } else {
        throw new Error('In order to calculate the Antimeridian latitude, two valid LatLngs are required.');
    }
}

/**
 * Returns true if the line between the two points will cross either
 * the prime meridian (Greenwich) or its antimeridian (International Date Line)
 * 
 * @param {L.LatLng} latLngA
 * @param {L.LatLng} latLngB
 * @returns {boolean}
 */
export function isCrossMeridian(latLngA: L.LatLng, latLngB: L.LatLng): boolean {
    if (latLngA instanceof L.LatLng && latLngB instanceof L.LatLng) {
        // Returns true if the signs are not the same.
        return MathUtils.sign(latLngA.lng) * MathUtils.sign(latLngB.lng) < 0;
    } else {
        throw new Error('In order to calculate whether two LatLngs cross a meridian, two valid LatLngs are required.');
    }
}

/**
 * Adds the latlng to the current ring as a layer point and expands the projected bounds.
 * 
 * @param {L.Point[]} ring
 * @param {L.Bounds} projectedBounds
 * @param {L.LatLng} latlng
 * @param {L.Map} map
 */
export function pushLatLng(ring: L.Point[], projectedBounds: L.Bounds, latlng: L.LatLng, map: L.Map): void {
    if (Array.isArray(ring) && projectedBounds instanceof L.Bounds && latlng instanceof L.LatLng && map instanceof L.Map) {
        ring.push(map.latLngToLayerPoint(latlng));
        projectedBounds.extend(ring[ring.length - 1]);
    } else {
        throw new Error('In order to push a LatLng into a ring, the ring point array, the LatLng, the projectedBounds, and the map must all be valid.');
    }
}

/**
 * Determines when the ring should be broken and a new one started.
 * This will return true if the distance is smaller when mapped across the Antimeridian.
 * 
 * @param {L.LatLng} latLngA
 * @param {L.LatLng} latLngB
 * @returns {boolean}
 */
export function isBreakRing(latLngA: L.LatLng, latLngB: L.LatLng): boolean {
    if (latLngA instanceof L.LatLng && latLngB instanceof L.LatLng) {
        return isCrossMeridian(latLngA, latLngB) &&
            (360 - Math.abs(latLngA.lng) - Math.abs(latLngB.lng) < 180);

    } else {
        throw new Error('In order to calculate whether the ring created by two LatLngs should be broken, two valid LatLngs are required.');
    }
}

/**
 * Breaks the existing ring along the anti-meridian.
 * returns the starting latLng for the next ring.
 * 
 * @param {L.LatLng} currentLat
 * @param {L.LatLng} nextLat
 * @param {L.Point[][]} rings
 * @param {L.Bounds} projectedBounds
 * @param {L.Map} map
 * @returns {L.LatLng}
 */
export function breakRing(currentLat: L.LatLng, nextLat: L.LatLng, rings: L.Point[][], projectedBounds: L.Bounds, map: L.Map): L.LatLng {
    if (currentLat instanceof L.LatLng && nextLat instanceof L.LatLng && Array.isArray(rings) && projectedBounds instanceof L.Bounds && map instanceof L.Map) {
        const ring = rings[rings.length - 1];

        // Calculate two points for the anti-meridian crossing.
        const breakLat = calculateAntimeridianLat(currentLat, nextLat);
        const breakLatLngs = [new L.LatLng(breakLat, 180), new L.LatLng(breakLat, -180)];

        // Add in first anti-meridian latlng to this ring to finish it.
        // Positive if positive, negative if negative.
        if (MathUtils.sign(currentLat.lng) > 0) {
            pushLatLng(ring, projectedBounds, breakLatLngs.shift()!, map);
        } else {
            pushLatLng(ring, projectedBounds, breakLatLngs.pop()!, map);
        }

        // Return the second anti-meridian latlng
        return breakLatLngs.pop()!;
    } else {
        throw new Error('In order to break a ring, all the inputs must exist and be valid.');
    }
}
