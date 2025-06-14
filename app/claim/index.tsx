import { Redirect } from 'expo-router';
import React from 'react';

export default function ClaimIndex() {
  // Redirect to home if no code is provided
  return <Redirect href="/" />;
} 