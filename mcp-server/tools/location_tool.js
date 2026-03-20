import fetch from "node-fetch";

const NOMINATIM_URL = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org";
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || "earnsure-app";

// Helper function to make API calls to Nominatim
async function nominatimRequest(endpoint, params) {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${NOMINATIM_URL}${endpoint}?${queryString}`, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-IN,en"
    }
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Nominatim API error: ${data.error}`);
  }

  return data;
}

export const definition = {
  name: "location_tool",
  description: "OpenStreetMap/Nominatim location tool for India. Provides geocoding, reverse geocoding, and place search for gig workers in India. FREE - no API key required!",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["geocode", "reverse_geocode", "search", "address_lookup"],
        description: "The location service action to perform"
      },
      address: {
        type: "string",
        description: "Address or location name for geocoding (required for geocode/search actions)"
      },
      latitude: {
        type: "number",
        description: "Latitude for reverse geocoding (required for reverse_geocode)"
      },
      longitude: {
        type: "number",
        description: "Longitude for reverse geocoding (required for reverse_geocode)"
      },
      limit: {
        type: "integer",
        description: "Maximum number of results (default: 10)",
        default: 10
      },
      countrycodes: {
        type: "string",
        description: "Country code filter (default: 'in' for India)",
        default: "in"
      },
      city: {
        type: "string",
        description: "City filter for more specific results (e.g., 'Mumbai', 'Delhi', 'Bangalore')"
      },
      state: {
        type: "string",
        description: "State filter (e.g., 'Maharashtra', 'Karnataka', 'Tamil Nadu')"
      }
    },
    required: ["action"]
  }
};

export async function handler({ 
  action, 
  address, 
  latitude, 
  longitude, 
  limit = 10,
  countrycodes = "in",
  city,
  state
}) {
  // Build address query string
  let queryAddress = address;
  if (city) queryAddress += `, ${city}`;
  if (state) queryAddress += `, ${state}`;
  queryAddress += ", India";

  switch (action) {
    case "geocode":
      return await geocode(queryAddress, limit, countrycodes);
    
    case "reverse_geocode":
      return await reverseGeocode(latitude, longitude);
    
    case "search":
      return await search(address, limit, countrycodes);
    
    case "address_lookup":
      return await addressLookup(address, limit, countrycodes);
    
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Convert address to coordinates
async function geocode(address, limit, countrycodes) {
  const results = await nominatimRequest("/search", {
    q: address,
    format: "json",
    limit,
    countrycodes,
    addressdetails: 1,
    extratags: 1
  });

  if (results.length === 0) {
    return {
      status: "ZERO_RESULTS",
      results: [],
      message: "No results found for the given address"
    };
  }

  return {
    status: "OK",
    results: results.map(place => ({
      place_id: place.place_id,
      display_name: place.display_name,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      type: place.type,
      importance: place.importance,
      // Address components
      address: place.address ? {
        road: place.address.road,
        neighbourhood: place.address.neighbourhood,
        suburb: place.address.suburb,
        city: place.address.city || place.address.town || place.address.village,
        county: place.address.county,
        state: place.address.state,
        postcode: place.address.postcode,
        country: place.address.country,
        country_code: place.address.country_code
      } : null,
      // India-specific
      is_india: place.address?.country_code?.toLowerCase() === "in"
    })),
    count: results.length
  };
}

// Convert coordinates to address
async function reverseGeocode(latitude, longitude) {
  const results = await nominatimRequest("/reverse", {
    lat: latitude,
    lon: longitude,
    format: "json",
    addressdetails: 1,
    extratags: 1,
    zoom: 18 // Address level
  });

  if (!results || results.error) {
    return {
      status: "ZERO_RESULTS",
      message: "No results found for the given coordinates"
    };
  }

  return {
    status: "OK",
    place_id: results.place_id,
    display_name: results.display_name,
    latitude: parseFloat(results.lat),
    longitude: parseFloat(results.lon),
    type: results.type,
    // Address components
    address: results.address ? {
      road: results.address.road,
      house_number: results.address.house_number,
      neighbourhood: results.address.neighbourhood,
      suburb: results.address.suburb,
      city: results.address.city || results.address.town || results.address.village,
      county: results.address.county,
      state: results.address.state,
      postcode: results.address.postcode,
      country: results.address.country,
      country_code: results.address.country_code
    } : null,
    // India-specific
    is_india: results.address?.country_code?.toLowerCase() === "in",
    state: results.address?.state,
    city: results.address?.city || results.address?.town || results.address?.village,
    postal_code: results.address?.postcode
  };
}

// Search for places
async function search(query, limit, countrycodes) {
  const results = await nominatimRequest("/search", {
    q: query,
    format: "json",
    limit,
    countrycodes,
    addressdetails: 1,
    featuretype: "settlement"
  });

  if (results.length === 0) {
    return {
      status: "ZERO_RESULTS",
      results: [],
      message: "No places found for the given query"
    };
  }

  return {
    status: "OK",
    results: results.map(place => ({
      place_id: place.place_id,
      display_name: place.display_name,
      name: place.name,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      type: place.type,
      importance: place.importance,
      // Address components
      city: place.address?.city || place.address?.town || place.address?.village,
      state: place.address?.state,
      country: place.address?.country,
      country_code: place.address?.country_code,
      // India-specific
      is_india: place.address?.country_code?.toLowerCase() === "in"
    })),
    count: results.length
  };
}

// Lookup address details
async function addressLookup(address, limit, countrycodes) {
  // First geocode to get place_id
  const geoResults = await geocode(address, 1, countrycodes);
  
  if (geoResults.status !== "OK" || geoResults.results.length === 0) {
    return geoResults;
  }

  const placeId = geoResults.results[0].place_id;

  // Get full address details using the place_id
  const lookupUrl = `${NOMINATIM_URL}/lookup?osm_ids=R${placeId}&format=json&addressdetails=1&extratags=1`;
  
  const response = await fetch(lookupUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en-IN,en"
    }
  });

  if (!response.ok) {
    return geoResults; // Return geocode results if lookup fails
  }

  const lookupResults = await response.json();

  if (!lookupResults || lookupResults.length === 0) {
    return geoResults;
  }

  const place = lookupResults[0];

  return {
    status: "OK",
    place_id: place.place_id,
    display_name: place.display_name,
    latitude: parseFloat(place.lat),
    longitude: parseFloat(place.lon),
    type: place.type,
    // Full address breakdown
    address: {
      name: place.name,
      road: place.address?.road,
      house_number: place.address?.house_number,
      neighbourhood: place.address?.neighbourhood,
      suburb: place.address?.suburb,
      city: place.address?.city || place.address?.town || place.address?.village,
      county: place.address?.county,
      state: place.address?.state,
      postcode: place.address?.postcode,
      country: place.address?.country,
      country_code: place.address?.country_code
    },
    // India-specific
    is_india: place.address?.country_code?.toLowerCase() === "in",
    india_details: {
      state: place.address?.state,
      city: place.address?.city || place.address?.town || place.address?.village,
      district: place.address?.county,
      postal_code: place.address?.postcode,
      pincode: place.address?.postcode
    }
  };
}
