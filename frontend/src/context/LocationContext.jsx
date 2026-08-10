import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => {
    const saved = localStorage.getItem('chefai_user_location');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return { country: 'India', city: 'Greater Noida' };
  });

  const [isDetecting, setIsDetecting] = useState(false);

  const getFlag = (countryName) => {
    if (!countryName) return '📍';
    const c = countryName.toLowerCase();
    if (c.includes('india')) return '🇮🇳';
    if (c.includes('italy') || c.includes('italian')) return '🇮🇹';
    if (c.includes('mexico')) return '🇲🇽';
    if (c.includes('japan')) return '🇯🇵';
    if (c.includes('united states') || c.includes('usa') || c.includes('america')) return '🇺🇸';
    if (c.includes('france')) return '🇫🇷';
    if (c.includes('spain')) return '🇪🇸';
    if (c.includes('thailand')) return '🇹🇭';
    if (c.includes('china')) return '🇨🇳';
    if (c.includes('united kingdom') || c.includes('uk')) return '🇬🇧';
    return '🌎';
  };

  const updateLocation = (newLoc) => {
    setLocationState(newLoc);
    localStorage.setItem('chefai_user_location', JSON.stringify(newLoc));
  };

  const detectLocation = async (showToast = true) => {
    setIsDetecting(true);

    const tryReverseGeocodeLatLon = async (lat, lon) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const detectedCity = addr.city || addr.town || addr.suburb || addr.city_district || addr.state_district || addr.county || '';
          const detectedCountry = addr.country || 'India';
          return { country: detectedCountry, city: detectedCity };
        }
      } catch (e) {
        console.warn('Nominatim error:', e);
      }
      return null;
    };

    const tryIPGeolocate = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.country_name) {
          return { country: data.country_name, city: data.city || '' };
        }
      } catch (e) {
        console.warn('IP API 1 failed:', e);
      }
      return null;
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const geoRes = await tryReverseGeocodeLatLon(latitude, longitude);
          const finalLoc = geoRes || (await tryIPGeolocate()) || { country: 'India', city: 'Greater Noida' };
          updateLocation(finalLoc);
          if (showToast) {
            toast.success(`Region updated: ${finalLoc.city ? finalLoc.city + ', ' : ''}${finalLoc.country}`);
          }
          setIsDetecting(false);
        },
        async () => {
          const ipRes = await tryIPGeolocate();
          const finalLoc = ipRes || { country: 'India', city: 'Greater Noida' };
          updateLocation(finalLoc);
          if (showToast) {
            toast.success(`Region set to: ${finalLoc.city ? finalLoc.city + ', ' : ''}${finalLoc.country}`);
          }
          setIsDetecting(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      const ipRes = await tryIPGeolocate();
      const finalLoc = ipRes || { country: 'India', city: 'Greater Noida' };
      updateLocation(finalLoc);
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    // Detect location automatically on first load if no saved location
    if (!localStorage.getItem('chefai_user_location')) {
      detectLocation(false);
    }
  }, []);

  return (
    <LocationContext.Provider value={{
      location,
      flagEmoji: getFlag(location.country),
      updateLocation,
      detectLocation,
      isDetecting
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  return useContext(LocationContext);
}
