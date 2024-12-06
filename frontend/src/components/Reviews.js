import React, { useState, useEffect } from 'react';
import Review from './Review';
import { Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // For navigation to the map

const API_URL = process.env.REACT_APP_API_BASE_URL;

const Reviews = ({ selectedRating }) => {
  const [reviews, setReviews] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userLocation, setUserLocation] = useState(null); // Store user location
  const navigate = useNavigate(); // Hook for navigation

  const userId = localStorage.getItem('userId');

  // Haversine formula to calculate distance between two lat/lon points in miles
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3963; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in miles
    // round to two decimal places
    const roundedDistance = Math.round(distance * 100) / 100;
    return roundedDistance;
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reviews`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched Reviews:', data);
        setReviews(data);
      } catch (error) {
        setErrorMessage('Error fetching reviews. Please try again later.');
      }
    };

    // Get the user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        }
      );
    } else {
      setErrorMessage('Geolocation is not supported by this browser.');
    }

    fetchReviews();
  }, []);

  // Filter and sort reviews based on the selected rating and proximity to the user
  const filteredReviews = selectedRating
    ? reviews.filter((review) => Number(review.rating) === Number(selectedRating))
    : reviews;

  // If the user's location is available, calculate and sort reviews based on distance
  const reviewsWithDistance = userLocation
    ? filteredReviews
        .map((review) => {
          const distance = haversineDistance(
            userLocation.lat,
            userLocation.lng,
            review.lat,
            review.lng
          );
          return { ...review, distance }; // Add distance property to the review
        })
        .sort((a, b) => a.distance - b.distance) // Sort by distance (ascending)
    : filteredReviews;

  const handleDelete = async (reviewId) => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'User-Id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Error deleting review');
      }

      setReviews((prevReviews) =>
        prevReviews.filter((review) => review.id !== reviewId)
      );
      setSuccessMessage('Review deleted successfully!');
    } catch (error) {
      setErrorMessage('Unable to delete the review. Please try again later.');
    }
  };

  // Navigate to the map with the reviewId as a query parameter
  const handleNavigate = (reviewId) => {
    if (!reviewId) {
      console.error("Review ID is undefined!");
      return;
    }
    navigate(`/?reviewId=${reviewId}`);
  };

  return (
    <div className="container mt-4">
      <h2>Reviews</h2>
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <ul>
        {reviewsWithDistance.map((review) => (
          <Review
            key={review.id}
            item={review.item}
            username={review.username}
            rating={review.rating}
            description={review.description}
            lat={review.lat}
            lng={review.lng}
            distance={review.distance} // Pass the distance to the Review component
            canDelete={Number(review.user_id) === Number(userId)}
            onDelete={() => handleDelete(review.id)}
            onNavigate={() => {
              console.log('Review ID:', review.id);
              handleNavigate(review.id); // Pass the query param handler
            }}
          />
        ))}
      </ul>
    </div>
  );
};

export default Reviews;

