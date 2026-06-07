import * as AntimeridianUtils from './Wrapped.AntimeridianUtils';
import * as L from 'leaflet';

/*
 * @namespace L.Wrapped
 * A polygon that will automatically split and wrap around the Antimeridian (Internation Date Line).
 */
export const Polygon = L.Polygon.extend({
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
            // Because this is a polygon, there will always be a comparison latlng
            const compareLatLng = this._getCompareLatLng(i, len, latlngs);
            const currentLatLng = latlngs[i];

            AntimeridianUtils.pushLatLng(rings[rings.length - 1], projectedBounds, currentLatLng, this._map);

            // Check to see if the ring should be broken.
            if (AntimeridianUtils.isBreakRing(compareLatLng, currentLatLng)) {
                const secondMeridianLatLng = AntimeridianUtils.breakRing(currentLatLng, compareLatLng,
                    rings, projectedBounds, this._map);

                this._startNextRing(rings, projectedBounds, secondMeridianLatLng, i === len - 1);
            }
        }

        // Join the last two rings if needed.
        this._checkConcaveRings(rings);
        this._joinLastRing(rings, latlngs);
    },

    /**
     * Starts a new ring if needed and adds the second meridian point to the
     * correct ring.
     * 
     * @param {L.Point[]} rings
     * @param {L.Bounds} projectedBounds
     * @param {L.LatLng} secondMeridianLatLng
     * @param {boolean} isLastLatLng
     */
    _startNextRing: function (rings: L.Point[], projectedBounds: L.Bounds, secondMeridianLatLng: L.LatLng, isLastLatLng: boolean): void {
        let ring: L.Point[];
        if (!isLastLatLng) {
            ring = [];
            rings.push(ring);
            AntimeridianUtils.pushLatLng(ring, projectedBounds, secondMeridianLatLng, this._map);
        } else {
            // If this is the last latlng, don't bother starting a new ring.
            // instead, join the last meridian point to the first point, to connect
            // the shape correctly.
            ring = rings[0];
            ring.unshift(this._map.latLngToLayerPoint(secondMeridianLatLng));
            projectedBounds.extend(ring[0]);
        }
    },

    /**
     * returns the latlng to compare the current latlng to.
     * 
     * @param {number} i
     * @param {number} len
     * @param {L.LatLng[]} latlngs
     * @returns {L.LatLng}
     */
    _getCompareLatLng: function (i: number, len: number, latlngs: L.LatLng[]): L.LatLng {
        return (i + 1 < len) ? latlngs[i + 1] : latlngs[0];
    },

    /**
     * Joins the last ring to the first if they were accidentally disconnected by
     * crossing the anti-meridian
     * 
     * @param {L.Point[]} rings
     * @param {L.LatLng[]} latlngs
     */
    _joinLastRing: function (rings: L.Point[], latlngs: L.LatLng[]): void {
        const firstRing = rings[0];
        const lastRing = rings[rings.length - 1];

        // If either the first or last latlng cross the meridian immediately, then
        // they will be drawn as a single line, not a polygon, since they will not be
        // connected to the last ring. Reconnect them.
        if (rings.length > 1 && (firstRing.length === 2 || lastRing.length === 2) &&
            !AntimeridianUtils.isCrossMeridian(latlngs[0], latlngs[latlngs.length - 1])) {
            const len = lastRing.length;
            for (let i = 0; i < len; i++) {
                firstRing.unshift(lastRing.pop()!);
            }
            // Remove the empty ring.
            rings.pop();
        }
    },

    /**
     * Check for concave sections of the rings and join the rings if they are
     * concave
     * 
     * @param {L.Point[]} rings
     */
    _checkConcaveRings: function (rings: L.Point[]): void {
        const firstLatLng = this._map.layerPointToLatLng(rings[0][0]);

        for (let i = 0; i <= rings.length - 3; i++) {
            const middleLatLng = this._map.layerPointToLatLng(rings[i + 1][0]);
            const lastLatLng = this._map.layerPointToLatLng(rings[i + 2][0]);

            // If the meridian is crossed and then is crossed again
            // over the first polygon, the polygon is concave. Join the rings.
            if (AntimeridianUtils.isCrossMeridian(firstLatLng, middleLatLng) &&
                AntimeridianUtils.isCrossMeridian(middleLatLng, lastLatLng)) {
                const firstRing = rings[0];
                const lastRing = rings[i + 2];

                const newRing = firstRing.concat(lastRing);

                // Remove the joined polygon and then update the first polygon.
                rings.splice(i + 2, 1);
                rings.splice(0, 1, newRing);
            }
        }
    }
});

/**
 * @factory L.wrappedPolygon(latlngs: LatLng[], options?: Polygon options)
 * Instantiates a polygon that will automatically split around the
 * antimeridian (Internation Date Line) if that is a shorter path.
 * 
 * @param {L.LatLng[]} latlngs
 * @param {Partial<L.Polygon>} options
 * @returns {L.Wrapped.Polygon}
 */
export function wrappedPolygon(latlngs: L.LatLng[], options?: Partial<L.Polygon>): L.Wrapped.Polygon {
    return new L.Wrapped.Polygon(latlngs, options);
}
