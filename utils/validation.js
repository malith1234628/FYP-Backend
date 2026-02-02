// Validation utility functions

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

const validatePhone = (phone) => {
  // Basic phone validation (10-15 digits, optional + prefix)
  const phoneRegex = /^\+?[\d\s-]{10,15}$/;
  return phoneRegex.test(phone);
};

const validateStudentRegistration = (data) => {
  const errors = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || !validatePassword(data.password)) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters)');
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.push('Valid phone number is required');
  }

  // if (!data.country || data.country.trim().length < 2) {
  //   errors.push('Country is required');
  // }

  return errors;
};

const validateAgencyRegistration = (data) => {
  const errors = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || !validatePassword(data.password)) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!data.agency_name || data.agency_name.trim().length < 2) {
    errors.push('Agency name is required (minimum 2 characters)');
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.push('Valid phone number is required');
  }

  if (!data.address || data.address.trim().length < 5) {
    errors.push('Address is required (minimum 5 characters)');
  }

  if (!data.country_of_operation || data.country_of_operation.trim().length < 2) {
    errors.push('Country of operation is required');
  }

  if (!data.license_number || data.license_number.trim().length < 2) {
    errors.push('License number (business registration number) is required');
  }

  return errors;
};

const validateLogin = (data) => {
  const errors = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password) {
    errors.push('Password is required');
  }

  return errors;
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateStudentRegistration,
  validateAgencyRegistration,
  validateLogin
};
