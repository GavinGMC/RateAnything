import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CreateReview from './CreateReview';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const ReviewMap = ({ selectedRating }) => {
  const [searchParams] = useSearchParams();
  const [reviews, setReviews] = useState([]);
  const [newMarkerPosition, setNewMarkerPosition] = useState(null);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [isReviewFocused, setIsReviewFocused] = useState(false); // State to track if the review is being focused on
  const mapRef = useRef();
  const markerRefs = useRef({});
  const selectedReviewId = searchParams.get('reviewId');

  const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const userIcon = L.icon({
    iconUrl: "/images/person.png",
    iconSize: [40, 60],
    iconAnchor: [20, 60],
    popupAnchor: [1, -34],
  });

  const getItemIcon = (itemType) => {
    switch (itemType) {
      case 'Water Fountain':
        return L.icon({
          iconUrl: '/images/water-fountain.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });
      case 'Bench':
        return L.icon({
          iconUrl: '/images/bench.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });
      case 'Vending Machine':
        return L.icon({
          iconUrl: '/images/vending-machine.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });
      case 'Tree':
        return L.icon({
          iconUrl: '/images/tree.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });
      default:
        return defaultIcon;
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Error fetching reviews. Please try again later.');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = selectedRating
    ? reviews.filter(review => review.rating === selectedRating)
    : reviews;

  // Get user's current location when the component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        }
      );
    }
  }, []);

  useEffect(() => {
    if (userLocation && !isReviewFocused && mapRef.current) {
      const map = mapRef.current;
      map.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation, isReviewFocused]);

  useEffect(() => {
    if (selectedReviewId) {
      const review = reviews.find((r) => String(r.id) === String(selectedReviewId));
      if (review && review.lat && review.lng && mapRef.current) {
        const map = mapRef.current;

        // Wait until the map has been rendered and the marker is added to the map
        map.once('moveend', () => {
          if (markerRefs.current[review.id]) {
            // Ensure the popup opens after the marker is rendered
            markerRefs.current[review.id].openPopup();
          }
        });

        // Set the map to the review location without affecting the user's location
        setIsReviewFocused(true); // Set review focus flag to true
        map.flyTo([review.lat, review.lng], 16, {
          animate: true,
          duration: 1.5, // Set duration for smoother transition
        });
      }
    }
  }, [selectedReviewId, reviews]);

  const AddMarkerOnClick = () => {
    useMap().on('click', (e) => {
      setNewMarkerPosition(e.latlng);
    });
    return null;
  };

  const handleReviewSubmit = async (location) => {
    console.log('Review submitted at:', location);
    await fetchReviews();
    setNewMarkerPosition(null);
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : [35.3074, -80.7352]} // Prioritize user location
        zoom={15}
        style={{ height: 'calc(100vh - 50px)', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AddMarkerOnClick />

        {/* Add user location marker if available */}
        {userLocation && !isReviewFocused && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          </Marker>
        )}

        {filteredReviews.map(
          (review) =>
            review.lat &&
            review.lng && (
              <Marker
                key={review.id}
                position={[review.lat, review.lng]}
                icon={getItemIcon(review.item)}
                eventHandlers={{
                  click: () => {
                    mapRef.current.flyTo([review.lat, review.lng], 16, { animate: true, duration: 1.5 });
                  },
                }}
                ref={(el) => (markerRefs.current[review.id] = el)}
              >
                <Popup>
                  <strong>{review.item}</strong>
                  <br />
                  Rated {review.rating}/5 stars
                  <br />
                  Reviewed by {review.username}
                  <br />
                  <small>{review.description}</small>
                </Popup>
              </Marker>
            )
        )}

        {newMarkerPosition && (
          <Marker position={newMarkerPosition} icon={defaultIcon}>
            <Popup>
              <CreateReview
                location={newMarkerPosition}
                onSuccess={() => handleReviewSubmit(newMarkerPosition)}
              />
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default ReviewMap;