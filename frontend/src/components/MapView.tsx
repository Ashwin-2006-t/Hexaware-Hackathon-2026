import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { MatchResult } from '../types';
import { Star, MapPin } from 'lucide-react';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  matches: MatchResult[];
  onSelectProvider: (providerId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({ matches, onSelectProvider }) => {
  const defaultCenter: [number, number] = [13.0418, 80.2541];

  return (
    <div className="w-full h-[450px] rounded-3xl overflow-hidden border-2 border-zinc-200 shadow-md relative z-10">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {matches.map((match, idx) => {
          const provider = match.provider;
          const user = provider?.user;
          if (!user || user.latitude === undefined || user.longitude === undefined) return null;

          const lat = user.latitude;
          const lon = user.longitude;

          return (
            <Marker key={match.provider_id || idx} position={[lat, lon]}>
              <Popup>
                <div className="p-2 space-y-2 max-w-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-100 text-emerald-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                      {match.score}% MATCH
                    </span>
                    <span className="text-xs font-bold text-amber-700 flex items-center">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-0.5" />
                      {provider.rating}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900 leading-tight">{user.name}</h4>
                    <p className="text-xs text-zinc-600 font-semibold mt-0.5">{provider.title}</p>
                  </div>

                  <div className="flex items-center text-xs text-zinc-500">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 mr-1" />
                    <span>{user.location} ({match.distance_km} km)</span>
                  </div>

                  <button
                    onClick={() => onSelectProvider(match.provider_id)}
                    className="w-full mt-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>View Profile</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
