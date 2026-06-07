import { describe, it, expect, beforeEach } from 'vitest';
import * as L from 'leaflet';
import { Polygon as WrappedPolygon } from '../src/vector/Wrapped.Polygon';

describe('Wrapped.Polygon', () => {
  let map: L.Map;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '400px';
    container.style.height = '400px';
    document.body.appendChild(container);
    
    map = new L.Map(container);
    map.setView(new L.LatLng(55.8, 37.6), 6);
  });

  it('should split polygons that cross the International Date Line', () => {
    const latLngs = [
      L.latLng([45, 107]),
      L.latLng([50, 127]),
      L.latLng([50, -127])
    ];
    
    const polygon = new WrappedPolygon(latLngs);
    polygon.addTo(map);

    expect((polygon as any)._rings.length).toBe(2);
    expect((polygon as any)._rings[0].length).toBe(4);
    expect((polygon as any)._rings[1].length).toBe(3);
  });

  it('should not split polygons that do not cross the International Date Line', () => {
    const latLngs = [
      L.latLng([45, -90]),
      L.latLng([50, -70]),
      L.latLng([50, 90])
    ];
    
    const polygon = new WrappedPolygon(latLngs);
    polygon.addTo(map);

    expect((polygon as any)._rings.length).toBe(1);
    expect((polygon as any)._rings[0].length).toBe(3);
  });
});
