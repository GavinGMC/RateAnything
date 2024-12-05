from flask import Flask, jsonify, request, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
import os
from dotenv import load_dotenv
from flask_cors import CORS
import jwt
import datetime

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "https://rateanythingclt.com"}})

db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME')
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

# Register a new user
@app.route('/api/signup', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data['username']
    password = data['password']

    hashed_password = generate_password_hash(password)
    
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        query = "INSERT INTO users (username, password) VALUES (%s, %s)"
        cursor.execute(query, (username, hashed_password))
        connection.commit()
        return jsonify({'message': 'User registered successfully!'}), 201
    except mysql.connector.errors.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 400
    finally:
        cursor.close()
        connection.close()

# Login user
@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    username = data['username']
    password = data['password']

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    cursor.close()
    connection.close()

    if user and check_password_hash(user['password'], password):
        print(user)
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, os.getenv('SECRET_KEY'), algorithm='HS256')
        return jsonify({
            'message': 'Login successful!', 
            'user_id': user['id'],
            'token': token
            }), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/reviews', methods=['POST'])
def add_review():
    data = request.get_json()
    user_id = data.get('user_id')
    item = data['item']
    rating = data['rating']
    description = data['description']
    lat = data.get('lat')
    lng = data.get('lng')

    # Check if user_id is provided
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    # Check if lat and lng are provided
    if lat is None or lng is None:
        return jsonify({'error': 'Coordinates (lat, lng) are required'}), 400

    connection = get_db_connection()
    if connection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    cursor = connection.cursor()

    query = """
    INSERT INTO reviews (user_id, item, rating, description, lat, lng)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (user_id, item, rating, description, lat, lng))
    connection.commit()
    
    cursor.close()
    connection.close()
    
    return jsonify({'message': 'Review added successfully!'}), 201

#Delete a review
@app.route('/api/reviews/<int:review_id>', methods=['DELETE'])
def delete_review(review_id):
    user_id = request.headers.get('User-Id')  # Ensure you pass the user ID in the request headers or token
    if not user_id:
        return jsonify({'error': 'User authentication required.'}), 401

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # Check if the review belongs to the current user
        cursor.execute("SELECT id FROM reviews WHERE id = %s AND user_id = %s", (review_id, user_id))
        review = cursor.fetchone()

        if not review:
            return jsonify({'error': 'Review not found or unauthorized to delete.'}), 403

        # Proceed to delete the review
        cursor.execute("DELETE FROM reviews WHERE id = %s", (review_id,))
        connection.commit()

        return jsonify({'message': 'Review deleted successfully!'}), 200

    except Exception as e:
        connection.rollback()
        return jsonify({'error': 'An error occurred: ' + str(e)}), 500

    finally:
        cursor.close()
        connection.close()

# Get all reviews
@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    # Include `reviews.user_id` in the SELECT statement
    cursor.execute(""" 
    SELECT reviews.id, reviews.item, reviews.rating, reviews.description, reviews.lat, reviews.lng, 
           reviews.user_id, users.username 
    FROM reviews 
    JOIN users ON reviews.user_id = users.id 
    """)
    reviews = cursor.fetchall()
    
    cursor.close()
    connection.close()
    
    return jsonify(reviews)

# Get reviews by user
@app.route('/api/reviews/user/<int:user_id>', methods=['GET'])
def get_reviews_by_user(user_id):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    
    cursor.execute(""" 
    SELECT reviews.id, reviews.item, reviews.rating, reviews.description, reviews.lat, reviews.lng, users.username 
    FROM reviews 
    JOIN users ON reviews.user_id = users.id 
    WHERE user_id = %s
    """, (user_id,))
    reviews = cursor.fetchall()
    
    cursor.close()
    connection.close()
    
    return jsonify(reviews)

@app.route('/test-db', methods=['GET'])
def test_db():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute('SELECT 1')  # Simple query to test the connection
        cursor.fetchone()  # Fetch the result to ensure the query ran successfully
        return {'status': 'success', 'message': 'Database is connected!'}, 200
    except Exception as e:
        return {'status': 'error', 'message': str(e)}, 500
    finally:
        cursor.close()
        connection.close()

@app.route('/', methods=['GET'])
def hello_world():
    return 'Hello, World!'


if __name__ == '__main__':
    app.run(debug=True)
