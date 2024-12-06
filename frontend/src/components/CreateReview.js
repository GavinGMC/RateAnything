import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_BASE_URL;

const CreateReview = ({ location, onSuccess}) => {
  const navigate = useNavigate();
  const [item, setItem] = useState('');
  const [rating, setRating] = useState(1);
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const userId = localStorage.getItem('userId'); // Retrieve user ID from local storage

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Redirect to sign-in if not logged in
    if (!userId) {
      setErrorMessage('Please sign in to submit a review.');
      navigate('/login');
      return;
    }

    const reviewData = {
      user_id: userId,
      item,
      rating: Number(rating),
      description,
      lat: location?.lat,
      lng: location?.lng,
    };

    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        setSuccessMessage('Review added successfully!');
        setItem('');
        setRating(1);
        setDescription('');
        onSuccess();
      } else {
        const errorData = await response.json();
        setErrorMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding review:', error);
      setErrorMessage('There was an error submitting the review');
    }
  };

  return (
    <div className="container mt-4">
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Form onSubmit={handleSubmit}>
      <Form.Group controlId="formItem">
        <Form.Label>Item</Form.Label>
        <Form.Select
          value={item}
          onChange={(e) => setItem(e.target.value)}
          required
        >
          <option value="" disabled>
            Select an item
          </option>
          <option value="Water Fountain">Water Fountain</option>
          <option value="Vending Machine">Vending Machine</option>
          <option value="Bench">Bench</option>
          <option value="Tree">Tree</option>
        </Form.Select>
      </Form.Group>

        <Form.Group controlId="formRating">
          <Form.Label>Rating</Form.Label>
          <Form.Control
            type="number"
            value={rating}
            min="1"
            max="5"
            onChange={(e) => setRating(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="formDescription">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Submit Review
        </Button>
      </Form>
    </div>
  );
};

export default CreateReview;
