const { body } = require('express-validator');

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nama harus diisi')
    .isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email harus diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password harus diisi')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka'),
];

/**
 * Validation rules for login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email harus diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password harus diisi'),
];

/**
 * Validation rules for screening input
 */
const screeningValidation = [
  body('age')
    .notEmpty().withMessage('Usia harus diisi')
    .isInt({ min: 15, max: 80 }).withMessage('Usia harus antara 15-80 tahun'),
  body('cigarettesPerDay')
    .notEmpty().withMessage('Jumlah rokok per hari harus diisi')
    .isInt({ min: 1, max: 60 }).withMessage('Jumlah rokok harus antara 1-60 batang'),
  body('coughDuration')
    .notEmpty().withMessage('Durasi batuk harus diisi')
    .isFloat({ min: 0, max: 24 }).withMessage('Durasi batuk harus antara 0-24 bulan'),
  body('weight')
    .notEmpty().withMessage('Berat badan harus diisi')
    .isFloat({ min: 30, max: 200 }).withMessage('Berat badan harus antara 30-200 kg'),
  body('height')
    .notEmpty().withMessage('Tinggi badan harus diisi')
    .isFloat({ min: 100, max: 250 }).withMessage('Tinggi badan harus antara 100-250 cm'),
  body('familyHistory')
    .notEmpty().withMessage('Riwayat keluarga harus diisi')
    .isBoolean().withMessage('Riwayat keluarga harus true/false'),
  body('environmentalExposure')
    .notEmpty().withMessage('Paparan lingkungan harus diisi')
    .isInt({ min: 1, max: 10 }).withMessage('Paparan lingkungan harus skala 1-10'),
  body('chestPainScale')
    .notEmpty().withMessage('Skala nyeri dada harus diisi')
    .isInt({ min: 1, max: 10 }).withMessage('Skala nyeri dada harus 1-10'),
];

/**
 * Validation rules for forgot password
 */
const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email harus diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
];

/**
 * Validation rules for reset password
 */
const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Token harus diisi'),
  body('password')
    .notEmpty().withMessage('Password baru harus diisi')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka'),
];

/**
 * Validation rules for profile update
 */
const profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nama harus 2-100 karakter'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/).withMessage('Format nomor telepon tidak valid'),
  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE']).withMessage('Gender harus MALE atau FEMALE'),
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Format tanggal lahir tidak valid'),
];

module.exports = {
  registerValidation,
  loginValidation,
  screeningValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  profileUpdateValidation,
};
