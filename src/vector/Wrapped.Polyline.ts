import * as AntimeridianUtils from './Wrapped.AntimeridianUtils';
import * as L from 'leaflet';

/*
 * @namespace L.Wrapped
 * A polyline that will automatically split and wrap around the Antimeridian (Internation Date Line).
 */
export const Polyline = L.Polyline.extend({
    /**
     * recursively turns latlngs into a set of rings with projected coordinates
     * This is the entrypoint that is called from the overriden class to change
     * the rendering.
     * 
     * @param {L.LatLng[]} latlngs
     * @param {L.Point[]} result
     * @param {L.Bounds} projectedBounds
     */
    _projectLatlngs: function (latlngs: L.LatLng[], result: L.Point[], projectedBounds: L.Bounds): void {
        const isMultiRing = latlngs[0] instanceof L.LatLng;

        if (isMultiRing) {
            this._createRings(latlngs, result, projectedBounds);
        } else {
            for (let i = 0; i < latlngs.length; i++) {
                this._projectLatlngs(latlngs[i], result, projectedBounds);
            }
        }
    },

    /**
     * Creates the rings used to render the latlngs.
     * 
     * @param {L.LatLng[]} latlngs
     * @param {L.Point[]} rings
     * @param {L.Bounds} projectedBounds
     */
    _createRings: function (latlngs: L.LatLng[], rings: L.Point[], projectedBounds: L.Bounds): void {
        const len = latlngs.length;
        rings.push([]);

        for (let i = 0; i < len; i++) {
            const compareLatLng = this._getCompareLatLng(i, len, latlngs);
            const currentLatLng = latlngs[i];

            AntimeridianUtils.pushLatLng(rings[rings.length - 1], projectedBounds, latlngs[i], this._map);

            // If the next point to check exists, then check to see if the
            // ring should be broken.
            if (compareLatLng && AntimeridianUtils.isBreakRing(compareLatLng, currentLatLng)) {
                const secondMeridianLatLng = AntimeridianUtils.breakRing(currentLatLng, compareLatLng,
                    rings, projectedBounds, this._map);

                this._startNextRing(rings, projectedBounds, secondMeridianLatLng);
            }
        }
    },

    /**
     * returns the latlng to compare the current latlng to.
     * 
     * @param {number} i
     * @param {number} len
     * @param {L.LatLng[]} latlngs
     * @returns {L.LatLng | null}
     */
    _getCompareLatLng: function (i: number, len: number, latlngs: L.LatLng[]): L.LatLng | null {
        return (i + 1 < len) ? latlngs[i + 1] : null;
    },

    /**
     * Starts a new ring and adds the second meridian point.
     * 
     * @param {L.Point[]} rings
     * @param {L.Bounds} projectedBounds
     * @param {L.LatLng} secondMeridianLatLng
     */
    _startNextRing: function (rings: L.Point[], projectedBounds: L.Bounds, secondMeridianLatLng: L.LatLng): void {
        const ring: L.Point[] = [];
        rings.push(ring);
        AntimeridianUtils.pushLatLng(ring, projectedBounds, secondMeridianLatLng, this._map);
    }
});

/**
 * @factory L.wrappedPolyline(latlngs: LatLng[], options?: Polyline options)
 * Instantiates a polyline that will automatically split around the
 * antimeridian (Internation Date Line) if that is a shorter path.
 * 
 * @param {L.LatLng[]} latlngs
 * @param {Partial<L.Polyline>} options
 * @returns {L.Wrapped.Polyline}
 */
export function wrappedPolyline(latlngs: L.LatLng[], options?: Partial<L.Polyline>): L.Wrapped.Polyline {
    return new L.Wrapped.Polyline(latlngs, options);
}
