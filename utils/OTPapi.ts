const API_BASE_URL = 'https://serenidad.click/mealpack';

export const createOTP = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/createOTP`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to create OTP');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating OTP:', error);
    throw error;
  }
};

export const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/verifyOTP`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify OTP');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}; 