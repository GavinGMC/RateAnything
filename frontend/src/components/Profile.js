import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container } from 'react-bootstrap';
import Review from './Review'; // Import the reusable Review component

const API_URL = process.env.REACT_APP_API_URL;

const Profile = () => {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId'); // Replace with your actual auth mechanism

  // Fetch user's reviews
  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/user/${userId}`);
      if (!response.ok) {
        throw new Error('Error fetching reviews');
      }
      const data = await response.json();
      setReviews(data);
    } catch (err) {
      setError('Unable to fetch your reviews. Please try again later.');
      console.error(err);
    }
  };

  // Handle delete review
  const handleDelete = async (reviewId) => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': userId, // Include userId as required by your backend
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting review');
      }

      // Update the local state to remove the deleted review
      setReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId));
    } catch (err) {
      setError(err.message || 'Unable to delete the review. Please try again later.');
      console.error(err);
    }
  };

  // Navigate to the map with the reviewId as a query parameter
  const handleNavigate = (reviewId) => {
    if (!reviewId) {
      console.error("Review ID is undefined!");
      return;
    }
    navigate(`/?reviewId=${reviewId}`);  // This will navigate to the map page
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    } else {
      fetchReviews();
    }
  }, [userId, navigate]);

  return (
    <Container className="my-5">
      <h1>My Profile</h1>
      <Button variant="danger" onClick={handleLogout}>
        Logout
      </Button>

      <h2 className="mt-4">My Reviews</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {reviews.length > 0 ? (
        reviews.map((review) => (
          <Review
            key={review.id}
            item={review.item}
            username={null} // Username is not displayed on the user's profile
            rating={review.rating}
            description={review.description}
            canDelete={true} // Always true for the profile
            onDelete={() => handleDelete(review.id)} // Pass the delete handler
            onNavigate={() => handleNavigate(review.id)} // Pass the navigate handler
          />
        ))
      ) : (
        <p>No reviews found.</p>
      )}
    </Container>
  );
};

export default Profile;

