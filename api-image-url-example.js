// Example: Constructing imageUrl in backend API response
// Assume trek.imageFileName is stored in DB, e.g., 'trek-123456.jpg'

const BASE_URL = 'http://localhost:5050'; // Your backend base URL

function getTrekApiResponse(trek) {
  return {
    ...trek,
    imageUrl: trek.imageFileName ? `${BASE_URL}/uploads/treks/${trek.imageFileName}` : null,
    // ...other fields
  };
}
