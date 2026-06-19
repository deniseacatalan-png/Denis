"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

function parseCoordinate(value, fallback) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : fallback;
}

function MapCenterSync({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 14));
  }, [center, map]);

  return null;
}

function MapClickSync({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    }
  });

  return null;
}

const defaultPosition = [-40.1573, -71.3524];

export function LocationPicker({
  latitude,
  longitude,
  location,
  markerColor = "#a65774",
  onCoordinatesChange,
  onPlaceSelect,
  title = "Ubicacion en mapa",
  selectedSubtitle = "Coordenadas seleccionadas",
  fallbackSubtitle = "San Martin de los Andes",
  searchPlaceholder = "Buscar por nombre o direccion"
}) {
  const previousLocationRef = useRef(location);
  const [searchQuery, setSearchQuery] = useState(location || "");
  const [searchResults, setSearchResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const hasValidLatitude = Number.isFinite(Number(latitude));
  const hasValidLongitude = Number.isFinite(Number(longitude));
  const position = useMemo(
    () => [
      parseCoordinate(latitude, defaultPosition[0]),
      parseCoordinate(longitude, defaultPosition[1])
    ],
    [latitude, longitude]
  );
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "admin-location-marker",
        html: `<span class="admin-location-marker-pin" style="--marker-color: ${markerColor}"></span>`,
        iconSize: [34, 44],
        iconAnchor: [17, 40],
        popupAnchor: [0, -34]
      }),
    [markerColor]
  );

  useEffect(() => {
    if (location !== previousLocationRef.current) {
      previousLocationRef.current = location;
      setSearchQuery(location || "");
    }
  }, [location]);

  const updateCoordinates = (nextLatitude, nextLongitude) => {
    onCoordinatesChange(nextLatitude.toFixed(6), nextLongitude.toFixed(6));
  };

  const handleMarkerDrag = (event) => {
    const nextPosition = event.target.getLatLng();
    updateCoordinates(nextPosition.lat, nextPosition.lng);
  };

  const handleSearch = async (event) => {
    event?.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) return;

    const coordinateMatch = trimmedQuery.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (coordinateMatch) {
      updateCoordinates(Number(coordinateMatch[1]), Number(coordinateMatch[2]));
      setSearchResults([]);
      setSearchMessage("");
      return;
    }

    setIsSearching(true);
    setSearchMessage("");

    try {
      const params = new URLSearchParams({
        format: "json",
        limit: "5",
        countrycodes: "ar",
        addressdetails: "1",
        "accept-language": "es",
        q: trimmedQuery
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error("No se pudo buscar esa ubicacion.");
      }

      const results = await response.json();
      setSearchResults(results);
      setSearchMessage(results.length ? "" : "No encontre resultados para esa busqueda.");
    } catch (searchError) {
      setSearchResults([]);
      setSearchMessage(searchError.message);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    const nextLatitude = Number(result.lat);
    const nextLongitude = Number(result.lon);

    if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) return;

    updateCoordinates(nextLatitude, nextLongitude);
    onPlaceSelect?.(result);
    setSearchQuery(result.display_name || "");
    setSearchResults([]);
    setSearchMessage("");
  };

  return (
    <section className="admin-location-picker">
      <div className="admin-location-picker-header">
        <div>
          <h3>{title}</h3>
          <p>{hasValidLatitude && hasValidLongitude ? selectedSubtitle : fallbackSubtitle}</p>
        </div>
        <div className="admin-location-search">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch(event);
              }
            }}
            placeholder={searchPlaceholder}
          />
          <button type="button" className="map-btn" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      {searchMessage ? <p className="admin-location-message">{searchMessage}</p> : null}

      {searchResults.length ? (
        <div className="admin-location-results">
          {searchResults.map((result) => (
            <button type="button" key={result.place_id} onClick={() => selectSearchResult(result)}>
              {result.display_name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="admin-location-map-wrap">
        <MapContainer center={position} zoom={14} scrollWheelZoom className="admin-location-map">
          <MapCenterSync center={position} />
          <MapClickSync onSelect={updateCoordinates} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} draggable icon={markerIcon} eventHandlers={{ dragend: handleMarkerDrag }}>
            <Popup>Ubicacion seleccionada</Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="admin-location-coordinates">
        <label>
          Latitud
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(event) => onCoordinatesChange(event.target.value, longitude)}
            required
          />
        </label>
        <label>
          Longitud
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(event) => onCoordinatesChange(latitude, event.target.value)}
            required
          />
        </label>
      </div>
    </section>
  );
}
