import { useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";

const officeIcon = L.divIcon({
  className: "",
  html: '<div style="width:12px;height:12px;background:#4F7A63;border:2px solid white;border-radius:9999px;box-shadow:0 1px 4px rgba(79,122,99,.4)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const userIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:12px;height:12px">
    <div style="position:absolute;inset:0;background:#0ea5e9;opacity:.35;border-radius:9999px;animation:ping 1.4s cubic-bezier(0,0,.2,1) infinite"></div>
    <div style="position:absolute;inset:0;background:#0ea5e9;border:2px solid white;border-radius:9999px;box-shadow:0 1px 4px rgba(14,165,233,.5)"></div>
  </div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

interface Props {
  userLat: number;
  userLng: number;
  officeLat: number;
  officeLng: number;
  radiusMeters: number;
  className?: string;
}

const FitBounds = ({
  userLat,
  userLng,
  officeLat,
  officeLng,
  radiusMeters,
}: {
  userLat: number;
  userLng: number;
  officeLat: number;
  officeLng: number;
  radiusMeters: number;
}) => {
  const map = useMap();
  useEffect(() => {
    const office = L.latLng(officeLat, officeLng);
    const bounds = L.latLngBounds(office, L.latLng(userLat, userLng));
    bounds.extend(office.toBounds(Math.max(radiusMeters, 100) * 2.4));
    map.fitBounds(bounds, { padding: [24, 24], animate: false });
  }, [map, userLat, userLng, officeLat, officeLng, radiusMeters]);
  return null;
};

const LocationMap = ({
  userLat,
  userLng,
  officeLat,
  officeLng,
  radiusMeters,
  className,
}: Props) => {
  return (
    <div className={`leaflet-static ${className ?? ""}`}>
      <MapContainer
        center={[officeLat, officeLng]}
        zoom={16}
        dragging={true}
        touchZoom={true}
        scrollWheelZoom={false}
        doubleClickZoom={true}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        attributionControl={true}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OSM"
        />
        <Circle
          center={[officeLat, officeLng]}
          radius={radiusMeters}
          pathOptions={{
            color: "#4F7A63",
            weight: 1.5,
            dashArray: "4 4",
            fillColor: "#4F7A63",
            fillOpacity: 0.1,
          }}
        />
        <Marker position={[officeLat, officeLng]} icon={officeIcon} />
        <Marker position={[userLat, userLng]} icon={userIcon} />
        <FitBounds
          userLat={userLat}
          userLng={userLng}
          officeLat={officeLat}
          officeLng={officeLng}
          radiusMeters={radiusMeters}
        />
        <ZoomControl position="topright" />
      </MapContainer>
    </div>
  );
};

export default LocationMap;
